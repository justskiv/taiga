/* taiga — entrypoint. Bundled with js.Build (iife), loaded `defer` at the
   end of <body>. Each module self-guards on the DOM it needs, so it stays quiet
   on pages that don't have it. The Go highlighter, the series-bridge builder and
   the metadata search index of the mock are gone: highlighting is server-side
   Chroma, the bridge is server-rendered, and search is Pagefind full-text. */
import { buildPopover } from './modules/popover.js';
import { mountFocusBtn } from './modules/focus.js';
import { bindHeader } from './modules/header.js';
import { bindNavMenu } from './modules/navmenu.js';
import { markVisited } from './modules/visited.js';
import { buildToc } from './modules/toc.js';
import { bindRails } from './modules/rails.js';
import { bindTips } from './modules/tooltip.js';
import { bindTerms } from './modules/term.js';
import { bindLinkPreviews } from './modules/linkpreview.js';
import { bindKeys } from './modules/keys.js';
import { mountScrollTop } from './modules/scrolltop.js';
import { initFeatured } from './modules/featured.js';
import { initFeedReveal } from './modules/reveal.js';
import { initTagsFilter } from './modules/tags-filter.js';
import { bindCodeCopy } from './modules/codecopy.js';
import { bindCodeEditors } from './modules/codeedit.js';
import { bindRunOutputs } from './modules/runout.js';

function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* Widget runtime (ARCHITECTURE §4a): Taiga.widget(id, fn) registers an initializer;
   on DOM ready each mount is looked up by id and, if present, handed to its fn
   inside a try/catch — a thrown widget logs and doesn't take down its neighbours;
   a missing mount (shortcode removed from the text) is silently skipped. The
   migrated mock IIFEs don't use this — it's the contract for new widgets. Widgets
   run on DOMContentLoaded, not immediately: the page-bundle widgets.js is deferred
   after main.js, so it registers between main's parse and DOMContentLoaded. */
const Taiga = (window.Taiga = window.Taiga || {});
const widgetInits = [];
Taiga.widget = function (id, fn) { widgetInits.push([id, fn]); };
function runWidgets() {
  widgetInits.forEach(function (w) {
    const mount = document.getElementById(w[0]);
    if (!mount) return;
    try { w[1](mount); } catch (e) { console.error('widget ' + w[0] + ' failed:', e); }
  });
}

onReady(function () {
  const mount = document.getElementById('tp-mount');
  if (mount) buildPopover(mount);
  mountFocusBtn();
  bindHeader();
  bindNavMenu();   /* narrow screens only: self-guards on .nav-wrap/.nav-btn */
  markVisited();   /* before the minimaps: dots read .is-visited/.cur */
  buildToc();
  bindRails();
  bindTips();
  bindTerms();  /* articles only: self-guards on .term-cards */
  bindLinkPreviews();  /* self-guards on a[data-preview]/[data-tg]/[data-yt] */
  bindKeys();
  mountScrollTop();
  initFeatured();   /* home only: self-guards on #hd-strip/#hd-data */
  initFeedReveal(); /* home only: self-guards on .feed-more */
  initTagsFilter(); /* tags only: self-guards on #cloud/#tagFeed */
  bindCodeCopy();    /* every code listing; BEFORE the editor — it owns the outer wrapper */
  bindCodeEditors(); /* runnable snippets only: self-guards on codapi-snippet */
  bindRunOutputs();  /* ditto: self-guards on the .ro output block beside one */
});

if (document.readyState === 'complete') runWidgets();
else window.addEventListener('DOMContentLoaded', runWidgets);
