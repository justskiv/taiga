# Authoring a guide

A guide is a **leaf bundle**: a folder with `index.md` and, when it has live
illustrations, a `widgets.js` next to it. This page is the contract for writing
one — front matter, shortcodes, code, diagrams, widgets, covers, and voice.

## Start from the archetype

```sh
hugo new content howto/my-guide --kind guides
```

You get a bundle skeleton — `index.md` with every field pre-filled plus a stub
`widgets.js`. **Note the path has no `/index.md`**: pass the bundle folder, or
Hugo drops into single-file mode and won't copy the archetype's sibling files.

## Front matter

```yaml
title: "Значения и layout: как Go-значение лежит в памяти"
slug: memory-1-layout        # freezes the URL (…/memory-1-layout/)
date: 2026-03-07             # feed/RSS/sitemap only — never shown in the article
description: "One sentence — for the feed, search and meta tags."
lead: "Lead paragraph (may be longer than description)."
series: ["memory"]           # membership; omit for a standalone guide
series_weight: 1             # order within the series
tags: [memory, layout, unsafe]
mins: 12                     # "~12 мин" chip — hand-tuned, not .ReadingTime
version: "go1.26"            # free-form "tested on" chip; omit to fall back to versionDefault
rail_title: "Layout"         # optional: 2–4 word name for the left rail / minimap (else title)
related: []                  # standalone guides: 3–5 content paths for the "ещё по теме" rail
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Split on the first `": "` into an `<h1>` + `.sub`; use `sub:` to override, or a title without `": "` for a single line. |
| `slug` | yes | Freezes the pretty URL; keep it stable once published. |
| `date` | yes | Orders the feed and RSS. **Dates never appear in article text.** |
| `description` | yes | Feed card, search result, `og:description`. |
| `lead` | recommended | The opening paragraph. Falls back to `description`. |
| `series`, `series_weight` | for series | See below. |
| `tags` | recommended | Chips linking to `/tags/#<tag>`. |
| `mins` | recommended | The reading-time chip and the series-bridge scale; falls back to `.ReadingTime`. |
| `version` | optional | Falls back to `versionDefault`; unset on both ⇒ no chip. |
| `rail_title` | optional | Short rail/minimap label. |
| `related` | standalone only | Content paths for the "ещё по теме" rail. |
| `placeholder` | optional | See [Placeholders](#placeholders). |
| `og_image`, `og_style` | optional | See [Covers](#covers-og-images). |
| `interactive_label`, `toc_labels`, `intro`, `sub` | optional | Fine-tuning; see the demo guides. |

### Series and weight

Membership is two lines — `series: ["memory"]` + `series_weight: N`. Order,
"часть N из M" kickers, the left rail, and the bottom bridge (scaled by `mins`,
"осталось ~N мин") are all derived from that, server-side. Adding a part is
dropping in a file with those two lines.

Series metadata lives in the term page `content/series/<id>/_index.md`:

```yaml
title: "Память"             # series name, used in kickers and the rubric block
description: "One line for the series block on the rubric page."
weight: 10                  # order of series on the rubric page
```

### Placeholders

An unconverted guide can ship as a placeholder: full front matter from the feed,
body a single line, and `placeholder: true`. It counts in the feed, tag cloud
and series structure ("часть N из M") but is **excluded from RSS and search**.
Drop the flag and write the body when the guide is ready.

## Shortcodes

### callout — `{{</* callout type="trap" */>}}`

Four types: `key` (главная мысль), `trap` (ловушка), `note` (историческая
сноска), `internals` (под капотом). The label comes from i18n; override with
`label=`. The body is Markdown.

```md
{{</* callout type="key" */>}}
A slice header is three words: pointer, length, capacity.
{{</* /callout */>}}
```

### widget — `{{</* widget id="w-x" */>}}`

Three forms (see [Widgets](#widgets)):

```md
{{</* widget id="w-escape" cap="Поиграй" note="— двигай слайдер, смотри на кучу" */>}}
```
- **empty mount** (self-closed): renders the caption + an empty `.w-root` your
  `widgets.js` fills. `cap` overrides the default "Поиграй"; `note` is the aside.
- **static fallback** (`id` + inner): the inner HTML lives inside the mount until
  JS replaces it — and stays if JS is off.
- **raw** (no `id`, inner only): the inner HTML is dropped straight into the figure.

### bigcard — `{{</* bigcard href="/lab/" k="Тренажёр →" t="…" s="…" */>}}`

A link card: `k` kicker, `t` title, `s` subtitle. Internal `href` is resolved to
its permalink.

### raw — `{{</* raw */>}}…{{</* /raw */>}}`

Passes its inner HTML through untouched — for the hand-built diagrams below.

### roadmap — `{{</* roadmap */>}}`

Renders the roadmap blocks from `data/roadmap.toml` (see the demo `roadmap.md`).

## Code blocks

Fenced code as usual. **Only Go is highlighted** (server-side Chroma, recoloured
to the theme palette); every other language, ` ```text `, and bare fences render
as plain `<code class="nohl">`. Two fence attributes:

````md
```go {label="runtime/malloc.go (упрощено)"}
func mallocgc(size uintptr) unsafe.Pointer { … }
```
````

- `{label="…"}` — a file caption above the block.
- `{hl_lines="2-3"}` — highlight lines (Go blocks).

## Diagrams (instead of images)

The theme has no images in guides — memory diagrams are hand-built HTML inside a
`raw` block. The building blocks (all styled by the theme):

```md
{{</* raw */>}}
<div class="mem">
  <div class="mem-lab">slice header <span class="tot">→ 24 B</span></div>
  <div class="header">
    <div class="header-word ptr" data-tip="ptr · pointer"><span class="wk">ptr</span><span class="wv">→</span></div>
    <div class="header-word" data-tip="len · length"><span class="wk">len</span><span class="wv">3</span></div>
  </div>
  <div class="mem-row"><div class="word live" data-tip="element">e0</div><div class="word spare" data-tip="spare">··</div></div>
</div>
{{</* /raw */>}}
```

- `.mem` cells: `.word.live` / `.spare` / `.ro` / `.ptrcell` / `.dead`; header
  cells `.header-word.ptr` / `.tab`. Any `data-tip` gets a tooltip for free.
- Byte strip: `.byte-strip > .byte-seg > .cells > .byte-box.{f0|f1|f2|pad}`
  plus a `.seg-tag` label (see the mock's `memory-1-layout` for a full one).

## Widgets

A live illustration is two touches, no templates or head edits:

1. In the text: the `widget` shortcode above.
2. Next to `index.md`: a `widgets.js` (and optional `widgets.css`). The theme
   finds, minifies, fingerprints and loads it **only on this page**.

Register each figure by its mount id:

```js
Taiga.widget("w-escape", function (root) {
  // `root` is the .w-root mount — build the interactive here (vanilla JS).
});
```

`Taiga.widget` is a tiny runtime in the theme. It waits for the DOM, finds the
mount by id and hands it to your callback inside a `try/catch`: a widget that
throws logs to the console and doesn't take down its neighbours; a missing mount
(shortcode removed) is skipped silently. The id in the shortcode and in
`Taiga.widget(…)` must match character for character.

Use the theme's building-block classes so the widget looks native without a line
of your own CSS: `.w-row` (control row), `.w-btn` (`.primary`/`.ghost`),
`.w-num` (`<b>` big number, `.tick` animates it), `.w-badge.ok`/`.alloc`,
`.w-cap` (output line), sliders as `.gc-slider-row` with a `.nval` readout.
A widget should work offline with no dependencies and have a clear initial state.

## Covers (OG images)

Every guide gets an Open Graph cover generated at build time — backdrop + series
kicker + title + minutes — for **zero author effort**. To override one guide:
drop an `og.png` in its bundle, or set `og_image:` in front matter. To change the
style for a page, `og_style:`; site-wide, `params.ogImages.style`
(see [customizing.md](customizing.md#og-cover-styles)).

## Rubrics

A rubric is a section with an `_index.md`:

```yaml
title: "Приёмы"
params:
  label: "руководство"      # kicker label on this rubric's guides
  slug_mono: "howto"        # mono slug in the rubric kicker
  lead: "What this rubric is about."
  foot: "Closing note under the rubric."
```

List the section in `params.rubricSections` (site config) so its leaf pages get
the full guide layout.

## Voice

The reference is the mock's `memory-1-layout`. In short:

- Conversational, precise, second person ("ты"). No corporate-speak, no marketing.
- The arc is **naive → pain → fixed → this is how Go does it**: a simple model
  first, where it breaks, then the real machinery.
- One through-line per guide; return to it.
- Italic checkpoints after big blocks: *"Теперь ты можешь …"*.
- Short everyday metaphors (a library slip, a parcel tag).
- Widgets woven in with a concrete task: "Поиграй — …".
- `h2` headings are short and substantive — not "Введение" / "Заключение".
- End with "Что дальше" and a bridge to the next part.

Prose is copied verbatim when porting — don't silently edit text; fix a real
error and note it.
