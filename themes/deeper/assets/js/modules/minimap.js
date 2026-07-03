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
  /* small delays: entry so a passing cursor doesn't flash the panel,
     exit so the map→overlay hand-off doesn't flicker */
  box.addEventListener('mouseenter', function () { if (!railOn(side)) sched(peek, 120); });
  box.addEventListener('mouseleave', function () { sched(unpeek, 200); });
  box.addEventListener('focusin', function () { if (!railOn(side)) peek(); });
  rail.addEventListener('focusout', function (e) {
    if (!(e.relatedTarget && rail.contains(e.relatedTarget))) unpeek();
  });
  rail.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rail.classList.contains('peek')) unpeek();
  });
  if (inEl) {
    inEl.addEventListener('mouseenter', function () { if (rail.classList.contains('peek')) clearTimeout(t); });
    inEl.addEventListener('mouseleave', function () { if (rail.classList.contains('peek')) sched(unpeek, 200); });
    if (!inEl.querySelector('.rail-pin')) {
      const pin = document.createElement('button');
      pin.type = 'button'; pin.className = 'rail-pin';
      pin.title = I18N.pinPanel + ' — ' + keys;
      pin.innerHTML = I18N.pinPanel + ' <kbd class="kb">' + keys.charAt(0) + '</kbd>';
      pin.addEventListener('click', function () { unpeek(); setRail(side, true); });
      inEl.appendChild(pin);
    }
  }
  rail.appendChild(box);
  return box;
}
