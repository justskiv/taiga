/* Rails: close buttons + a live minimap when collapsed. Left folds into series
   dots (read/current state, dots navigate); the right minimap is built in
   toc.js. Runs after markVisited so the dots read .is-visited/.cur. */
import { setRail } from './view.js';
import { buildMini } from './minimap.js';
import { I18N } from './i18n.js';

export function bindRails() {
  Array.prototype.forEach.call(document.querySelectorAll('.rail-x'), function (x) {
    x.addEventListener('click', function () { setRail(x.getAttribute('data-rail'), false); });
  });
  const railL = document.querySelector('.rail-l');
  if (railL && !railL.querySelector('.rail-mini')) {
    const mini = buildMini(railL, 'l', '[ ' + I18N.keyOr + ' ⌘1');
    Array.prototype.forEach.call(railL.querySelectorAll('.snav li'), function (li) {
      const a = li.querySelector('a');
      const s = a || li.querySelector('.soon');   // announce parts are a .soon <span>
      if (!s) return;
      const d = document.createElement(a ? 'a' : 'span'); d.className = 'mini-dot';
      if (a) { d.href = a.getAttribute('href'); } else { d.classList.add('is-announce'); }
      d.title = (a ? a.textContent : s.firstChild.textContent).replace(/\s*✓\s*$/, '').trim();
      if (li.classList.contains('cur')) d.classList.add('cur');
      if (a && a.classList.contains('is-visited')) d.classList.add('is-visited');
      mini.appendChild(d);
    });
  }
}
