/* taiga — pre-paint preferences.
   Inlined in <head> before the stylesheet, so the saved theme, rails and
   rubric-list variant apply before first paint (no FOUC). Themes now live as
   CSS [data-theme] blocks, so this only sets attributes/classes — it never
   touches colors. The main bundle is deferred; this tiny script is the whole
   critical path. */
import * as params from '@params';

(function () {
  'use strict';
  var root = document.documentElement;
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var t = read('taiga.theme');
  if (t) {
    root.setAttribute('data-theme', t);
    /* keep data-scheme (light|dark, server-set for the default palette) in
       step with the saved palette; the light ids come from build params */
    var light = params.lightThemes || [];
    root.setAttribute('data-scheme', light.indexOf(t) >= 0 ? 'light' : 'dark');
  }
  if (read('taiga.railL') === 'off') root.classList.add('rail-l-off');
  if (read('taiga.railR') === 'off') root.classList.add('rail-r-off');
  var rv = read('taiga.rubvar');
  if (rv === 'loud' || rv === 'shelf') root.setAttribute('data-rubvar', rv);
})();
