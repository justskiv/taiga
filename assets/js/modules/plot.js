/* Observable Plot on demand — the loader behind {{< chart >}} and behind any
   page-bundle widget that draws with Plot (front matter `plot: true`).

   The library is NOT part of any bundle. layouts/_partials/scripts.html prints
   its fingerprinted address and SRI hash as inert JSON (#vendor-plot) on the
   pages that need it, and nothing is fetched until a figure asks:
   plotWhenNear(root, live) waits until the figure comes within NEAR of the
   viewport, so a reader who never scrolls that far downloads nothing. Until
   then — and for good if the load fails — the figure keeps its static
   fallback.

   ONE request per page, whoever asks first: plot() keeps a single promise, and
   a script already on its way from somewhere else (a bundle's own loader from
   before Plot moved into the theme) is joined rather than doubled. */

const CFG = 'vendor-plot';
/* start fetching this far before a figure scrolls into view */
const NEAR = '600px 0px';
/* how long to wait on a script someone else inserted before giving up on it:
   its load event may already have fired before we started listening */
const JOIN_WAIT = 20000;

let plotP = null;

function ready() {
  return window.Plot && typeof window.Plot.plot === 'function' ? window.Plot : null;
}

/* Resolves with the Plot namespace; rejects when the page carries no config
   or the script does not arrive (network, SRI mismatch). */
export function plot() {
  if (plotP) return plotP;
  if (ready()) return (plotP = Promise.resolve(ready()));
  const el = document.getElementById(CFG);
  let cfg = null;
  try { cfg = el && JSON.parse(el.textContent); } catch (e) { cfg = null; }
  if (!cfg || !cfg.src) {
    return (plotP = Promise.reject(new Error('no #' + CFG + ' on this page (a chart shortcode, or front matter plot: true)')));
  }
  plotP = new Promise(function (ok, fail) {
    function settle() {
      if (ready()) ok(ready());
      else fail(new Error('Plot is not on window after ' + cfg.src));
    }
    const other = Array.prototype.find.call(document.scripts, function (s) {
      return s.getAttribute('src') === cfg.src;
    });
    if (other) {
      const t = setTimeout(settle, JOIN_WAIT);
      other.addEventListener('load', function () { clearTimeout(t); settle(); });
      other.addEventListener('error', function () { clearTimeout(t); fail(new Error('could not load ' + cfg.src)); });
      return;
    }
    const s = document.createElement('script');
    s.src = cfg.src;
    if (cfg.integrity) { s.integrity = cfg.integrity; s.crossOrigin = 'anonymous'; }
    s.async = true;
    s.setAttribute('data-taiga-plot', '');
    s.onload = settle;
    s.onerror = function () { fail(new Error('could not load ' + cfg.src)); };
    document.head.appendChild(s);
  });
  return plotP;
}

/* Draw a Plot figure once its mount comes near the viewport. `live(Plot)`
   builds the figure and swaps it in; it must draw before it swaps, so that a
   throw leaves the fallback in place. Returns start(): loads and draws right
   now, whatever the scroll position (a promise — handy for tests). */
export function plotWhenNear(root, live) {
  let started = null;
  function start() {
    if (started) return started;
    started = plot().then(function (P) {
      try { live(P); } catch (e) { console.error('plot figure ' + (root.id || '') + ' failed:', e); }
    }, function (e) {
      console.warn((root.id || 'plot figure') + ': ' + (e && e.message) + ' — keeping the static figure');
    });
    return started;
  }
  if (typeof IntersectionObserver !== 'function') { start(); return start; }
  const io = new IntersectionObserver(function (en) {
    for (let k = 0; k < en.length; k++) {
      if (en[k].isIntersecting) { io.disconnect(); start(); return; }
    }
  }, { rootMargin: NEAR });
  io.observe(root);
  return start;
}
