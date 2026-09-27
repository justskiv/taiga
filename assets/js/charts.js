/* taiga — the chart runtime's entry on the site. A bundle of its own, loaded
   only on pages that carry a {{< chart >}} (scripts.html, the "chart" flag),
   deferred after main.js — whose Taiga.plotWhenNear it relies on, so Plot is
   fetched once per page whoever asks.

   Each figure.chart holds the no-JS tables and its data as JSON
   (script.chart-spec, written by layouts/_shortcodes/chart.html). The data is
   read now — cheap, and a broken spec is reported at load, not on scroll —
   and the chart is drawn when the figure comes near the viewport. Until then,
   and for good if Plot never arrives, the tables are the figure. */
import { normalize, mount } from './charts/core.js';

(function () {
  const T = window.Taiga;
  const figs = document.querySelectorAll('figure.chart');
  if (!figs.length || !T || typeof T.plotWhenNear !== 'function') return;
  let labels = {};
  try { labels = JSON.parse(document.getElementById('taiga-chart-i18n').textContent) || {}; } catch (e) { /* the runtime has fallbacks */ }
  figs.forEach(function (fig) {
    const root = fig.querySelector('.chart-root');
    const el = fig.querySelector('script.chart-spec');
    if (!root || !el) return;
    let model;
    try { model = normalize(JSON.parse(el.textContent)); } catch (e) { console.error('chart: unreadable data', e); return; }
    if (model.warn.length) console.warn('chart: ' + model.warn.join('; '));
    T.plotWhenNear(root, function (P) { mount(root, model, { Plot: P, labels: labels }); });
  });
})();
