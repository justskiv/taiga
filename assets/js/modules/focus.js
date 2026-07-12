/* Focus mode: hide all chrome, leave the text (F toggles). The exit is an
   icon-only "shrink back" at top-right (where enter lived in the now-hidden
   header): it enters visible, melts to a whisper, hides on scroll-down and
   drifts back on scroll-up. The label rides in its own tip on hover/focus. */
import { I18N } from './i18n.js';

const root = document.documentElement;
let focusExit = null, focusDimT = null, lastY = 0, scrollTick = false;

const EXIT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4"/><path d="M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4"/><path d="M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20"/><path d="M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20"/></svg>';

function onScroll() {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(applyScroll);
}
function applyScroll() {
  scrollTick = false;
  const y = window.pageYOffset || root.scrollTop || 0;
  if (focusExit && root.classList.contains('focus')) {
    const dy = y - lastY;
    if (dy > 4 && y > 80) focusExit.classList.add('gone');       /* down: tuck away */
    else if (dy < -4) focusExit.classList.remove('gone');        /* up: drift back */
  }
  lastY = y;
}

export function toggleFocus(on) {
  const v = (on === undefined) ? !root.classList.contains('focus') : on;
  root.classList.toggle('focus', v);
  if (v && !focusExit) {
    focusExit = document.createElement('button');
    focusExit.type = 'button'; focusExit.className = 'focus-exit';
    focusExit.setAttribute('aria-label', I18N.focusExitTip);
    focusExit.innerHTML = EXIT_SVG +
      '<span class="focus-exit-tip" aria-hidden="true">' +
      I18N.focusExitTip + ' <kbd class="kb">F</kbd></span>';
    focusExit.addEventListener('click', function () { toggleFocus(false); });
    document.body.appendChild(focusExit);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  if (focusExit) {
    focusExit.hidden = !v;
    clearTimeout(focusDimT);
    focusExit.classList.remove('dim', 'gone');
    if (v) {
      lastY = window.pageYOffset || root.scrollTop || 0;
      focusDimT = setTimeout(function () { focusExit.classList.add('dim'); }, 1600);
    }
  }
}

export function mountFocusBtn() {
  if (!document.body.classList.contains('article')) return;
  const mount = document.getElementById('tp-mount'); if (!mount) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'focus-btn';
  b.title = I18N.focusTitle; b.setAttribute('aria-label', I18N.focusAria);
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9"/><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9"/><path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/></svg>';
  b.addEventListener('click', function () { toggleFocus(true); });
  mount.parentNode.insertBefore(b, mount);
}
