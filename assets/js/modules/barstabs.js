/* {{< bars tabs="true" >}}: the groups of a stack or of grouped bars — the
   heading rows of the table — become tabs (31-data.css, "bars in tabs").

   The shortcode prints every group one under another with its heading: what
   a reader without JavaScript, a feed reader and a printer get. It also marks
   the open group (is-on, data-open), and html.js — set by prefs.js before
   first paint — has already given the figure its tabbed shape, so this only
   adds what cannot be printed:

     tab     the chart's series glyph in the group's hue, the heading's bold
             as the name, its italic as a quiet summary
     switch  the bars grow or shrink from the old tab's lengths to the new
             ones, the numbers fade in; prefers-reduced-motion swaps at once
     keys    ←/→ (wrapping), Home/End; a tab is selected as it takes focus —
             the panel is drawn already, there is nothing to wait for

   No imports and no globals at import time — the Obsidian plugin carries a
   byte copy of this file for its own bars. */

/* the chart's series glyphs, in its order (charts/core.js), 10×10 */
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross'];
const GLYPH = {
  circle: '<circle cx="5" cy="5" r="4"/>',
  square: '<rect x="1.2" y="1.2" width="7.6" height="7.6" rx="1"/>',
  triangle: '<path d="M5 .8 9.4 8.9H.6Z"/>',
  diamond: '<path d="M5 .4 9.6 5 5 9.6.4 5Z"/>',
  star: '<path d="m5 .5 1.3 3 3.3.3-2.5 2.2.8 3.3L5 7.6 2.1 9.3l.8-3.3L.4 3.8l3.3-.3Z"/>',
  cross: '<path d="M3.7.6h2.6v3.1h3.1v2.6H6.3v3.1H3.7V6.3H.6V3.7h3.1Z"/>'
};
/* how long .is-anim stays on: past the width transition (31-data.css) */
const ANIM_MS = 700;
/* what grows on a switch: a stack's parts, a grouped row's bar */
const BAR = '.bars-part, .bars-bar';

let seq = 0;

function mountOne(root, win) {
  const doc = root.ownerDocument;
  const groups = Array.prototype.filter.call(root.children, function (c) { return c.classList.contains('bars-g'); });
  if (groups.length < 2) return null;
  const id = 'bars-t' + (++seq);
  const first = Math.min(Math.max(parseInt(root.getAttribute('data-open'), 10) || 1, 1), groups.length) - 1;
  const reduce = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  const list = doc.createElement('div');
  list.className = 'bars-tabs';
  list.setAttribute('role', 'tablist');
  const fig = root.closest('figure');
  const cap = fig && fig.querySelector('figcaption');
  const capId = cap && !cap.id ? id + '-cap' : '';
  if (cap) {
    if (capId) cap.id = capId;
    list.setAttribute('aria-labelledby', cap.id);
  }

  const tabs = groups.map(function (g, i) {
    const hd = g.querySelector('.bars-hd');
    const strong = hd && hd.querySelector('strong');
    const em = hd && hd.querySelector('em');
    let name = strong ? strong.textContent : '';
    if (!name && hd) {
      const bare = hd.cloneNode(true);
      const tail = bare.querySelector('em');
      if (tail) tail.remove();
      name = bare.textContent.trim();
    }
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'bars-tab';
    b.id = id + '-tab' + i;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', id + '-p' + i);
    b.style.setProperty('--c', g.style.getPropertyValue('--c'));
    b.innerHTML = '<span class="bars-tab-n"><span class="ch-mk"><svg class="ch-sh" viewBox="0 0 10 10" aria-hidden="true">' +
      GLYPH[SHAPES[i % SHAPES.length]] + '</svg></span><b></b></span>' + (em ? '<small></small>' : '');
    b.querySelector('b').textContent = name || String(i + 1);
    if (em) b.querySelector('small').textContent = em.textContent;
    list.appendChild(b);

    g.id = id + '-p' + i;
    g.setAttribute('role', 'tabpanel');
    g.setAttribute('aria-labelledby', b.id);
    return b;
  });
  root.insertBefore(list, root.firstChild);

  const st = { cur: -1, timer: 0 };

  /* each row's widths, row by row, keyed by the fill (p1, p2, p3): a
     stack's parts, or the one bar of a row of grouped bars */
  function lengths(g) {
    return Array.prototype.map.call(g.querySelectorAll('.bars-r'), function (r) {
      const w = {};
      r.querySelectorAll(BAR).forEach(function (p) { w[p.className] = p.getBoundingClientRect().width; });
      return w;
    });
  }

  /* start the new panel's bars at the old panel's lengths, then let go: the
     width transition (only while .is-anim) carries them to their own */
  function grow(g, from) {
    const parts = [];
    g.querySelectorAll('.bars-r').forEach(function (r, k) {
      r.querySelectorAll(BAR).forEach(function (p) {
        const w = from[k] && from[k][p.className];
        if (w != null) { p.style.width = w + 'px'; parts.push(p); }
      });
    });
    root.classList.remove('is-anim');
    void root.offsetWidth;
    root.classList.add('is-anim');
    parts.forEach(function (p) { p.style.width = ''; });
    win.clearTimeout(st.timer);
    st.timer = win.setTimeout(function () { root.classList.remove('is-anim'); }, ANIM_MS);
  }

  function select(i, how) {
    if (i < 0 || i >= tabs.length) return;
    if (i === st.cur) {
      if (how === 'key') tabs[i].focus();
      return;
    }
    const from = st.cur >= 0 && !reduce.matches ? lengths(groups[st.cur]) : null;
    st.cur = i;
    tabs.forEach(function (t, k) {
      t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      t.tabIndex = k === i ? 0 : -1;
    });
    groups.forEach(function (g, k) {
      g.classList.toggle('is-on', k === i);
      g.tabIndex = k === i ? 0 : -1;
    });
    if (how === 'key') tabs[i].focus();
    if (from) grow(groups[i], from);
  }

  function onClick(e) {
    const b = e.target.closest('.bars-tab');
    if (b) select(tabs.indexOf(b), 'click');
  }
  function onKey(e) {
    const k = tabs.indexOf(e.target);
    if (k < 0) return;
    const n = tabs.length;
    let to;
    switch (e.key) {
      case 'ArrowRight': to = (k + 1) % n; break;
      case 'ArrowLeft': to = (k - 1 + n) % n; break;
      case 'Home': to = 0; break;
      case 'End': to = n - 1; break;
      default: return;
    }
    e.preventDefault();
    select(to, 'key');
  }
  list.addEventListener('click', onClick);
  list.addEventListener('keydown', onKey);
  root.classList.add('is-live');
  select(first, 'init');

  return function () {
    win.clearTimeout(st.timer);
    list.remove();
    if (capId && cap.id === capId) cap.removeAttribute('id');
    groups.forEach(function (g, k) {
      ['id', 'role', 'aria-labelledby', 'tabindex'].forEach(function (a) { g.removeAttribute(a); });
      g.classList.toggle('is-on', k === first);
      g.querySelectorAll(BAR).forEach(function (p) { p.style.width = ''; });
    });
    root.classList.remove('is-live', 'is-anim');
  };
}

/* Mount every tabbed figure in scope (default: the document). Returns a
   function that takes them all back to the printed markup. */
export function mountBarsTabs(scope) {
  const doc = (scope && scope.ownerDocument) || document;
  const win = doc.defaultView || window;
  const stops = [];
  (scope || doc).querySelectorAll('.bars.has-tabs').forEach(function (root) {
    if (root.classList.contains('is-live')) return;
    const stop = mountOne(root, win);
    if (stop) stops.push(stop);
  });
  return function () { stops.forEach(function (s) { s(); }); };
}
