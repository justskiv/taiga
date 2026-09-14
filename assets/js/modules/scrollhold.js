/* Scroll hold — keep the page still when a block on it grows because the reader
   asked it to.

   Both Gecko and Blink implement scroll anchoring: on every layout the browser
   picks a node in the viewport and, if that node moves because content ABOVE it
   changed size, scrolls by the same amount to keep it visually still. That is
   right for growth nobody asked for — a late image, an injected banner — and
   exactly wrong for a disclosure the reader is looking at. Open a fold whose
   anchor node happens to sit BELOW it and Firefox holds that node in place by
   scrolling the page down the full height of the panel: on a real article a
   2044px panel moved the page 2008px and left the summary 1705px above the top
   of the screen. The reader pressed the toggle and the paragraph they were
   reading flew off upwards. Closing is the same bug mirrored — the page jumps
   up instead — which is why this does not care which way the panel went.

   The browser picks the anchor, not us, so this never reproduces on demand: it
   depends on where the reader happens to be standing when they press.

   The fix is NOT to scroll back afterwards. A correction has to measure the
   summary before the adjustment lands and again after, which means guessing how
   many frames "after" is; it paints the wrong position for those frames, so the
   reader sees a 2000px strobe instead of a jump; and it cannot tell the
   browser's adjustment apart from a scroll that was meant — following a link to
   a heading inside a closed <details> makes the browser open it and then scroll
   to the target, and a correction would fight that. So instead we tell the
   browser not to make the adjustment at all, for half a second around a
   deliberate expansion, and put the property back the way we found it.

   WHEN NOT TO: only when the block is on screen. A block that grows off-screen
   is precisely what anchoring is for — the compensation is what keeps the
   paragraph under the reader's eyes still, and switching it off there moves the
   text they are actually reading. So every entry point but a click on a visible
   <summary> goes through the viewport test in holdScroll(el).

   BEFORE, NOT AFTER — the one rule that makes this work. `overflow-anchor` is
   read when the browser SELECTS an anchor, not when it applies an adjustment,
   so setting it once the DOM has already changed is too late: Gecko keeps the
   anchor it had and compensates anyway. Measured — a MutationObserver on the
   `open` attribute does fire in the microtask before the next frame, and the
   page still moved the full 1200px of the probe; the same change with the hold
   armed one statement earlier moved 0. So there is no way to catch a
   programmatic `el.open = true` from the outside, and this module does not
   pretend to: it listens for the one signal that arrives BEFORE the DOM changes
   — a click on a <summary>, in the capture phase, which is also the keyboard
   path since activating a <summary> with Enter or Space dispatches a click of
   its own. Everything that opens a block from script arms the hold itself:
   modules/runout.js does, and window.Taiga.holdScroll(el) is there for a
   page-bundle widget, which is built as its own iife
   (layouts/_partials/scripts.html) and cannot import this. */

/* Long enough to cover the height reveal — .2s in 22-fold.css and
   26-run-output.css — with room for a slow frame either side, short enough that
   anchoring is back before anything else on the page could want it. A widget
   with a longer transition of its own calls holdScroll() again to push the
   window back. */
const HOLD = 500;

let timer = 0;
let prev = null;   /* the inline value we displaced, restored verbatim */

function release() {
  timer = 0;
  const root = document.documentElement;
  /* put back what was there — a site may well set this property itself, and
     removing it outright would be a silent override that outlives us */
  if (prev && prev[0]) root.style.setProperty('overflow-anchor', prev[0], prev[1]);
  else root.style.removeProperty('overflow-anchor');
  prev = null;
}

/* Arm, or push back, the window — always BEFORE the change that grows the
   block. With an element, only when that element is on screen (see WHEN NOT TO
   above); bare, unconditionally — the only caller that may do that is a click
   on a <summary>, which is visible by definition. */
export function holdScroll(el) {
  if (el) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;                         /* not rendered */
    if (r.bottom <= 0 || r.top >= window.innerHeight) return;  /* off screen   */
  }
  const root = document.documentElement;
  if (timer) {
    clearTimeout(timer);
  } else {
    prev = [root.style.getPropertyValue('overflow-anchor'),
            root.style.getPropertyPriority('overflow-anchor')];
    root.style.setProperty('overflow-anchor', 'none');
  }
  timer = setTimeout(release, HOLD);
}

export function bindScrollHold() {
  /* The self-guard is a capability, not a piece of DOM: there is no element to
     look for — the <details> a widget builds does not exist yet when this runs,
     and the run block opens hours into a reading session. WebKit implements no
     scroll anchoring at all, so there it stays quiet. */
  if (!window.CSS || !CSS.supports('overflow-anchor', 'none')) return;

  /* Capture, so this runs before the activation behaviour sets `open`. Any
     <summary> on the page, not just the theme's two: a widget that ships a
     plain disclosure gets it for free. */
  document.addEventListener('click', function (e) {
    const t = e.target;
    if (t && t.closest && t.closest('summary')) holdScroll();
  }, true);

  /* The way in for code that opens a block itself — see BEFORE, NOT AFTER. */
  const T = (window.Taiga = window.Taiga || {});
  T.holdScroll = holdScroll;
}
