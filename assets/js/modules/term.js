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

  function place(card, word) {
    if (sheet.matches) return;   /* bottom sheet — CSS owns the geometry */
    const r = word.getBoundingClientRect();
    card.style.left = '0px'; card.style.top = '0px';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let x = r.left + r.width / 2 - cw / 2;
    x = Math.max(EDGE, Math.min(x, window.innerWidth - cw - EDGE));
    /* below by default — the card is tall, and below keeps the word and the
       text above it readable; flip up only when there is no room down there */
    let y = r.bottom + GAP;
    if (y + ch > window.innerHeight - EDGE && r.top - ch - GAP > EDGE) y = r.top - ch - GAP;
    y = Math.max(EDGE, Math.min(y, window.innerHeight - ch - EDGE));
    card.style.left = Math.round(x) + 'px';
    card.style.top = Math.round(y) + 'px';
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
    card.classList.add('is-open');
    card.classList.toggle('is-pinned', pinned);
    word.setAttribute('aria-expanded', 'true');
    place(card, word);
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
    open = null; owner = null; pinned = false;
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
      word.addEventListener('mouseenter', function () {
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
      if (word.matches(':focus-visible') && open !== card) show(word, false);
    });

    word.addEventListener('click', function (e) {
      e.preventDefault();
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
      const r = owner.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { hide(); return; }
      place(open, owner);
    });
  }
  window.addEventListener('scroll', track, { passive: true });
  window.addEventListener('resize', function () { if (open && owner) place(open, owner); }, { passive: true });
}
