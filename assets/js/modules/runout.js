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
   reads. The module only ever adds the live half. */

import { I18N } from './i18n.js';

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

class RunOutput {
  constructor(snip, box) {
    this.snip = snip;
    this.box = box;
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

    snip.dataset.ro = '1';
    snip.addEventListener('execute', () => this.running());
    snip.addEventListener('result', (e) => this.result(e.detail));
    snip.addEventListener('error', (e) => this.error(e.detail));

    /* the button sits inside <summary>, where a click also toggles the panel —
       collapsing the block is the opposite of what "restore the example" means */
    if (this.btn) {
      this.btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.restore();
      });
    }

    this.hydrate();
  }

  running() {
    this.box.hidden = false;
    this.box.open = true;   /* they pressed Run to see the output — show it */
    this.box.dataset.state = 'running';
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
    this.code.textContent = text || I18N.runEmpty;
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
    this.code.textContent = this.example;
    this.box.dataset.src = 'example';
    this.box.dataset.state = this.exampleState;
    this.chip.textContent = I18N.runExample;
    this.btn.hidden = true;
    this.pre.scrollTop = 0;
  }
}
