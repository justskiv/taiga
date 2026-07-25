/* Palette popover, mounted into #tp-mount in the header. The list comes from
   the JSON the palettes partial emits (#dg-themes) — JS knows only ids, names,
   group labels and four swatch colors, never palette values. */
import { I18N } from './i18n.js';
import { curTheme, setTheme } from './view.js';

function themes() {
  const el = document.getElementById('dg-themes');
  if (!el) return [];
  try { return JSON.parse(el.textContent) || []; } catch (e) { return []; }
}

/* A swatch is the palette drawn as a tiny page: the canvas, a card on it, and
   two lines of text over the card. Colors ride in as custom properties so the
   CSS owns every dimension — the JSON stays a list of four hex values. */
function swatch(sw) {
  return '<span class="tp-sw" aria-hidden="true" style="--sw-bg:' + sw[0] +
    ';--sw-card:' + sw[1] + ';--sw-tx:' + sw[2] + ';--sw-mu:' + sw[3] + '">' +
    '<i class="tp-sw-h"></i><i class="tp-sw-t"></i><i class="tp-sw-s"></i></span>';
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

  /* Groups come out of the data as labels, not ids: a new block opens whenever
     the label changes down the (weight-sorted) list. Palettes without a group
     collect in an unlabelled block, which is what a site that never sets the
     key gets — the old flat list. */
  const itemEls = [];
  let box = null, boxLabel = null, gid = 0;
  list.forEach(function (t) {
    const label = t.group || '';
    if (!box || label !== boxLabel) {
      boxLabel = label;
      box = document.createElement('div'); box.className = 'tp-grp';
      if (label) {
        const lab = document.createElement('div');
        lab.className = 'tp-glab'; lab.id = 'tp-g' + (gid++); lab.textContent = label;
        box.setAttribute('role', 'group'); box.setAttribute('aria-labelledby', lab.id);
        box.appendChild(lab);
      }
      listEl.appendChild(box);
    }
    const it = document.createElement('button');
    it.type = 'button'; it.className = 'tp-item'; it.setAttribute('role', 'menuitemradio');
    it.innerHTML = swatch(t.sw || []) +
      '<span class="tp-name">' + t.name + '</span>' +
      '<span class="tp-check" aria-hidden="true">✓</span>';
    it.addEventListener('click', function () { setTheme(t.id); mark(); });
    it._id = t.id; box.appendChild(it); itemEls.push(it);
  });
  function mark() {
    const cur = curTheme();
    itemEls.forEach(function (el) {
      const on = el._id === cur;
      el.classList.toggle('current', on);
      el.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function onDoc(e) { if (!pop.contains(e.target) && !btn.contains(e.target)) close(); }
  function onKey(e) { if (e.key === 'Escape') { close(); btn.focus(); } }
  function show() {
    pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    mark();
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
