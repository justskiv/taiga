/* Theme + view popover, mounted into #tp-mount in the header. The theme list
   comes from the JSON the palettes partial emits (#dg-themes) — JS knows only
   names and swatch colors, never palette values. */
import { I18N } from './i18n.js';
import { curTheme, setTheme } from './view.js';

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
        '<i class="tp-acc"></i></span>' +
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
