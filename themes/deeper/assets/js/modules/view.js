/* Shared "view" state: theme, rails, rubric-list variant. The popover and the
   hotkeys both drive these; segment buttons register here so any change keeps
   every control in sync. Themes are CSS [data-theme] blocks now — switching a
   theme just swaps the attribute (prefs.js already applied the saved one). */
import { store, read } from './store.js';

const root = document.documentElement;
const THEME_KEY = 'dg.theme';

export function curTheme() { return root.getAttribute('data-theme') || read(THEME_KEY) || 'amber'; }

export function setTheme(id) {
  root.classList.add('theme-switching');   /* kill transitions for one frame */
  root.setAttribute('data-theme', id);
  store(THEME_KEY, id);
  void root.offsetHeight;
  requestAnimationFrame(function () { root.classList.remove('theme-switching'); });
}

/* rubric page layout variant: rows (default) / loud / shelf */
let rubvar = (function () { const v = read('dg.rubvar'); return (v === 'loud' || v === 'shelf') ? v : 'rows'; })();
export function getRubvar() { return rubvar; }
export function setRubvar(v) {
  rubvar = v; store('dg.rubvar', v);
  if (v === 'rows') root.removeAttribute('data-rubvar');
  else root.setAttribute('data-rubvar', v);
  syncSegs();
}

export function railOn(side) { return !root.classList.contains('rail-' + side + '-off'); }
export function setRail(side, on) {
  root.classList.toggle('rail-' + side + '-off', !on);
  store(side === 'l' ? 'dg.railL' : 'dg.railR', on ? 'on' : 'off');
  syncSegs();
}

/* segmented controls stay in sync with the underlying state */
const segRegistry = [];
export function registerSeg(btns, idx) { segRegistry.push({ btns: btns, idx: idx }); }
export function syncSegs() {
  segRegistry.forEach(function (s) {
    const k = s.idx();
    s.btns.forEach(function (b, i) { b.classList.toggle('on', i === k); });
  });
}
