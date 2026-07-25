/* Rubric menu for narrow screens: the burger in the header opens the panel that
   holds the nav below the header breakpoint (10-header.css). This module never
   learns that breakpoint — the panel is CSS-hidden above it and the button is
   display:none, so all there is to do here is flip one class and the aria state.

   Deliberately a disclosure, not a modal: the button precedes the panel in the
   markup, so Tab walks from the burger into the links and then on into the page,
   and a focus trap would only get in the way of that. Leaving the wrap closes
   the menu instead, which is what the ARIA disclosure-navigation pattern asks
   for and what a reader tabbing past the last rubric expects. */
export function bindNavMenu() {
  const wrap = document.querySelector('.nav-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('.nav-btn');
  const pop = wrap.querySelector('.nav-pop');
  if (!btn || !pop) return;

  let openY = 0;

  function onDoc(e) { if (!wrap.contains(e.target)) close(false); }
  function onKey(e) { if (e.key === 'Escape') close(true); }
  /* Focus that lands outside the menu — a Tab past the last row, a click on some
     other control — takes the panel with it. relatedTarget is null when focus
     goes nowhere at all, and `contains(null)` is false, which is the right
     answer here too. */
  function onFocusOut(e) { if (!wrap.contains(e.relatedTarget)) close(false); }
  /* The header is sticky and tucks itself away on scroll-down: without this an
     open panel would ride off the top of the screen still reporting itself
     expanded. The threshold keeps a stray pixel of touch scroll from closing it. */
  function onScroll() { if (Math.abs(window.scrollY - openY) > 24) close(false); }
  /* A viewport grown past the breakpoint hides the burger outright (offsetParent
     goes null with display:none), so the state has to go with it — otherwise the
     class and aria-expanded survive into the desktop row and are waiting, stale,
     if the window narrows again. */
  function onResize() { if (!btn.offsetParent) close(false); }

  function open() {
    openY = window.scrollY;
    wrap.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('focusout', onFocusOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  function close(refocus) {
    if (!wrap.classList.contains('open')) return;
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', onDoc);
    document.removeEventListener('keydown', onKey);
    wrap.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    /* only when the reader dismissed it themselves (Esc): a close caused by
       focus or a pointer moving elsewhere must not yank focus back */
    if (refocus) btn.focus();
  }

  btn.addEventListener('click', function () {
    if (wrap.classList.contains('open')) close(false); else open();
  });
  /* A link to the section the reader is already in navigates to the same URL and
     leaves the panel hanging open over the page — close on any pick. */
  pop.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });
}
