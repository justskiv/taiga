/* Focus mode: hide all chrome, leave the text (F toggles). The exit button
   enters bright, then melts to a whisper after a beat. */
import { I18N } from './i18n.js';

const root = document.documentElement;
let focusExit = null, focusDimT = null;

export function toggleFocus(on) {
  const v = (on === undefined) ? !root.classList.contains('focus') : on;
  root.classList.toggle('focus', v);
  if (v && !focusExit) {
    focusExit = document.createElement('button');
    focusExit.type = 'button'; focusExit.className = 'focus-exit';
    focusExit.innerHTML = I18N.focusEnter;
    focusExit.addEventListener('click', function () { toggleFocus(false); });
    document.body.appendChild(focusExit);
  }
  if (focusExit) {
    focusExit.hidden = !v;
    clearTimeout(focusDimT);
    focusExit.classList.remove('dim');
    if (v) focusDimT = setTimeout(function () { focusExit.classList.add('dim'); }, 1600);
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
