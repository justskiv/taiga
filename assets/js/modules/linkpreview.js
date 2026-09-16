/* Link previews — the hover cards behind prose links. The heavy sibling of the
   term card (modules/term.js): same physics — a 120ms close delay with :hover
   re-checks, GAP 10 / EDGE 12, a placement ladder that never covers the link,
   reposition on scroll, die when the owner leaves the viewport — plus two things
   a term never needs:

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
/* A trim the reader cannot tell from a short card: ~3.5 lines of the card's own
   prose (14px × 1.62), and the bottom 30px of it are under the fade mask anyway.
   It buys the axis one more rung before the card moves beside the link. */
const SOFT = 80;
/* The floor a card shrinks to: title + meta + four lines of body + the pinned
   action row. Not invented — it is the floor tg already carries in CSS
   (.tg-text min-height:110 + head + meta + row ≈ 250). */
const MIN_CARD = 240;
/* ...and the flexible region inside it never collapses to nothing. A card whose
   chrome alone eats the whole budget — a tg post with a photo, a wiki card with
   a thumbnail — would otherwise open as a head, a footer and a hole where the
   text was. ~4 lines of body; past that the card simply hangs off the edge. */
const MIN_FLEX = 96;

export function bindLinkPreviews() {
  const marked = document.querySelector('a[data-preview], a[data-tg], a[data-yt], a[data-wiki], a[data-gob], a[data-gdoc]');
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
  /* A card is cloned OUT of the hidden store, and the clone brings the store
     copy's ids with it: two elements share an id, and every reference inside the
     clone (a Wikipedia formula is <defs> plus <use>) resolves to whichever comes
     first in the document — the copy that stays hidden. Rename the ids in the
     clone so it draws from itself and nothing depends on resolving into a
     display:none subtree. */
  let cloneN = 0;
  function cloneCard(node) {
    const card = node.firstElementChild.cloneNode(true);
    const ids = card.querySelectorAll('[id]');
    if (!ids.length) return card;
    const suffix = '-c' + ++cloneN;
    const renamed = {};
    for (let i = 0; i < ids.length; i++) {
      renamed[ids[i].id] = ids[i].id + suffix;
      ids[i].id += suffix;
    }
    const all = card.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      ['href', 'xlink:href'].forEach((attr) => {
        const v = all[i].getAttribute(attr);
        if (v && v.charAt(0) === '#' && renamed[v.slice(1)]) {
          all[i].setAttribute(attr, '#' + renamed[v.slice(1)]);
        }
      });
    }
    return card;
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
    render: (_a, node) => (node ? cloneCard(node) : null),
    skeleton: () => skeleton(['50%', '92%', '99%', '68%']),
  };
  const yt = {
    id: 'yt',
    match: (a) => a.hasAttribute('data-yt'),
    key: (a) => 'y|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('yt', a.getAttribute('href'))),
    render: (_a, node) => (node ? cloneCard(node) : null),
    skeleton: () => skeleton(['100%', '62%', '48%']),
  };
  const wiki = {
    id: 'wiki',
    match: (a) => a.hasAttribute('data-wiki'),
    key: (a) => 'w|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('wiki', a.getAttribute('href'))),
    render: (_a, node) => (node ? cloneCard(node) : null),
    skeleton: () => skeleton(['34%', '70%', '46%', '100%', '96%', '84%']),
  };
  const gob = {
    id: 'gob',
    match: (a) => a.hasAttribute('data-gob'),
    key: (a) => 'g|' + a.getAttribute('href'),
    fetch: (a) => Promise.resolve(storeCard('gob', a.getAttribute('href'))),
    render: (_a, node) => (node ? cloneCard(node) : null),
    skeleton: () => skeleton(['30%', '72%', '40%', '100%', '94%', '88%']),
  };
  /* go.dev documentation. Keyed off data-gdoc rather than the href: a link into a
     section (/ref/spec#Method_declarations) shares the whole page's card, and the
     attribute is the fragment-less URL the build filed it under. */
  const gdoc = {
    id: 'gdoc',
    match: (a) => a.hasAttribute('data-gdoc'),
    key: (a) => 'd|' + a.getAttribute('data-gdoc'),
    fetch: (a) => Promise.resolve(storeCard('gdoc', a.getAttribute('data-gdoc'))),
    render: (_a, node) => (node ? cloneCard(node) : null),
    skeleton: () => skeleton(['36%', '84%', '100%', '92%', '64%']),
  };
  const providers = [internal, tg, yt, wiki, gob, gdoc];
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
      /* A size change here is either our own cap echoing back, or real growth (a
         photo decoded, the emoji font swapped) which invalidates the frozen plan.
         A flag cannot tell them apart — the callback lands at the end of the
         frame either way — but the height we last produced can. */
      new ResizeObserver((es) => {
        if (!cur.a || !plan) return;
        if (Math.abs(es[0].target.offsetHeight - plan.h) < 1) return;
        replan(pop, cur.a);
      }).observe(pop);
    }
    document.body.appendChild(pop);
    return pop;
  }

  /* The rect the card points at. A link that WRAPPED across lines has a bounding
     box spanning both lines AND the whole column between them, so a card centred
     on it floats off into the middle of the paragraph, covering the prose instead
     of pointing at the link. getClientRects gives one rect per line box: use the
     one the pointer came in on, and the first line when there is no pointer to
     ask (keyboard focus, a scroll that moved the link under a still cursor).
     term.js carries the same helper for the same reason.

     The line is chosen ONCE, at open, and frozen as an index in plan.line: pt
     holds the last pointer position and a scroll does not update it, so a wrapped
     link under a still cursor could swap lines mid-scroll and jump the card. */
  let pt = null;
  function lineIndex(el) {
    const rs = el.getClientRects();
    if (rs.length < 2 || !pt) return 0;
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      if (pt.y >= r.top - 2 && pt.y <= r.bottom + 2 &&
          pt.x >= r.left - 2 && pt.x <= r.right + 2) return i;
    }
    return 0;
  }
  function anchorRect(el, i) {
    const rs = el.getClientRects();
    if (!rs.length) return el.getBoundingClientRect();
    return rs[i] || rs[0];
  }

  /* An internal card is up to ~645px tall and the window is often shorter than
     that with the link in the middle of it. This used to place the card below,
     flip it above when below did not fit, and then CLAMP it into the viewport —
     and the clamp knows nothing about the anchor, so a card that fit NEITHER side
     slid up over its own link: the reader hovered a link and lost the ability to
     click it. It was not bad luck but arithmetic — "does not fit below" is
     exactly `innerHeight - ch - EDGE < r.bottom + GAP`, so the clamped top always
     landed above the link's bottom.

     There is no final clamp any more. Every rung derives its coordinate from an
     edge of the link, so crossing the link is not something the card can do;
     running off the edge of the window is, and that is the better failure.

     The rungs, and the passes are deliberately separate: the whole card below or
     above → a trim of at most SOFT there → the whole card beside the link →
     whatever side has the most room. Folding the sides into the first pass would
     send the card sideways when the axis was short by five pixels, which is the
     very jump SOFT exists to absorb.

     The rung and the cap are decided ONCE per painted card (replan) and frozen; a
     scroll only re-applies them (apply). Recomputing per frame would reflow the
     card's text under a reader mid-sentence, which is worse than any jump. A
     window resize does replan: it invalidates a side that no longer fits and the
     vh-based max-heights inside the cards. */
  let plan = null;                      /* {mode, flex, cap, line, h} */
  const AXIS = ['below', 'above'], SIDE = ['right', 'left'];

  /* The card's natural size, and the one region that may give height back: the
     .lp-scroll / .lp-clip markOverflow already knows. Head and action row keep
     their height — a shrunk card still says what it is and still offers the way
     in. (.lp-scroll then scrolls; .lp-clip is overflow:hidden, so there the trim
     deepens the fade instead, and the footer link remains the way to the rest.) */
  function measure(node) {
    const flex = node.querySelector('.lp-scroll, .lp-clip');
    if (flex) flex.style.maxHeight = '';       /* or the last link's cap sticks */
    node.style.left = '0px'; node.style.top = '0px';
    const ch = node.offsetHeight;
    /* minH: the shortest this card can HONESTLY get. A yt card has no flexible
       region and cannot shrink at all; a tg post's text stops at its own
       min-height. Without it the trim rung below is a promise the card cannot
       keep, and "trimmed by 40px" silently becomes "hanging 40px off the
       window" — while a side that fits the whole card goes untried. */
    const shrink = flex ? Math.max(0, flex.offsetHeight - MIN_FLEX) : 0;
    return { flex, cw: node.offsetWidth, ch, minH: ch - shrink,
             chrome: flex ? ch - flex.offsetHeight : 0 };
  }

  function replan(node, word) {
    const box = word.getBoundingClientRect();  /* every line box: what must stay clickable */
    const m = measure(node);
    const vw = window.innerWidth, vh = window.innerHeight;
    const room = {
      below: vh - EDGE - (box.bottom + GAP),
      above: (box.top - GAP) - EDGE,
      right: (box.right + GAP + m.cw <= vw - EDGE) ? vh - 2 * EDGE : 0,
      left: (box.left - GAP - m.cw >= EDGE) ? vh - 2 * EDGE : 0,
    };
    const mode =
      AXIS.find((k) => room[k] >= m.ch) ||             /* whole card, on the axis */
      AXIS.find((k) => room[k] >= Math.max(m.ch - SOFT, m.minH)) ||  /* a trim nobody reads
                                                         as one — and one the card can do */
      SIDE.find((k) => room[k] >= m.ch) ||             /* whole card, beside the link */
      AXIS.concat(SIDE).reduce((a, b) => (room[b] > room[a] ? b : a));
    const target = Math.max(MIN_CARD, Math.min(m.ch, room[mode]));
    plan = { mode, flex: m.flex, line: lineIndex(word), h: 0,
             /* a pixel under target: chrome is measured in whole offsetHeights
                while the card lays out in fractions, and overshooting the room
                is what trips the correction below */
             cap: target < m.ch ? Math.max(MIN_FLEX, target - m.chrome - 1) : null };
    apply(node, word);
    /* The cap is a request, not a promise — .tg-text keeps a min-height, a yt card
       has no flexible region at all — so check what actually happened, after the
       re-measure. Only `above` cuts the HEAD off when a card refuses to shrink;
       hanging off the bottom costs the action row, which the link itself repeats. */
    if (plan.mode === 'above' && box.top - GAP - plan.h < EDGE - 2) {   /* 2px: rounding, not a miss */
      plan.mode = 'below';
      apply(node, word);
    }
    if (plan.cap != null) markOverflow(node);  /* .is-ovf was measured uncapped */
  }

  function apply(node, word) {
    /* BEFORE the measurements below, and they are what forces the style recalc:
       the entry transform is per side (24-linkpreview.css), and the transition
       starts from whatever the computed value was at the last recalc. Set after,
       the card would open with the PREVIOUS side's offset — towards the link. */
    node.dataset.side = plan.mode;
    const r = anchorRect(word, plan.line);     /* the line the card points at */
    const box = word.getBoundingClientRect();
    if (plan.flex) plan.flex.style.maxHeight = plan.cap == null ? '' : plan.cap + 'px';
    const cw = node.offsetWidth, ch = node.offsetHeight;   /* a floor may have refused the cap */
    let x, y;
    if (plan.mode === 'below' || plan.mode === 'above') {
      x = Math.round(Math.max(EDGE, Math.min(r.left + r.width / 2 - cw / 2,
                                             window.innerWidth - cw - EDGE)));
      /* round AWAY from the link, and on the far side spend one more pixel:
         at box.bottom = 475.25 a plain round gives 485 and the 10px halo starts
         at 475, a quarter pixel on top of the link — and above/left measure the
         card with offsetWidth/Height, whole numbers for a box that lays out in
         fractions, so the gap could come out a fraction short of the halo */
      y = plan.mode === 'below' ? Math.ceil(box.bottom + GAP)
                                : Math.floor(box.top - GAP - ch) - 1;
    } else {
      x = plan.mode === 'right' ? Math.ceil(box.right + GAP)
                                : Math.floor(box.left - GAP - cw) - 1;
      /* clamping y is safe beside the link: the two are already apart on x */
      y = Math.round(Math.max(EDGE, Math.min(r.top, window.innerHeight - ch - EDGE)));
    }
    if (node.style.left !== x + 'px') node.style.left = x + 'px';
    if (node.style.top !== y + 'px') node.style.top = y + 'px';
    plan.h = ch;                               /* what the ResizeObserver may ignore */
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
          replan(pop, a);
        });
      } else if (!paint(p, a, data)) {   /* nothing to show (e.g. self-link) */
        cur.a = null; cur.p = null; return;
      }
      replan(pop, a);
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
    cur.a = null; cur.p = null; plan = null;
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
    pt = { x: e.clientX, y: e.clientY };   /* which line box the card belongs to */
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
    pt = null;                             /* no pointer: anchor on the first line */
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
      /* the card dies when the LINK leaves the viewport, so this test takes the
         whole element: on a wrapped link one line box can scroll out while the
         other is still being read, and anchorRect answers about a line. */
      const box = cur.a.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) hidePop();
      else { plan ? apply(pop, cur.a) : replan(pop, cur.a); scheduleClose(); }
    });
  }
  window.addEventListener('scroll', track, { passive: true });
  /* not track(): a resize can invalidate the frozen rung itself — the side that
     fitted a moment ago may now hang off the window, and every vh-based
     max-height inside the cards has just changed */
  window.addEventListener('resize', () => { if (cur.a) replan(pop, cur.a); }, { passive: true });
}
