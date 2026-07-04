/* Auto-reveal header: hides on scroll-down, slides back on scroll-up. */
export function bindHeader() {
  const root = document.documentElement;
  let lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    const y = window.scrollY, d = y - lastY; lastY = y;
    if (Math.abs(d) < 4) return;
    if (d > 0 && y > 90) root.classList.add('head-hidden');
    else if (d < 0) root.classList.remove('head-hidden');
  }, { passive: true });
}
