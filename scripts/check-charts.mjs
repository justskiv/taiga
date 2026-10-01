#!/usr/bin/env node
/* The data-figure grammar check: every vector of assets/js/charts/cases.json
   through both implementations of it —
     · the JS one (assets/js/charts/fmt.js, core.js), which the chart runtime
       and — as a byte copy — the Obsidian plugin use;
     · the Hugo one (layouts/_partials/data/{num,fmt,cell,cell-text}.html),
       which prints the no-JS tables: a throwaway site on this theme renders
       the vectors through those partials, in both languages.
   One meaning, so both must print the same thing.

   Usage: node scripts/check-charts.mjs            (from anywhere; no deps)
          node scripts/check-charts.mjs --no-hugo  (the JS half only) */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets/js/charts');
const cases = JSON.parse(readFileSync(join(dir, 'cases.json'), 'utf8'));
const F = await import(pathToFileURL(join(dir, 'fmt.js')).href);

/* the separators the theme's i18n gives each language (num_decimal / num_group) */
const SEP = { ru: { dec: ',', group: ' ' }, en: { dec: '.', group: ',' } };

const bad = [];
const eq = (what, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

for (const c of cases.num) eq(`num(${JSON.stringify(c.in)})`, F.num(c.in), c.out);
for (const c of cases.fmt) eq(`fmt(${c.v}, ${c.d}, ${c.lang})`, F.fmt(c.v, c.d, SEP[c.lang]), c.out);
for (const c of cases.digits) eq(`digitsOf(${JSON.stringify(c.in)})`, F.digitsOf(c.in), c.out);
for (const c of cases.cells) {
  const got = F.cell(c.in);
  eq(`cell(${JSON.stringify(c.in)})`, [got.kind, got.v, got.detail, !!got.bad], [c.kind, c.v, c.detail, !!c.bad]);
}
for (const t of cases.table) {
  for (const r of t.rows) {
    const c = F.cell(r.in);
    const text = c.kind === 'same' ? '~' : c.kind === 'none' ? '—' : F.fmt(c.v, t.digits, SEP[t.lang]);
    eq(`table(${JSON.stringify(r.in)})`, [text, c.kind === 'alt', c.detail], [r.text, r.alt, r.detail]);
  }
}
/* the page's own fallback must agree with the i18n values above */
for (const lang of Object.keys(SEP)) eq(`sepFor(${lang})`, F.sepFor(lang), SEP[lang]);

if (existsSync(join(dir, 'core.js'))) {
  const C = await import(pathToFileURL(join(dir, 'core.js')).href);
  if (typeof C.selfTest === 'function') for (const e of C.selfTest(cases)) bad.push(`core: ${e}`);
}

/* ── the series glyphs: charts/core.js draws them in the key; the bars tabs
   (modules/barstabs.js) and {{< mk >}} in the text (31-data.css, as mask
   data URIs) carry copies. One series, one glyph wherever it is shown. ── */
{
  const glyphs = (src) => {
    const out = {};
    const block = /GLYPH = \{([\s\S]*?)\n\};/.exec(src);
    if (block) for (const m of block[1].matchAll(/(\w+): '([^']*)'/g)) out[m[1]] = m[2];
    return out;
  };
  const shapes = (src) => JSON.parse((/SHAPES = (\[[^\]]*\])/.exec(src)?.[1] ?? '[]').replace(/'/g, '"'));
  const coreSrc = readFileSync(join(dir, 'core.js'), 'utf8');
  const core = glyphs(coreSrc);
  const tabsFile = join(root, 'assets/js/modules/barstabs.js');
  if (existsSync(tabsFile)) {
    const tabsSrc = readFileSync(tabsFile, 'utf8');
    eq('barstabs.js SHAPES', shapes(tabsSrc), shapes(coreSrc));
    eq('barstabs.js GLYPH', glyphs(tabsSrc), core);
  }
  const css = readFileSync(join(root, 'assets/css/31-data.css'), 'utf8');
  const masks = {};
  for (const m of css.matchAll(/\.mk-(\w+)\{--mk-s:url\("data:image\/svg\+xml,([^"]*)"\)\}/g)) {
    const svg = decodeURIComponent(m[2]).replace(/'/g, '"');
    masks[m[1]] = /viewBox="0 0 10 10">(.*)<\/svg>$/.exec(svg)?.[1] ?? svg;
  }
  eq('31-data.css .mk-* masks', masks, core);
}

/* ── the Hugo half ── */
const HUGO_PAGE = `{{- $c := resources.Get "js/charts/cases.json" | transform.Unmarshal -}}
{{- $lang := .Language.Lang -}}
{{- $num := slice -}}
{{- range $c.num -}}
  {{- $e := dict "in" .in -}}
  {{- with partial "data/num.html" .in }}{{ $e = merge $e (dict "out" .v) }}{{ end -}}
  {{- $num = $num | append $e -}}
{{- end -}}
{{- $fmt := slice -}}
{{- range $c.fmt }}{{ if eq .lang $lang }}{{ $fmt = $fmt | append (dict "v" .v "d" .d "out" (partial "data/fmt.html" (dict "v" .v "d" .d))) }}{{ end }}{{ end -}}
{{- $cells := slice -}}
{{- range $c.cells }}{{ $r := partial "data/cell.html" .in }}{{ $cells = $cells | append (dict "in" .in "kind" $r.kind "v" $r.v "detail" $r.detail "bad" $r.bad) }}{{ end -}}
{{- $table := slice -}}
{{- range $c.table -}}{{- if eq .lang $lang -}}{{- $d := .digits -}}
  {{- range .rows }}{{ $r := partial "data/cell.html" .in }}{{ $table = $table | append (dict "in" .in "text" (partial "data/cell-text.html" (dict "c" $r "d" $d)) "alt" (eq $r.kind "alt") "detail" $r.detail) }}{{ end -}}
{{- end -}}{{- end -}}
{{- dict "lang" $lang "num" $num "fmt" $fmt "cells" $cells "table" $table | jsonify -}}
`;

function hugoHalf() {
  const probe = spawnSync('hugo', ['version'], { encoding: 'utf8' });
  if (probe.error) { console.warn('check-charts: hugo not found — the Hugo half is skipped'); return; }
  const site = mkdtempSync(join(tmpdir(), 'taiga-charts-'));
  try {
    writeFileSync(join(site, 'hugo.toml'), [
      'baseURL = "/"', `theme = "${basename(root)}"`, 'defaultContentLanguage = "en"',
      'disableKinds = ["home", "section", "taxonomy", "term", "rss", "sitemap", "robotsTXT", "404"]',
      '[languages.en]', 'weight = 1', '[languages.ru]', 'weight = 2', ''
    ].join('\n'));
    mkdirSync(join(site, 'content'));
    writeFileSync(join(site, 'content', 'cases.md'), '---\ntitle: cases\n---\n');
    writeFileSync(join(site, 'content', 'cases.ru.md'), '---\ntitle: cases\n---\n');
    mkdirSync(join(site, 'layouts'));
    writeFileSync(join(site, 'layouts', 'page.html'), HUGO_PAGE);
    const out = join(site, 'public');
    const r = spawnSync('hugo', ['--logLevel', 'error', '-s', site, '--themesDir', dirname(root), '-d', out], { encoding: 'utf8' });
    if (r.status !== 0) { bad.push('hugo: ' + (r.stderr + r.stdout).trim()); return; }
    for (const [lang, file] of [['en', 'cases/index.html'], ['ru', 'ru/cases/index.html']]) {
      const got = JSON.parse(readFileSync(join(out, file), 'utf8'));
      for (const [i, c] of cases.num.entries()) eq(`hugo ${lang} num(${JSON.stringify(c.in)})`, got.num[i].out ?? null, c.out);
      const fm = cases.fmt.filter((c) => c.lang === lang);
      for (const [i, c] of fm.entries()) eq(`hugo fmt(${c.v}, ${c.d}, ${lang})`, got.fmt[i].out, c.out);
      for (const [i, c] of cases.cells.entries()) {
        const g = got.cells[i];
        eq(`hugo ${lang} cell(${JSON.stringify(c.in)})`, [g.kind, g.v, g.detail, !!g.bad], [c.kind, c.v, c.detail, !!c.bad]);
      }
      const tr = cases.table.filter((t) => t.lang === lang).flatMap((t) => t.rows);
      for (const [i, r] of tr.entries()) {
        const g = got.table[i];
        eq(`hugo table(${JSON.stringify(r.in)})`, [g.text, g.alt, g.detail], [r.text, r.alt, r.detail]);
      }
    }
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
}
if (!process.argv.includes('--no-hugo')) hugoHalf();

if (bad.length) {
  console.error(`check-charts: ${bad.length} mismatch(es)\n  ` + bad.join('\n  '));
  process.exit(1);
}
console.log('check-charts: ok');
