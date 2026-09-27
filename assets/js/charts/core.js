/* The chart runtime behind {{< chart >}} — one implementation, two hosts.

   The site's entry (assets/js/charts.js) and the Obsidian plugin (a byte copy
   of this file and of fmt.js beside it) both hand it the same spec, the one
   layouts/_shortcodes/chart.html writes as JSON, and get the same chart. That
   is why this module stays portable: no imports but fmt.js, nothing touched at
   import time, every element made through root.ownerDocument (Obsidian's
   popout windows are other documents), every listener and observer released
   by destroy().

   normalize(spec) → model   the one reading of the data: the Markdown table of
                             the inline form or the rows of a YAML file, every
                             cell through fmt.js's grammar (a value, *hollow*,
                             ~, no data, a trailing *detail*), colours, shapes,
                             digits, domains
   mount(root, model, env)   draws with env.Plot into root, over the no-JS
                             tables the shortcode left there; returns
                             { redraw, destroy, select }

   READING VALUES — after Grafana's TooltipPlugin2, ECharts, OWID, Highcharts
   and WCAG 1.4.13, as first built for the Go 1.27 allocation chart:
   · the crosshair and the rings SNAP to the nearest measured x — never an
     interpolated value;
   · mouse/pen: the panel follows the raw pointer with no movement animation,
     its corner diagonally at +14/+14 px so it never covers the lines being
     read; it flips left when it would leave the stage and flips back only
     with 28 px to spare, flips up near the bottom, stays inside the stage;
     its columns are fixed in ch, so a flipped panel never jitters; it fades
     in 120 ms (CSS), hides 100 ms after the pointer leaves, and on Esc;
   · touch: no panel under the finger — a tap selects, a sideways drag scrubs
     (vertical drags still scroll), the values go to a readout line ABOVE the
     chart whose height is reserved up front;
   · keyboard: the stage is a tab stop; ←/→, Home/End walk the points, Esc
     hides; only keyboard steps are announced (a polite live region).
   The chart is drawn once per width and mode; the crosshair is an HTML layer
   over it, so moving it costs no re-render. Colours reach Plot as 'var(--…)'
   strings, so a palette switch repaints with no JavaScript at all. */

import { cell, fmt, numMatch, digitsOf, decimals, sepFor } from './fmt.js';

export var SPEC_VERSION = 1;

/* series defaults, in order — the palette roles live in 31-data.css (--dv-*) */
var COLORS = ['blue', 'green', 'red', 'gold', 'violet', 'copper'];
var SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross'];
var INKS = COLORS.concat(['accent', 'ink']);
var GLYPH = {
  circle: '<circle cx="5" cy="5" r="4"/>',
  square: '<rect x="1.2" y="1.2" width="7.6" height="7.6" rx="1"/>',
  triangle: '<path d="M5 .8 9.4 8.9H.6Z"/>',
  diamond: '<path d="M5 .4 9.6 5 5 9.6.4 5Z"/>',
  star: '<path d="m5 .5 1.3 3 3.3.3-2.5 2.2.8 3.3L5 7.6 2.1 9.3l.8-3.3L.4 3.8l3.3-.3Z"/>',
  cross: '<path d="M3.7.6h2.6v3.1h3.1v2.6H6.3v3.1H3.7V6.3H.6V3.7h3.1Z"/>'
};
var HOLLOW = '<circle cx="5" cy="5" r="3.6"/>';

/* geometry */
var NARROW = 480;           // below this plot width: narrow ticks, lower chart
var M = { right: 12, top: 26, topBare: 12, bottom: 34 };
var DODGE = 5;              // px between the hollow "~" marks of one x
/* the panel: diagonal offset from the anchor, the spare room it wants before
   it flips back, how long it lingers after the pointer leaves */
var OFF = 14, SPARE = 28, HIDE = 100;
/* the touch readout gets its second (detail) line from this width up */
var WIDE = 340;

/* ─────────────────────────── reading the data ─────────────────────────── */

function copy(o) {
  var r = {};
  if (o && typeof o === 'object') for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k];
  return r;
}
function str(v) { return v == null ? '' : String(v); }
function isNum(v) { return typeof v === 'number' && isFinite(v); }
/* a label cell with its Markdown stripped: **name**, *x*, `code` */
function plain(s) {
  return str(s).replace(/\*\*|__|`/g, '').replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1$2').trim();
}
function numOf(v) {
  var m = numMatch(v);
  return m ? m.v : null;
}
function pair(a) {
  if (!Array.isArray(a) || a.length !== 2) return null;
  var p = [numOf(a[0]), numOf(a[1])];
  return p[0] == null || p[1] == null || p[0] === p[1] ? null : p;
}
function numList(a) {
  if (!Array.isArray(a)) return null;
  var r = [];
  a.forEach(function (v) { var n = numOf(v); if (n != null) r.push(n); });
  return r.length ? r : null;
}

/* A GFM table as text → { head, body, warn }. Leading/trailing pipes are
   optional, \| is a literal pipe, the delimiter row (---, :--:) is dropped. */
export function parseTable(text) {
  var out = { head: [], body: [], warn: [] };
  var lines = str(text).replace(/\r\n?/g, '\n').split('\n');
  var rows = [];
  lines.forEach(function (ln, i) {
    var s = ln.trim();
    if (!s) return;
    if (s.indexOf('|') < 0) { out.warn.push('line ' + (i + 1) + ' is not a table row: ' + s); return; }
    s = s.replace(/\\\|/g, '\u0000');
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    rows.push(s.split('|').map(function (c) { return c.replace(/\u0000/g, '|').trim(); }));
  });
  if (!rows.length) return out;
  out.head = rows[0];
  var body = rows.slice(1);
  if (body.length && body[0].every(function (c) { return /^:?-+:?$/.test(c); })) body = body.slice(1);
  out.body = body;
  return out;
}

/* spec (the shortcode's JSON, or the plugin's reading of the same source) →
   the model mount() draws. Never throws on bad data: what cannot be read is
   left out and said in model.warn. */
export function normalize(spec) {
  var s = spec || {};
  var warn = [];
  var lang = str(s.lang) || 'en';
  var sep = s.num && s.num.dec ? { dec: str(s.num.dec), group: s.num.group == null ? ',' : str(s.num.group) } : sepFor(lang);
  var x = copy(s.x), y = copy(s.y);
  var series = Array.isArray(s.series) ? s.series.map(copy) : [];
  var raw = [];

  if (typeof s.table === 'string') {
    var t = parseTable(s.table);
    t.warn.forEach(function (w) { warn.push(w); });
    if (!x.title && t.head.length) x.title = plain(t.head[0]);
    for (var h = 1; h < t.head.length; h++) {
      var o = series[h - 1] || (series[h - 1] = {});
      if (!o.name) o.name = plain(t.head[h]);
    }
    if (series.length > t.head.length - 1) series.length = Math.max(0, t.head.length - 1);
    raw.push({ label: '', rows: t.body });
  } else if (Array.isArray(s.modes) && s.modes.length) {
    s.modes.forEach(function (m) { raw.push({ label: str(m && m.label), rows: (m && m.rows) || [] }); });
  } else {
    raw.push({ label: '', rows: s.rows || [] });
  }

  /* a data set without a series list still draws: one series per column */
  if (!series.length) {
    var widest = 0;
    raw.forEach(function (m) { (m.rows || []).forEach(function (r) { if (Array.isArray(r)) widest = Math.max(widest, r.length - 1); }); });
    for (var w = 0; w < widest; w++) series.push({ name: String(w + 1) });
  }
  series.forEach(function (o, i) {
    o.i = i;
    o.name = plain(o.name);
    o.note = str(o.note);
    o.color = INKS.indexOf(o.color) >= 0 ? o.color : COLORS[i % COLORS.length];
    o.shape = SHAPES.indexOf(o.shape) >= 0 ? o.shape : SHAPES[i % SHAPES.length];
  });
  var n = series.length;

  var xsAll = [], valsAll = [];
  var hasSame = false, hasAlt = false;
  var modes = raw.map(function (m, mi) {
    var rows = [];
    (m.rows || []).forEach(function (r, ri) {
      var where = (raw.length > 1 ? 'mode ' + (mi + 1) + ', ' : '') + 'row ' + (ri + 1);
      if (!Array.isArray(r) || !r.length) { warn.push(where + ' is not a list'); return; }
      var xm = numMatch(r[0]);
      if (!xm) { warn.push(where + ': x ' + JSON.stringify(r[0]) + ' is not a number'); return; }
      if (r.length - 1 !== n) warn.push(where + ': ' + (r.length - 1) + ' cells for ' + n + ' series');
      var cells = [];
      for (var i = 0; i < n; i++) {
        var c = cell(r[i + 1]);
        if (c.bad) warn.push(where + ': ' + JSON.stringify(r[i + 1]) + ' is not a value, ~, *hollow* or empty');
        if (c.kind === 'same') hasSame = true;
        if (c.kind === 'alt') hasAlt = true;
        cells.push(c);
        valsAll.push(r[i + 1]);
      }
      xsAll.push(r[0]);
      rows.push({ x: xm.v, cells: cells });
    });
    rows.sort(function (a, b) { return a.x - b.x; });
    return { label: m.label, rows: rows };
  });

  x.title = str(x.title); y.title = str(y.title);
  x.unit = str(x.unit); y.unit = str(y.unit);
  x.digits = isNum(x.digits) ? x.digits : digitsOf(xsAll);
  y.digits = isNum(y.digits) ? y.digits : digitsOf(valsAll);

  var lo = Infinity, hi = -Infinity, ylo = 0, yhi = 0;
  modes.forEach(function (m) {
    m.rows.forEach(function (r) {
      lo = Math.min(lo, r.x); hi = Math.max(hi, r.x);
      r.cells.forEach(function (c) { if (c.v != null) { ylo = Math.min(ylo, c.v); yhi = Math.max(yhi, c.v); } });
    });
  });
  x.nice = !pair(x.domain);
  x.domain = pair(x.domain) || (lo < hi ? [lo, hi] : [lo - 1, hi + 1]);
  y.nice = !pair(y.domain);
  y.domain = pair(y.domain) || (ylo < yhi ? [ylo, yhi] : [ylo - 1, yhi + 1]);
  x.ticks = numList(x.ticks);
  x.narrow = numList(x.narrow);
  y.ticks = numList(y.ticks);

  function named(v) {
    if (isNum(v) && series[v]) return v;
    for (var k = 0; k < series.length; k++) if (series[k].name === plain(v)) return k;
    return -1;
  }
  var rules = [], zones = [], jumps = [];
  (Array.isArray(s.rules) ? s.rules : []).forEach(function (r) {
    var at = numOf(r && r.x);
    if (at == null) warn.push('rule without a number x'); else rules.push({ x: at, label: str(r.label) });
  });
  (Array.isArray(s.zones) ? s.zones : []).forEach(function (z) {
    var a = numOf(z && z.from), b = numOf(z && z.to);
    if (a == null || b == null) warn.push('zone without from/to'); else zones.push({ from: Math.min(a, b), to: Math.max(a, b), label: str(z.label) });
  });
  (Array.isArray(s.jumps) ? s.jumps : []).forEach(function (j) {
    var k = named(j && j.series), a = numOf(j && j.from), b = numOf(j && j.to);
    if (k < 0 || a == null || b == null) warn.push('jump needs a known series, from and to');
    else jumps.push({ series: k, from: a, to: b, label: str(j.label) });
  });

  var legend = copy(s.legend);
  var heights = numList(s.height);

  return {
    v: SPEC_VERSION, lang: lang, sep: sep, x: x, y: y, series: series, modes: modes,
    rules: rules, zones: zones, jumps: jumps,
    legend: { title: str(legend.title), same: hasSame ? str(legend.same) : '', hollow: hasAlt ? str(legend.hollow) : '', hasSame: hasSame, hasAlt: hasAlt },
    rest: numOf(s.rest),
    summary: str(s.summary),
    height: heights && heights.length === 2 ? heights : [250, 290],
    warn: warn
  };
}

/* ───────────────────────────── drawing ───────────────────────────── */

function esc(s) {
  return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ink(color) { return 'var(--dv-' + color + ')'; }
function mark(s, hollow) {
  return '<span class="ch-mk" style="--c:' + ink(s.color) + '"><svg class="ch-sh' + (hollow ? ' is-hollow' : '') +
    '" viewBox="0 0 10 10" aria-hidden="true">' + (hollow ? HOLLOW : GLYPH[s.shape]) + '</svg></span>';
}

/* a value as the panel, the readout and the legend print it */
function valText(model, c, noData) {
  if (!c || c.kind === 'none') return noData;
  if (c.kind === 'same') return '~';
  var u = model.y.unit;
  return fmt(c.v, model.y.digits, model.sep) + u;
}
function xText(model, x) { return fmt(x, model.x.digits, model.sep) + model.x.unit; }
/* tick labels carry a unit only when it is glued to the number ("%", "×") */
function tickText(v, axis, sep) {
  var d = Math.min(3, decimals(v));
  var t = v === 0 ? '0' : fmt(v, d, sep);
  return axis.unit && axis.unit.charAt(0) !== ' ' ? t + (v === 0 ? '' : axis.unit) : t;
}

/* the solid chains, the dashed "~" links and the three kinds of point */
function geometry(model, mode) {
  var g = { segs: [], vals: [], sames: [], alts: [] };
  var n = model.series.length;
  model.series.forEach(function (s) {
    var i = s.i, prev = null;
    var dx = (i - (n - 1) / 2) * DODGE;
    mode.rows.forEach(function (r) {
      var c = r.cells[i];
      if (c.kind === 'val' || c.kind === 'same') {
        var p = { s: i, x: r.x, y: c.kind === 'same' ? 0 : c.v, same: c.kind === 'same', dx: c.kind === 'same' ? dx : 0 };
        if (prev) g.segs.push({ s: i, x1: prev.x, y1: prev.y, x2: p.x, y2: p.y, dashed: prev.same || p.same });
        (p.same ? g.sames : g.vals).push(p);
        prev = p;
      } else {
        if (c.kind === 'alt') g.alts.push({ s: i, x: r.x, y: c.v });
        prev = null; // a hollow point or a gap breaks the line
      }
    });
  });
  return g;
}

function yAt(mode, s, x) {
  for (var k = 0; k < mode.rows.length; k++) {
    var r = mode.rows[k];
    if (r.x === x) { var c = r.cells[s]; return c && c.v != null ? c.v : null; }
  }
  return null;
}

function plotChart(P, model, mode, w) {
  var narrow = w < NARROW;
  var H = narrow ? model.height[0] : model.height[1];
  var g = geometry(model, mode);
  var ids = model.series.map(function (s) { return s.i; });
  var yt = model.y.ticks;
  var labelled = model.rules.some(function (r) { return r.label; }) || model.zones.some(function (z) { return z.label; });

  /* the left margin fits the longest y tick label (mono 11px ≈ 6.7px a char) */
  var yLabels = (yt || [model.y.domain[0], model.y.domain[1]]).map(function (v) { return tickText(v, model.y, model.sep); });
  var ml = Math.max(30, Math.ceil(Math.max.apply(null, yLabels.map(function (t) { return t.length; })) * 6.7) + 12);
  var yd = model.y.domain;

  var marks = [];
  var grid = (yt || []).filter(function (v) { return v !== 0; });
  if (grid.length) marks.push(P.gridY(grid, { stroke: 'var(--dv-grid)', strokeOpacity: 1 }));
  else marks.push(P.gridY({ stroke: 'var(--dv-grid)', strokeOpacity: 1 }));
  /* labels hang from the frame, not from a data value: the frame's top is
     whichever end of the domain the axis puts there, niced or reversed */
  model.zones.forEach(function (z) {
    marks.push(P.rect([z], { x1: 'from', x2: 'to', fill: 'var(--dv-zone)' }));
    if (z.label) {
      marks.push(P.text([z], { x: function (d) { return (d.from + d.to) / 2; }, frameAnchor: 'top', dy: 4, lineAnchor: 'top', fill: 'var(--text-muted)', text: 'label' }));
    }
  });
  if (Math.min(yd[0], yd[1]) <= 0 && Math.max(yd[0], yd[1]) >= 0) marks.push(P.ruleY([0], { stroke: 'var(--dv-base)' }));
  model.rules.forEach(function (r) {
    marks.push(P.ruleX([r.x], { stroke: 'var(--dv-axis)', strokeDasharray: '2,3' }));
    if (r.label) marks.push(P.text([r], { x: 'x', frameAnchor: 'top', dy: -14, fill: 'var(--text-secondary)', text: 'label' }));
  });
  model.jumps.forEach(function (j) {
    var a = yAt(mode, j.series, j.from), b = yAt(mode, j.series, j.to);
    if (a == null || b == null) return;
    var c = ink(model.series[j.series].color);
    /* the level at `from` carried over to `to`, then the rise itself */
    marks.push(P.link([{ x1: j.from, x2: j.to, y: a }], { x1: 'x1', x2: 'x2', y1: 'y', y2: 'y', stroke: c, strokeOpacity: 0.55, strokeDasharray: '1,3' }));
    marks.push(P.arrow([{ x: j.to, y1: a, y2: b }], { x1: 'x', x2: 'x', y1: 'y1', y2: 'y2', stroke: c, strokeWidth: 1.4, headLength: 7, insetEnd: 7, dx: -10, bend: 0 }));
    if (j.label) {
      marks.push(P.text([j], { x: j.to, y: a + (b - a) * 0.35, dx: -18, textAnchor: 'end', fill: 'var(--text-primary)', fontWeight: 700, fontSize: 13, text: 'label' }));
    }
  });
  marks.push(P.link(g.segs.filter(function (d) { return d.dashed; }), {
    x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2', stroke: 's', strokeWidth: 1.4, strokeDasharray: '3,4', strokeOpacity: 0.8
  }));
  marks.push(P.link(g.segs.filter(function (d) { return !d.dashed; }), {
    x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2', stroke: 's', strokeWidth: 2, strokeLinecap: 'round'
  }));
  model.series.forEach(function (s) {
    var mine = function (d) { return d.s === s.i; };
    /* the hollow "~" marks of one x sit on one spot (0): nudged apart per series */
    marks.push(P.dot(g.sames.filter(mine), { x: 'x', y: 'y', symbol: 's', dx: (s.i - (model.series.length - 1) / 2) * DODGE, r: 4.5, fill: 'var(--dv-ring)', stroke: 's', strokeWidth: 1.6 }));
    marks.push(P.dot(g.alts.filter(mine), { x: 'x', y: 'y', symbol: 'circle', r: 3.5, fill: 'var(--dv-ring)', stroke: 's', strokeWidth: 1.4 }));
    marks.push(P.dot(g.vals.filter(mine), { x: 'x', y: 'y', symbol: 's', r: 4.5, fill: 's', stroke: 'var(--dv-ring)', strokeWidth: 2 }));
  });

  var svg = P.plot({
    width: w, height: H,
    marginLeft: ml, marginRight: M.right, marginTop: labelled ? M.top : M.topBare, marginBottom: M.bottom,
    style: { background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', overflow: 'visible' },
    x: {
      domain: model.x.domain, nice: model.x.nice, label: model.x.title || null, labelAnchor: 'right', labelOffset: 32, labelArrow: 'none',
      tickSize: 0, tickPadding: 8, ticks: (narrow && model.x.narrow) || model.x.ticks || (narrow ? 5 : 8),
      tickFormat: function (v) { return tickText(v, model.x, model.sep); }
    },
    y: {
      domain: model.y.domain, nice: model.y.nice, label: null, tickSize: 0, tickPadding: 8, ticks: yt || 5,
      tickFormat: function (v) { return tickText(v, model.y, model.sep); }
    },
    /* ordinal, said outright: the series keys are numbers, and a numeric
       domain would make Plot infer a continuous colour scale — which then
       interpolates between two var(--…) strings and paints every line black */
    symbol: { type: 'ordinal', domain: ids, range: model.series.map(function (s) { return s.shape; }) },
    color: { type: 'ordinal', domain: ids, range: model.series.map(function (s) { return ink(s.color); }) },
    marks: marks
  });
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('ch-svg');
  return { svg: svg, height: H, sx: svg.scale('x'), sy: svg.scale('y') };
}

/* A roving-tabindex segmented control (role=tablist) — the modes. */
function segmented(doc, items, label, onChange) {
  var el = doc.createElement('div');
  el.className = 'ch-seg';
  el.setAttribute('role', 'tablist');
  if (label) el.setAttribute('aria-label', label);
  var cur = 0;
  var btns = items.map(function (text, i) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'ch-seg-b';
    b.setAttribute('role', 'tab');
    b.textContent = text;
    b.addEventListener('click', function () { set(i, true); });
    el.appendChild(b);
    return b;
  });
  function paint() {
    btns.forEach(function (b, i) {
      b.classList.toggle('is-on', i === cur);
      b.setAttribute('aria-selected', i === cur ? 'true' : 'false');
      b.tabIndex = i === cur ? 0 : -1;
    });
  }
  function set(i, user) {
    cur = (i + btns.length) % btns.length;
    paint();
    if (user) onChange(cur);
  }
  el.addEventListener('keydown', function (e) {
    var k = e.key, nx = cur;
    if (k === 'ArrowRight' || k === 'ArrowDown') nx = cur + 1;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') nx = cur - 1;
    else if (k === 'Home') nx = 0;
    else if (k === 'End') nx = btns.length - 1;
    else return;
    e.preventDefault();
    set(nx, true);
    btns[cur].focus();
  });
  paint();
  return { el: el, set: function (i) { set(i, false); } };
}

/* Draw `model` into `root` with env.Plot. The no-JS tables already in root
   stay there, visually hidden once the chart is up (class is-drawn), so a
   screen reader keeps every number of every mode. The first frame is drawn
   before anything is swapped: if Plot throws, root is left as it was.
   env: { Plot, labels: { stage, noData, same, hollow, modes }, onResize } */
export function mount(root, model, env) {
  var P = env.Plot, L = env.labels || {};
  var doc = root.ownerDocument, win = doc.defaultView || {};
  var noData = L.noData || '—';
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var modeI = 0, width = 0, chart = null;
  var sel = -1, via = null, flipX = false;
  var timers = [], raf = 0, ro = null, dead = false;

  var wrap = el('div', 'ch');
  var head = el('div', 'ch-head');
  var seg = null;
  if (model.modes.length > 1) {
    seg = segmented(doc, model.modes.map(function (m) { return m.label; }), L.modes || '', function (i) { modeI = i; render(); });
    head.appendChild(seg.el);
  }
  if (model.y.title) {
    var yt = el('span', 'ch-ytitle');
    yt.textContent = model.y.title;
    head.appendChild(yt);
  }
  if (head.firstChild) wrap.appendChild(head);

  var readout = el('div', 'ch-readout', '<span class="ch-r1"></span><span class="ch-r2"></span>');
  readout.setAttribute('aria-hidden', 'true');
  wrap.appendChild(readout);

  var stage = el('div', 'ch-stage');
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', L.stage || '');
  var plotBox = el('div', 'ch-plot');
  var layer = el('div', 'ch-hover', '<span class="ch-x"></span><span class="ch-dots"></span><div class="ch-tip"></div>');
  layer.setAttribute('aria-hidden', 'true');
  stage.appendChild(plotBox);
  stage.appendChild(layer);
  wrap.appendChild(stage);
  var tip = layer.querySelector('.ch-tip');

  var key = el('div', 'ch-key');
  if (model.legend.title) key.appendChild(el('span', 'ch-kh')).textContent = model.legend.title;
  model.series.forEach(function (s) {
    var k = el('span', 'ch-k', mark(s) + '<span></span>' + (s.note ? '<b></b>' : ''));
    k.querySelector('span:not(.ch-mk)').textContent = s.name;
    if (s.note) k.querySelector('b').textContent = s.note;
    key.appendChild(k);
  });
  var notes = el('span', 'ch-notes');
  if (model.legend.hasSame) notes.appendChild(el('span', 'ch-note')).textContent = model.legend.same || L.same || '';
  if (model.legend.hasAlt) {
    var hn = el('span', 'ch-note', mark({ color: 'ink', shape: 'circle' }, true) + '<span></span>');
    hn.lastChild.textContent = model.legend.hollow || L.hollow || '';
    notes.appendChild(hn);
  }
  if (notes.firstChild) key.appendChild(notes);
  wrap.appendChild(key);

  if (model.summary) wrap.appendChild(el('p', 'vh')).textContent = model.summary;
  var live = el('p', 'vh');
  live.setAttribute('aria-live', 'polite');
  wrap.appendChild(live);

  function mode() { return model.modes[modeI] || { rows: [] }; }
  function rows() { return mode().rows; }
  function restI() {
    var rs = rows();
    if (!rs.length) return -1;
    if (model.rest == null) return rs.length - 1;
    var best = 0;
    rs.forEach(function (r, k) { if (Math.abs(r.x - model.rest) < Math.abs(rs[best].x - model.rest)) best = k; });
    return best;
  }

  /* fixed panel columns, in ch, from the widest text any selection can show */
  function sizeTip() {
    var nameW = 0, valW = noData.length, detW = 0;
    model.series.forEach(function (s) { nameW = Math.max(nameW, s.name.length); });
    rows().forEach(function (r) {
      r.cells.forEach(function (c) {
        valW = Math.max(valW, valText(model, c, noData).length);
        detW = Math.max(detW, c.detail.length);
      });
    });
    /* as custom properties, not a template: the stylesheet decides which
       columns a phone keeps */
    tip.style.setProperty('--tn', nameW + 'ch');
    tip.style.setProperty('--tv', valW + 'ch');
    tip.style.setProperty('--td', detW + 'ch');
    tip.classList.toggle('has-detail', detW > 0);
  }

  function paintTip(i) {
    var r = rows()[i];
    tip.innerHTML = '<span class="ch-th">' + esc(xText(model, r.x)) + '</span>' + model.series.map(function (s) {
      var c = r.cells[s.i];
      return '<span class="ch-tr' + (c.kind === 'none' ? ' is-nd' : '') + '">' + mark(s, c.kind === 'alt' || c.kind === 'same') +
        '<span class="ch-tn">' + esc(s.name) + '</span><b>' + esc(valText(model, c, noData)) + '</b>' +
        (tip.classList.contains('has-detail') ? '<span class="ch-td">' + esc(c.detail) + '</span>' : '') + '</span>';
    }).join('');
  }

  function paintReadout() {
    var i = sel >= 0 ? sel : restI();
    readout.classList.toggle('is-rest', sel < 0);
    var r = rows()[i];
    var r1 = readout.querySelector('.ch-r1'), r2 = readout.querySelector('.ch-r2');
    if (!r) { r1.innerHTML = ''; r2.innerHTML = ''; return; }
    r1.innerHTML = '<b>' + esc(xText(model, r.x)) + '</b>' + model.series.map(function (s) {
      var c = r.cells[s.i];
      return '<span class="ch-rv' + (c.kind === 'none' ? ' is-nd' : '') + '">' + mark(s, c.kind === 'alt' || c.kind === 'same') + esc(valText(model, c, noData)) + '</span>';
    }).join('');
    /* details only where there is room for a second line of them; the class
       depends on the width alone, so the reserved height never changes */
    var any = r.cells.some(function (c) { return c.detail; });
    var wide = readout.clientWidth >= WIDE && rows().some(function (rr) { return rr.cells.some(function (c) { return c.detail; }); });
    readout.classList.toggle('is-wide', wide);
    r2.innerHTML = wide && any ? model.series.map(function (s) {
      var c = r.cells[s.i];
      return c.detail ? '<span class="ch-rv">' + mark(s) + esc(c.detail) + '</span>' : '';
    }).join('') : '';
  }

  function paintCross(i) {
    var r = rows()[i];
    var X = chart.sx.apply(r.x);
    var yr = chart.sy.range;
    var rule = layer.querySelector('.ch-x');
    rule.style.transform = 'translateX(' + X + 'px)';
    rule.style.top = Math.min(yr[0], yr[1]) + 'px';
    rule.style.height = Math.abs(yr[0] - yr[1]) + 'px';
    var n = model.series.length;
    layer.querySelector('.ch-dots').innerHTML = model.series.map(function (s) {
      var c = r.cells[s.i];
      if (c.v == null) return '';
      var dx = c.kind === 'same' ? (s.i - (n - 1) / 2) * DODGE : 0;
      return '<i class="ch-ring" style="transform:translate(' + (X + dx) + 'px,' + chart.sy.apply(c.v) + 'px)"></i>';
    }).join('');
  }

  /* the panel: diagonal to the anchor, flips with hysteresis */
  function place(ax, ay) {
    var tw = tip.offsetWidth, th = tip.offsetHeight, hh = chart.height;
    if (!flipX && ax + OFF + tw > width) flipX = true;
    else if (flipX && ax + OFF + tw + SPARE <= width) flipX = false;
    var left = flipX ? ax - OFF - tw : ax + OFF;
    var top = ay + OFF;
    if (top + th > hh - M.bottom) top = ay - OFF - th;
    left = Math.max(0, Math.min(width - tw, left));
    top = Math.max(0, Math.min(hh - th, top));
    tip.style.transform = 'translate(' + Math.round(left) + 'px,' + Math.round(top) + 'px)';
  }

  function select(i, how) {
    var snapped = i !== sel || how !== via;
    sel = i; via = how;
    layer.classList.add('is-on');
    layer.classList.toggle('is-touch', how === 'touch');
    if (snapped) {
      paintCross(i);
      if (how !== 'touch') paintTip(i);
    }
    paintReadout();
  }
  function unselect() {
    sel = -1; via = null; flipX = false;
    layer.classList.remove('is-on');
    paintReadout();
  }

  function nearest(clientX) {
    var b = plotBox.getBoundingClientRect(), px = clientX - b.left;
    var rs = rows(), best = 0;
    rs.forEach(function (r, k) {
      if (Math.abs(chart.sx.apply(r.x) - px) < Math.abs(chart.sx.apply(rs[best].x) - px)) best = k;
    });
    return best;
  }

  /* pointer: mouse/pen follow, touch selects and scrubs */
  var leaveT = 0, scrubbing = false;
  function later(fn, ms) { var t = (win.setTimeout || setTimeout)(fn, ms); timers.push(t); return t; }
  function cancel(t) { (win.clearTimeout || clearTimeout)(t); }
  function onMove(e) {
    if (!rows().length) return;
    if (e.pointerType === 'touch') {
      if (scrubbing) select(nearest(e.clientX), 'touch');
      return;
    }
    cancel(leaveT);
    select(nearest(e.clientX), 'mouse');
    var b = stage.getBoundingClientRect();
    place(e.clientX - b.left, e.clientY - b.top);
  }
  plotBox.addEventListener('pointermove', onMove);
  plotBox.addEventListener('pointerdown', function (e) {
    if (!rows().length) return;
    if (e.pointerType === 'touch') {
      scrubbing = true;
      wrap.classList.add('is-touched');
      select(nearest(e.clientX), 'touch');
    } else onMove(e);
  });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    plotBox.addEventListener(t, function (e) { if (e.pointerType === 'touch') scrubbing = false; });
  });
  plotBox.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'touch' || via !== 'mouse') return;
    cancel(leaveT);
    leaveT = later(unselect, HIDE);
  });
  function onDocDown(e) { if (!stage.contains(e.target) && sel >= 0) unselect(); }
  function onDocKey(e) { if (e.key === 'Escape' && sel >= 0) unselect(); }
  doc.addEventListener('pointerdown', onDocDown);
  doc.addEventListener('keydown', onDocKey);

  /* keyboard */
  function keySelect(i, announce) {
    select(i, 'key');
    var yr = chart.sy.range;
    place(chart.sx.apply(rows()[i].x), Math.min(yr[0], yr[1]) - OFF);
    if (announce) {
      var r = rows()[i];
      live.textContent = xText(model, r.x) + ': ' + model.series.map(function (s) {
        return s.name + ' ' + valText(model, r.cells[s.i], noData);
      }).join(', ');
    }
  }
  /* only a keyboard focus opens the panel: a click or a tap focuses the
     stage too, and must not turn into keyboard mode */
  stage.addEventListener('focus', function () {
    if (!rows().length) return;
    var kb = true;
    try { kb = stage.matches(':focus-visible'); } catch (e) { /* old engines: assume keyboard */ }
    if (kb && via !== 'mouse' && via !== 'touch') keySelect(sel >= 0 ? sel : restI(), false);
  });
  stage.addEventListener('blur', function () { if (via === 'key') unselect(); });
  stage.addEventListener('keydown', function (e) {
    var last = rows().length - 1;
    if (last < 0) return;
    var i = sel >= 0 ? sel : restI();
    if (e.key === 'ArrowRight') i = Math.min(last, i + 1);
    else if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = last;
    else return;
    e.preventDefault();
    keySelect(i, true);
  });

  function draw(w) {
    var c = plotChart(P, model, mode(), w);
    plotBox.innerHTML = '';
    plotBox.appendChild(c.svg);
    plotBox.style.minHeight = c.height + 'px';
    chart = c;
  }

  function render() {
    if (dead) return;
    width = stage.clientWidth || width;
    draw(width);
    sizeTip();
    if (sel >= 0 && sel < rows().length) {
      var i = sel, how = via;
      sel = -1;
      if (how === 'key') keySelect(i, false); else select(i, how);
    } else if (sel >= 0) unselect();
    paintReadout();
    if (typeof env.onResize === 'function') env.onResize();
  }

  /* first frame off-DOM, at the root's content width */
  var cs = win.getComputedStyle ? win.getComputedStyle(root) : null;
  width = Math.round(root.clientWidth - (cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0));
  if (!(width > 0)) width = 600;
  draw(width);
  sizeTip();
  root.insertBefore(wrap, root.firstChild);
  root.classList.add('is-drawn');
  paintReadout();

  /* re-render on a width change only (the height is ours), one per frame */
  if (typeof win.ResizeObserver === 'function') {
    var lastW = width;
    ro = new win.ResizeObserver(function (en) {
      var nw = Math.round(en[0].contentRect.width);
      if (!nw || nw === lastW) return;
      lastW = nw;
      (win.cancelAnimationFrame || function () {})(raf);
      raf = (win.requestAnimationFrame || function (f) { return later(f, 16); })(function () {
        try { render(); } catch (e) { if (win.console) win.console.error('chart resize failed:', e); }
      });
    });
    ro.observe(stage);
  }

  return {
    redraw: render,
    /* test seam and host control: a mode, and a point index (null clears) */
    select: function (m, i) {
      if (m != null && m !== modeI && model.modes[m]) { modeI = m; if (seg) seg.set(m); render(); }
      if (i == null) unselect(); else if (rows()[i]) keySelect(i, false);
    },
    destroy: function () {
      dead = true;
      if (ro) ro.disconnect();
      (win.cancelAnimationFrame || function () {})(raf);
      timers.forEach(cancel);
      doc.removeEventListener('pointerdown', onDocDown);
      doc.removeEventListener('keydown', onDocKey);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      root.classList.remove('is-drawn');
    }
  };
}

/* ─────────────────── self-test (scripts/check-charts.mjs) ─────────────────── */

export function selfTest(cases) {
  var bad = [];
  function eq(what, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(what + ': got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
  }
  var t = parseTable('| Size | A | B |\n|--:|--:|--:|\n| 8 | 1,5 | *2* |\n| 16 | ~ | |\n| 24 | 3 \\| x | 4 *d* |');
  eq('parseTable head', t.head, ['Size', 'A', 'B']);
  eq('parseTable body', t.body, [['8', '1,5', '*2*'], ['16', '~', ''], ['24', '3 | x', '4 *d*']]);

  var m = normalize({ lang: 'ru', num: { dec: ',', group: ' ' }, table: '| **Size** | A | B |\n|---|---|---|\n| 16 | ~ | 2 |\n| 8 | 1,5 | *2* |\n| 24 | 3 | 4 *d* |' });
  eq('normalize x title', m.x.title, 'Size');
  eq('normalize names', m.series.map(function (s) { return s.name; }), ['A', 'B']);
  eq('normalize order', m.modes[0].rows.map(function (r) { return r.x; }), [8, 16, 24]);
  eq('normalize digits', [m.x.digits, m.y.digits], [0, 1]);
  eq('normalize legend flags', [m.legend.hasSame, m.legend.hasAlt], [true, true]);
  var g = geometry(m, m.modes[0]);
  /* A: 1,5 → ~ (dashed) → 3 (dashed); B: *2* breaks, 2 → 4 solid */
  eq('chains', g.segs.map(function (d) { return [d.s, d.x1, d.x2, d.dashed]; }), [[0, 8, 16, true], [0, 16, 24, true], [1, 16, 24, false]]);
  eq('alts', g.alts.map(function (d) { return [d.s, d.x, d.y]; }), [[1, 8, 2]]);

  var y = normalize({ modes: [{ label: 'a', rows: [[1, 2]] }, { label: 'b', rows: [[1, 'x']] }], series: [{ name: 'S', color: 'nope', shape: 'star' }] });
  eq('modes', y.modes.map(function (md) { return md.label; }), ['a', 'b']);
  eq('series defaults', [y.series[0].color, y.series[0].shape], ['blue', 'star']);
  eq('bad cell warns', y.warn.length, 1);

  (cases && cases.cells || []).forEach(function (c) {
    var r = normalize({ rows: [[1, c.in]], series: [{ name: 's' }] }).modes[0].rows[0].cells[0];
    eq('model cell ' + JSON.stringify(c.in), [r.kind, r.v, r.detail], [c.kind, c.v, c.detail]);
  });
  return bad;
}
