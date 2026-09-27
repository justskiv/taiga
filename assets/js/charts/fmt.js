/* The number grammar of the data figures — one meaning in three places.

   The chart runtime (charts/core.js), Taiga.fmt for page-bundle widgets
   (modules/plot.js) and the Obsidian plugin (a byte copy of this file) all
   read and print numbers through here; the Hugo partials that build the no-JS
   tables (layouts/_partials/taiga/{num,fmt,chart-cell}.html) follow the same
   rules, and charts/cases.json holds the vectors all of them must pass
   (scripts/check-charts.mjs).

   So this module stays portable: no imports, no globals touched at import
   time, no DOM. Separators are passed in — the page gets them from Hugo's
   i18n (num_decimal / num_group), the plugin from its own catalogue — and
   sepFor() derives them from Intl only where nothing else is at hand.

   Printing: half-up away from zero on the printed digit, not on the binary
   value — 41.55 is 41.5499… as a double and must still print 41,6 as the
   article's tables do. A real minus (U+2212), never "−0". Thousands are
   grouped only from five integer digits: "1234", but "12 345". */

var MINUS = '−';

/* A number as written somewhere in a string: an optional sign right before the
   digits, a comma or a dot as the decimal mark, spaces between digit groups.
   "−41%" → −41, "+155 КБ" → 155, "в 3,5 раза" → 3.5, "1 234,5" → 1234.5.
   Returns { v, dec } (dec: decimals as written) or null. A comma is always a
   decimal mark — "1,234" is 1.234 — so thousands take a space only. */
export function numMatch(text) {
  if (typeof text === 'number') return isFinite(text) ? { v: text, dec: decimals(text) } : null;
  if (text == null) return null;
  var s = String(text).replace(/(\d)[    ](?=\d)/g, '$1');
  var m = /([+\-−]?)(\d+(?:[.,]\d+)?|[.,]\d+)/.exec(s);
  if (!m) return null;
  var body = m[2].replace(',', '.');
  var v = parseFloat(body);
  if (m[1] === '-' || m[1] === MINUS) v = -v;
  if (v === 0) v = 0; // no −0
  var dot = body.indexOf('.');
  return { v: v, dec: dot < 0 ? 0 : body.length - dot - 1 };
}

export function num(text) {
  var m = numMatch(text);
  return m ? m.v : null;
}

/* decimals of a JS number as it prints (26.6 → 1), capped at 6 */
export function decimals(v) {
  var s = String(Math.abs(v));
  if (s.indexOf('e') >= 0) return 6;
  var dot = s.indexOf('.');
  return dot < 0 ? 0 : Math.min(6, s.length - dot - 1);
}

/* Decimal and group separators of a language, from Intl. The page prefers
   Hugo's i18n values (they travel in the chart spec); this is the fallback. */
export function sepFor(lang) {
  var sep = { dec: '.', group: ',' };
  try {
    var parts = new Intl.NumberFormat(lang || 'en', { useGrouping: true }).formatToParts(12345.6);
    parts.forEach(function (p) {
      if (p.type === 'decimal') sep.dec = p.value;
      if (p.type === 'group') sep.group = p.value;
    });
  } catch (e) { /* keep the defaults */ }
  return sep;
}

/* Print v with d decimals. sep: { dec, group } (see sepFor). */
export function fmt(v, d, sep) {
  if (v == null || !isFinite(v)) return '';
  d = d > 0 ? Math.min(6, d | 0) : 0;
  var s = sep || { dec: '.', group: ',' };
  var k = Math.pow(10, d);
  var r = Math.round(Math.abs(v) * k + 1e-7) / k;
  var txt = r.toFixed(d);
  var dot = txt.indexOf('.');
  var int = dot < 0 ? txt : txt.slice(0, dot);
  var frac = dot < 0 ? '' : txt.slice(dot + 1);
  if (int.length >= 5) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, s.group);
  return (v < 0 && r !== 0 ? MINUS : '') + int + (d ? s.dec + frac : '');
}

/* One cell of a data table, in the grammar the chart shortcode documents:
     12,65                a value
     *13,18*              a hollow point from another source: never joined
     ~                    no measurable difference: hollow, on the zero line
     (empty, null, —)     no data: the line breaks
   any of the first three may end in *detail* — a second, quieter line.
   Returns { kind: 'val'|'alt'|'same'|'none', v, dec, detail, bad }. `bad`
   marks text that is none of the above (a typo): drawn as no data, and worth
   a warning where there is somewhere to say it. */
export function cell(input) {
  var out = { kind: 'none', v: null, dec: 0, detail: '', bad: false };
  if (typeof input === 'number') {
    if (isFinite(input)) { out.kind = 'val'; out.v = input === 0 ? 0 : input; out.dec = decimals(input); }
    return out;
  }
  if (input == null) return out;
  var s = String(input).trim();
  if (s === '' || s === '—') return out;
  var m = /^(.+?)\s+\*([^*]+)\*$/.exec(s);
  if (m) { s = m[1].trim(); out.detail = m[2].trim(); }
  if (s === '~') { out.kind = 'same'; out.v = 0; return out; }
  var alt = /^\*([^*]+)\*$/.exec(s);
  var n = numMatch(alt ? alt[1] : s);
  if (!n) { out.bad = true; out.detail = ''; return out; }
  out.kind = alt ? 'alt' : 'val';
  out.v = n.v;
  out.dec = n.dec;
  return out;
}

/* The decimals a data set prints at: the most any of its values was written
   with, so 26.6 next to 5.67 prints 26,60. */
export function digitsOf(list) {
  var d = 0;
  (list || []).forEach(function (x) {
    var c = cell(x);
    if ((c.kind === 'val' || c.kind === 'alt') && c.dec > d) d = c.dec;
  });
  return d;
}
