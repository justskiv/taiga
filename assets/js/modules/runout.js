/* Run output — one output block per runnable snippet.

   codapi renders its result into its own <codapi-output>, directly under the
   toolbar. A guide, though, almost always ships the output the author recorded
   as well — the reader has to see what the code prints without pressing
   anything, since most of them never will. Both on the page at once means two
   near-identical blocks stacked one on the other, and the reader working out
   which is theirs.

   So the shortcode (layouts/_shortcodes/run.html) renders ONE block, and this
   module makes codapi fill it: codapi's own box is hidden (via the data-ro
   attribute, see 26-run-output.css) and the result is poured into the block
   already on the page. The author's output is kept in memory, so "restore the
   example" puts it back exactly, and the reader can always tell whose output
   they are looking at from the provenance text on the prompt line.

   Nothing here is required for the block to work: without JS (or with codapi
   failing to load) the recorded output is still there, still folds, still
   reads. The module only ever adds the live half.

   A snippet with several commands (codapi's actions="Label:command") ships a
   frame of such blocks, one per command (.ro-group). RunModes below turns it
   into a mode switch: pick a command, Run runs it, the frame shows its part. */

import { I18N } from './i18n.js';
import { holdScroll } from './scrollhold.js';

/* codapi can render a result as a table, an SVG, an iframe… Those modes build
   DOM of their own, which belongs in codapi's box, not in our <pre>. Only plain
   text is taken over; anything else keeps codapi's own rendering. */
const TEXT_MODES = new Set(['', 'text']);

export function bindRunOutputs() {
  const blocks = document.querySelectorAll('.ro');
  if (!blocks.length) return;
  blocks.forEach((box) => {
    const snip = box.previousElementSibling;
    if (!snip || snip.tagName !== 'CODAPI-SNIPPET') return;
    if (!TEXT_MODES.has((snip.getAttribute('output-mode') || '').toLowerCase())) return;
    try {
      new RunOutput(snip, box);
    } catch (e) {
      console.error('run output failed:', e);
    }
  });
  /* the parts of a group sit inside the frame, so none of them has the
     snippet as its previous sibling and the loop above passes them by */
  document.querySelectorAll('.ro-group').forEach((group) => {
    const snip = group.previousElementSibling;
    if (!snip || snip.tagName !== 'CODAPI-SNIPPET') return;
    try {
      new RunModes(snip, group);
    } catch (e) {
      console.error('run modes failed:', e);
    }
  });
}

/* A run has two streams and codapi hands over both. Its own renderer shows one
   — `stdout || stderr` — and for Go that quietly drops half of a common case:
   fmt writes to stdout, log writes to stderr, and a snippet that uses both ends
   up showing whichever came first alphabetically in the source of a library we
   do not own. A failing run is worse: the program's own output disappears and
   only the compiler's complaint survives, so the reader cannot see how far it
   got. Both are shown, in the order they happen on a terminal — the program's
   output, then what went wrong — and the single-stream case is byte for byte
   what it was. */
function transcript(res) {
  const out = String(res.stdout || '');
  const err = String(res.stderr || '');
  /* Only the SEAM is normalised. A single stream is handed over byte for byte —
     trailing whitespace can be the point (a program that prints a padded table,
     a snippet about `strings.TrimRight`), and this is not the place to have an
     opinion about it. */
  if (out && err) return out.replace(/\n+$/, '') + '\n' + err;
  return out || err;
}

/* lang= on the shortcode names the language the output is written in, and
   the block highlights it. The recorded part arrives highlighted from the
   build (_partials/run/output.html); a live result and a restored example are
   highlighted here, line by line, by the same rules — change one, change the
   other. The classes are Chroma's own diff tokens, so the palette paints them
   exactly as it paints a ```diff listing (20-chroma.css). A marked line is
   wrapped whole and nothing is added around it: what the reader copies is the
   output, byte for byte. */
const LANGS = new Map([
  ['diff', (line) => {
    if (line.startsWith('+++') || line.startsWith('---')) return 'gh';
    if (line.startsWith('@@')) return 'gu';
    if (line.startsWith('+')) return 'gi';
    if (line.startsWith('-')) return 'gd';
    return '';
  }],
]);

function fill(code, text, lang) {
  const tone = LANGS.get(lang);
  if (!tone) {
    code.textContent = text;
    return;
  }
  const frag = document.createDocumentFragment();
  text.split('\n').forEach((line, i) => {
    if (i) frag.append('\n');
    const cls = tone(line);
    if (!cls) {
      if (line) frag.append(line);
      return;
    }
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = line;
    frag.append(span);
  });
  code.textContent = '';
  code.appendChild(frag);
}

/* Focus goes back to Run only if nothing else has it: a disabled button hands
   it to <body>, and a reader who moved on while the run was out keeps their
   place. */
function focusLost() {
  const a = document.activeElement;
  return !a || a === document.body || a === document.documentElement;
}

class RunOutput {
  /* `part` is set when the block is one part of a group: RunModes then decides
     which part a run belongs to and calls running/result/error itself, and is
     told when the reader puts a part's example back. */
  constructor(snip, box, part) {
    this.snip = snip;
    this.box = box;
    this.part = part || null;
    this.refocus = null;
    this.pre = box.querySelector('.ro-pre');
    this.code = box.querySelector('.ro-pre code');
    this.chip = box.querySelector('.ro-chip');
    this.btn = box.querySelector('.ro-reset');
    if (!this.pre || !this.code || !this.chip) return;

    /* the author's own output, verbatim, so restoring it is exact. `null` when
       the snippet shipped without one — then there is nothing to restore and
       the block stays hidden until the first run. */
    this.example = box.dataset.src === 'example' ? this.code.textContent : null;
    this.exampleState = box.dataset.state || 'idle';
    this.lang = box.dataset.lang || '';

    snip.dataset.ro = '1';
    if (!part) {
      snip.addEventListener('execute', () => this.running());
      snip.addEventListener('result', (e) => this.result(e.detail));
      snip.addEventListener('error', (e) => this.error(e.detail));
    }

    /* the button sits inside <summary>, where a click also toggles the panel —
       collapsing the block is the opposite of what "restore the example" means */
    if (this.btn) {
      this.btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const hadFocus = document.activeElement === this.btn;
        this.restore();
        if (part) part.restored(this, hadFocus);
      });
    }

    /* a group reads codapi's leftover state once, for the part it belongs to */
    if (!part) this.hydrate();
  }

  running() {
    /* the Run button is codapi's, not a <summary>, so the click signal in
       modules/scrollhold.js never sees it — arm the hold by hand */
    holdScroll(this.snip);
    this.box.hidden = false;
    this.box.open = true;   /* they pressed Run to see the output — show it */
    this.box.dataset.state = 'running';
    /* codapi disables Run right after this event, and a disabled button hands
       the focus to <body>: a keyboard reader would start over from the top of
       the page after every run. Whether Run had it is remembered here and
       given back in put(). A group does the same for its Run (RunModes). */
    if (!this.part) {
      const run = this.snip.querySelector('codapi-toolbar > button');
      this.refocus = run && document.activeElement === run ? run : null;
    }
  }

  result(res) {
    if (!res) return;
    const ok = !!res.ok;
    this.put(transcript(res), ok ? 'ok' : 'failed', res.duration);
  }

  error(err) {
    this.put(String((err && err.message) || err || ''), 'failed', 0);
  }

  put(text, state, ms) {
    /* FIRST, before a single byte of this block changes. The answer lands long
       after the click that asked for it, so the hold running() armed has
       lapsed, and nothing observing the DOM afterwards can take its place (see
       BEFORE, NOT AFTER in modules/scrollhold.js). "Before" is meant literally:
       holdScroll reads a rect, which flushes layout, so arming it even one
       statement below the text swap hands the browser a finished layout with
       anchoring still on — and a taller transcript than the one it measured
       moves the page by the difference.

       The snippet, not the block: a block still `hidden` has no box to test,
       and what decides whether suppressing is right is whether the READER is
       looking at this snippet — if they pressed Run and read on below,
       anchoring is doing its job. */
    holdScroll(this.snip);
    if (text) fill(this.code, text, this.lang);
    else this.code.textContent = I18N.runEmpty;
    this.box.hidden = false;
    this.box.open = true;
    this.box.dataset.src = 'live';
    this.box.dataset.state = state;

    const label = state === 'ok' ? I18N.runOk : I18N.runFailed;
    const ms0 = Math.round(Number(ms) || 0);
    this.chip.textContent = ms0 > 0 ? label + ' · ' + ms0 + ' ms' : label;
    this.chip.hidden = false;
    if (this.btn) this.btn.hidden = this.example === null;
    this.pre.scrollTop = 0;   /* a fresh result is read from its first line */
    /* codapi has enabled Run again by the time it fires result or error */
    if (this.refocus && focusLost()) this.refocus.focus({ preventScroll: true });
    this.refocus = null;
  }

  /* hydrate covers the one ordering this module cannot control: codapi is a
     third-party custom element, and if a result had already landed in its own
     box before this ran, hiding that box would take the reader's output off the
     page. Rare — a run needs a click, and the click needs the page — but the
     failure mode is silent, and reading the state codapi keeps on the element
     costs one branch. */
  hydrate() {
    const state = this.snip.getAttribute('state');
    if (state !== 'succeded' && state !== 'failed') return;
    const box = this.snip.querySelector('codapi-output');
    if (!box) return;
    /* Not trimmed, and an all-whitespace result is not treated as no result:
       the run finished, that IS its output, and put() shows the empty-output
       label when there is genuinely nothing. Trimming here would have quietly
       edited the reader's own output on the way in. */
    const text = (box.querySelector('code') || box).textContent;
    if (text == null) return;
    this.put(text, state === 'succeded' ? 'ok' : 'failed', 0);
  }

  restore() {
    if (this.example === null) return;
    fill(this.code, this.example, this.lang);
    this.box.dataset.src = 'example';
    this.box.dataset.state = this.exampleState;
    this.chip.textContent = I18N.runExample;
    this.btn.hidden = true;
    this.pre.scrollTop = 0;
  }
}

/* ── several commands: the mode switch ──────────────────────────────────── */

/* the glyph Run wears in a group: ▶ at rest, a spinner while a run is out */
const PLAY = '<svg class="ro-g ro-g-play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.3 1.8v8.4L10.2 6z"/></svg>';
const SPIN = '<svg class="ro-g ro-g-spin" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.3"/></svg>';

/* the editor modes codeedit.js mounts on: those toolbars get an Edit button,
   and the seam that sets it apart from running */
const EDITABLE = new Set(['basic', 'external']);

/* A snippet with command actions, as the shortcode prints it: one part per
   command in a .ro-group frame, each part an ordinary .ro block carrying its
   command (data-cmd) and its name in the switch (data-label).

   codapi stays as shipped. Its toolbar gets a switch after Run, and picking a
   command sets the snippet's own `command` attribute, which codapi observes and
   rebuilds its executor from — so Run, and ⌘↵ in the editor, both run the
   picked command without our having to intercept either. Its action links
   stay in the DOM (it keeps references to them) and are hidden: the switch
   speaks for them.

   Which part a result belongs to is decided at `execute`: the switch is
   locked for the length of a run, so the command picked when it started is
   the one that answers. */
class RunModes {
  constructor(snip, group) {
    this.snip = snip;
    this.group = group;
    this.parts = new Map();
    group.querySelectorAll(':scope > .ro[data-cmd]').forEach((box) => {
      this.parts.set(box.dataset.cmd, new RunOutput(snip, box, this));
    });
    if (this.parts.size < 2) return;

    this.primary = this.parts.keys().next().value;
    this.selected = this.primary;
    this.target = null;
    /* runs in flight: the switch stays locked, and every answer goes to the
       part picked when they started, until the last one is in */
    this.inflight = 0;
    this.busy = false;
    this.refocus = false;
    this.radios = [];
    this.run = null;

    snip.addEventListener('execute', () => this.running());
    snip.addEventListener('result', (e) => this.settle((p) => p.result(e.detail)));
    snip.addEventListener('error', (e) => this.settle((p) => p.error(e.detail)));

    /* until the reader picks, the snippet runs its own command= — the first part */
    this.parts.get(this.primary).hydrate();

    /* the switch goes into codapi's toolbar, which exists once the element is
       upgraded — before this runs, or later with defer/init-delay */
    if (snip.ready) this.mount();
    else snip.addEventListener('load', () => this.mount(), { once: true });
  }

  mount() {
    const bar = this.snip.querySelector('codapi-toolbar');
    const run = bar && bar.querySelector(':scope > button');
    if (!run) return;
    this.run = run;
    bar.classList.add('ro-bar');

    bar.querySelectorAll(':scope > a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href !== '#edit' && this.parts.has(href.slice(1))) a.hidden = true;
    });

    const label = run.textContent.trim();
    run.innerHTML = PLAY + SPIN;
    run.append(label);

    const seg = document.createElement('span');
    seg.className = 'ro-seg';
    seg.setAttribute('role', 'radiogroup');
    seg.setAttribute('aria-label', I18N.runModes);
    this.parts.forEach((part, cmd) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ro-opt';
      b.setAttribute('role', 'radio');
      b.dataset.cmd = cmd;
      b.textContent = part.box.dataset.label || cmd;
      b.addEventListener('click', () => this.select(cmd, false));
      seg.appendChild(b);
      this.radios.push(b);
    });
    seg.addEventListener('keydown', (e) => this.onKey(e));
    run.after(seg);

    if (EDITABLE.has(this.snip.getAttribute('editor') || 'off')) {
      const sep = document.createElement('span');
      sep.className = 'ro-sep';
      sep.setAttribute('aria-hidden', 'true');
      seg.after(sep);
    }
    this.sync();

    /* Only now, with the switch on the page, does the frame show one part at
       a time: the part is marked first, then the frame. Until then — and for
       good if codapi never loads — every recorded part stays readable. */
    this.show(this.selected);
    this.group.dataset.mode = '';
  }

  /* Picking a command never runs it. The part on screen follows the pick:
     the command's recorded output, or its last live one. */
  select(cmd, focus) {
    if (this.busy || !this.parts.has(cmd)) return;
    if (cmd !== this.selected) {
      /* the frame grows or shrinks under the switch the reader just pressed —
         hold the page, before a byte changes (modules/scrollhold.js) */
      holdScroll(this.snip);
      /* one frame, one fold: the next part opens, or stays folded, the way
         the reader left the one before it */
      const prev = this.parts.get(this.selected);
      if (!prev.box.hidden) this.parts.get(cmd).box.open = prev.box.open;
      this.selected = cmd;
      this.snip.setAttribute('command', cmd);
      this.show(cmd);
      this.sync();
    }
    if (focus) {
      const b = this.radios.find((r) => r.dataset.cmd === cmd);
      if (b) b.focus();
    }
  }

  show(cmd) {
    this.parts.forEach((p, c) => p.box.toggleAttribute('data-on', c === cmd));
  }

  /* one tab stop for the group; arrows move the pick inside it, as radios do */
  onKey(e) {
    const i = this.radios.indexOf(document.activeElement);
    if (i < 0) return;
    const n = this.radios.length;
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    this.select(this.radios[j].dataset.cmd, true);
  }

  sync() {
    this.radios.forEach((b) => {
      const on = b.dataset.cmd === this.selected;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
  }

  running() {
    if (!this.inflight) this.target = this.selected;
    this.inflight++;
    this.busy = true;
    /* codapi disables Run right after this event, and a disabled button hands
       the focus to <body>: a keyboard reader would lose their place on every
       run. Whether Run had it is remembered here and given back in settle(). */
    if (this.inflight === 1) this.refocus = !!this.run && document.activeElement === this.run;
    this.parts.get(this.target).running();
    this.radios.forEach((b) => { b.disabled = true; });
    if (this.run) this.run.classList.add('is-running');
  }

  settle(apply) {
    const cmd = this.target || this.selected;
    const part = this.parts.get(cmd);
    this.inflight = Math.max(0, this.inflight - 1);
    /* the part first: put() arms the scroll hold before anything changes */
    apply(part);
    if (this.inflight) {
      /* another run of the same command is still out: stay locked for it */
      part.running();
      return;
    }
    this.target = null;
    this.busy = false;
    this.radios.forEach((b) => { b.disabled = false; });
    if (this.run) this.run.classList.remove('is-running');
    /* codapi has re-enabled Run by the time it fires result or error */
    if (this.refocus && this.run && focusLost()) this.run.focus({ preventScroll: true });
    this.refocus = false;
  }

  /* "restore the example" on one part: a focused button that has just hidden
     itself hands the focus to the prompt line it sat on */
  restored(part, hadFocus) {
    if (hadFocus) part.box.querySelector('.ro-h').focus({ preventScroll: true });
  }
}
