/* Global hotkeys. Matched on e.code (physical key) so they survive non-Latin
   layouts: on the Russian layout [ ], F and the rest all sit under Cyrillic
   letters, so e.key would miss every one of them. */
import { railOn, setRail } from './view.js';
import { toggleFocus } from './focus.js';
import { openSearch, closeSearch } from './search.js';

export function bindKeys() {
  const root = document.documentElement;
  document.addEventListener('keydown', function (e) {
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape') { closeSearch(); if (root.classList.contains('focus')) toggleFocus(false); return; }
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') { e.preventDefault(); openSearch(); return; }
    /* ⌘1/⌘2 (or Ctrl+1/2). NB: in Chrome with several tabs ⌘1 also switches
       the tab — the browser keeps that shortcut. */
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      if (e.code === 'Digit1') { e.preventDefault(); setRail('l', !railOn('l')); return; }
      if (e.code === 'Digit2') { e.preventDefault(); setRail('r', !railOn('r')); return; }
      return;
    }
    if (inField) return;
    if (e.shiftKey) return;
    if (e.code === 'Slash') { e.preventDefault(); openSearch(); }
    else if (e.code === 'BracketLeft' || (e.altKey && e.code === 'Digit1')) { e.preventDefault(); setRail('l', !railOn('l')); }
    else if (e.code === 'BracketRight' || (e.altKey && e.code === 'Digit2')) { e.preventDefault(); setRail('r', !railOn('r')); }
    else if (e.code === 'KeyF' && !e.altKey && document.body.classList.contains('article')) { e.preventDefault(); toggleFocus(); }
  });
  const sb = document.getElementById('searchBtn');
  if (sb) sb.addEventListener('click', openSearch);
}
