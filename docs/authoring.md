**English** · [Русский](ru/authoring.md)

# Authoring a guide

A guide is a **leaf bundle**: a folder with `index.md` and, when it has live
illustrations, a `widgets/` folder next to it. This page is the contract for writing
one — front matter, shortcodes, code, links, diagrams, widgets, covers,
translations and voice.

## Start from the archetype {#archetype}

```sh
hugo new content howto/my-guide --kind guides            # standalone guide
hugo new content howto/handbook/my-guide --kind guides   # part of the "handbook" series
```

You get a bundle skeleton — `index.md` with the core fields filled in plus a stub
`widgets/w-example/widget.js`. **Note the path has no `/index.md`**: pass the
bundle folder, or Hugo drops into single-file mode and won't copy the
archetype's sibling files. A folder with no `widgets/` is the first sign of
that mistake.

The first path segment must be a section listed in `params.rubricSections` —
that is what makes the page a guide (two rails, kicker, meta chips, TOC, series
bridge) rather than a plain column. A guide placed one folder deeper is a
**series part** — see [Series](#series-and-weight).

## Front matter {#front-matter}

```yaml
title: "Values and layout: how a Go value sits in memory"
slug: memory-1-layout        # freezes the URL (…/memory-1-layout/)
date: 2026-03-07             # feed order, RSS, sitemap — never shown in the article body
description: "One sentence — for the feed, search and meta tags."
lead: "Lead paragraph (may be longer than description)."
weight: 1                    # part order inside its series; omit for a standalone guide
tags: [memory, layout, unsafe]
mins: 12                     # "~12 min" chip — hand-tuned, not .ReadingTime
version: "go1.26"            # free-form "tested on" chip; omit to fall back to versionDefault
rail_title: "Layout"         # optional: 2–4 word name for the left rail / minimap (else title)
related: []                  # standalone guides: 3–5 content paths for the "related" rail
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Split on the first `": "` into an `<h1>` + `.sub`; use `sub:` to override, or a title without `": "` for a single line. |
| `slug` | yes | Freezes the pretty URL; keep it stable once published, and **identical across translations** (see [Translating a guide](#translating-a-guide)). |
| `date` | yes | Orders the feed and RSS, and prints on the feed card. **Never appears in the article body.** |
| `description` | yes | Feed card, search result, `og:description`, RSS `<description>`. |
| `lead` | recommended | The opening paragraph. Also the fallback for `og:description`. |
| `weight` | for series parts | Part order inside the series folder. See [Series](#series-and-weight). |
| `tags` | recommended | Chips linking to the tags page, anchored at `#<tag>`. Keep **identical across translations**. |
| `mins` | recommended | The reading-time chip, the rubric duration sum and the series-bridge scale; falls back to `.ReadingTime`. |
| `version` | optional | Free-form "tested on" chip, rendered verbatim (`go1.26`, `PostgreSQL 17`). Falls back to `params.versionDefault`; unset on both ⇒ no chip. |
| `arch` | optional | Appended to the version chip after a `·`, e.g. `64-bit`. |
| `interactive` | optional | Adds a third meta chip listing what is interactive on the page. |
| `interactive_label` | optional | Label for that chip; defaults to the i18n `meta_interactive`. |
| `rail_title` | optional | Short label for the left rail, the minimap and the series bridge. Defaults to the title up to the first `:`. |
| `linkTitle` | optional | Short title for the rubric page's series list. Doesn't touch the `<h1>` or `<title>`. |
| `related` | standalone only | 3–5 **content paths** (`inside/anatomy/palette-is-a-file`, not a URL) for the "related" rail. Ignored on a series guide, which shows its parts instead. |
| `placeholder` | optional | See [Placeholders](#placeholders). |
| `og_image`, `og_style` | optional | See [Covers (OG images)](#covers-og-images). |
| `sub` | optional | Overrides the automatic `title` split. |
| `intro` | optional | Markdown rendered between the meta chips and the TOC. |
| `foot` | optional | Markdown rendered at the very bottom, below the series bridge. |
| `toc_labels` | optional | Map of heading id → short label, to shorten a long `h2` in the TOC: `toc_labels: {two-fields: "Two fields"}`. |
| `draft` | optional | Standard Hugo. The archetype sets `draft: true`. |

`kicker:` and `headline:` are read only on **non-guide** pages (about, roadmap,
`/tags/`); on a guide the kicker is derived from the rubric and the series, and
setting them does nothing.

### Series {#series-and-weight}

A series is a **folder** — a sub-section of its rubric. Membership is where the
bundle sits, and nothing else:

```
content/howto/
  handbook/                 ← the series
    _index.md               ← series metadata (below)
    get-started/index.md    ← part, weight: 1
    first-guide/index.md    ← part, weight: 2
  build-magic/index.md      ← standalone guide (a direct child of the rubric)
  standalone/               ← optional container for standalone guides (see below)
    _index.md               ← params.standalone: true
    build-magic/index.md    ← standalone guide, identical to the one above
```

`weight` in a part's front matter is its order inside the series. The "part N
of M" kicker, the left rail, and the bottom bridge (segments scaled by `mins`,
"~N min left") are all derived from the folder, server-side. Adding a part is
dropping a bundle into the series folder; moving a guide in or out of a series
is a `mv`. A series with a single part renders as a standalone guide — the
machinery only fires from two parts up.

Each series renders a **landing page** (`/<rubric>/<series>/`): title, tagline,
description, the `_index.md` body as an epigraph, the parts list and a "start
the series" CTA. The rubric page shows the same series as an anchored block
(`/<rubric>/#<series>`); a series announced with an `_index.md` but no parts
yet appears there as an "in the works" teaser, and its landing renders the
announcement. Scaffold the `_index.md` with the archetype:

```sh
hugo new content howto/handbook/_index.md --kind series
```

```yaml
title: "Memory"             # series name, used in kickers, the rubric block and the landing
description: "One line for the series block on the rubric page and the landing."
weight: 10                  # order of series on the rubric page
params:
  label: "memory"           # short lowercase name in kickers (else the lowercased title)
  tagline: "3 parts, from a byte to the GC"   # optional line beside "series ·" on the rubric page
```

### Standalone guides and containers {#standalone}

A standalone guide is a direct child of its rubric — no folder, no `weight`.
When loose guides start to drown the series folders, tuck them into a
**container**: a sub-section whose `_index.md` is nothing but a marker. Both
homes are equally valid, so adoption is one `mv` at a time:

```yaml
title: "Standalone"         # never rendered anywhere
params:
  standalone: true          # "my children are standalone guides, I am not a series"
build:
  render: never             # a container has no page of its own
  list: local               # visible to the rubric's templates, not globally
```

A container holds **leaf bundles only** — never nest a series inside one. On a
multilingual site the marker `_index.md` must exist **per language**
(`_index.md` + `_index.ru.md`), or the other language tree reads the folder as
a series.

Guides that belong to **no rubric** get a top-level section of their own,
listed in `params.extraGuideSections` (see [params.md](params.md)): its pages
join the feed, search and RSS with the full article layout, and the kicker
takes the section `_index.md`'s `label` — but the section is not a rubric (no
home card, no 404 entry).

### Placeholders {#placeholders}

An unconverted guide can ship as a placeholder: full front matter from the feed,
body a single line, and `placeholder: true`. It counts in the feed, tag cloud
and series structure ("part N of M") but is **excluded from RSS and from the
search index**. Drop the flag and write the body when the guide is ready.

## Shortcodes {#shortcodes}

Seven, and that is the whole set.

### callout — `{{</* callout type="trap" */>}}` {#callout}

Four types: `key` (key idea), `trap`, `note` (historical note), `internals`
(under the hood). The label comes from i18n (`callout_key`, `callout_trap`,
`callout_note`, `callout_internals`); override with `label=`. The body is
Markdown. `type` defaults to `note`.

```md
{{</* callout type="key" */>}}
A slice header is three words: pointer, length, capacity.
{{</* /callout */>}}
```

### fold — `{{</* fold icon="video" title="…" */>}}` {#fold}

A quiet, collapsible inline note. Collapsed it is a single line — icon,
summary, and a "Подробнее ⌄" toggle — with no border or background, so it
reads as part of the prose; a click slides the panel open by height. Use it
for an aside the reader can take or skip: a video version, a caveat, a full
listing. The body is Markdown, and `title=` is inline Markdown — a link in
the summary works, and clicking it does not toggle the panel.

```md
{{</* fold icon="video" title="There is also a [video version](https://youtu.be/…)." */>}}
Watch first, then read to cement it — some things land better on screen,
others in text.
{{</* /fold */>}}
```

| Parameter | Meaning |
|---|---|
| `title=` | the summary line, inline Markdown (required) |
| `icon=` | leading glyph from the set below; default `info`, `none` to omit |
| `more=` | collapsed toggle label (default `Подробнее`) |
| `less=` | expanded toggle label (default `Свернуть`) |
| `open=` | `true` to render already expanded |

Icons: `video` · `info` · `tip` · `book` · `code` · `terminal` · `warning` ·
`star` · `link` · `note`.

The panel animates its height — a real slide, not a fade — via
`interpolate-size` on `:root` (set in `00-tokens.css`); where a browser lacks
it the panel snaps open. Labels default to Russian; override per call.

### term — `{{</* term "mcache" */>}}` {#term}

A word in the sentence with a full definition card behind it: hover opens the
card, a click pins it so you can read and follow the link inside, Escape closes.
The body is Markdown — bold, inline code, lists, links, code blocks, images.

```md
Every P owns an {{</* term "mcache" */>}}
A per-P cache of small objects. Allocating from it takes **not a single
atomic** — the fast path never touches shared state.
{{</* /term */>}}, and hitting it is the cheapest allocation there is.
```

| Parameter | Meaning |
|---|---|
| *positional 0* or `word=` | the word as it reads in the sentence (required) |
| `title=` | the card's heading, when it differs from the word — defaults to the word |
| `kind=` | free-text mono label ("runtime struct", "hardware"), omit for none |
| `color=` | `accent` (default, the brand colour) \| `green` \| `copper` \| `blue` \| `gold` \| `red` |
| `href=` | target of the optional "read more" link; internal paths resolve to a permalink |
| `more=` | that link's text (default: i18n `term_more`) |

**Hugo will not let you mix positional and named parameters.** So it is either
the short form `{{</* term "mcache" */>}}` or the fully named form — the moment
you need `title=` or any other parameter, the word moves to `word=`:

```md
the data lives in the {{</* term word="core's caches" title="CPU cache"
                           kind="hardware" color="green"
                           href="/inside/caches/" more="Deep dive: the memory hierarchy" */>}}
Three levels — L1, L2, L3. The closer to the core, the smaller and faster.
{{</* /term */>}}, not in RAM.
```

Two things worth knowing:

- **The card is not rendered where you write it.** A paragraph cannot legally
  contain a `<pre>` or a `<div>` — the HTML parser would close it and tear the
  paragraph apart — so the shortcode leaves an inline link in the prose and the
  cards are collected and rendered after the article body. With JavaScript off
  they show up there as a plain "Definitions" list, and every word links to its
  own. That is the whole no-JS story, and it is also what prints.
- **Repeating a term is free.** The card's id is a hash of word + definition, so
  the same word with the same definition used five times shares one card, and
  every mention opens it. Change the definition and you get a second card — if
  that was not what you meant, keep the wording identical.

### widget — `{{</* widget id="w-x" */>}}` {#widget}

Three forms (see [Widgets](#widgets)):

```md
{{</* widget id="w-escape" cap="Play" note="— drag the slider, watch the heap" */>}}
```
- **self-closed, with `id`**: renders the caption + a `.w-root` mount. If the
  bundle carries a page resource `widgets/w-escape/figure.html`, its content
  fills the mount as the no-JS view; with no such resource the mount starts
  empty and `widgets/w-escape/widget.js` fills it once it runs. `cap` overrides
  the default caption (i18n `widget_cap`); `note` is the muted aside after it.
- **with `id` and an inner body**: the inner HTML is the no-JS view instead of a
  `figure.html` resource — for a fallback short enough to keep next to the
  shortcode rather than in its own file.
- **raw** (no `id`, inner only): the inner HTML is dropped straight into the figure.

### bigcard — `{{</* bigcard href="/playground/" k="Playground →" t="…" s="…" */>}}` {#bigcard}

A link card: `k` kicker, `t` title, `s` subtitle. An internal `href` is resolved
to its permalink (and so survives a slug change); an external one passes through.

### raw — `{{</* raw */>}}…{{</* /raw */>}}` {#raw}

Passes its inner HTML through untouched — for the hand-built diagrams below.
Unlike a bare HTML block in Markdown, a shortcode captures its body whole, so
blank lines inside don't cut the block short.

### roadmap — `{{</* roadmap */>}}` {#roadmap}

Renders the roadmap blocks — "in progress" cards, the queue, the rules — from the
site's roadmap data: either a flat `data/roadmap.toml` or, on a multilingual
site, `data/roadmap/<lang>.toml` (what the demo ships). Same data feeds the "in
progress" strip on the home page. See the demo's `roadmap.md`.

## Code blocks {#code-blocks}

Fenced code as usual. **Only Go is highlighted** (server-side Chroma, recoloured
to the theme palette); every other language, ` ```text `, and bare fences render
as plain `<code class="nohl">`. Two fence attributes:

````md
```go {label="runtime/malloc.go (simplified)" hl_lines=[2]}
func mallocgc(size uintptr) unsafe.Pointer { … }
```
````

- `{label="…"}` — a file caption above the block. Works on any language.
- `{hl_lines=[2]}` — highlight lines; ranges go in as strings, `hl_lines=[2,"5-7"]`.
  Go blocks only (it is a Chroma option).

## Links {#links}

Write internal links as **content paths**, not output URLs: the link render hook
resolves them with `site.GetPage` and rewrites them to the canonical permalink,
so a link survives a slug change — and, on a multilingual site, resolves to the
translation in the current language.

```md
[the bundle guide](/inside/anatomy/guide-is-a-bundle)            ← content path, resolved
[a section of it](/inside/anatomy/guide-is-a-bundle#two-touches) ← fragment preserved
```

A dead internal link **fails the build** (`params.linkcheck = "error"`, the
default) or warns (`"warn"`).

A root-absolute path that carries a file extension — `/index.xml`, a sitemap, a
static download — is not a content page, so it skips the page lookup and goes
through `relURL` instead. That is what keeps it alive on a site served from a
subpath (`https://example.github.io/taiga/`), where a literal `/index.xml` would
point at the domain root and 404.

## Diagrams (instead of images) {#diagrams}

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
  plus a `.seg-tag` label (`.seg-tag.padtag` for padding).
- A worked example of both sits on the demo's `reference/kitchen-sink` page.

## Widgets {#widgets}

A live illustration is two touches, no templates or head edits:

1. In the text: the `widget` shortcode above.
2. Next to `index.md`: a `widgets/<id>/` folder — `widget.js` and, if the
   building-block classes below aren't enough, `widget.css`. The theme finds
   every `widgets/**.js` and `widgets/**.css` in the bundle, concatenates each
   in filename order, builds and fingerprints them, and loads the result
   **only on this page**.

Register each figure by its mount id, in `widgets/w-escape/widget.js`:

```js
Taiga.widget("w-escape", function (root) {
  // `root` is the .w-root mount — build the interactive here (vanilla JS).
});
```

`Taiga.widget` is a tiny runtime in the theme, and this call is the one thing
that hasn't changed shape: it still waits for the DOM, finds the mount by id
and hands it to your callback inside a `try/catch` — a widget that throws logs
to the console and doesn't take down its neighbours; a missing mount (shortcode
removed) is skipped silently. The id in the shortcode and in `Taiga.widget(…)`
must match character for character.

A bundle with more than one widget can add a `widgets/_shared/` folder for
code or classes several of them need — a `lib.js` (the runtime guard plus any
shared helpers) and a `shared.css`. The build sorts by filename, and `_shared`
always sorts ahead of every `w-*` folder, so `_shared/lib.js` lands first in
the concatenated script and its declarations are already in scope for every
`widgets/<id>/widget.js` after it — they're fragments of one build, not
separate files each with a closure of their own. A worked, commented example of
the whole layout — a static widget, an interactive one, and `_shared/` — sits
on the demo's `reference/widget-anatomy` page.

Use the theme's building-block classes so the widget looks native without a line
of your own CSS: `.w-row` (control row), `.w-btn` (`.primary`/`.ghost`),
`.w-num` (big number; add `.tick` to its `<b>` to animate a change),
`.w-badge.ok`/`.alloc`, `.w-cap` (output line), sliders as `.gc-slider-row` with
a `.nval` readout. A widget should work offline with no dependencies and have a
clear initial state.

### One widgets/ folder, two languages {#widgets-i18n}

**A bundle's `widgets/` folder is shared across translations.** Hugo has no
per-language variant of a page resource: `index.md` and `index.ru.md` are two
pages of *one* leaf bundle, and the bundle has exactly one `widgets/` folder. So
a widget with hardcoded strings shows the wrong language on half of a bilingual
site — and nothing warns you.

The demo solves it by branching on the document language, which the theme sets on
`<html lang>`:

```js
Taiga.widget("w-series-math", function (root) {
  var RU = document.documentElement.lang.indexOf("ru") === 0;
  var L = RU
    ? { onPart: "ты на части", cap: function (n, total) { … } }
    : { onPart: "you are on part", cap: function (n, total) { … } };

  // …build the widget, taking every user-visible string from L
});
```

Keep the strings in one object per language at the top of the widget and never
inline a literal further down — that is the whole discipline. `indexOf("ru") === 0`
rather than `=== "ru"` so a `languageCode` like `ru-RU` still matches. See
`exampleSite/content/inside/anatomy/series-knows-itself/widgets/w-series-math/widget.js`
for the full pattern.

The same holds for every other bundle resource: an `og.png` override, a
`figure.html`, and everything under `widgets/` are one copy for both languages.

## Covers (OG images) {#covers-og-images}

Every guide gets an Open Graph cover generated at build time — backdrop + series
kicker + title + minutes — for **zero author effort**, in the language of the
page. To override one guide: drop an `og.png` (or `og.jpg`) in its bundle, or set
`og_image:` in front matter. To change the style for a page, `og_style:`;
site-wide, `params.ogImages.style`
(see [customizing.md](customizing.md#og-cover-styles)).

## Rubrics {#rubrics}

A rubric is a section with an `_index.md`:

```yaml
title: "How-to"
params:
  label: "handbook"         # kicker label on this rubric's guides, and the feed card's rubric link
  slug_mono: "howto"        # mono slug in the rubric page's own kicker
  sub: "from install to your first guide."   # optional h1 subtitle
  lead: "What this rubric is about."
  card_line: "Take it and get moving."       # optional line on the home page's rubric card
  foot: "Closing note under the rubric."
```

List the section in `params.rubricSections` (site config) so its leaf pages get
the full guide layout.

## Translating a guide {#translating-a-guide}

Content pairs **by file suffix**, inside the same bundle:

```
content/inside/anatomy/series-knows-itself/
  index.md        ← default language
  index.ru.md     ← the translation
  widgets/        ← shared by both (see above)
```

Rubric and series index pages pair the same way: `_index.md` ↔ `_index.ru.md`.

Two fields must stay **identical across the two files**:

- **`slug`** — so the page and its translation share a URL path (`/inside/anatomy/series-knows-itself/`
  and `/ru/inside/anatomy/series-knows-itself/`). The language switcher then hops between
  them in place instead of dumping the reader on the home page.
- **`tags`** — so the tag chips, the tag cloud and the `/tags/#<tag>` feed line up
  on both sides. Translate the tag and you get two half-empty clouds.

Everything else — `title`, `description`, `lead`, `rail_title`, prose — is
translated. `weight`, `mins` and `version` are structural: copy them verbatim.

Content paths inside front matter (`related:`) and in links resolve **per
language**, so they are written once and identically in both files:
`related: ["inside/anatomy/palette-is-a-file"]` picks the English page from `index.md`
and the Russian one from `index.ru.md`.

Nothing else is needed on the theme side: the language switcher appears by
itself, `hreflang` alternates are emitted, and the feed date is rendered from
i18n month names — no per-language partial to mirror.

## Voice {#voice}

The reference is the demo's own guides (`exampleSite/content/`). In short:

- Conversational, precise, second person. No corporate-speak, no marketing.
- The arc is **naive → pain → fixed → this is how it really works**: a simple
  model first, where it breaks, then the real machinery.
- One through-line per guide; return to it.
- Italic checkpoints after big blocks: *"Now you can …"*.
- Short everyday metaphors (a library slip, a parcel tag).
- Widgets woven in with a concrete task: "Play — …".
- `h2` headings are short and substantive — not "Introduction" / "Conclusion".
- End with a "What's next" section and a bridge to the next part.

Prose is copied verbatim when porting — don't silently edit text; fix a real
error and note it.
