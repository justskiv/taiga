/* deeper.go — entrypoint. Bundled with js.Build (iife), loaded `defer` at the
   end of <body>. Each module self-guards on the DOM it needs, so it stays quiet
   on pages that don't have it. The Go highlighter, the series-bridge builder and
   the metadata search index of the mock are gone: highlighting is server-side
   Chroma, the bridge is server-rendered, and search is Pagefind full-text. */
import { buildPopover } from './modules/popover.js';
import { mountFocusBtn } from './modules/focus.js';
import { bindHeader } from './modules/header.js';
import { markVisited } from './modules/visited.js';
import { buildToc } from './modules/toc.js';
import { bindRails } from './modules/rails.js';
import { bindTips } from './modules/tooltip.js';
import { bindKeys } from './modules/keys.js';
import { mountScrollTop } from './modules/scrolltop.js';

function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

onReady(function () {
  const mount = document.getElementById('tp-mount');
  if (mount) buildPopover(mount);
  mountFocusBtn();
  bindHeader();
  markVisited();   /* before the minimaps: dots read .is-visited/.cur */
  buildToc();
  bindRails();
  bindTips();
  bindKeys();
  mountScrollTop();
});
