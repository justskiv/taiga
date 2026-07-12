/* Right rail: table of contents built from h2/h3 with ids, plus a miniature
   outline synced with the scroll-spy. */
import { buildMini } from './minimap.js';

export function buildToc() {
  const host = document.getElementById('tocRail'); if (!host) return;
  const hs = Array.prototype.slice.call(document.querySelectorAll('.wrap h2[id], .wrap h3[id]'));
  if (!hs.length) { const rr = document.querySelector('.rail-r'); if (rr) rr.style.display = 'none'; return; }
  const items = [];
  hs.forEach(function (h) {
    const li = document.createElement('li');
    li.className = h.tagName === 'H3' ? 'lv3' : 'lv2';
    const a = document.createElement('a'); a.href = '#' + h.id;
    a.textContent = h.textContent.replace(/^#+\s*/, '').trim();
    li.appendChild(a); host.appendChild(li);
    items.push({ h: h, li: li });
  });
  const railR = document.querySelector('.rail-r');
  if (railR && !railR.querySelector('.rail-mini')) {
    const mini = buildMini(railR, 'r', '] или ⌘2');
    items.forEach(function (it) {
      const ln = document.createElement('a');
      ln.className = 'mini-ln' + (it.li.className === 'lv3' ? ' lv3' : '');
      ln.href = '#' + it.h.id;
      ln.title = it.h.textContent.replace(/^#+\s*/, '').trim();
      mini.appendChild(ln); it.ln = ln;
    });
  }
  let ticking = false;
  function spy() {
    ticking = false;
    const line = window.scrollY + Math.min(180, window.innerHeight * 0.25);
    /* default to the first heading so the toc is never blank in the pre-heading
       lead — it reads as "you're at the start", and lights the real section
       once one crosses the line */
    let cur = items[0];
    for (let i = 0; i < items.length; i++) {
      const top = items[i].h.getBoundingClientRect().top + window.scrollY;
      if (top <= line) cur = items[i]; else break;
    }
    items.forEach(function (it) {
      it.li.classList.toggle('on', it === cur);
      if (it.ln) it.ln.classList.toggle('on', it === cur);
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  spy();
}
