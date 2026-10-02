/* Edit history behind the "updated" date. The markup ships in the page (see
   _partials/article/updates-card.html): this moves the block to <body>, hangs
   the card from the date in the meta line and runs the interaction.

   The date wears a term's dots, and on this site dots mean "a card opens
   here" — so the card behaves like a term card (modules/term.js): a 250ms
   hover intent, a short grace on the way out, click to pin, Escape and a
   click outside to dismiss, a bottom sheet on narrow screens. One trigger,
   one card, so none of the term engine's per-word bookkeeping. */

const CLOSE_DELAY = 120;  /* modules/term.js — the same rhythm */
const OPEN_DELAY = 250;
const GAP = 10;           /* card offset from the date */
const EDGE = 12;          /* viewport gutter */
const MIN_BODY = 120;     /* below this a squeezed body stops being readable */

export function bindUpdates() {
  const block = document.querySelector('.updates');
  const trigger = document.querySelector('a.upd-trigger');
  if (!block || !trigger) return;
  const card = block.querySelector('.upd-card');
  const body = card && card.querySelector('.upd-b');
  if (!card || !body) return;

  /* out of the article flow, as the term cards: no rail overflow or
     transformed ancestor may clip or trap it */
  document.body.appendChild(block);
  block.classList.add('is-live');
  trigger.setAttribute('aria-expanded', 'false');

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const sheet = window.matchMedia('(max-width: 640px)');

  const scrim = document.createElement('div');
  scrim.className = 'upd-scrim';
  document.body.appendChild(scrim);

  let open = false;
  let pinned = false;
  let openT = 0;
  let closeT = 0;
  /* set while focus is handed back to the date after a close: the focus
     listener below would otherwise read it as a keyboard user arriving and
     open the card again, and the next Escape would close that instead of
     leaving focus mode */
  let returning = false;

  /* Below the date by default; above when below has no room for it; with
     neither, the side with more room. The card's left edge sits so its text
     lines up with the date's text — unless that runs the card past the
     article column, then it hangs from the date's right end instead, over
     the article rather than the rail.

     The body is then held to the room on the chosen side (--upd-room): a long
     history in a short window, or at a large zoom, must scroll inside the
     card, not run off the screen. */
  function place() {
    if (sheet.matches) {
      card.removeAttribute('data-side');
      card.style.left = card.style.top = '';
      card.style.removeProperty('--upd-room');
      return;
    }
    card.style.removeProperty('--upd-room');
    card.style.left = '0px'; card.style.top = '0px';
    const r = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const cw = card.offsetWidth;
    let ch = card.offsetHeight;
    const room = { below: vh - EDGE - (r.bottom + GAP), above: (r.top - GAP) - EDGE };
    const side = ch <= room.below ? 'below'
      : ch <= room.above ? 'above'
      : (room.below >= room.above ? 'below' : 'above');
    if (ch > room[side]) {
      const chrome = ch - body.offsetHeight;
      card.style.setProperty('--upd-room', Math.max(MIN_BODY, Math.floor(room[side] - chrome)) + 'px');
      ch = card.offsetHeight;
    }
    const col = trigger.closest('main') || document.documentElement;
    const colR = col.getBoundingClientRect().right;
    let x = Math.round(r.left - 15);   /* 18px card padding vs 3px of the dots' bleed */
    if (x + cw > colR && r.right + 15 - cw >= EDGE) x = Math.round(r.right + 15 - cw);
    x = Math.max(EDGE, Math.min(x, vw - cw - EDGE));
    /* the entry transform is per side (32-updates.css) — set before the card
       opens, or it slides in from the previous side's offset */
    card.dataset.side = side;
    card.style.left = x + 'px';
    card.style.top = (side === 'below' ? Math.ceil(r.bottom + GAP) : Math.floor(r.top - GAP - ch) - 1) + 'px';
  }

  /* the fade belongs on a body that actually overflows (term.js does the
     same); recomputed on every layout, since --upd-room changes the height */
  function markScroll() {
    const over = body.scrollHeight - body.clientHeight > 2;
    body.classList.toggle('is-scrollable', over);
    body.classList.toggle('at-end', over && body.scrollTop + body.clientHeight >= body.scrollHeight - 2);
  }
  body.addEventListener('scroll', markScroll, { passive: true });

  function show(pin) {
    clearTimeout(openT);
    clearTimeout(closeT);
    pinned = !!pin;
    place();
    open = true;
    card.classList.add('is-open');
    markScroll();
    card.classList.toggle('is-pinned', pinned);
    trigger.setAttribute('aria-expanded', 'true');
    if (sheet.matches) scrim.classList.add('is-open');
    /* focus moves in only on a deliberate pin, as a term card's */
    if (pinned) card.focus({ preventScroll: true });
  }

  function hide(giveBack) {
    clearTimeout(openT);
    clearTimeout(closeT);
    if (!open) return;
    const wasPinned = pinned;
    open = false; pinned = false;
    card.classList.remove('is-open', 'is-pinned');
    scrim.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    if (giveBack && wasPinned && card.contains(document.activeElement)) {
      returning = true;
      trigger.focus({ preventScroll: true });
      returning = false;
    }
  }

  /* closing is decided when the timer fires, by :hover (see term.js) */
  function scheduleClose() {
    clearTimeout(closeT);
    closeT = setTimeout(function () {
      if (!open || pinned) return;
      if (card.matches(':hover') || trigger.matches(':hover')) return;
      hide(false);
    }, CLOSE_DELAY);
  }

  const hoverable = function () { return fine.matches && !sheet.matches; };

  trigger.addEventListener('mouseenter', function () {
    if (!hoverable()) return;
    clearTimeout(closeT);
    if (open) return;
    clearTimeout(openT);
    openT = setTimeout(function () {
      if (trigger.matches(':hover')) show(false);
    }, OPEN_DELAY);
  });
  trigger.addEventListener('mouseleave', function () {
    clearTimeout(openT);
    if (open && !pinned) scheduleClose();
  });
  card.addEventListener('mouseenter', function () { clearTimeout(closeT); });
  card.addEventListener('mouseleave', function () {
    if (hoverable() && !pinned) scheduleClose();
  });

  /* keyboard: focus previews the card, Enter pins it */
  trigger.addEventListener('focus', function () {
    if (returning || open || sheet.matches) return;
    if (trigger.matches(':focus-visible')) show(false);
  });
  trigger.addEventListener('blur', function (e) {
    if (!open || pinned) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    hide(false);
  });
  card.addEventListener('focusout', function (e) {
    if (!open || pinned) return;
    if (e.relatedTarget && (card.contains(e.relatedTarget) || e.relatedTarget === trigger)) return;
    hide(false);
  });

  /* with the script on, the date opens the card instead of jumping down to
     the appendix */
  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    clearTimeout(openT);
    if (open && pinned) { hide(true); return; }
    show(true);
  });

  /* a section link in the card: close, then let the anchor jump happen */
  card.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) hide(false);
  });

  scrim.addEventListener('click', function () { hide(true); });

  /* Registered here, synchronously, before main.js binds keys.js — and
     stopImmediatePropagation, not stopPropagation: both listen on document,
     and only the former keeps Escape from also closing the search and leaving
     focus mode. With the card closed, Escape is left alone. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !open) return;
    e.stopImmediatePropagation();
    hide(true);
  });

  document.addEventListener('mousedown', function (e) {
    if (!open) return;
    if (card.contains(e.target) || trigger.contains(e.target)) return;
    hide(false);
  });

  /* follow the date; once it has left the viewport there is nothing to hang
     from */
  let raf = 0;
  function track() {
    if (!open || sheet.matches || raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      if (!open) return;
      const r = trigger.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { hide(false); return; }
      place();
      markScroll();
    });
  }
  window.addEventListener('scroll', track, { passive: true });
  /* a card opened wide and then narrowed past 640px becomes the sheet, and
     the sheet comes with its scrim — show() is not the only way into it */
  function relayout() {
    if (!open) return;
    place();
    markScroll();
    scrim.classList.toggle('is-open', sheet.matches);
  }
  window.addEventListener('resize', relayout, { passive: true });
  sheet.addEventListener('change', relayout);
}
