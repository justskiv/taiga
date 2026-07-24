/* Floating tooltip for [data-tip] diagram cells. A single element appended to
   <body>; positions itself above the cell (or below when clamped).

   A cell may name the card's colour with data-tip-color, from the same list
   the term shortcode takes; it rides the same --cl channel, so the kicker and
   its halo dot follow whatever the current palette gives that name. Cells
   without the attribute keep the site accent. */
const TIP_COLORS = ['green', 'copper', 'blue', 'gold', 'red', 'violet'];

export function bindTips() {
  const tip = document.createElement('div'); tip.className = 'l1-tip'; tip.setAttribute('role', 'tooltip');
  tip.innerHTML = '<div class="l1-tip-title"><span class="l1-tip-dot"></span><span class="l1-tip-t"></span></div><div class="l1-tip-sub"></div><div class="l1-tip-arrow"></div>';
  document.body.appendChild(tip);
  const tEl = tip.querySelector('.l1-tip-t'), sEl = tip.querySelector('.l1-tip-sub');
  let curCell = null, curColor = '';

  function show(cell) {
    clearTimeout(showTimer); pendCell = null;
    curCell = cell;
    const raw = cell.getAttribute('data-tip') || '';
    const cut = raw.indexOf('·');
    if (cut > 0) { tEl.textContent = raw.slice(0, cut).trim(); sEl.textContent = raw.slice(cut + 1).trim(); }
    else { tEl.textContent = raw; sEl.textContent = ''; }
    /* one card serves every cell, so the previous colour comes off first;
       an unknown name is ignored and the card falls back to the accent */
    const named = cell.getAttribute('data-tip-color') || '';
    const color = TIP_COLORS.indexOf(named) < 0 ? '' : named;
    if (curColor !== color) {
      if (curColor) tip.classList.remove('c-' + curColor);
      if (color) tip.classList.add('c-' + color);
      curColor = color;
    }
    tip.classList.add('show');
    const r = cell.getBoundingClientRect();
    tip.classList.remove('below');
    tip.style.left = '0px'; tip.style.top = '0px';
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
    let y = r.top - th - 10;
    if (y < 8) { y = r.bottom + 10; tip.classList.add('below'); }
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    const arrow = tip.querySelector('.l1-tip-arrow');
    let ax = r.left + r.width / 2 - x;
    ax = Math.max(10, Math.min(ax, tw - 10));
    arrow.style.left = ax + 'px';
  }
  function hide() {
    clearTimeout(showTimer); pendCell = null;
    curCell = null; tip.classList.remove('show');
  }
  /* short open delay so sweeping the cursor across cells does not
     flicker the card; once a tip is up, moving between cells retargets
     it instantly (warm-tooltip pattern) */
  let showTimer = 0, pendCell = null;
  function scheduleShow(cell) {
    if (cell === curCell || cell === pendCell) return;
    clearTimeout(showTimer); pendCell = null;
    if (curCell) { show(cell); return; }
    pendCell = cell;
    showTimer = setTimeout(function () { pendCell = null; show(cell); }, 180);
  }
  /* widgets re-render cells; if the hovered one was replaced no mouseout
     fires — poll connectivity while the tip is up */
  setInterval(function () { if (curCell && !curCell.isConnected) hide(); }, 300);
  document.addEventListener('mousedown', function (e) {
    if (curCell && !(e.target.closest && e.target.closest('[data-tip]'))) hide();
  });
  document.addEventListener('mouseover', function (e) {
    const cell = e.target.closest && e.target.closest('[data-tip]');
    if (cell) { if (cell.tabIndex < 0) cell.tabIndex = 0; scheduleShow(cell); }
    else if (curCell || pendCell) hide();
  });
  document.addEventListener('focusin', function (e) {
    const cell = e.target.closest && e.target.closest('[data-tip]');
    if (cell) show(cell);
  });
  document.addEventListener('focusout', function () { if (curCell) hide(); });
  window.addEventListener('scroll', function () { if (curCell) hide(); }, { passive: true });
  Array.prototype.forEach.call(document.querySelectorAll('[data-tip]'), function (c) {
    if (c.tabIndex < 0) c.tabIndex = 0;
  });
}
