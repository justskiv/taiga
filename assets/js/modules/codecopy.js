/* Copy button for code listings.

   One action, mounted on every listing the codeblock render hook produced —
   a plain fence and a runnable snippet alike, since to the reader they are the
   same object with the same thing worth taking out of it. The look and the
   reasoning behind hiding it at rest live in 27-code-copy.css; this module
   builds it, decides what the block's text actually is, and says how it went.

   Order matters once: this runs BEFORE bindCodeEditors() (main.js), so the
   nesting is always .cc-wrap > .ced > pre. The editor then wraps a <pre> that
   already sits in our wrapper, the button stays a child of .cc-wrap rather than
   of the editor's box, and its z-index keeps it clickable above the editing
   textarea. Mounted the other way round the two wrappers would nest inside out
   and the button would ride the editor's layer.

   The module keeps quiet on pages with no listings. */

import { I18N } from './i18n.js';

/* How long a result stays on the button. Failure holds longer: it carries
   something the reader has to notice and act on, success only confirms what
   they already expected. */
const HOLD_OK = 1600;
const HOLD_ERR = 2400;

/* Stacked in one cell by CSS; only one is opaque at a time. stroke-width 1.8 is
   the weight the theme's other small glyphs are drawn at (the fold chevron, the
   rail arrows). */
const ICONS =
  '<svg class="cc-i-copy" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
  '<svg class="cc-i-ok" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
  '<svg class="cc-i-err" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

export function bindCodeCopy() {
  const listings = findListings();
  if (!listings.length) return;
  const live = liveRegion();
  listings.forEach((pre) => mount(pre, live));
}

/* A listing is what layouts/_markup/render-codeblock.html emits, and nothing
   else: a Chroma <pre> for Go, a plain <pre><code class="nohl"> for every other
   language. Matching those two shapes rather than every <pre> in the column is
   what keeps the button off blocks that are not listings — the run-output
   transcript (.ro-pre), codapi's own result box, and whatever markup a widget
   or a raw HTML block brings with it. */
function findListings() {
  const out = [];
  document.querySelectorAll('.wrap pre').forEach((pre) => {
    const code = pre.firstElementChild;
    if (pre.classList.contains('chroma') ||
        (code && code.classList.contains('nohl'))) out.push(pre);
  });
  return out;
}

function mount(pre, live) {
  /* codeedit.js mounts on codapi's `load` event, which for a snippet upgraded
     during parse has already fired by the time we run — so the editor's wrapper
     may be here first. Wrap whichever element is currently the listing's
     outermost box and the button ends up outside it either way. */
  const host = pre.closest('.ced') || pre;
  const wrap = document.createElement('div');
  wrap.className = 'cc-wrap';
  host.parentNode.insertBefore(wrap, host);
  wrap.appendChild(host);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cc-btn';
  /* Icon-only, so the accessible name is the whole label. It never changes:
     the button does the same thing before and after a copy, and a name that
     turned into "Copied" would describe the outcome rather than the control.
     The outcome goes to the live region instead. */
  btn.setAttribute('aria-label', I18N.copyCode);
  btn.innerHTML = ICONS;
  wrap.appendChild(btn);

  let timer = 0;
  btn.addEventListener('click', () => {
    clearTimeout(timer);
    copy(sourceText(wrap)).then(
      () => { timer = flash(btn, live, 'is-ok', I18N.copyDone, HOLD_OK); },
      () => { timer = flash(btn, live, 'is-err', I18N.copyFail, HOLD_ERR); }
    );
  });
}

/* What gets copied. While a snippet is being edited the reader's own text is in
   the textarea; codeedit.js mirrors it back into the listing on every keystroke,
   so the two agree, but the textarea is the original and cannot drift.

   The trailing newline goes: Chroma ends the last line with one, and a shell
   pasted into with it runs the command instead of offering it for a look. */
function sourceText(wrap) {
  const ta = wrap.querySelector('.ced.is-editing .ced-input');
  const code = wrap.querySelector('pre code');
  return (ta ? ta.value : (code || wrap).textContent).replace(/\n$/, '');
}

/* flash paints the result and schedules the way back. The state class comes off
   and the element is reflowed before it goes on again, so a second click
   restarts the swap instead of leaving a check already on screen unchanged —
   which would read as "nothing happened this time". */
function flash(btn, live, cls, message, hold) {
  btn.classList.remove('is-ok', 'is-err');
  void btn.offsetWidth;
  btn.classList.add(cls);
  live.textContent = message;
  return setTimeout(() => {
    btn.classList.remove(cls);
    /* Emptied with the button: a live region that keeps its text can read it
       out again the next time anything makes it re-announce. */
    live.textContent = '';
  }, hold);
}

/* navigator.clipboard needs a secure context, and a site served over plain http
   — `hugo server` reached from another machine on the LAN, say — has none.
   There the old execCommand path still works, so the button works too. Both
   ends resolve into one promise, and the caller handles one shape. */
function copy(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('aria-hidden', 'true');
    /* Off-screen but still selectable: display:none and visibility:hidden
       cannot be selected at all, and anything visible would scroll the page to
       itself as it takes focus. */
    ta.style.cssText = 'position:fixed; top:0; left:0; width:1px; height:1px; opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    ta.remove();
    if (ok) resolve();
    else reject(new Error('copy failed'));
  });
}

/* One region for the page: the announcement is about the click that has just
   happened, and only one button can be clicked at a time. */
function liveRegion() {
  const el = document.createElement('div');
  el.className = 'cc-live';
  el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);
  return el;
}
