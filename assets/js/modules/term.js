/* Definition cards for {{< term >}}. The markup ships in the page (see
   _partials/article/term-cards.html): this moves the block to <body>, anchors
   each card to its word and runs the interaction.

   Deliberately NOT the .l1-tip engine: that one is pointer-events:none, plain
   text and dies on scroll. A definition card holds a heading and often a link,
   so it has to be enterable — which makes it a non-modal dialog, not a tooltip.

   Behaviour follows WCAG 2.1 SC 1.4.13 (content on hover or focus):
   • hoverable  — the pointer can travel into the card; a short close delay
                  covers the gap between the word and the card
   • dismissible— Escape, a click outside, or moving the pointer away
   • persistent — it stays until dismissed. Reposition on scroll, never
                  auto-hide on a timer. */

const CLOSE_DELAY = 120;  /* just enough to cross the 10px gap into the
                             card; longer and it reads as the card lingering */
const OPEN_DELAY = 250;   /* hover intent — the one shared rhythm with link
                             previews (modules/linkpreview.js); keep in sync */
const GAP = 10;           /* card offset from the word */
const EDGE = 12;          /* viewport gutter */

export function bindTerms() {
  const block = document.querySelector('.term-cards');
  if (!block) return;
  const words = document.querySelectorAll('a.term[data-term]');
  if (!words.length) return;

  /* out of the article flow: the card must not be clipped by a rail's overflow
     or trapped in a transformed ancestor's stacking context */
  document.body.appendChild(block);
  block.classList.add('is-live');

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const sheet = window.matchMedia('(max-width: 640px)');

  const scrim = document.createElement('div');
  scrim.className = 'term-scrim';
  document.body.appendChild(scrim);

  let open = null;      /* the open card */
  let owner = null;     /* the word that opened it */
  let pinned = false;
  let closeT = 0;
  let openT = 0;

  const clear = () => { clearTimeout(closeT); };

  /* Closing is decided when the timer FIRES, not when it is armed.

     Arming-time bookkeeping was not enough: closeT holds one id, so a second
     mouseleave arriving before the first timer resolved orphaned the earlier
     one — clearTimeout freed the newest id and the stale timers still fired,
     closing a card the pointer had already returned to. Chasing that with
     event bookkeeping only moves the bug; any mouseenter the browser skips
     brings it back.

     :hover is the browser's own answer to "is the pointer over this right
     now", so the card closes only when it genuinely is not. */
  function scheduleClose() {
    clearTimeout(closeT);
    closeT = setTimeout(function () {
      if (!open) return;
      if (open.matches(':hover')) return;
      if (owner && owner.matches(':hover')) return;
      hide();
    }, CLOSE_DELAY);
  }

  /* Which line box the card points at. A term that WRAPPED («хрупко и с
     оговорками» broken across two lines) has a bounding box spanning both lines
     and the column between them, and a card centred on that lands in the middle
     of the paragraph rather than under the word. One rect per line box, pick the
     one the pointer entered on — the first when there is no pointer (keyboard).
     Same helper as linkpreview.js, kept local like the physics constants.

     The line is picked ONCE, at open, and frozen as an index: pt holds the last
     pointer position and a scroll does not update it, so a wrapped term under a
     still cursor could swap lines mid-scroll and jump the card. */
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

  /* Below by default — the card is tall, and below keeps the word and the text
     above it readable. Above when below has no room. BESIDE when neither side of
     the word can hold the card, which used to end in a clamp into the viewport —
     and a clamp knows nothing about the word, so the card slid over the very term
     it annotates and swallowed its click. No final clamp on the axis any more:
     each rung derives y from an edge of the word, so the card cannot cross it.
     Off the edge of the window it may go; that is the better failure.

     Link previews (modules/linkpreview.js) carry the same ladder plus a size-to-
     fit rung. A term card does not need that one: .term-card-b already scrolls
     inside its own max-height, and these cards run 200-300px.

     The rung is chosen once per open and frozen — a scroll re-applies it, it does
     not re-decide it, or the card would hop between sides under a reading eye. */
  let plan = null;                    /* {mode, line} */
  const AXIS = ['below', 'above'], SIDE = ['right', 'left'];

  function replan(card, word) {
    if (sheet.matches) return;   /* bottom sheet — CSS owns the geometry */
    const box = word.getBoundingClientRect();   /* every line box: what stays clickable */
    card.style.left = '0px'; card.style.top = '0px';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const room = {
      below: vh - EDGE - (box.bottom + GAP),
      above: (box.top - GAP) - EDGE,
      right: (box.right + GAP + cw <= vw - EDGE) ? vh - 2 * EDGE : 0,
      left: (box.left - GAP - cw >= EDGE) ? vh - 2 * EDGE : 0,
    };
    const mode =
      AXIS.find(function (k) { return room[k] >= ch; }) ||
      SIDE.find(function (k) { return room[k] >= ch; }) ||
      AXIS.concat(SIDE).reduce(function (a, b) { return room[b] > room[a] ? b : a; });
    plan = { mode: mode, line: lineIndex(word) };
    apply(card, word);
    /* above is the one rung that cuts the HEAD off a card too tall for it —
       hanging off the bottom costs the footer link instead */
    if (plan.mode === 'above' && box.top - GAP - card.offsetHeight < EDGE - 2) {
      plan.mode = 'below';
      apply(card, word);
    }
  }

  function apply(card, word) {
    if (sheet.matches || !plan) return;
    /* before the measurements, which force the recalc: the entry transform is per
       side, and a transition starts from the value of the last recalc — set after,
       the card would open with the previous side's offset, towards the word */
    card.dataset.side = plan.mode;
    const r = anchorRect(word, plan.line);      /* the line the card points at */
    const box = word.getBoundingClientRect();
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let x, y;
    if (plan.mode === 'below' || plan.mode === 'above') {
      x = Math.round(Math.max(EDGE, Math.min(r.left + r.width / 2 - cw / 2,
                                             window.innerWidth - cw - EDGE)));
      /* round AWAY from the word: at a fractional box.bottom a plain round can
         land the card a fraction of a pixel on top of it */
      y = plan.mode === 'below' ? Math.ceil(box.bottom + GAP)
                                : Math.floor(box.top - GAP - ch) - 1;
    } else {
      x = plan.mode === 'right' ? Math.ceil(box.right + GAP)
                                : Math.floor(box.left - GAP - cw) - 1;
      /* clamping y is safe beside the word: the two are already apart on x */
      y = Math.round(Math.max(EDGE, Math.min(r.top, window.innerHeight - ch - EDGE)));
    }
    card.style.left = x + 'px';
    card.style.top = y + 'px';
  }

  /* the fade only belongs on a body that actually overflows */
  function markScroll(card) {
    const b = card.querySelector('.term-card-b');
    if (!b) return;
    const over = b.scrollHeight - b.clientHeight > 2;
    b.classList.toggle('is-scrollable', over);
    if (over && !b.dataset.bound) {
      b.dataset.bound = '1';
      b.addEventListener('scroll', function () {
        b.classList.toggle('at-end', b.scrollTop + b.clientHeight >= b.scrollHeight - 2);
      }, { passive: true });
    }
  }

  function show(word, pin) {
    const card = document.getElementById(word.dataset.term);
    if (!card) return;
    if (open && open !== card) hide(true);
    clear();
    open = card; owner = word; pinned = !!pin;
    /* Placed BEFORE is-open, and the order is load-bearing: the entry transform
       is per side (data-side, 23-term.css) and a transition takes its start
       value from the last style recalc. Flip is-open first and the card animates
       in from the PREVIOUS side's offset — towards the word it must not touch. */
    replan(card, word);
    card.classList.add('is-open');
    card.classList.toggle('is-pinned', pinned);
    word.setAttribute('aria-expanded', 'true');
    markScroll(card);
    if (sheet.matches) scrim.classList.add('is-open');
    /* focus moves in only on a deliberate pin — yanking it on a passive hover
       would throw the reader's place away. Safe to call synchronously: the
       is-open rule flips visibility with a 0s transition (see 23-term.css), so
       the card is already visible here — and a hidden element cannot be
       focused, which is exactly the trap that rule avoids. */
    if (pinned) card.focus({ preventScroll: true });
  }

  function hide(silent) {
    clear();
    if (!open) return;
    const card = open, word = owner, wasPinned = pinned;
    card.classList.remove('is-open', 'is-pinned');
    if (word) word.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('is-open');
    open = null; owner = null; pinned = false; plan = null;
    /* Escape/× must hand focus back, or the keyboard user is stranded in a
       detached subtree at the end of <body> */
    if (!silent && wasPinned && word && card.contains(document.activeElement)) {
      word.focus({ preventScroll: true });
    }
  }

  words.forEach(function (word) {
    const card = document.getElementById(word.dataset.term);
    if (!card) return;
    word.setAttribute('aria-controls', card.id);
    word.setAttribute('aria-expanded', 'false');
    word.setAttribute('aria-haspopup', 'dialog');

    if (fine.matches) {
      word.addEventListener('mouseenter', function (e) {
        pt = { x: e.clientX, y: e.clientY };
        clear();
        clearTimeout(openT);
        if (open === card) return;
        /* the same hover-intent dwell as link previews: a passing cursor
           opens nothing; the timer re-checks :hover when it fires */
        openT = setTimeout(function () {
          if (word.matches(':hover')) show(word, false);
        }, OPEN_DELAY);
      });
      word.addEventListener('mouseleave', function () {
        clearTimeout(openT);
        if (open === card && !pinned) scheduleClose();
      });
    }

    /* keyboard: focus opens, unpinned — Tab then walks into the card, which sits
       right after the word in the tab order because the browser follows the DOM
       and the block was appended at the end. Enter pins it. */
    word.addEventListener('focus', function () {
      pt = null;
      if (word.matches(':focus-visible') && open !== card) show(word, false);
    });

    word.addEventListener('click', function (e) {
      e.preventDefault();
      pt = { x: e.clientX, y: e.clientY };
      clearTimeout(openT);   /* a pin must not be undone by a pending hover */
      if (open === card && pinned) { hide(); return; }
      show(word, true);
    });
  });

  /* The card is hoverable: entering it cancels the pending close, and only
     LEAVING THE CARD ITSELF starts one.

     These listeners sit on each card, not on the block with capture:true.
     mouseenter/mouseleave do not bubble, so capture on an ancestor is the only
     way to observe them from there — but it observes them for every descendant
     too. Moving the pointer from a paragraph onto a code block inside the card
     then fires mouseleave (target: the paragraph), which armed the close timer;
     if the pointer then settled on bare card padding, no matching mouseenter
     ever came and the card vanished mid-read. Bound to the card, they fire only
     when the pointer truly crosses the card's own boundary. */
  block.querySelectorAll('.term-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () { clearTimeout(closeT); });
    card.addEventListener('mouseleave', function () {
      if (!fine.matches || pinned) return;
      scheduleClose();
    });
  });

  scrim.addEventListener('click', function () { hide(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { e.stopPropagation(); hide(); }
  });

  /* click outside dismisses a pinned card (a hovered one leaves on its own) */
  document.addEventListener('mousedown', function (e) {
    if (!open || !pinned) return;
    if (e.target.closest('.term-card') || e.target.closest('a.term')) return;
    hide();
  });

  /* persistent, not fragile: follow the word rather than vanish. If the word
     has scrolled out of the viewport there is nothing left to annotate. */
  let raf = 0;
  function track() {
    if (!open || !owner || sheet.matches) return;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      if (!open || !owner) return;
      /* the whole word decides whether there is still anything to annotate; a
         wrapped term keeps one line on screen while the other scrolls off, and
         anchorRect answers about a line, not about the word. */
      const box = owner.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) { hide(); return; }
      if (plan) apply(open, owner); else replan(open, owner);
    });
  }
  window.addEventListener('scroll', track, { passive: true });
  /* replan, not apply: a resize invalidates the rung itself — the side that
     fitted a moment ago may now hang off the window */
  window.addEventListener('resize', function () { if (open && owner) replan(open, owner); }, { passive: true });
  /* leaving the sheet hands the geometry back to JS, and the coordinates it last
     wrote were for a different layout */
  sheet.addEventListener('change', function () { if (open && owner) replan(open, owner); });
}
