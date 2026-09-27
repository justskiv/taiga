/* taiga — entrypoint. Bundled with js.Build (iife), loaded `defer` at the
   end of <body>. Each module self-guards on the DOM it needs, so it stays quiet
   on pages that don't have it. The Go highlighter, the series-bridge builder and
   the metadata search index of the mock are gone: highlighting is server-side
   Chroma, the bridge is server-rendered, and search is Pagefind full-text. */
import { bindScrollHold } from './modules/scrollhold.js';
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
import { patchRunClock } from './modules/runclock.js';
import { bindNewsletter } from './modules/newsletter.js';
import { bindComments } from './modules/comments.js';
import { plot, plotWhenNear } from './modules/plot.js';
import { fitBars } from './modules/barsfit.js';
import { fmt, num, sepFor } from './charts/fmt.js';

/* Build-time feature flags. esbuild substitutes a literal `true`/`false` for
   these (js.Build `defines` in layouts/_partials/scripts.html), so a call
   guarded by a false one folds away and the module behind it is tree-shaken
   out of the bundle entirely — that is what lets an optional feature promise
   "off ⇒ not one byte shipped" rather than "off ⇒ dead code that never runs".
   They are NOT globals: nothing reads them at run time, and a bundle built
   without the defines would throw on the first one. */
/* global TAIGA_NEWSLETTER, TAIGA_COMMENTS */

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

/* Helpers a widget may lean on instead of carrying its own copy
   (docs/authoring.md#data). Taiga.plot() / Taiga.plotWhenNear(root, live) load
   Observable Plot once per page — only where the page asks for it, see
   modules/plot.js. Taiga.fmt(v, digits) prints a number the way the figures do
   (the page language's decimal mark, a real minus, half-up, no "−0");
   Taiga.num(text) reads the first number out of a string ("−41%" → −41). */
Taiga.plot = plot;
Taiga.plotWhenNear = plotWhenNear;
let numSep = null;
Taiga.fmt = function (v, digits) { return fmt(v, digits, numSep || (numSep = sepFor(document.documentElement.lang))); };
Taiga.num = num;
function runWidgets() {
  widgetInits.forEach(function (w) {
    const mount = document.getElementById(w[0]);
    if (!mount) return;
    try { w[1](mount); } catch (e) { console.error('widget ' + w[0] + ' failed:', e); }
  });
}

/* Before onReady, and outside it: this one is not a mount, it is a correction
   to the number a finished run reports, and a snippet can be run from script as
   well as from a click. codapi is loaded by the same deferred tag one line
   above this bundle in scripts.html, so window.codapi is already there; on a
   page without a snippet the call finds nothing and returns. */
patchRunClock();

onReady(function () {
  bindScrollHold();  /* page-wide: guards on the engine, not on the DOM — the disclosures it covers may not exist yet */
  const mount = document.getElementById('tp-mount');
  if (mount) buildPopover(mount);
  mountFocusBtn();
  bindHeader();
  bindNavMenu();   /* narrow screens only: self-guards on .nav-wrap/.nav-btn */
  markVisited();   /* before the minimaps: dots read .is-visited/.cur */
  fitBars();       /* {{< bars >}}: labels in or out of their bars, by measure */
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
  if (TAIGA_NEWSLETTER) bindNewsletter();  /* subscription forms: self-guards on .nl-form */
  if (TAIGA_COMMENTS) bindComments();      /* comments block: self-guards on .cmnt */
});

if (document.readyState === 'complete') runWidgets();
else window.addEventListener('DOMContentLoaded', runWidgets);
