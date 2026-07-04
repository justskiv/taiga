/* Visited marks: series lists get a quiet ✓ once a guide has been read. */
import { store, read } from './store.js';

const VIS_KEY = 'dg.visited';
function visited() { try { return JSON.parse(read(VIS_KEY) || '[]'); } catch (e) { return []; } }

export function markVisited() {
  const list = visited();
  if (document.body.classList.contains('article')) {
    const p = location.pathname;
    if (list.indexOf(p) < 0) { list.push(p); store(VIS_KEY, JSON.stringify(list.slice(-200))); }
  }
  const set = {}; list.forEach(function (p) { set[p] = 1; });
  Array.prototype.forEach.call(document.querySelectorAll('.snav a, .slist a'), function (a) {
    if (!a.querySelector('.vmark')) {
      const v = document.createElement('span'); v.className = 'vmark'; v.textContent = '✓';
      v.setAttribute('aria-hidden', 'true'); a.appendChild(v);
    }
    if (set[a.pathname]) a.classList.add('is-visited');
  });
  /* safety: mark current article in its series list even if the page forgot */
  Array.prototype.forEach.call(document.querySelectorAll('.snav a'), function (a) {
    if (a.pathname === location.pathname) a.closest('li').classList.add('cur');
  });
}
