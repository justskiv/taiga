/* reference/widget-anatomy — shared widget code (bundle level).

   A FRAGMENT, not a standalone script: the theme concatenates every
   widgets/**.js of a page bundle in Name order (_shared/ sorts before w-*,
   since '_' 0x5F < 'w' 0x77) and wraps the result in ONE iife via js.Build.
   So the guard and the `h` helper below share a single scope with every
   widgets/<id>/widget.js in THIS bundle — no closures of their own, no
   re-declaration. See themes/taiga/layouts/_partials/scripts.html.

   This bundle has only one interactive widget, so nothing here is shared out
   of strict necessity — it is shared by convention: the guard always lives
   in _shared/lib.js regardless of how many widgets a bundle has, and `h` is
   kept here as a stand-in for "a helper two widgets would both call" (rule 3
   of the migration recipe — a reusable primitive earns a spot in _shared even
   with one consumer today). For a bundle where splitting actually matters,
   see content/internals/sched/concurrency-price/widgets/_shared/lib.js. */
'use strict';
var W = window.Taiga;
if (!W || typeof W.widget !== 'function') return;

/* tiny element builder — reused by widgets/w-anatomy-toggle/widget.js */
function h(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/* silent self-test: a thrown assertion must never take down a live widget */
try {
  if (typeof W.widget !== 'function') {
    console.error('widget-anatomy self-test: Taiga.widget missing');
  }
} catch (e) { /* never break a live widget */ }
