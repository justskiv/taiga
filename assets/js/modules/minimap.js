/* Collapsed-rail minimap + peek overlay, shared by both rails. When a rail is
   off, its panel folds into bare marks in the margin; hovering or focusing the
   map peeks the full .rail-in as an overlay on the same top line, and the
   «закрепить панель» row inside pins it back. */
import { I18N } from './i18n.js';
import { railOn, setRail } from './view.js';

export function buildMini(rail, side, keys) {
  const box = document.createElement('div'); box.className = 'rail-mini';
  const inEl = rail.querySelector('.rail-in');
  let t = null;
  function sched(fn, ms) { clearTimeout(t); t = setTimeout(fn, ms); }
  function peek() { clearTimeout(t); rail.classList.add('peek'); }
  function unpeek() { clearTimeout(t); rail.classList.remove('peek'); }
  /* tiny entry delay so the panel feels responsive to intent (just enough to
     swallow a passing cursor), a longer exit one so the map→overlay hand-off
     doesn't flicker */
  box.addEventListener('mouseenter', function () { if (!railOn(side)) sched(peek, 50); });
  box.addEventListener('mouseleave', function () { sched(unpeek, 50); });
  box.addEventListener('focusin', function () { if (!railOn(side)) peek(); });
  rail.addEventListener('focusout', function (e) {
    if (!(e.relatedTarget && rail.contains(e.relatedTarget))) unpeek();
  });
  rail.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rail.classList.contains('peek')) unpeek();
  });
  if (inEl) {
    inEl.addEventListener('mouseenter', function () { if (rail.classList.contains('peek')) clearTimeout(t); });
    inEl.addEventListener('mouseleave', function () { if (rail.classList.contains('peek')) sched(unpeek, 50); });
    if (!inEl.querySelector('.rail-pin')) {
      const pin = document.createElement('button');
      pin.type = 'button'; pin.className = 'rail-pin';
      pin.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6"/><path d="M10 4v6l-2 3h8l-2-3V4"/><path d="M12 13v7"/></svg>' +
        '<span class="rail-pin-lab">' + I18N.pinPanel + '</span>' +
        '<kbd class="kb">' + keys.charAt(0) + '</kbd>';
      pin.addEventListener('click', function () { unpeek(); setRail(side, true); });
      inEl.appendChild(pin);
    }
  }
  (rail.querySelector('.rail-dock') || rail).appendChild(box);
  return box;
}
