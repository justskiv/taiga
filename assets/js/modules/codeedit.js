/* Live code editor for runnable snippets (codapi).

   codapi ships its own `editor="basic"`: it sets contenteditable on the <code>
   element and, on the first focus, runs `code.textContent = code.textContent` —
   which throws the Chroma markup away, so the snippet loses its colours the
   moment the reader touches it and never gets them back. There is no editing
   MODE either: "Edit" is a bare focus() call, so there is nothing to leave, no
   way to undo, and no signal that the block is live beyond a blinking caret.

   This replaces that with the overlay editing model: a transparent <textarea>
   sits exactly on top of the highlighted <pre>, so the browser handles caret,
   selection, IME, undo and mobile keyboards natively while the colours below
   stay real markup. Every keystroke re-highlights through modules/gohl.js,
   which emits the same Chroma classes 20-chroma.css already paints.

   codapi still owns execution: it reads `code.textContent` when Run is pressed,
   and since the highlighter is lossless that text is exactly what the reader
   typed. We only take the editing half away from it — its own Edit link is
   hidden and contenteditable removed.

   The snippet keeps working without this module (Run still runs, the code is
   still readable), and the module keeps quiet on pages with no snippets. */

import { I18N } from './i18n.js';
import { highlightGo, escapeHTML } from './gohl.js';

/* Editing modes we take over. `off` means the author wants a read-only
   listing — leave it alone. */
const EDITABLE = new Set(['basic', 'external']);

const OPEN = { '(': ')', '[': ']', '{': '}', '"': '"', '`': '`', "'": "'" };
const CLOSERS = new Set([')', ']', '}', '"', '`', "'"]);
const QUOTES = new Set(['"', "'", '`']);
const WORD = /[\p{L}\p{Nd}_]/u;

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

export function bindCodeEditors() {
  const snippets = document.querySelectorAll('codapi-snippet');
  if (!snippets.length) return;
  snippets.forEach((snip) => {
    /* A snippet is upgraded by codapi either before this runs (the usual case:
       its script is synchronous and the custom element upgrades during parse)
       or later, if it was loaded with defer/async or given an init-delay. Both
       paths land here exactly once. */
    if (snip.ready) mount(snip);
    else snip.addEventListener('load', () => mount(snip), { once: true });
  });
}

function mount(snip) {
  try {
    const mode = snip.getAttribute('editor') || 'off';
    if (!EDITABLE.has(mode)) return;
    const code = findCode(snip);
    if (!code || code.dataset.ced) return;
    const pre = code.closest('pre');
    if (!pre) return;
    code.dataset.ced = '1';
    new CodeEditor(snip, pre, code);
  } catch (e) {
    console.error('code editor failed:', e);
  }
}

/* findCode mirrors codapi's own lookup (snippet.js findCodeElement): the code
   block is the previous sibling, or inside it. We ask codapi first — it has
   already resolved the element, including a custom `selector` attribute. */
function findCode(snip) {
  const own = snip.snippet && snip.snippet.el;
  if (own) return own;
  const prev = snip.previousElementSibling ||
    (snip.parentElement && snip.parentElement.previousElementSibling);
  if (!prev) return null;
  return prev.querySelector('code') || prev;
}

class CodeEditor {
  constructor(snip, pre, code) {
    this.snip = snip;
    this.pre = pre;
    this.code = code;
    this.editing = false;
    this.ta = null;

    /* The pristine snippet, kept as markup as well as text: Reset restores the
       server-rendered Chroma output byte for byte, including hl_lines, which
       the client-side highlighter does not reproduce. */
    this.original = code.textContent;
    this.originalHTML = code.innerHTML;
    /* Match the indentation the snippet already uses. Chroma expands tabs to
       spaces (markup.highlight tabWidth), so this is normally four spaces. */
    this.unit = /^\t/m.test(this.original) ? '\t' : '    ';

    const lang = (code.getAttribute('data-lang') || snip.getAttribute('syntax') ||
      snip.getAttribute('sandbox') || '').toLowerCase();
    this.hl = lang.startsWith('go') ? highlightGo : escapeHTML;

    /* Take editing away from codapi: no contenteditable, no Edit link. Its
       keydown handlers stay bound to an element that can no longer be focused,
       which costs nothing. */
    code.removeAttribute('contenteditable');
    const link = snip.querySelector('codapi-toolbar a[href="#edit"]');
    if (link) link.hidden = true;

    this.wrap = document.createElement('div');
    this.wrap.className = 'ced';
    pre.parentNode.insertBefore(this.wrap, pre);
    this.wrap.appendChild(pre);

    this.buildControls();
    this.update();
  }

  /* buildControls appends our own controls to codapi's toolbar, so Run, the
     status line and the editing controls stay one row.

     The buttons go BEFORE the status, the shortcut hint AFTER it. The hint
     appears and disappears with the editing mode, and anything that grows in
     front of the status shoves it sideways: a reader who has just run the code
     watches "✓ Done" jump across the row the moment they press Edit. Behind
     the status it can come and go without moving the one thing on this row
     they are actually reading. */
  buildControls() {
    const bar = this.snip.querySelector('codapi-toolbar');
    if (!bar) return;
    const anchor = bar.querySelector('codapi-status');

    this.btnEdit = button(I18N.codeEdit, () => this.enter());
    this.btnClose = button(I18N.codeClose, () => this.exit());
    this.btnReset = button(I18N.codeReset, () => this.reset());

    /* innerHTML, because the string carries <kbd class="kb"> key caps — the
       same ones the header's ⌘K and the rails' [ ] wear. It comes from the
       site's own i18n catalogue, exactly like the focus button's hint. ⌘ needs
       no special handling here — the key cap corrects the glyph's size itself,
       through a unicode-range face (10-header.css). */
    this.hint = document.createElement('span');
    this.hint.className = 'ced-hint';
    this.hint.innerHTML = String(I18N.codeHint || '').replace('{mod}', IS_MAC ? '⌘' : 'Ctrl');

    [this.btnEdit, this.btnClose, this.btnReset].forEach((el) => {
      bar.insertBefore(el, anchor);
    });
    /* after the status, and after any action links codapi added of its own */
    bar.appendChild(this.hint);
  }

  /* buildInput creates the editing surface on first use: a transparent textarea
     laid over the highlighted block. Its metrics are pinned in CSS to the same
     values as `pre code`, so glyphs sit exactly on their coloured twins. */
  buildInput() {
    const ta = document.createElement('textarea');
    ta.className = 'ced-input';
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.autocomplete = 'off';
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('wrap', 'off');
    ta.setAttribute('aria-label', I18N.codeAria);

    ta.addEventListener('input', () => this.onInput());
    ta.addEventListener('keydown', (e) => this.onKey(e));
    /* The <pre> cannot scroll on its own while editing (CSS hides its overflow),
       so the textarea's scroll position is the single source of truth. */
    ta.addEventListener('scroll', () => {
      this.pre.scrollLeft = ta.scrollLeft;
      this.pre.scrollTop = ta.scrollTop;
    });

    this.wrap.appendChild(ta);
    this.ta = ta;
    return ta;
  }

  enter() {
    const ta = this.ta || this.buildInput();
    ta.value = this.code.textContent;
    this.editing = true;
    this.pre.setAttribute('aria-hidden', 'true');
    this.update();
    /* preventScroll: entering the editor must not move the page under the
       reader — they are looking at the block already. */
    ta.focus({ preventScroll: true });
    const end = ta.value.length;
    ta.setSelectionRange(end, end);
  }

  exit() {
    if (!this.editing) return;
    const hadFocus = document.activeElement === this.ta;
    this.editing = false;
    this.pre.removeAttribute('aria-hidden');
    this.pre.scrollLeft = this.ta ? this.ta.scrollLeft : 0;
    this.update();
    /* Never drop focus into the void: hand it to the control that brought the
       reader here, which is where Tab would resume from. */
    if (hadFocus) this.btnEdit.focus({ preventScroll: true });
  }

  reset() {
    this.code.innerHTML = this.originalHTML;
    if (this.ta) this.ta.value = this.original;
    if (this.editing) this.ta.focus({ preventScroll: true });
    this.update();
  }

  run() {
    if (typeof this.snip.execute === 'function') this.snip.execute();
  }

  onInput() {
    const val = this.ta.value;
    /* A trailing newline has no glyphs to give the <pre> height, so the last
       line would sit below the box. An empty span restores the line without
       adding a character to textContent — which is what gets executed. */
    this.code.innerHTML = this.hl(val) + (/\n$/.test(val) ? '<span class="ced-eol"></span>' : '');
    this.pre.scrollLeft = this.ta.scrollLeft;
    this.update();
  }

  update() {
    const dirty = this.code.textContent !== this.original;
    this.wrap.classList.toggle('is-editing', this.editing);
    this.wrap.classList.toggle('is-dirty', dirty);
    if (!this.btnEdit) return;
    this.btnEdit.hidden = this.editing;
    this.btnClose.hidden = !this.editing;
    this.btnReset.hidden = !dirty;
    this.hint.hidden = !this.editing;
  }

  /* ── keyboard ─────────────────────────────────────────────────────────── */

  onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.exit(); return; }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'Enter' || e.key === 'NumpadEnter')) {
      e.preventDefault(); this.run(); return;
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.code === 'Slash')) {
      e.preventDefault(); this.comment(); return;
    }
    /* Everything else with a modifier is the browser's (undo, copy, word jumps). */
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Tab') { e.preventDefault(); this.indent(e.shiftKey); return; }
    if (e.key === 'Enter') { e.preventDefault(); this.newline(); return; }
    if (e.key === 'Backspace') { this.backspace(e); return; }
    if (e.key.length === 1) this.pair(e);
  }

  /* indent: Tab inserts one unit; Shift+Tab and any multi-line selection
     re-indent whole lines instead, the way every editor behaves. */
  indent(back) {
    const ta = this.ta;
    const { selectionStart: s, selectionEnd: t, value: v } = ta;
    if (!back && s === t) { replaceRange(ta, s, t, this.unit); return; }
    if (!back && !v.slice(s, t).includes('\n')) { replaceRange(ta, s, t, this.unit); return; }

    const from = v.lastIndexOf('\n', s - 1) + 1;
    /* A selection ending exactly at a line start does not include that line. */
    const lastPos = t > s && v[t - 1] === '\n' ? t - 1 : t;
    let to = v.indexOf('\n', lastPos);
    if (to < 0) to = v.length;

    const src = v.slice(from, to).split('\n');
    const out = src.map((line) => {
      if (!line.trim()) return line;
      if (!back) return this.unit + line;
      if (line[0] === '\t') return line.slice(1);
      const m = new RegExp('^ {1,' + this.unit.length + '}').exec(line);
      return m ? line.slice(m[0].length) : line;
    });

    const next = out.join('\n');
    const headDelta = out[0].length - src[0].length;
    const tailDelta = next.length - (to - from);
    replaceRange(ta, from, to, next);
    ta.setSelectionRange(Math.max(from, s + headDelta), Math.max(from, t + tailDelta));
  }

  /* newline keeps the current indentation, adds one level after an opening
     bracket, and opens a body when the caret sits between a pair. */
  newline() {
    const ta = this.ta;
    const { selectionStart: s, selectionEnd: t, value: v } = ta;
    const from = v.lastIndexOf('\n', s - 1) + 1;
    const line = v.slice(from, s);
    const indent = (/^[\t ]*/.exec(line) || [''])[0];
    const opens = /[{([]\s*$/.test(line);
    const closes = /^[ \t]*[}\])]/.test(v.slice(t));

    if (s === t && opens && closes) {
      const body = '\n' + indent + this.unit;
      replaceRange(ta, s, t, body + '\n' + indent, s + body.length);
      return;
    }
    replaceRange(ta, s, t, '\n' + indent + (opens ? this.unit : ''));
  }

  /* pair: auto-close brackets and quotes, wrap a selection, and type over a
     closer the editor itself inserted. Deliberately conservative — it stays
     out of the way when the caret is glued to a word. */
  pair(e) {
    const ta = this.ta;
    const { selectionStart: s, selectionEnd: t, value: v } = ta;
    const key = e.key;

    if (s === t && CLOSERS.has(key) && v[s] === key) {
      e.preventDefault();
      ta.setSelectionRange(s + 1, s + 1);
      return;
    }

    const close = OPEN[key];
    if (!close) return;

    if (s !== t) {
      e.preventDefault();
      replaceRange(ta, s, t, key + v.slice(s, t) + close);
      ta.setSelectionRange(s + 1, t + 1);
      return;
    }

    const prev = v[s - 1] || '';
    const next = v[s] || '';
    if (QUOTES.has(key)) {
      if (WORD.test(prev) || WORD.test(next) || QUOTES.has(next)) return;
    } else if (next && !/[\s)\]},;]/.test(next)) {
      return;
    }
    e.preventDefault();
    replaceRange(ta, s, s, key + close, s + 1);
  }

  /* backspace removes both halves of an empty pair, so an auto-inserted closer
     never has to be deleted by hand. */
  backspace(e) {
    const ta = this.ta;
    const { selectionStart: s, selectionEnd: t, value: v } = ta;
    if (s !== t || s === 0) return;
    if (OPEN[v[s - 1]] !== v[s]) return;
    e.preventDefault();
    deleteRange(ta, s - 1, s + 1);
  }

  /* comment toggles `// ` on the touched lines: commented out unless every
     non-blank line already is, in which case it uncomments. */
  comment() {
    const ta = this.ta;
    const { selectionStart: s, selectionEnd: t, value: v } = ta;
    const from = v.lastIndexOf('\n', s - 1) + 1;
    const lastPos = t > s && v[t - 1] === '\n' ? t - 1 : t;
    let to = v.indexOf('\n', lastPos);
    if (to < 0) to = v.length;

    const src = v.slice(from, to).split('\n');
    const filled = src.filter((l) => l.trim());
    if (!filled.length) return;
    const commented = filled.every((l) => /^[ \t]*\/\//.test(l));

    const out = src.map((line) => {
      if (!line.trim()) return line;
      if (commented) return line.replace(/^([ \t]*)\/\/ ?/, '$1');
      const pad = /^[ \t]*/.exec(line)[0];
      return pad + '// ' + line.slice(pad.length);
    });

    const next = out.join('\n');
    replaceRange(ta, from, to, next);
    ta.setSelectionRange(from, from + next.length);
  }
}

function button(label, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'ced-btn';
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

/* replaceRange edits through execCommand, the only API that writes into a
   textarea while keeping the browser's native undo stack — setRangeText wipes
   it, so it is the fallback for engines that refuse the command. */
function replaceRange(ta, from, to, text, caret) {
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(from, to);
  let ok = false;
  try {
    ok = document.execCommand('insertText', false, text);
  } catch (e) {
    ok = false;
  }
  if (!ok) {
    ta.setRangeText(text, from, to, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (caret != null) ta.setSelectionRange(caret, caret);
}

function deleteRange(ta, from, to) {
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(from, to);
  let ok = false;
  try {
    ok = document.execCommand('delete');
  } catch (e) {
    ok = false;
  }
  if (!ok) {
    ta.setRangeText('', from, to, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
