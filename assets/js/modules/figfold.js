/* A {{< fold >}} inside a figure (data/figure-fold.html) is native
   <details>: it opens, closes, takes the keyboard and works without this
   file. Paper is the one thing left — every such fold prints open. CSS does
   that where ::details-content can be styled (31-data.css); a browser that
   cannot gets the closed ones opened on beforeprint and closed again after,
   so the reader finds the page as they left it. */
export function bindFigureFolds() {
  if (!document.querySelector('details.fig-fold')) return;
  if (window.CSS && CSS.supports && CSS.supports('selector(::details-content)')) return;
  let opened = [];
  addEventListener('beforeprint', function () {
    document.querySelectorAll('details.fig-fold:not([open])').forEach(function (d) {
      d.open = true;
      opened.push(d);
    });
  });
  addEventListener('afterprint', function () {
    opened.forEach(function (d) { d.open = false; });
    opened = [];
  });
}
