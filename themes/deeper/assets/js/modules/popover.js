/* Theme + view popover, mounted into #tp-mount in the header. The theme list
   comes from the JSON the palettes partial emits (#dg-themes) — JS knows only
   names and swatch colors, never palette values. */
import { I18N } from './i18n.js';
import { curTheme, setTheme, railOn, setRail, getRubvar, setRubvar, registerSeg, syncSegs } from './view.js';

function themes() {
  const el = document.getElementById('dg-themes');
  if (!el) return [];
  try { return JSON.parse(el.textContent) || []; } catch (e) { return []; }
}

export function buildPopover(mount) {
  const list = themes();
  const wrap = document.createElement('div'); wrap.className = 'tp-wrap';
  const btn = document.createElement('button');
  btn.className = 'tp-btn'; btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', I18N.popoverAria);
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r="0.75" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="0.75" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r="0.75" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="0.75" fill="currentColor" stroke="none"/></svg>';

  const pop = document.createElement('div');
  pop.className = 'tp-pop'; pop.setAttribute('role', 'menu'); pop.hidden = true;

  const head = document.createElement('div'); head.className = 'tp-head'; head.textContent = I18N.themeHead;
  pop.appendChild(head);
  const listEl = document.createElement('div'); listEl.className = 'tp-list'; pop.appendChild(listEl);

  const itemEls = [];
  list.forEach(function (t) {
    const sw = t.sw || [];
    const it = document.createElement('button');
    it.type = 'button'; it.className = 'tp-item'; it.setAttribute('role', 'menuitemradio');
    it.innerHTML = '<span class="tp-sw" style="background:' + sw[0] + '">' +
        '<i style="background:' + sw[1] + '"></i>' +
        '<i style="background:' + sw[2] + '"></i>' +
        '<i style="background:' + sw[3] + '"></i>' +
        '<i class="tp-amber"></i></span>' +
      '<span class="tp-name">' + t.name + '</span>' +
      '<span class="tp-check" aria-hidden="true">✓</span>';
    it.addEventListener('click', function () { setTheme(t.id); mark(); });
    it._id = t.id; listEl.appendChild(it); itemEls.push(it);
  });
  function mark() {
    const cur = curTheme();
    itemEls.forEach(function (el) {
      const on = el._id === cur;
      el.classList.toggle('current', on);
      el.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  /* view settings: rails, rubric layout */
  function segRow(label, opts, activeIdx, choose) {
    const row = document.createElement('div'); row.className = 'tp-row';
    row.innerHTML = '<span class="tr-l">' + label + '</span>';
    const seg = document.createElement('span'); seg.className = 'tp-seg';
    const btns = opts.map(function (o, i) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = o;
      b.addEventListener('click', function () { choose(i); });
      seg.appendChild(b); return b;
    });
    row.appendChild(seg);
    registerSeg(btns, activeIdx);
    return row;
  }
  const sec = document.createElement('div'); sec.className = 'tp-sec';
  const vh = document.createElement('div'); vh.className = 'tp-head'; vh.textContent = I18N.viewHead;
  sec.appendChild(vh);
  let hasRows = false;
  if (document.body.classList.contains('article')) {
    hasRows = true;
    sec.appendChild(segRow(I18N.railLeft, [I18N.on, I18N.off],
      function () { return railOn('l') ? 0 : 1; }, function (i) { setRail('l', i === 0); }));
    sec.appendChild(segRow(I18N.railRight, [I18N.on, I18N.off],
      function () { return railOn('r') ? 0 : 1; }, function (i) { setRail('r', i === 0); }));
  }
  if (document.body.classList.contains('rubric')) {
    hasRows = true;
    const RUBVARS = ['rows', 'loud', 'shelf'];
    sec.appendChild(segRow(I18N.lists, [I18N.listRows, I18N.listLoud, I18N.listShelf],
      function () { return Math.max(0, RUBVARS.indexOf(getRubvar())); },
      function (i) { setRubvar(RUBVARS[i]); }));
  }
  if (document.body.classList.contains('article')) {
    const hint = document.createElement('div'); hint.className = 'tp-hint';
    hint.innerHTML = I18N.hint;
    sec.appendChild(hint);
  }
  if (hasRows) pop.appendChild(sec);

  function onDoc(e) { if (!pop.contains(e.target) && !btn.contains(e.target)) close(); }
  function onKey(e) { if (e.key === 'Escape') { close(); btn.focus(); } }
  function show() {
    pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    mark(); syncSegs();
  }
  function close() {
    pop.hidden = true; btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey);
  }
  btn.addEventListener('click', function () { pop.hidden ? show() : close(); });

  mark();
  wrap.appendChild(btn); wrap.appendChild(pop);
  mount.appendChild(wrap);
}
