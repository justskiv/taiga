/* {{< bars >}}: a label sits inside its bar's end unless the bar is too short
   for it, and then it steps out past the end (class is-out, 31-data.css).
   The template can only guess that for a typical width; this measures it on
   the page and keeps it right as the column narrows or widens.

   No imports and no globals at import time — the Obsidian plugin carries a
   byte copy of this file for its own bars. A root that is not laid out yet
   (a card still closed, width 0) is left alone and fitted when it grows. */

/* the label wants this much room inside its bar beyond its own width */
const PAD = 14;

function fitOne(root) {
  if (!root.clientWidth) return;
  const rows = root.querySelectorAll('.bars-r:not(.is-na)');
  for (let k = 0; k < rows.length; k++) {
    const row = rows[k];
    /* in a whole the label belongs to the part marked at the bar's end */
    const bar = row.querySelector('.bars-cut') || row.querySelector('.bars-bar');
    const lab = bar && bar.querySelector('.bars-v');
    if (!lab) continue;
    row.classList.toggle('is-out', lab.offsetWidth + PAD > bar.offsetWidth);
  }
}

export function fitBars(scope) {
  const doc = (scope && scope.ownerDocument) || document;
  const win = doc.defaultView || window;
  const roots = (scope || doc).querySelectorAll('.bars');
  if (!roots.length) return function () {};
  let raf = 0;
  const pending = new Set();
  function flush() {
    raf = 0;
    pending.forEach(fitOne);
    pending.clear();
  }
  const ro = typeof win.ResizeObserver === 'function'
    ? new win.ResizeObserver(function (entries) {
      entries.forEach(function (e) { pending.add(e.target); });
      if (!raf) raf = win.requestAnimationFrame(flush);
    })
    : null;
  roots.forEach(function (r) {
    fitOne(r);
    if (ro) ro.observe(r);
  });
  /* the mono face arriving late changes every label's width */
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { roots.forEach(fitOne); });
  return function () {
    if (ro) ro.disconnect();
    if (raf) win.cancelAnimationFrame(raf);
  };
}
