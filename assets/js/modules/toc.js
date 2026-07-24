/* Right rail: table of contents built from h2/h3 with ids, plus a miniature
   outline synced with the scroll-spy.

   Long TOCs (that would overflow the sticky panel) fold into an accordion: h3s
   are grouped under their h2 and only the active h2's group is open; short TOCs
   stay flat, exactly as before. The minimap keeps every heading as a dash — it
   is the full map — regardless of what the panel collapses. */
import { buildMini } from './minimap.js';
import { I18N } from './i18n.js';

export function buildToc() {
  const host = document.getElementById('tocRail'); if (!host) return;
  const hs = Array.prototype.slice.call(document.querySelectorAll('.wrap h2[id], .wrap h3[id]'));
  if (!hs.length) { const rr = document.querySelector('.rail-r'); if (rr) rr.style.display = 'none'; return; }

  const items = [];            // {h, li, ln, grp}
  const groups = [];           // {h2li, sub}  — one per h2 (+ leading orphan h3s)
  let curOl = null, curGrp = -1;

  hs.forEach(function (h) {
    const isH3 = h.tagName === 'H3';
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href = '#' + h.id;
    a.textContent = h.textContent.replace(/^#+\s*/, '').trim();
    li.appendChild(a);

    if (isH3) {
      if (!curOl) {                          // h3 before any h2 — open a headless group
        const wrap = document.createElement('li'); wrap.className = 'sub';
        curOl = document.createElement('ol'); wrap.appendChild(curOl);
        host.appendChild(wrap);
        groups.push({ h2li: null, sub: wrap }); curGrp = groups.length - 1;
      }
      li.className = 'lv3';
      curOl.appendChild(li);
    } else {
      li.className = 'lv2';
      host.appendChild(li);
      const wrap = document.createElement('li'); wrap.className = 'sub';
      curOl = document.createElement('ol'); wrap.appendChild(curOl);
      host.appendChild(wrap);
      groups.push({ h2li: li, sub: wrap }); curGrp = groups.length - 1;
    }
    items.push({ h: h, li: li, grp: curGrp });
  });

  // right-rail minimap: one dash per heading (built once, stays flat)
  const railR = document.querySelector('.rail-r');
  const railIn = railR && railR.querySelector('.rail-in');
  if (railR && !railR.querySelector('.rail-mini')) {
    const mini = buildMini(railR, 'r', '] ' + I18N.keyOr + ' ⌘2');
    items.forEach(function (it) {
      const ln = document.createElement('a');
      ln.className = 'mini-ln' + (it.li.className === 'lv3' ? ' lv3' : '');
      ln.href = '#' + it.h.id;
      ln.title = it.h.textContent.replace(/^#+\s*/, '').trim();
      mini.appendChild(ln); it.ln = ln;
    });
  }

  let accordion = false, grpTimer = null;
  let activeIdx = -1, activeGrp = -1, ticking = false;

  /* keep the active entry inside the middle 60% of the panel (only when the
     reader isn't hovering it — never yank the list out from under the cursor) */
  function nudge() {
    if (!railIn || railIn.matches(':hover')) return;
    const it = items[activeIdx]; if (!it) return;
    requestAnimationFrame(function () {                 // let an open apply its height first
      const cr = railIn.getBoundingClientRect();
      const lr = it.li.getBoundingClientRect();
      const H = railIn.clientHeight;
      const center = lr.top + lr.height / 2 - cr.top;
      if (center < H * 0.2 || center > H * 0.8) {
        railIn.scrollTo({ top: Math.max(0, railIn.scrollTop + center - H / 2), behavior: 'smooth' });
      }
    });
  }

  function openGroup(grp) {
    groups.forEach(function (g, i) {
      const open = i === grp;
      g.sub.classList.toggle('open', open);
      if (g.h2li) g.h2li.classList.toggle('open', open);
    });
    nudge();
  }

  /* SIZE-driven, not toggle-driven: collapse only when the flat list would
     overflow the sticky panel. Floor 12 keeps small TOCs always-flat; cap 24
     always folds a wall even on a tall monitor. */
  function evalLong() {
    host.classList.remove('acc');                       // measure the flat layout
    const n = items.length;
    const shown = railIn && getComputedStyle(railIn).display !== 'none';
    const overflow = shown && railIn.scrollHeight > railIn.clientHeight + 2;
    accordion = n > 24 || (overflow && n > 12);
    host.classList.toggle('acc', accordion);
    if (accordion) openGroup(items[activeIdx >= 0 ? activeIdx : 0].grp);
    else groups.forEach(function (g) {
      g.sub.classList.remove('open'); if (g.h2li) g.h2li.classList.remove('open');
    });
  }

  function spy() {
    ticking = false;
    const line = window.scrollY + Math.min(180, window.innerHeight * 0.25);
    /* default to the first heading so the toc is never blank in the pre-heading
       lead — it reads as "you're at the start" and lights the real section
       once one crosses the line */
    let cur = 0;
    for (let i = 0; i < items.length; i++) {
      const top = items[i].h.getBoundingClientRect().top + window.scrollY;
      if (top <= line) cur = i; else break;
    }
    if (cur !== activeIdx) {
      items.forEach(function (it, i) {
        it.li.classList.toggle('on', i === cur);
        if (it.ln) it.ln.classList.toggle('on', i === cur);
      });
      activeIdx = cur;
    }
    if (!accordion) return;
    const grp = items[cur].grp;
    if (grp !== activeGrp) {                             // switch open group on a debounce
      activeGrp = grp;
      clearTimeout(grpTimer);
      grpTimer = setTimeout(function () { openGroup(grp); }, 250);
    } else {
      nudge();                                          // same group, moving between its h3s
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  window.addEventListener('resize', function () { evalLong(); });

  evalLong();
  spy();
}
