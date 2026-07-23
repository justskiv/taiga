/* Link previews — the hover cards behind prose links. The heavy sibling of the
   term card (modules/term.js): same physics — a 120ms close delay with :hover
   re-checks, GAP 10 / EDGE 12, flip below→above, reposition on scroll, die when
   the owner leaves the viewport — plus two things a term never needs:

   • a DWELL before opening (a page window is heavier than a word hint, so it must
     not fire on a passing cursor), softened by a WARM window (once the reader is
     "browsing links", the next preview opens almost at once);
   • provider-supplied cards. An INTERNAL link fetches a build-time fragment
     (/<slug>/index.preview.html) and the card is assembled from it — trimmed to a
     word budget by whole H2 sections, reshaped for a #anchor. A t.me or youtube
     link reads a card the build already rendered into a hidden store in the page
     (article/link-cards.html) — no runtime fetch to t.me/YouTube at all.

   One .lp-pop per page. Off on coarse pointers (a tap must follow the link).
   Self-guards: does nothing on a page with no markable links. */

const GAP = 10, EDGE = 12, CLOSE_DELAY = 120, WARM_MS = 450, WARM_DWELL = 90, DWELL = 250;

export function bindLinkPreviews() {
  const marked = document.querySelector('a[data-preview], a[data-tg], a[data-yt], a[data-wiki], a[data-gob]');
  if (!marked) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;   /* touch: the link is the whole interaction */

  const budget = parseInt(document.documentElement.dataset.lpBudget, 10) || 1400;

  /* ── providers ─────────────────────────────────────────────────────────── */
  function baseHref(a) { return (a.getAttribute('data-preview') || '').split('#')[0]; }
  function hashOf(a) {
    const h = a.getAttribute('href') || '';
    const i = h.indexOf('#');
    return i < 0 ? '' : h.slice(i + 1);
  }
  function storeCard(kind, href) {
    const store = document.querySelector('.lp-store');
    if (!store) return null;
    const cards = store.querySelectorAll('[data-lp-' + kind + ']');
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute('data-lp-' + kind) === href) return cards[i];
    }
    return null;
  }

  const internal = {
    id: 'preview',
    match: (a) => a.hasAttribute('data-preview') && baseHref(a) !== location.pathname,
    key: (a) => 'p|' + baseHref(a),
    fetch: (a) => fetch(baseHref(a) + 'index.preview.html', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null),
    render: (a, html) => (html == null ? null : shapeInternal(html, hashOf(a))),
    skeleton: () => skeleton(['58%', '100%', '96%', '84%']),
  };
  const tg = {
    id: 'tg',
    match: (a) => a.hasAttribute('data-tg'),
    key: (a) => 't|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('tg', a.getAttribute('href'))),
    render: (_a, node) => (node ? node.firstElementChild.cloneNode(true) : null),
    skeleton: () => skeleton(['50%', '92%', '99%', '68%']),
  };
  const yt = {
    id: 'yt',
    match: (a) => a.hasAttribute('data-yt'),
    key: (a) => 'y|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('yt', a.getAttribute('href'))),
    render: (_a, node) => (node ? node.firstElementChild.cloneNode(true) : null),
    skeleton: () => skeleton(['100%', '62%', '48%']),
  };
  const wiki = {
    id: 'wiki',
    match: (a) => a.hasAttribute('data-wiki'),
    key: (a) => 'w|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('wiki', a.getAttribute('href'))),
    render: (_a, node) => (node ? node.firstElementChild.cloneNode(true) : null),
    skeleton: () => skeleton(['34%', '70%', '46%', '100%', '96%', '84%']),
  };
  const gob = {
    id: 'gob',
    match: (a) => a.hasAttribute('data-gob'),
    key: (a) => 'g|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('gob', a.getAttribute('href'))),
    render: (_a, node) => (node ? node.firstElementChild.cloneNode(true) : null),
    skeleton: () => skeleton(['30%', '72%', '40%', '100%', '94%', '88%']),
  };
  const providers = [internal, tg, yt, wiki, gob];
  function providerFor(a) {
    for (let i = 0; i < providers.length; i++) if (providers[i].match(a)) return providers[i];
    return null;
  }

  /* ── internal fragment → card (budget trim / anchor reshape) ───────────── */
  function shapeInternal(html, hash) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    const card = tpl.content.querySelector('.ic');
    if (!card) return null;
    const b = parseInt(card.dataset.lpBudget, 10) || budget;
    const sections = Array.prototype.slice.call(card.querySelectorAll('.ic-sec'));
    let anchorSec = null;
    if (hash) sections.forEach((s) => { if (s.getAttribute('data-lp-h2') === hash) anchorSec = s; });

    if (anchorSec) {
      card.classList.add('is-anchor');
      show(card.querySelector('.ic-anchor-ctx'));
      hide(card.querySelector('.ic-meta'));
      hide(card.querySelector('.ic-series'));
      hide(card.querySelector('.ic-intro'));
      hide(card.querySelector('.ic-more'));
      sections.forEach((s) => { if (s !== anchorSec) hide(s); else show(s); });
      hide(card.querySelector('.ic-foot'));
      show(card.querySelector('.ic-foot-anchor'));
      return card;
    }

    /* article mode: whole sections until the word budget, then a muted list */
    hide(card.querySelector('.ic-anchor-ctx'));
    hide(card.querySelector('.ic-foot-anchor'));
    let acc = wordCount(card.querySelector('.ic-intro'));
    let shown = 0, hit = false;
    const dropped = [];
    sections.forEach((sec) => {
      const w = wordCount(sec);
      if (!hit && (shown === 0 || acc + w <= b)) { acc += w; shown++; }
      else { hit = true; hide(sec); dropped.push(sec); }
    });
    const more = card.querySelector('.ic-more');
    const list = card.querySelector('.ic-more-list');
    if (dropped.length && more && list) {
      dropped.forEach((sec) => {
        const h = sec.querySelector('h2');
        if (!h) return;
        const c = h.cloneNode(true);
        const hash2 = c.querySelector('.hash'); if (hash2) hash2.remove();
        const li = document.createElement('li');
        li.textContent = c.textContent.trim();
        list.appendChild(li);
      });
      show(more);
    } else if (more) { hide(more); }
    return card;
  }
  function wordCount(el) {
    if (!el) return 0;
    const t = (el.textContent || '').trim();
    return t ? t.split(/\s+/).length : 0;
  }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function skeleton(rows) {
    const card = document.createElement('div');
    card.className = 'lp-card';
    const pad = document.createElement('div');
    pad.style.cssText = 'padding:16px 18px;width:min(440px,calc(100vw - 32px))';
    rows.forEach((w, i) => {
      const l = document.createElement('div');
      l.className = 'lp-skl';
      l.style.width = w; l.style.height = (i ? 10 : 12) + 'px';
      if (i) l.style.marginTop = (i === 1 ? 16 : 10) + 'px';
      pad.appendChild(l);
    });
    card.appendChild(pad);
    return card;
  }

  /* ── data cache (fragment HTML / store node), keyed per provider+href ───── */
  const cache = new Map();
  function fetchFor(p, a) {
    const key = p.key(a);
    let c = cache.get(key);
    if (c) return c;
    c = { status: 'pending', data: null };
    c.promise = Promise.resolve(p.fetch(a)).then((data) => { c.status = 'ready'; c.data = data; return data; });
    cache.set(key, c);
    return c;
  }

  /* ── popover shell ─────────────────────────────────────────────────────── */
  let pop = null;
  const cur = { a: null, p: null };
  let openT = 0, closeT = 0, seq = 0, lastHideAt = -1e9;

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'lp-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-hidden', 'true');
    pop.addEventListener('mouseenter', () => clearTimeout(closeT));
    pop.addEventListener('mouseleave', () => { if (cur.a) scheduleClose(); });
    if (window.ResizeObserver) {
      new ResizeObserver(() => { if (cur.a) place(pop, cur.a); }).observe(pop);
    }
    document.body.appendChild(pop);
    return pop;
  }

  function place(node, word) {
    const r = word.getBoundingClientRect();
    node.style.left = '0px'; node.style.top = '0px';
    const cw = node.offsetWidth, ch = node.offsetHeight;
    let x = r.left + r.width / 2 - cw / 2;
    x = Math.max(EDGE, Math.min(x, window.innerWidth - cw - EDGE));
    let y = r.bottom + GAP;
    if (y + ch > window.innerHeight - EDGE && r.top - ch - GAP > EDGE) y = r.top - ch - GAP;
    y = Math.max(EDGE, Math.min(y, window.innerHeight - ch - EDGE));
    node.style.left = Math.round(x) + 'px';
    node.style.top = Math.round(y) + 'px';
  }

  function markOverflow(root) {
    root.querySelectorAll('.lp-scroll, .lp-clip').forEach((b) => {
      const over = b.scrollHeight - b.clientHeight > 2;
      b.classList.toggle('is-ovf', over);
      if (over && b.classList.contains('lp-scroll') && !b.dataset.bound) {
        b.dataset.bound = '1';
        b.addEventListener('scroll', () => {
          b.classList.toggle('at-end', b.scrollTop + b.clientHeight >= b.scrollHeight - 2);
        }, { passive: true });
      }
    });
  }

  function paint(p, a, data) {
    const node = p.render(a, data);
    if (!node) return false;
    pop.replaceChildren(node);
    markOverflow(pop);
    return true;
  }

  function open(a, p) {
    const my = ++seq;
    const c = fetchFor(p, a);
    const doOpen = (data, skeletonMode) => {
      if (my !== seq) return;
      ensurePop();
      clearTimeout(closeT);
      cur.a = a; cur.p = p;
      if (skeletonMode) {
        pop.replaceChildren(p.skeleton(a));
        c.promise.then((d) => {
          if (my !== seq || cur.a !== a) return;
          if (!paint(p, a, d)) { hide(); return; }
          place(pop, a);
        });
      } else if (!paint(p, a, data)) {   /* nothing to show (e.g. self-link) */
        cur.a = null; cur.p = null; return;
      }
      place(pop, a);
      pop.classList.add('is-open');
      pop.setAttribute('aria-hidden', 'false');
    };
    if (c.status === 'ready') doOpen(c.data, false);
    else doOpen(null, true);
  }

  function hidePop() {
    clearTimeout(openT); clearTimeout(closeT);
    if (!cur.a) return;
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden', 'true');
    cur.a = null; cur.p = null;
    lastHideAt = performance.now();
    seq++;
  }

  function scheduleClose() {
    clearTimeout(closeT);
    closeT = setTimeout(() => {
      if (!cur.a) return;
      if (pop && pop.matches(':hover')) return;
      if (cur.a.matches(':hover')) return;
      hidePop();
    }, CLOSE_DELAY);
  }

  /* ── hover machinery (delegated) ───────────────────────────────────────── */
  let hoverA = null;
  function enterLink(a) {
    const p = providerFor(a);
    if (!p) return;
    fetchFor(p, a);                                /* prefetch at once */
    clearTimeout(openT);
    const warm = (performance.now() - lastHideAt < WARM_MS) || !!cur.a;
    const dwell = warm ? WARM_DWELL : DWELL;
    openT = setTimeout(() => open(a, p), dwell);
  }
  function leaveLink() { clearTimeout(openT); if (cur.a) scheduleClose(); }

  function inScope(a) {
    /* prose only: skip the TOC, footnotes, the series bridge and the rails */
    return a && !a.closest('.lp-pop') && !a.closest('.footnotes') &&
      !a.closest('.toc') && !a.closest('.sbr') && !a.closest('.rail') && providerFor(a);
  }

  document.addEventListener('mouseover', (e) => {
    let a = e.target.closest && e.target.closest('a');
    if (a && !inScope(a)) a = null;
    if (a === hoverA) return;
    if (hoverA) leaveLink();
    hoverA = a;
    if (a) enterLink(a);
  });
  document.addEventListener('mouseout', (e) => {
    if (!hoverA) return;
    const to = e.relatedTarget;
    if (to && hoverA.contains(to)) return;
    if (e.target.closest && e.target.closest('a') === hoverA) { leaveLink(); hoverA = null; }
  });

  /* keyboard parity: focus opens without dwell, blur schedules close */
  document.addEventListener('focusin', (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a || !inScope(a) || !a.matches(':focus-visible')) return;
    const p = providerFor(a);
    if (p) { fetchFor(p, a); open(a, p); }
  });
  document.addEventListener('focusout', () => { if (cur.a) scheduleClose(); });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePop(); });

  /* follow the owner on scroll; a scroll can carry the pointer off the link
     without a mouse event, so re-check :hover and let the timer decide */
  let raf = 0;
  function track() {
    if (raf || !cur.a) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!cur.a) return;
      const r = cur.a.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) hidePop();
      else { place(pop, cur.a); scheduleClose(); }
    });
  }
  window.addEventListener('scroll', track, { passive: true });
  window.addEventListener('resize', track, { passive: true });
}
