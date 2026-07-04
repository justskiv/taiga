/* Scroll-to-top button for article pages. Ported from tuzov.dev: a single
   <button> spanning the full viewport height at the left edge — the whole
   column is the click target (a Fitts's-law "infinite width" target at the
   screen edge), not just the circle glyph inside it. Appears after scrolling
   past the lead; first click smooth-scrolls to the top and "arms"; a second
   click returns to where you were; a manual scroll cancels the armed state.

   "Manual scroll" is read off the input gestures (wheel / touch / scroll keys),
   not the resulting 'scroll' events: window.scrollTo() dispatches none of
   those, so our own smooth scroll can never be mistaken for the reader taking
   control back, however long or choppy it is — which matters because these
   articles run much longer than a typical post. */
const THRESHOLD = 300;
const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];

export function mountScrollTop() {
  if (!document.body.classList.contains('article')) return;

  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'scrolltop-btn';
  btn.setAttribute('aria-label', 'Наверх');
  btn.innerHTML = '<span class="scrolltop-circle" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>' +
    '</span>';
  document.body.appendChild(btn);

  let savedY = 0, isBack = false;
  function getY() { return window.scrollY || document.documentElement.scrollTop || 0; }
  function sync() { btn.classList.toggle('is-visible', getY() > THRESHOLD || isBack); }
  function disarm() { if (!isBack) return; isBack = false; btn.classList.remove('is-back'); sync(); }

  btn.addEventListener('click', function () {
    if (isBack) {
      window.scrollTo({ top: savedY, behavior: reduceMotion ? 'auto' : 'smooth' });
      isBack = false; btn.classList.remove('is-back');
    } else {
      savedY = getY();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      isBack = true; btn.classList.add('is-back');
    }
  });

  window.addEventListener('wheel', disarm, { passive: true });
  window.addEventListener('touchmove', disarm, { passive: true });
  window.addEventListener('keydown', function (e) {
    /* Space/Enter on the button itself activate it (see the click handler)
       rather than scrolling; every other scroll key still disarms. */
    if (e.target === btn && (e.key === ' ' || e.key === 'Enter')) return;
    if (SCROLL_KEYS.indexOf(e.key) !== -1) disarm();
  });
  window.addEventListener('scroll', sync, { passive: true });
  sync();
}
