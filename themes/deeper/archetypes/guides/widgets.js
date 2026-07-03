/* Widgets for this guide. Register each interactive figure by its mount id: the
   runtime (main.js) waits for the DOM, finds <div id="..." class="w-root">
   inside its figure.widget, and hands it to the callback. A widget that throws
   logs and doesn't break its neighbours; a missing mount is skipped silently.
   Delete this file if the guide has no widgets. */
DG.widget('w-example', function (root) {
  // root is the .w-root mount — build the interactive here (vanilla JS).
});
