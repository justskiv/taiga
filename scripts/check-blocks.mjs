#!/usr/bin/env node
/* The block-schema check: data/blocks/*.yaml against the schema format, the
   shared vocabulary of data/blocks/_common.yaml, and the templates the
   schemas describe.

   The YAML is parsed by Hugo itself — a throwaway site on this theme prints
   site.Data.blocks as JSON — so the schemas are read exactly as the build
   reads them, with no parser of our own and no dependencies. Parsing IS the
   check: without hugo the script fails instead of passing.

   A second throwaway build renders every insert template, {cursor} dropped,
   through the theme's own shortcodes and render hooks: an insert that warns
   or fails there would put a broken block into the author's note.

   Rules (numbered as the block contract numbers them):
     1  every layouts/_shortcodes/*.html has a schema or an entry in EXCEPT;
        the alerts render-blockquote.html knows = the `syntax: alert` schemas
     2  every .Get of a shortcode with a schema is a param or an accepted
        role of it, and every one of those is read; for an alert, a marker
        parameter ⇔ the hook prints the marker line
     3  `set`s exist; `default: {i18n: …}` keys exist in both languages;
        excludes / requires / when name existing params
     4  variations: match and set name params, set holds no common roles,
        contradicts no `excludes`, and makes its own match true
     5  body.keys at most two levels deep; limits from the closed vocabulary
     6  body.adapter ∈ bars | chart; keys beside kind: table only with chart
     7  the cap role accepted ⇔ a frame declared; frame.default resolves
     8  param names: kebab-case, not a role (but `id` on widget), not tgc-*,
        not tip / tip-*
   plus the format itself: root fields, closed value sets, {ru, en} labels,
   defaults written as the source writes them, exactly one {cursor} per
   insert, docs anchors that exist in docs/ and docs/ru/.

   Usage: node scripts/check-blocks.mjs          (from anywhere; needs hugo)
          node scripts/check-blocks.mjs <root>   (another copy of the theme)
   Exit:  0 clean · 1 problems · 2 hugo missing */
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['ru', 'en'];

/* Theme shortcodes without a schema yet, each with its reason. An entry that
   names no template, or a template that has a schema too, is a problem. */
const EXCEPT = {
  mk: 'wave 2, figures: a series glyph',
  bigcard: 'wave 4, service', roadmap: 'wave 4, service',
  newsletter: 'wave 4, service', 'newsletter-archive': 'wave 4, service', 'newsletter-cta': 'wave 4, service',
  'newsletter-inline': 'wave 4, service', 'newsletter-letter-example': 'wave 4, service',
};

/* the closed sets of the format */
const SYNTAX = ['shortcode', 'alert', 'quote'];
const SHAPES = ['block', 'void', 'inline'];
const CLASSES = ['figure', 'voice', 'box', 'code', 'inline', 'service'];
const TYPES = ['string', 'inline-md', 'number', 'bool', 'enum', 'color', 'list', 'resource', 'md'];
const TYPE_FIELDS = {
  string: ['pattern'], 'inline-md': [], number: ['min', 'max', 'integer', 'exclusiveMin'], bool: [],
  enum: ['values', 'labels', 'colors'], color: ['set'], list: ['of', 'len', 'min', 'max'],
  resource: ['glob', 'lang'], md: [],
};
const ALL_TYPE_FIELDS = new Set(Object.values(TYPE_FIELDS).flat());
const PARAM_KEYS = ['type', 'label', 'hint', 'default', 'required', 'tier', 'group', 'at', 'when', 'excludes', 'requires', 'ui', 'unit', 'deprecated'];
const ROLE_KEYS = ['type', 'label', 'hint', 'default', 'at', 'ui', 'unit', 'deprecated'];
const TIERS = ['main', 'more'];
const AT = ['attr', 'positional', 'marker'];
const ROLE_AT = ['attr', 'attrs-line'];
const UI = ['segments', 'swatches', 'rows', 'slots', 'textarea', 'widget'];
const KINDS = ['none', 'markdown', 'text', 'html', 'table', 'list', 'yaml'];
const BODY_KEYS = {
  none: [], markdown: [], text: [], html: [], list: ['item', 'tight'],
  table: ['adapter', 'columns', 'header', 'rows', 'blankLines', 'keys', 'oneOf'], yaml: ['adapter', 'keys', 'oneOf'],
};
const GRAMMARS = ['text', 'number', 'name-sub', 'short-long', 'value-note', 'value-detail', 'stat-item'];
const ADAPTERS = ['bars', 'chart'];
const LIMITS = ['items', 'valueColumns', 'valueColumnsWhen', 'perSection'];
const POLICIES = ['cap', 'always', 'bare'];
const ROOT_KEYS = ['v', 'name', 'syntax', 'shape', 'depth', 'class', 'title', 'summary', 'icon', 'keywords', 'docs',
  'common', 'frame', 'groups', 'params', 'body', 'variations', 'insert', 'limits', 'manifest'];
const COMMON_KEYS = ['v', 'roles', 'sets', 'classes'];
const KEBAB = /^[a-z][a-z0-9-]*$/;

const problems = [];
const bad = (file, msg) => problems.push(`${file}: ${msg}`);
const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const read = (p) => readFileSync(join(root, p), 'utf8');
const stripComments = (s) => s.replace(/\{\{-?\s*\/\*[\s\S]*?\*\/\s*-?\}\}/g, '');
const setEq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const list = (s) => [...s].sort().join(' ') || '(none)';

/* ── Hugo: parse the schemas and the i18n tables, render the inserts ── */

function build(files) {
  const site = mkdtempSync(join(tmpdir(), 'taiga-blocks-'));
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(site, p)), { recursive: true });
    writeFileSync(join(site, p), body);
  }
  const r = spawnSync('hugo', ['--logLevel', 'warn', '-s', site, '--themesDir', dirname(root), '-d', join(site, 'public')], { encoding: 'utf8' });
  const out = (r.stdout + r.stderr).replaceAll(`${site}/`, '');
  const logs = out.split('\n').filter((l) => /^(WARN|ERROR)\b/.test(l)).map((l) => l.replace(/^(WARN|ERROR)\s+/, '$1 '));
  return { site, ok: r.status === 0, logs, raw: out.trim() };
}

const config = (kinds, outputs) => [
  'baseURL = "/"', `theme = "${basename(root)}"`, 'defaultContentLanguage = "en"',
  `disableKinds = [${kinds.map((k) => `"${k}"`).join(', ')}]`, '[outputs]', outputs, '',
].join('\n');

function parse() {
  const files = {
    'hugo.toml': config(['page', 'section', 'taxonomy', 'term', 'rss', 'sitemap', 'robotsTXT', '404'], 'home = ["html"]'),
    'layouts/home.html': '{{- dict "blocks" site.Data.blocks "i18n" site.Data.taigai18n | jsonify -}}\n',
  };
  for (const l of LANGS) {
    const p = join(root, 'i18n', `${l}.toml`);
    if (existsSync(p)) files[`data/taigai18n/${l}.toml`] = readFileSync(p, 'utf8');
    else bad(`i18n/${l}.toml`, 'missing — i18n defaults cannot be checked');
  }
  const b = build(files);
  try {
    if (!b.ok) { bad('hugo', b.logs.join('\n  ') || b.raw); return null; }
    for (const l of b.logs) bad('hugo', l);
    return JSON.parse(readFileSync(join(b.site, 'public', 'index.html'), 'utf8'));
  } finally {
    rmSync(b.site, { recursive: true, force: true });
  }
}

/* Every insert, {cursor} dropped, on a page of its own; the page body is just
   .Content, so what warns is the block itself. */
function render(schemas) {
  const pages = [];
  for (const [name, s] of Object.entries(schemas)) {
    if (typeof s.insert === 'string') pages.push({ slug: name, name, s, text: s.insert });
    for (const v of Array.isArray(s.variations) ? s.variations : []) {
      if (isMap(v) && typeof v.insert === 'string' && isStr(v.id)) pages.push({ slug: `${name}--${v.id}`, name, s, text: v.insert });
    }
  }
  if (!pages.length) return;
  /* run with a sandbox= fails the build on a site that names no codapi server:
     that is the site's setting, not the block's, so the inserts render as on a
     site that has one. Nothing is fetched at build time. */
  const files = {
    'hugo.toml': config(['home', 'section', 'taxonomy', 'term', 'rss', 'sitemap', 'robotsTXT', '404'], 'page = ["html"]')
      + '[params.codapi]\nurl = "https://codapi.invalid/v1"\n',
    'layouts/page.html': '{{ .Content }}\n',
  };
  for (const p of pages) files[`content/${p.slug}.md`] = `---\ntitle: ${p.slug}\n---\n\n${p.text.replaceAll('{cursor}', '')}`;
  const b = build(files);
  try {
    /* a message names its page by path; the longest slug that fits wins */
    const bySlug = [...pages].sort((a, b) => b.slug.length - a.slug.length);
    const owner = (msg) => bySlug.find((p) => new RegExp(`/${p.slug}(\\.md|[\\s):"]|$)`).test(msg));
    const what = (p) => (p.slug === p.name ? 'insert' : `insert of variation ${p.slug.split('--')[1]}`);
    for (const l of b.logs) {
      const p = owner(l);
      if (p) bad(`data/blocks/${p.name}.yaml`, `${what(p)} renders with ${l}`);
      else bad('inserts', l);
    }
    if (!b.ok) { if (!b.logs.length) bad('inserts', b.raw); return; }
    /* and it renders as the block it inserts */
    for (const p of pages) {
      const where = `data/blocks/${p.name}.yaml`;
      const f = join(b.site, 'public', p.slug, 'index.html');
      if (!existsSync(f)) { bad(where, `${what(p)}: no page rendered`); continue; }
      const html = readFileSync(f, 'utf8');
      const thesis = html.includes('class="thesis');
      const as = p.s.syntax === 'alert' ? html.includes(`class="${p.name}`)
        : p.s.syntax === 'quote' && p.s.depth === 2 ? thesis
        : p.s.syntax === 'quote' ? html.includes('<blockquote') && !thesis
        : true;
      if (!as) bad(where, `${what(p)} does not render as ${p.name}`);
    }
  } finally {
    rmSync(b.site, { recursive: true, force: true });
  }
}

/* ── the format ── */

function checkLabel(file, where, v, required = true) {
  if (v === undefined) { if (required) bad(file, `${where}: missing, want {ru, en}`); return; }
  if (!isMap(v)) { bad(file, `${where}: want a {ru, en} map`); return; }
  for (const l of LANGS) if (!isStr(v[l])) bad(file, `${where}.${l}: missing or empty`);
  for (const [k, x] of Object.entries(v)) {
    if (!LANGS.includes(k)) bad(file, `${where}: unexpected key "${k}"${x === null ? ' — an unquoted comma splits a flow map; quote the value' : ''}`);
  }
}

const num = (s) => {
  const t = String(s).replace(/\s/g, '').replace('−', '-').replace(',', '.');   /* \s covers NBSP and NNBSP */
  return t !== '' && Number.isFinite(Number(t)) ? Number(t) : null;
};

/* A literal value in source notation, as the author writes it in the marker. */
function checkLiteral(file, where, p, value, cx) {
  if (typeof value !== 'string') { bad(file, `${where}: write it as the source does — a string, not ${JSON.stringify(value)}`); return; }
  switch (p.type) {
    case 'bool':
      if (value !== 'true') bad(file, `${where}: a bool is written "true" or left out, not ${JSON.stringify(value)}`);
      break;
    case 'enum':
      if (Array.isArray(p.values) && !p.values.includes(value)) bad(file, `${where}: "${value}" is not one of ${p.values.join(' ')}`);
      break;
    case 'color': {
      const set = cx.sets[p.set];
      if (Array.isArray(set) && !set.includes(value)) bad(file, `${where}: "${value}" is not in the ${p.set} set`);
      break;
    }
    case 'number': {
      const v = num(value);
      if (v === null) { bad(file, `${where}: "${value}" is not a number`); break; }
      if (p.integer && !Number.isInteger(v)) bad(file, `${where}: "${value}" is not an integer`);
      if (typeof p.min === 'number' && v < p.min) bad(file, `${where}: "${value}" is below min ${p.min}`);
      if (typeof p.max === 'number' && v > p.max) bad(file, `${where}: "${value}" is above max ${p.max}`);
      if (typeof p.exclusiveMin === 'number' && v <= p.exclusiveMin) bad(file, `${where}: "${value}" is not above ${p.exclusiveMin}`);
      break;
    }
    case 'string':
      if (isStr(p.pattern)) { try { if (!new RegExp(p.pattern).test(value)) bad(file, `${where}: "${value}" does not match ${p.pattern}`); } catch { /* reported by checkParam */ } }
      break;
    case 'list': {
      const items = value.split(' ').filter(Boolean);
      if (typeof p.len === 'number' && items.length !== p.len) bad(file, `${where}: ${items.length} items, want ${p.len}`);
      if (isMap(p.of)) for (const it of items) checkLiteral(file, where, p.of, it, cx);
      break;
    }
  }
}

function checkI18n(file, where, key, cx, params) {
  if (!isStr(key)) { bad(file, `${where}: want an i18n key`); return; }
  const subs = [...key.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
  let keys = [key];
  if (subs.length > 1) { bad(file, `${where}: one {param} in a key at most`); return; }
  if (subs.length === 1) {
    const ref = params && params[subs[0]];
    if (!isMap(ref) || ref.type !== 'enum' || !Array.isArray(ref.values)) { bad(file, `${where}: {${subs[0]}} must name an enum param of this block`); return; }
    keys = ref.values.map((v) => key.replace(`{${subs[0]}}`, v));
  }
  for (const k of keys) for (const l of LANGS) {
    if (cx.i18n[l] && !(k in cx.i18n[l])) bad(file, `${where}: i18n key "${k}" is missing from i18n/${l}.toml`);
  }
}

function checkDefault(file, where, p, cx, params) {
  const d = p.default;
  if (d === undefined) return;
  if (p.required === true) bad(file, `${where}: a required param has nothing to default to`);
  if (p.type === 'bool') { bad(file, `${where}: a bool is false when left out and takes no default`); return; }
  if (isMap(d)) {
    const k = Object.keys(d);
    if (k.length !== 1 || !['i18n', 'auto'].includes(k[0])) bad(file, `${where}: want a literal, {i18n: key} or {auto: {ru, en}}`);
    else if (k[0] === 'i18n') checkI18n(file, `${where}.i18n`, d.i18n, cx, params);
    else checkLabel(file, `${where}.auto`, d.auto);
    return;
  }
  checkLiteral(file, where, p, d, cx);
}

/* one parameter or role; x = { role, file, names, groups, params, syntax } */
function checkParam(where, name, p, cx, x) {
  const { file } = x;
  if (!isMap(p)) { bad(file, `${where}: want a map`); return; }
  const own = x.role ? ROLE_KEYS : PARAM_KEYS;
  for (const k of Object.keys(p)) if (!own.includes(k) && !ALL_TYPE_FIELDS.has(k)) bad(file, `${where}: unknown field "${k}"`);
  if (!TYPES.includes(p.type)) { bad(file, `${where}.type: "${p.type}" is not one of ${TYPES.join(' ')}`); return; }
  if (p.type === 'md') bad(file, `${where}: type md is for a markdown body, not a parameter`);
  for (const k of Object.keys(p)) if (ALL_TYPE_FIELDS.has(k) && !TYPE_FIELDS[p.type].includes(k)) bad(file, `${where}.${k}: not a field of type ${p.type}`);
  checkLabel(file, `${where}.label`, p.label);
  if ('hint' in p) checkLabel(file, `${where}.hint`, p.hint);
  if ('unit' in p) checkLabel(file, `${where}.unit`, p.unit);
  if ('required' in p && p.required !== true) bad(file, `${where}.required: only true, or leave it out`);
  if ('deprecated' in p && p.deprecated !== true) bad(file, `${where}.deprecated: only true, or leave it out`);
  if ('tier' in p && !TIERS.includes(p.tier)) bad(file, `${where}.tier: "${p.tier}" is not one of ${TIERS.join(' ')}`);
  if ('group' in p && !(isMap(x.groups) && p.group in x.groups)) bad(file, `${where}.group: "${p.group}" is not declared in groups`);
  if ('at' in p && !(x.role ? ROLE_AT : AT).includes(p.at)) bad(file, `${where}.at: "${p.at}" is not one of ${(x.role ? ROLE_AT : AT).join(' ')}`);
  if ('ui' in p) {
    if (!UI.includes(p.ui)) bad(file, `${where}.ui: "${p.ui}" is not one of ${UI.join(' ')}`);
    const colorish = p.type === 'color' || (p.type === 'enum' && isMap(p.colors)) || (p.type === 'list' && isMap(p.of) && p.of.type === 'color');
    if (p.ui === 'swatches' && !colorish) bad(file, `${where}.ui: swatches need colours — a color, a list of colors or an enum with colors`);
    if (p.ui === 'segments' && p.type !== 'enum') bad(file, `${where}.ui: segments are for an enum`);
    if (p.ui === 'rows' && p.type !== 'list') bad(file, `${where}.ui: rows are for a list`);
  }
  /* rule 3: references to other params */
  const ref = (what, n) => {
    if (n === name) bad(file, `${where}.${what}: names the param itself`);
    else if (!x.names.has(n)) bad(file, `${where}.${what}: "${n}" is not a param or an accepted role of this block`);
  };
  for (const f of ['excludes', 'requires']) {
    if (!(f in p)) continue;
    if (!Array.isArray(p[f]) || !p[f].length) { bad(file, `${where}.${f}: want a list of names`); continue; }
    for (const n of p[f]) ref(f, n);
  }
  if ('when' in p) {
    const w = p.when;
    if (!isMap(w) || Object.keys(w).some((k) => !['param', 'is'].includes(k)) || !isStr(w.is)) bad(file, `${where}.when: want {param: <name>, is: absent | present | "<value>"}`);
    else ref('when', w.param);
  }
  /* the type's own fields */
  switch (p.type) {
    case 'string':
      if ('pattern' in p) { try { new RegExp(p.pattern); } catch (e) { bad(file, `${where}.pattern: ${e.message}`); } }
      break;
    case 'number':
      for (const f of ['min', 'max', 'exclusiveMin']) if (f in p && typeof p[f] !== 'number') bad(file, `${where}.${f}: want a number`);
      if ('integer' in p && p.integer !== true) bad(file, `${where}.integer: only true, or leave it out`);
      if (typeof p.min === 'number' && typeof p.max === 'number' && p.min > p.max) bad(file, `${where}: min is above max`);
      break;
    case 'enum': {
      const vs = p.values;
      if (!Array.isArray(vs) || !vs.length || vs.some((v) => !isStr(v))) { bad(file, `${where}.values: want a list of strings`); break; }
      if (new Set(vs).size !== vs.length) bad(file, `${where}.values: duplicates`);
      if ('labels' in p) {
        if (!isMap(p.labels)) bad(file, `${where}.labels: want a map value → {ru, en}`);
        else {
          for (const v of vs) checkLabel(file, `${where}.labels.${v}`, p.labels[v]);
          for (const k of Object.keys(p.labels)) if (!vs.includes(k)) bad(file, `${where}.labels: "${k}" is not a value`);
        }
      }
      if ('colors' in p) {
        if (!isMap(p.colors)) bad(file, `${where}.colors: want a map value → token`);
        else for (const [k, c] of Object.entries(p.colors)) {
          if (!vs.includes(k)) bad(file, `${where}.colors: "${k}" is not a value`);
          if (Array.isArray(cx.sets.dv) && !cx.sets.dv.includes(c)) bad(file, `${where}.colors.${k}: "${c}" is not in the dv set`);
        }
      }
      break;
    }
    case 'color':
      if (!(isStr(p.set) && Array.isArray(cx.sets[p.set]))) bad(file, `${where}.set: "${p.set}" is not a set of _common.yaml`);
      break;
    case 'list':
      if (!isMap(p.of)) { bad(file, `${where}.of: want an element {type: …}`); break; }
      if (['list', 'md', 'resource'].includes(p.of.type)) bad(file, `${where}.of: a list of ${p.of.type} is not a thing`);
      else checkParam(`${where}.of`, name, { ...p.of, label: { ru: '-', en: '-' } }, cx, { ...x, role: true });
      for (const f of ['len', 'min', 'max']) if (f in p && !(Number.isInteger(p[f]) && p[f] >= 0)) bad(file, `${where}.${f}: want a whole number`);
      break;
    case 'resource':
      if ('glob' in p && !isStr(p.glob)) bad(file, `${where}.glob: want a pattern`);
      if ('lang' in p && p.lang !== true) bad(file, `${where}.lang: only true, or leave it out`);
      break;
  }
  checkDefault(file, `${where}.default`, p, cx, x.params);
}

function checkCommon(c, i18n) {
  const file = 'data/blocks/_common.yaml';
  if (!isMap(c)) { bad(file, 'missing or not a map'); return { roles: {}, sets: {} }; }
  for (const k of Object.keys(c)) if (!COMMON_KEYS.includes(k)) bad(file, `unknown field "${k}"`);
  if (c.v !== 1) bad(file, `v: ${JSON.stringify(c.v)}, want 1`);
  const sets = isMap(c.sets) ? c.sets : (bad(file, 'sets: want a map'), {});
  for (const [n, s] of Object.entries(sets)) {
    if (!KEBAB.test(n)) bad(file, `sets.${n}: the name is not kebab-case`);
    if (!Array.isArray(s) || !s.length || s.some((t) => !isStr(t) || !KEBAB.test(t))) bad(file, `sets.${n}: want a list of token names`);
    else if (new Set(s).size !== s.length) bad(file, `sets.${n}: duplicates`);
  }
  const roles = isMap(c.roles) ? c.roles : (bad(file, 'roles: want a map'), {});
  const cx = { sets, i18n };
  for (const [n, r] of Object.entries(roles)) {
    if (!KEBAB.test(n)) bad(file, `roles.${n}: the name is not kebab-case`);
    checkParam(`roles.${n}`, n, r, cx, { role: true, file, names: new Set(Object.keys(roles)) });
  }
  if (!isMap(c.classes)) bad(file, 'classes: want a map');
  else {
    const got = new Set(Object.keys(c.classes));
    if (!setEq(got, new Set(CLASSES))) bad(file, `classes: {${list(got)}}, want {${list(new Set(CLASSES))}}`);
    for (const [n, k] of Object.entries(c.classes)) {
      if (!isMap(k)) { bad(file, `classes.${n}: want {title, section}`); continue; }
      for (const f of Object.keys(k)) if (!['title', 'section'].includes(f)) bad(file, `classes.${n}: unknown field "${f}"`);
      checkLabel(file, `classes.${n}.title`, k.title);
      checkLabel(file, `classes.${n}.section`, k.section);
    }
  }
  return { roles, sets };
}

function anchorsOf(p) {
  if (!existsSync(join(root, p))) return null;
  const s = read(p);
  const set = new Set();
  for (const m of s.matchAll(/^#{1,6} .*\{#([A-Za-z0-9_-]+)[^}]*\}\s*$/gm)) set.add(m[1]);
  for (const m of s.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) set.add(m[1]);
  return set;
}

function checkInsert(file, where, text, s) {
  if (!isStr(text)) { bad(file, `${where}: missing`); return; }
  const n = text.split('{cursor}').length - 1;
  if (n !== 1) bad(file, `${where}: ${n} {cursor} marks, want exactly one`);
  for (const m of text.matchAll(/(?<!\{)\{([a-z][a-z0-9-]*)\}(?!\})/g)) {
    if (m[1] !== 'cursor') bad(file, `${where}: {${m[1]}} — {cursor} is the only substitution`);
  }
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const name = s.name;
  if (s.syntax === 'shortcode') {
    const open = new RegExp(`\\{\\{[<%]\\s*${name}(\\s|/?\\s*[>%]\\}\\})`);
    if (!open.test(text)) bad(file, `${where}: does not open {{< ${name} … >}}`);
    const close = new RegExp(`\\{\\{[<%]\\s*/${name}\\s*[>%]\\}\\}|/[>%]\\}\\}`);
    if (s.shape === 'block' && !close.test(text)) bad(file, `${where}: a block shortcode is closed — {{< /${name} >}} or self-closing />}}`);
  } else if (s.syntax === 'alert') {
    if (!new RegExp(`^> \\[!${name}\\]( |$)`).test(lines[0] || '')) bad(file, `${where}: the first line is not "> [!${name}]"`);
    if (lines.some((l) => !l.startsWith('>'))) bad(file, `${where}: every line of an alert starts with ">"`);
  } else if (s.syntax === 'quote') {
    const ok = s.depth === 2 ? (l) => l.startsWith('>>') && !l.startsWith('>>>') : (l) => l.startsWith('>') && !l.startsWith('>>');
    if (lines.some((l) => !ok(l))) bad(file, `${where}: every line starts with ${s.depth === 2 ? '">>"' : '">" (not ">>")'}`);
  }
}

/* rule 5: two levels of keys; the rows table is the one construction below */
function checkKeys(file, where, keys) {
  if (!isMap(keys)) { bad(file, `${where}: want a map`); return; }
  const leaf = (w, v) => {
    if (typeof v === 'string') { if (!TYPES.includes(v) && !GRAMMARS.includes(v)) bad(file, `${w}: "${v}" is not a type or a grammar`); return; }
    if (!isMap(v)) { bad(file, `${w}: want a type`); return; }
    if ('fields' in v || 'list' in v) { bad(file, `${w}: deeper than two levels`); return; }
    if ('rows' in v) { if (!isMap(v.rows)) bad(file, `${w}.rows: want a map`); return; }
    if (!TYPES.includes(v.type)) bad(file, `${w}.type: "${v.type}" is not a type`);
  };
  for (const [k, v] of Object.entries(keys)) {
    const w = `${where}.${k}`;
    if (!isMap(v) || !['fields', 'list', 'rows'].some((f) => f in v)) { leaf(w, v); continue; }
    const forms = ['fields', 'list', 'rows'].filter((f) => f in v);
    if (forms.length > 1 || Object.keys(v).length > 1) { bad(file, `${w}: one of fields | list | rows`); continue; }
    const inner = v[forms[0]];
    if (!isMap(inner)) { bad(file, `${w}.${forms[0]}: want a map`); continue; }
    for (const [f, fv] of Object.entries(inner)) leaf(`${w}.${forms[0]}.${f}`, fv);
  }
}

function checkBody(file, s) {
  const b = s.body;
  if (!isMap(b)) { bad(file, 'body: missing, want {kind: …}'); return; }
  if (!KINDS.includes(b.kind)) { bad(file, `body.kind: "${b.kind}" is not one of ${KINDS.join(' ')}`); return; }
  for (const k of Object.keys(b)) if (k !== 'kind' && !BODY_KEYS[b.kind].includes(k)) bad(file, `body.${k}: not a field of kind ${b.kind}`);
  /* rule 6 */
  if ('adapter' in b && !ADAPTERS.includes(b.adapter)) bad(file, `body.adapter: "${b.adapter}" is not one of ${ADAPTERS.join(' ')}`);
  if (b.kind === 'table' && 'keys' in b && b.adapter !== 'chart') bad(file, 'body.keys beside kind: table only with adapter: chart');
  if ('keys' in b) checkKeys(file, 'body.keys', b.keys);
  if ('oneOf' in b && (!Array.isArray(b.oneOf) || b.oneOf.some((k) => !(isMap(b.keys) && k in b.keys)))) bad(file, 'body.oneOf: want a list of names from body.keys');
  if (b.kind === 'list') {
    if (!isMap(b.item) || !GRAMMARS.includes(b.item.grammar)) bad(file, `body.item.grammar: want one of ${GRAMMARS.join(' ')}`);
    if ('tight' in b && typeof b.tight !== 'boolean') bad(file, 'body.tight: want true or false');
  }
  if (b.kind === 'table') {
    for (const part of ['columns', 'header']) {
      if (!(part in b)) continue;
      if (!isMap(b[part])) { bad(file, `body.${part}: want {first, rest}`); continue; }
      for (const [k, c] of Object.entries(b[part])) {
        if (!['first', 'rest'].includes(k)) bad(file, `body.${part}.${k}: only first and rest`);
        if (!isMap(c) || !GRAMMARS.includes(c.grammar)) bad(file, `body.${part}.${k}.grammar: want one of ${GRAMMARS.join(' ')}`);
        if (isMap(c) && 'align' in c && !['left', 'right', 'center'].includes(c.align)) bad(file, `body.${part}.${k}.align: left | right | center`);
      }
    }
    if ('rows' in b && !(isMap(b.rows) && Object.entries(b.rows).every(([k, v]) => k === 'groupHeading' && v === 'values-empty'))) bad(file, 'body.rows: only {groupHeading: values-empty}');
    if ('blankLines' in b && b.blankLines !== 'keep') bad(file, 'body.blankLines: only keep');
  }
}

function checkLimits(file, s, names) {
  const l = s.limits;
  if (l === undefined) return;
  if (!isMap(l)) { bad(file, 'limits: want a map'); return; }
  const kind = isMap(s.body) ? s.body.kind : undefined;
  const range = (k, v, extra = []) => {
    if (!isMap(v)) { bad(file, `limits.${k}: want {min, max}`); return; }
    for (const f of Object.keys(v)) {
      if (['min', 'max'].includes(f)) { if (!(Number.isInteger(v[f]) && v[f] >= 0)) bad(file, `limits.${k}.${f}: want a whole number`); }
      else if (!extra.includes(f)) bad(file, `limits.${k}: unknown field "${f}"`);
    }
    if (!('min' in v) && !('max' in v)) bad(file, `limits.${k}: want min, max or both`);
    if (Number.isInteger(v.min) && Number.isInteger(v.max) && v.min > v.max) bad(file, `limits.${k}: min is above max`);
  };
  for (const [k, v] of Object.entries(l)) {
    if (!LIMITS.includes(k)) { bad(file, `limits.${k}: not one of ${LIMITS.join(' ')}`); continue; }
    if (k === 'items') { range(k, v); if (kind !== 'list') bad(file, 'limits.items: only for a list body'); }
    if (k === 'valueColumns') { range(k, v); if (kind !== 'table') bad(file, 'limits.valueColumns: only for a table body'); }
    if (k === 'valueColumnsWhen') {
      range(k, v, ['param', 'is']);
      if (kind !== 'table') bad(file, 'limits.valueColumnsWhen: only for a table body');
      if (isMap(v) && !names.has(v.param)) bad(file, `limits.valueColumnsWhen.param: "${v.param}" is not a param of this block`);
      if (isMap(v) && !isStr(v.is)) bad(file, 'limits.valueColumnsWhen.is: want absent | present | "<value>"');
    }
    if (k === 'perSection' && !(Number.isInteger(v) && v >= 1)) bad(file, 'limits.perSection: want a whole number ≥ 1');
  }
}

/* rule 4 */
function checkVariations(file, s, cx, params, roles) {
  const vs = s.variations;
  if (vs === undefined) return;
  if (!Array.isArray(vs)) { bad(file, 'variations: want a list'); return; }
  const setKeys = new Set(vs.flatMap((v) => (isMap(v) && isMap(v.set) ? Object.keys(v.set) : [])));
  const ids = new Set();
  const excl = (a, b) => (params[a]?.excludes || []).includes(b) || (params[b]?.excludes || []).includes(a);
  for (const [i, v] of vs.entries()) {
    const w = `variations[${isMap(v) && isStr(v.id) ? v.id : i}]`;
    if (!isMap(v)) { bad(file, `${w}: want a map`); continue; }
    for (const k of Object.keys(v)) if (!['id', 'title', 'summary', 'match', 'set', 'insert'].includes(k)) bad(file, `${w}: unknown field "${k}"`);
    if (!isStr(v.id) || !KEBAB.test(v.id)) bad(file, `${w}.id: want a kebab-case id`);
    else if (ids.has(v.id)) bad(file, `${w}.id: duplicate`);
    else ids.add(v.id);
    checkLabel(file, `${w}.title`, v.title);
    if ('summary' in v) checkLabel(file, `${w}.summary`, v.summary);
    const set = v.set === undefined ? {} : v.set;
    if (!isMap(set)) { bad(file, `${w}.set: want a map`); continue; }
    for (const [k, val] of Object.entries(set)) {
      if (k in roles) bad(file, `${w}.set.${k}: a common role is the author's, not a variation key`);
      else if (!(k in params)) bad(file, `${w}.set.${k}: not a param of this block`);
      else checkLiteral(file, `${w}.set.${k}`, params[k], val, cx);
    }
    const setNames = Object.keys(set);
    for (const [j, a] of setNames.entries()) for (const b of setNames.slice(j + 1)) if (excl(a, b)) bad(file, `${w}.set: ${a} and ${b} exclude each other`);
    if (!isMap(v.match)) { bad(file, `${w}.match: want a map param → absent | present | "<value>"`); }
    else {
      const on = [];
      for (const [k, m] of Object.entries(v.match)) {
        if (!(k in params)) { bad(file, `${w}.match.${k}: not a param of this block`); continue; }
        if (!isStr(m)) { bad(file, `${w}.match.${k}: want absent | present | "<value>"`); continue; }
        if (!setKeys.has(k)) { bad(file, `${w}.match.${k}: no variation sets ${k}, so choosing one cannot make it match`); continue; }
        if (m === 'absent' && k in set) bad(file, `${w}: match wants ${k} absent, set writes it`);
        if (m === 'present' && !(k in set)) bad(file, `${w}: match wants ${k} present, set does not write it`);
        if (m !== 'absent' && m !== 'present' && set[k] !== m) bad(file, `${w}: match wants ${k}="${m}", set writes ${k in set ? `"${set[k]}"` : 'nothing'}`);
        if (m !== 'absent') on.push(k);
      }
      for (const [j, a] of on.entries()) for (const b of on.slice(j + 1)) if (excl(a, b)) bad(file, `${w}.match: ${a} and ${b} exclude each other — nothing can match`);
    }
    if ('insert' in v) checkInsert(file, `${w}.insert`, v.insert, s);
  }
}

function checkSchema(key, s, cx) {
  const file = `data/blocks/${key}.yaml`;
  if (!isMap(s)) { bad(file, 'not a map'); return; }
  for (const k of Object.keys(s)) if (!ROOT_KEYS.includes(k)) bad(file, `unknown field "${k}"`);
  if (s.v !== 1) bad(file, `v: ${JSON.stringify(s.v)}, want 1`);
  if (s.name !== key) bad(file, `name: "${s.name}", want the file's name "${key}"`);
  if (!KEBAB.test(key)) bad(file, 'the file name is not kebab-case');
  if (!SYNTAX.includes(s.syntax)) bad(file, `syntax: "${s.syntax}" is not one of ${SYNTAX.join(' ')}`);
  if (s.syntax === 'shortcode') { if (!SHAPES.includes(s.shape)) bad(file, `shape: "${s.shape}" is not one of ${SHAPES.join(' ')}`); }
  else if ('shape' in s) bad(file, 'shape: only a shortcode has one');
  if (s.syntax === 'quote') { if (![1, 2].includes(s.depth)) bad(file, 'depth: want 1 (>) or 2 (>>)'); }
  else if ('depth' in s) bad(file, 'depth: only a quote role has one');
  if (!CLASSES.includes(s.class)) bad(file, `class: "${s.class}" is not one of ${CLASSES.join(' ')}`);
  checkLabel(file, 'title', s.title);
  checkLabel(file, 'summary', s.summary);
  if (!isStr(s.icon) || !KEBAB.test(s.icon)) bad(file, 'icon: want a Lucide id, kebab-case');
  if (!isMap(s.keywords)) bad(file, 'keywords: want {ru: […], en: […]}');
  else {
    for (const l of LANGS) if (!Array.isArray(s.keywords[l]) || !s.keywords[l].length || s.keywords[l].some((k) => !isStr(k))) bad(file, `keywords.${l}: want a list of words`);
    for (const k of Object.keys(s.keywords)) if (!LANGS.includes(k)) bad(file, `keywords: unexpected key "${k}"`);
  }
  const doc = isStr(s.docs) && s.docs.match(/^([a-z0-9-]+\.md)#([A-Za-z0-9_-]+)$/);
  if (!doc) bad(file, 'docs: want <file>.md#<anchor>');
  else for (const dir of ['docs', 'docs/ru']) {
    const a = cx.anchor(`${dir}/${doc[1]}`);
    if (a === null) { if (dir === 'docs') bad(file, `docs: ${dir}/${doc[1]} does not exist`); continue; }
    if (!a.has(doc[2])) bad(file, `docs: no {#${doc[2]}} heading in ${dir}/${doc[1]}`);
  }
  if ('manifest' in s && key !== 'widget') bad(file, 'manifest: only the widget block has one');

  /* accepted roles and the class's obligations */
  const common = Array.isArray(s.common) ? s.common : (bad(file, 'common: want a list of roles, [] for none'), []);
  const roles = {};
  for (const r of common) {
    if (!(r in cx.roles)) bad(file, `common: "${r}" is not a role of _common.yaml`);
    else if (r in roles) bad(file, `common: "${r}" twice`);
    else roles[r] = cx.roles[r];
  }
  if (key === 'widget' && 'id' in roles) bad(file, 'common: widget cannot accept the id role — its id param holds the name');
  if (s.class === 'voice' && !('id' in roles)) bad(file, 'common: a voice block accepts id');
  /* stats captions itself with its marker line; spanmap and raw have no caption */
  if (s.class === 'figure' && !['stats', 'spanmap', 'raw'].includes(key)) for (const r of ['cap', 'note']) if (!(r in roles)) bad(file, `common: a figure accepts ${r}`);

  /* rule 7 */
  if (('cap' in roles) !== ('frame' in s)) bad(file, 'cap' in roles ? 'accepts cap but declares no frame' : 'declares a frame but does not accept cap');
  if ('frame' in s) {
    const f = s.frame;
    if (!isMap(f)) bad(file, 'frame: want {policy, default}');
    else {
      for (const k of Object.keys(f)) if (!['policy', 'default'].includes(k)) bad(file, `frame: unknown field "${k}"`);
      if (!POLICIES.includes(f.policy)) bad(file, `frame.policy: "${f.policy}" is not one of ${POLICIES.join(' ')}`);
      if (f.policy === 'cap' && 'default' in f) bad(file, 'frame.default: with policy cap an empty cap means no frame, so there is no default');
      if (['always', 'bare'].includes(f.policy) && !('default' in f)) bad(file, `frame.default: policy ${f.policy} shows a caption with no cap given — name its i18n default`);
      if (f.policy === 'bare' && !('bare' in roles)) bad(file, 'frame: policy bare needs the bare role in common');
      if ('default' in f) {
        if (!isMap(f.default) || Object.keys(f.default).join() !== 'i18n') bad(file, 'frame.default: want {i18n: key}');
        else checkI18n(file, 'frame.default.i18n', f.default.i18n, cx, null);
      }
    }
  }

  /* params */
  const params = s.params === undefined ? {} : s.params;
  if (!isMap(params)) { bad(file, 'params: want a map'); return; }
  if ('groups' in s) {
    if (!isMap(s.groups)) bad(file, 'groups: want a map');
    else for (const [g, l] of Object.entries(s.groups)) { if (!KEBAB.test(g)) bad(file, `groups.${g}: not kebab-case`); checkLabel(file, `groups.${g}`, l); }
  }
  const names = new Set([...Object.keys(params), ...Object.keys(roles)]);
  for (const [n, p] of Object.entries(params)) {
    const w = `params.${n}`;
    /* rule 8 */
    if (!KEBAB.test(n)) bad(file, `${w}: the name is not kebab-case`);
    if (n in cx.roles && !(key === 'widget' && n === 'id')) bad(file, `${w}: "${n}" is a common role — accept it in common instead`);
    if (n.startsWith('tgc-')) bad(file, `${w}: tgc-* is the plugin's namespace`);
    if (n === 'tip' || n.startsWith('tip-')) bad(file, `${w}: tip / tip-* belong to the theme's tooltip`);
    checkParam(w, n, p, cx, { role: false, file, names, groups: s.groups, params });
    if (!isMap(p)) continue;
    const at = p.at || 'attr';
    if (s.syntax === 'shortcode' && at === 'marker') bad(file, `${w}.at: a shortcode has no marker line`);
    if (s.syntax === 'alert' && at !== 'marker') bad(file, `${w}.at: an alert's only parameter is its marker line — at: marker`);
    if (s.syntax === 'alert' && at === 'marker' && p.type !== 'inline-md') bad(file, `${w}.type: the marker line arrives rendered — inline-md`);
  }
  if (s.syntax === 'alert' && Object.keys(params).length > 1) bad(file, 'params: an alert has one parameter at most, its marker line');
  if (s.syntax === 'quote' && Object.keys(params).length) bad(file, 'params: a quote role has none');
  if (isMap(s.groups)) {
    const used = new Set(Object.values(params).filter(isMap).map((p) => p.group));
    for (const g of Object.keys(s.groups)) if (!used.has(g)) bad(file, `groups.${g}: no param uses it`);
  }

  checkBody(file, s);
  checkLimits(file, s, names);
  checkVariations(file, s, cx, params, roles);
  checkInsert(file, 'insert', s.insert, s);
}

/* ── the templates ── */

function shortcodes(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return shortcodes(join(dir, e.name), `${prefix}${e.name}/`);
    return e.name.endsWith('.html') ? [`${prefix}${e.name.split('.')[0]}`] : [];
  });
}

/* The branches of the alert switch: each `eq $type "x"` condition and the
   template text up to the next else / end at the same depth. */
function alertBranches(src) {
  const out = {};
  const acts = [...src.matchAll(/\{\{-?\s*([\s\S]*?)\s*-?\}\}/g)];
  const stack = [];
  for (const m of acts) {
    const a = m[1];
    const word = a.split(/\s+/)[0];
    if (['if', 'with', 'range', 'block', 'define'].includes(word)) stack.push(null);
    const t = a.match(/^(?:else\s+)?if\s+eq\s+\$type\s+"([^"]+)"/);
    const closes = word === 'end' || word === 'else';
    if (closes && stack.length && stack[stack.length - 1]) {
      const open = stack[stack.length - 1];
      out[open.name] = src.slice(open.from, m.index);
      stack[stack.length - 1] = null;
    }
    if (t) stack[stack.length - 1] = { name: t[1], from: m.index + m[0].length };
    if (word === 'end') stack.pop();
  }
  return out;
}

/* The .Get names a template builds from a range over literal names, the way
   chart.html reads its two axes:
     {{ range slice "x" "y" }} … $.Get . … $.Get (print . "-unit") … {{ end }}
   `.` is the range's element in every action no with / range in between has
   rebound it — the pipeline of a `with` opened in the loop still sees it. */
function rangedGets(src) {
  const out = new Set();
  const stack = [];   /* per open block: does it rebind the dot, and to which names */
  for (const m of src.matchAll(/\{\{-?\s*([\s\S]*?)\s*-?\}\}/g)) {
    const a = m[1];
    const word = a.split(/\s+/)[0];
    if (word === 'end') { stack.pop(); continue; }
    const dot = [...stack].reverse().find((f) => f.rebinds);
    if (dot && dot.names) {
      if (/(?<![\w)\]])\.Get\s+\.(?![\w.])/.test(a)) for (const n of dot.names) out.add(n);
      for (const g of a.matchAll(/(?<![\w)\]])\.Get\s+\(\s*print\s+\.\s+"([^"]*)"\s*\)/g)) for (const n of dot.names) out.add(n + g[1]);
    }
    if (['if', 'with', 'range', 'block', 'define'].includes(word)) {
      const r = a.match(/^range\s+slice((?:\s+"[^"]+")+)$/);
      stack.push({ rebinds: word === 'with' || word === 'range', names: r ? [...r[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null });
    }
  }
  return out;
}

function checkTemplates(schemas) {
  const all = shortcodes(join(root, 'layouts/_shortcodes'));
  const byName = new Set(all);
  for (const t of all) {
    const s = schemas[t];
    if (s) { if (s.syntax !== 'shortcode') bad(`data/blocks/${t}.yaml`, `syntax ${s.syntax}, but layouts/_shortcodes/${t}.html is a shortcode`); }
    else if (!(t in EXCEPT)) bad(`layouts/_shortcodes/${t}.html`, 'no schema in data/blocks/ and no entry in the exceptions of scripts/check-blocks.mjs');
  }
  for (const e of Object.keys(EXCEPT)) {
    if (!byName.has(e)) bad('scripts/check-blocks.mjs', `exception "${e}" names no template — drop it`);
    if (schemas[e]) bad('scripts/check-blocks.mjs', `exception "${e}" has a schema too — drop the exception`);
  }
  /* rule 2 */
  for (const [n, s] of Object.entries(schemas)) {
    if (s.syntax !== 'shortcode') continue;
    const tpl = `layouts/_shortcodes/${n}.html`;
    if (!byName.has(n)) { bad(`data/blocks/${n}.yaml`, `syntax shortcode, but ${tpl} does not exist`); continue; }
    const src = stripComments(read(tpl));
    /* the shortcode's own .Get, not .Page.Store.Get / .Scratch.Get */
    const named = new Set([...src.matchAll(/(?<![\w)\]])\.Get\s+(?:"([^"]+)"|`([^`]+)`)/g)].map((m) => m[1] ?? m[2]));
    for (const g of rangedGets(src)) named.add(g);
    const idx = new Set([...src.matchAll(/(?<![\w)\]])\.Get\s+(\d+)/g)].map((m) => Number(m[1])));
    const params = isMap(s.params) ? s.params : {};
    const attr = Object.keys(params).filter((k) => isMap(params[k]) && (params[k].at || 'attr') === 'attr');
    const positional = Object.keys(params).filter((k) => isMap(params[k]) && params[k].at === 'positional');
    /* A positional param is named too: Hugo takes no mix of the two, so beside
       any other param it is written name="…", and the template reads it both
       ways — or (.Get "word") (.Get 0). */
    const accepts = new Set([...attr, ...positional, ...(Array.isArray(s.common) ? s.common : [])]);
    for (const g of named) if (!accepts.has(g)) bad(tpl, `.Get "${g}" is neither a param nor an accepted role of data/blocks/${n}.yaml`);
    for (const a of accepts) if (!named.has(a)) bad(`data/blocks/${n}.yaml`, `"${a}" is never read by ${tpl} (.Get "${a}")`);
    const want = new Set(positional.map((_, i) => i));
    if (!setEq(idx, want)) bad(tpl, `reads positions {${list(idx)}}, the schema declares ${positional.length} positional param(s)`);
  }
  /* rule 1, alerts; rule 2 for the marker line */
  const hookFile = 'layouts/_markup/render-blockquote.html';
  if (!existsSync(join(root, hookFile))) { bad(hookFile, 'missing'); return; }
  const hook = stripComments(read(hookFile));
  const alerts = new Set(Object.keys(schemas).filter((n) => schemas[n].syntax === 'alert'));
  const lit = hook.match(/\(slice((?:\s+"[^"]+")+)\)\s+\$type/);
  if (lit) {
    const got = new Set([...lit[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
    if (!setEq(got, alerts)) bad(hookFile, `the alert list (slice …) is {${list(got)}}, the syntax: alert schemas are {${list(alerts)}}`);
  }
  const branches = alertBranches(hook);
  const got = new Set(Object.keys(branches));
  if (!setEq(got, alerts)) bad(hookFile, `renders alerts {${list(got)}}, the syntax: alert schemas are {${list(alerts)}}`);
  for (const a of alerts) {
    if (!(a in branches)) continue;
    /* a `with .AlertTitle` that only warns is the hook refusing the marker line */
    const prints = /\.AlertTitle/.test(branches[a].replace(/\{\{-?\s*with\s+\.AlertTitle\s*-?\}\}\s*\{\{-?\s*warnf[\s\S]*?\}\}/g, ''));
    const params = isMap(schemas[a].params) ? Object.values(schemas[a].params) : [];
    const marker = params.some((p) => isMap(p) && p.at === 'marker');
    if (marker && !prints) bad(`data/blocks/${a}.yaml`, `has a marker-line parameter, but ${hookFile} never prints .AlertTitle for [!${a}]`);
    if (!marker && prints) bad(`data/blocks/${a}.yaml`, `${hookFile} prints the marker line of [!${a}], but the schema has no at: marker parameter`);
  }
}

/* ── run ── */

if (spawnSync('hugo', ['version'], { encoding: 'utf8' }).error) {
  console.error('check-blocks: hugo not found — the schemas are parsed by Hugo, so without it nothing is checked');
  process.exit(2);
}

const dir = join(root, 'data/blocks');
let valid = {};
if (!existsSync(dir)) bad('data/blocks', 'missing');
else {
  /* Hugo reads .yml / .toml / .json and folders too; those are reported here
     and left out of the schema checks */
  const stray = new Set();
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) { bad(`data/blocks/${e.name}`, 'a folder — schemas are flat files'); stray.add(e.name); }
    else if (!e.name.endsWith('.yaml')) { bad(`data/blocks/${e.name}`, 'not .yaml — one schema per <name>.yaml'); stray.add(e.name.replace(/\.[^.]*$/, '')); }
  }
  const data = parse();
  if (data) {
    const blocks = isMap(data.blocks) ? data.blocks : {};
    const cx = { i18n: {}, anchor: (() => { const memo = {}; return (p) => (p in memo ? memo[p] : (memo[p] = anchorsOf(p))); })() };
    for (const l of LANGS) cx.i18n[l] = isMap(data.i18n) && isMap(data.i18n[l]) ? data.i18n[l] : null;
    Object.assign(cx, checkCommon(blocks._common, cx.i18n));
    const schemas = Object.fromEntries(Object.entries(blocks).filter(([k]) => k !== '_common' && !stray.has(k)));
    for (const [k, s] of Object.entries(schemas)) checkSchema(k, s, cx);
    const depths = Object.values(schemas).filter((s) => isMap(s) && s.syntax === 'quote').map((s) => s.depth);
    if (new Set(depths).size !== depths.length) bad('data/blocks', `two quote roles share a depth (${depths.join(', ')})`);
    valid = Object.fromEntries(Object.entries(schemas).filter(([, s]) => isMap(s)));
    checkTemplates(valid);
    render(valid);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`check-blocks: ${p}`);
  console.error(`check-blocks: ${problems.length} problem(s)`);
  process.exit(1);
}
const by = (x) => Object.values(valid).filter((s) => s.syntax === x).length;
const all = shortcodes(join(root, 'layouts/_shortcodes'));
console.log(`check-blocks: ok — ${Object.keys(valid).length} schemas (${by('alert')} alert, ${by('quote')} quote, ${by('shortcode')} shortcode); `
  + `${all.length} theme shortcodes: ${by('shortcode')} with a schema, ${Object.keys(EXCEPT).length} excepted`);
