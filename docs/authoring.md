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
| `description` | yes | Feed card, search result, `og:description`, RSS `<description>`. Write it for the result page, not as a second title: 70–160 characters, and **no markdown** — it is a plain attribute, carried through verbatim, so a backtick prints as a backtick (the lint says so). `lead`, by contrast, IS markdown: the page renders it, and so does the description fallback. The archetype ships a `TODO` **sentinel** here, and `params.seo.lint` fails the build while it is still in place — a guide is not allowed to reach production describing itself as TODO. |
| `lastmod` | when you revise | The date a published guide last changed, e.g. `2026-09-22`. It is what `dateModified`, `article:modified_time` and the sitemap report — a search engine has no other way to learn that the guide is not the one it indexed a year ago. Standard Hugo front matter; no `enableGitInfo` needed. |
| `titleSuffix` | optional | Overrides whether `<title>` ends with ` — <site>`. The site name is normally appended only while the whole line fits `params.seo.titleMax`; `false` drops it from a page that fits, `true` keeps it on one that does not. |
| `noindex` | optional | `true` keeps the page out of search: `noindex, follow` in the robots tag and no entry in `sitemap.xml`. For a page that exists for a reason other than being found. |
| `lead` | legacy | One-paragraph opening, kept for guides written before the `<!--more-->` divider (below). Also the fallback for `og:description`. |
| `weight` | for series parts | Part order inside the series folder. See [Series](#series-and-weight). |
| `tags` | recommended | Chips linking to the tags page, anchored at `#<tag>`. Keep **identical across translations**. |
| `mins` | recommended | The reading-time chip, the rubric duration sum and the series-bridge scale; falls back to `.ReadingTime`. |
| `version` | optional | Free-form "tested on" chip, rendered verbatim (`go1.26`, `PostgreSQL 17`). Falls back to `params.versionDefault`; unset on both ⇒ no chip. |
| `arch` | optional | Appended to the version chip after a `·`, e.g. `64-bit`. |
| `interactive` | optional | Adds a third meta chip listing what is interactive on the page. |
| `interactive_label` | optional | Label for that chip; defaults to the i18n `meta_interactive`. |
| `rail_title` | optional | Short label for the left rail, the minimap and the series bridge. Defaults to the title up to the first `:`. |
| `linkTitle` | optional | Short title for the rubric page's series list. Doesn't touch the `<h1>` or `<title>`. |
| `related` | standalone only | 3–5 **content paths** (`inside/anatomy/palette-is-a-file`, not a URL) for the "related" rail. With none listed — or none that resolves — the left rail is not rendered at all. Ignored on a series guide, which shows its parts instead. |
| `placeholder` | optional | See [Placeholders](#placeholders). |
| `og_image`, `og_style` | optional | See [Covers (OG images)](#covers-og-images). |
| `cover` | optional | The page's own picture — the feed banner and the share card. See [Covers (OG images)](#covers-og-images). |
| `sub` | optional | Overrides the automatic `title` split. |
| `intro` | optional | Markdown rendered between the meta chips and the TOC. |
| `foot` | optional | Markdown rendered at the very bottom, below the series bridge. |
| `mascot` | standalone only | Renders the site's `_partials/page/mascot.html` at the top of the page, with this value as the partial's context. No such partial on the site ⇒ nothing renders. |
| `toc_labels` | deprecated | Map of heading id → short label for both TOCs: `toc_labels: {two-fields: "Two fields"}`. It makes you spell out heading ids, so write `{short="…"}` on the heading instead (see [Short TOC entries](#short-toc-entries)). Still read, so pages already using it keep working. |
| `toc_inline` | optional | Keeps the boxed TOC in the prose on wide screens, where the right rail otherwise replaces it. The rail then stays hidden — minimap included — while the block is on screen, and fades in once it scrolls past. For a long survey, where the block is a map read before the article; an ordinary guide does not need both. |
| `lead_deck` | optional | Sets the standfirst as a display deck (19px, quieter) instead of ordinary prose. For an opening that introduces the piece; on a guide whose standfirst simply starts it, leave it off. |
| `draft` | optional | Standard Hugo. The archetype sets `draft: true`. |

`kicker:` and `headline:` are read only on **non-guide** pages (about, roadmap,
`/tags/`); on a guide the kicker is derived from the rubric and the series, and
setting them does nothing.

### The lead and `<!--more-->`

Put a `<!--more-->` line after the guide's opening prose:

```markdown
Opening paragraphs that stand on their own and earn the click.

<!--more-->

## First section
```

That divider does two jobs. In the article it splits the standfirst from the
body — the prose above it is the opening, styled as ordinary body text. In the
feed it becomes the preview, if the site set `params.home.feedPreview =
"summary"`; a guide **without** the divider keeps showing its `description`
instead, because Hugo would otherwise synthesise a summary that cuts
mid-sentence. So end the lead on a hook, not in the middle of an example.

### Short TOC entries {#short-toc-entries}

A section title can afford a colon and a clause; a table of contents cannot —
at rail width it wraps to three lines. Give the heading a short name for the
lists with `{short="…"}`:

```markdown
## Runtime: allocations, traceback labels, timers {short="Runtime: allocations and timers"}

### A subsection whose name is longer than the rail {short="Subsections"}
```

It applies to `h2` and `h3`, and both tables of contents read it: the boxed
block in the prose and the right rail. The heading itself, its `id` and the
anchor link are untouched — the short name lives only in the lists — so you
never have to know what Hugo made of the title. A heading without it is listed
as written.

It is a Goldmark heading attribute, the same mechanism as `{#custom-id}`, and
sits in the same braces: `## Title {#custom-id short="Short"}`.

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
lead, the `_index.md` body as an epigraph, the parts list and a "start
the series" CTA. The lead is `lead` when the series has one and `description`
otherwise — the same split a rubric uses: `lead` is written for the page and
may run as long as the page carries it, while `description` has a second job as
the meta tag and the share card, where a long line is cut mid-thought. The rubric page shows the same series as an anchored block
(`/<rubric>/#<series>`); a series announced with an `_index.md` but no parts
yet appears there as an "in the works" teaser, and its landing renders the
announcement. Scaffold the `_index.md` with the archetype:

```sh
hugo new content howto/handbook/_index.md --kind series
```

```yaml
title: "Memory"             # series name, used in kickers, the rubric block and the landing
description: "One line — the meta tag and the share card of the landing."
lead: "The paragraph the landing shows (optional; may run longer)."
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

## Emphasis in prose {#emphasis}

A `>` quote is somebody else's words. What you say in your own voice gets a
block of its own — written as plain Markdown, so the same source reads natively
in Obsidian (the companion theme styles all four):

| Block | Markdown | For | How often |
|---|---|---|---|
| Thesis | `>> text` | the section's conclusion, one to three sentences | at most one per `h2` |
| Aside | `> [!aside]` | "by the way", an analogy, a caveat — a step quieter | as needed |
| Recap | `> [!recap] label` | the checkpoint closing a section: "now you can …" | at most one per `h2`, not next to a thesis |
| Epigraph | `> [!epigraph] source` | a quotation on a threshold | one per threshold: a guide, a section, a series page |
| Quote | `> text` | somebody else's words, and only them | as needed |

```md
>> After an `append`, every old header onto the same array is under suspicion.

>> A thesis of two paragraphs: the blank line between them is `>>` too.
>>
>> The second paragraph.

> [!aside]
> By the way, the header is passed by value.

> [!recap] checkpoint
> Now you can tell whether a function may grow your slice in place.

> [!epigraph] Rob Pike, [Go Proverbs](https://go-proverbs.github.io/), 2015
> Clear is better than clever.
```

A thesis is upright and in prose colour, with an accent rule where a quote has
its own; the quote stays italic and a step quieter. An aside has no rule at
all — an indent and a smaller, quieter type. A recap is a short accent rule and
a mono label over an ordinary paragraph (no label → i18n `recap`). An epigraph
is the one block set wholly in italic, moved to the right, its source a mono
line; the dash before the source is drawn for you. All of them keep one
vertical: the sign on the column edge, the text at the list inset, so a quote
and a thesis on the same page line up.

The markup has rules, and the build warns (a strict build fails) when one is
broken:

- The text of `[!aside]`, `[!recap]` and `[!epigraph]` starts on the **next**
  line. The marker line is the recap's label or the epigraph's source; on an
  aside it would be dropped.
- The type is Latin letters only, with no `+`/`-` fold sign. An unknown type
  (`[!asdie]`) renders as a plain quote.
- Don't mix `>` and `>>` in one quote: a quote holding nothing but one inner
  quote is the thesis, and anything else beside it keeps it a quote. In
  Obsidian write the marker on every line — a lazy continuation line loses its
  level there.
- Block attributes work as on any block: `{#append-rule}` on the line after a
  thesis gives it an anchor to link to.
- An epigraph that opens a guide stands **above** the lead: write it first and
  keep the `<!--more-->` divider (see "The lead and `<!--more-->`" above). The
  page lifts it out of the lead, the feed and the meta description. With the
  legacy `lead:` param it renders below the lead instead.

Inline emphasis stays small. **Bold** (weight 600) is a term at the moment it
is defined, or a run-in head; *italic* is one to three words of stress — a
true Inter italic, fetched only by a page that sets one. A one-sentence idea no
longer needs `callout type="key"`: that is what `>>` is for.

## Shortcodes {#shortcodes}

Eleven — seven for any guide, four more for a site that runs a newsletter.

### callout — `{{</* callout type="trap" */>}}` {#callout}

Five types: `key` (key idea), `trap`, `note` (historical note), `internals`
(under the hood), `warn` (caution). The label comes from i18n (`callout_key`,
`callout_trap`, `callout_note`, `callout_internals`, `callout_warn`); override
with `label=`. The body is Markdown. `type` defaults to `note`.
A callout is a sidebar the text can do without. The main idea in one sentence
belongs in the flow as a thesis (`>>`, see [Emphasis in prose](#emphasis));
`key` is for a conclusion that needs several paragraphs or a checklist.

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

**The quiet belongs to the collapsed state, not to the revealed one.** The
opened panel is set in prose — the size and colour of the article around it —
because clicking "Развернуть" *is* the reader agreeing to read this, and
answering that with small dim type punishes the click. What says "inset" is
structure, not typography: the summary row on top, a thin rail down the left
(it grows out of the icon and is the only cue that survives scrolling — past
the first screen the summary is gone), and, on long folds, a closing row.

**Two registers, picked from the body's length.** A short fold (under ~900
runes) stays a footnote: quiet summary, no closing row. A long one becomes an
optional chapter — summary at reading size, its own air around the block, a
quicker reveal (0.2s across four screens read as a jolt) and a "Свернуть"
button at the end that collapses the panel *and*, if the summary has scrolled
off the top, returns the reader to it; collapsing from the bottom otherwise
teleports them into an unrelated paragraph. The register follows what was
written rather than being asked of the author; `size=` overrides it.

The rail is an exit too: clicking it collapses the fold, and hovering it warms
both the line and the closing row. Wherever the reader is in a long panel, the
way out is one move to the left. Mouse only — on touch a strip down the left
margin of a scrolling page would catch stray taps, with no hover state to warn
about it first.

On a phone (≤560px) that single line becomes two: the title takes the whole
width and the toggle moves under it, so a long summary is not squeezed into
three-word lines by a label standing next to it.

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
| `size=` | `note` or `section` — override the automatic register |

Icons: `video` · `info` · `tip` · `book` · `code` · `terminal` · `warning` ·
`star` · `link` · `note`.

The panel animates its height — a real slide, not a fade — via
`interpolate-size` on `:root` (set in `00-tokens.css`); where a browser lacks
it the panel snaps open. Labels default to Russian; override per call.

Written inside a `bars` or a `chart`, a fold is the card's footer instead —
lighter, and with only `title=` and `open=`: see
[Data figures → a fold under a figure](#figure-fold).

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

#### A diagram or a picture in a card

The body is rendered as block Markdown — the same pipeline as the article — so
anything legal in a guide is legal in a definition, raw block HTML included. A
diagram is therefore the theme's own diagram markup (see [Diagrams](#diagrams)),
written inside `{{</* raw */>}}`, and it needs no shortcode parameter:

```md
a slice is a {{</* term word="three-word header" kind="layout" */>}}
Three machine words, always in this order:

{{</* raw */>}}
<div class="header">
  <div class="header-word ptr"><span class="wk">ptr</span><span class="wv">0x1040</span></div>
  <div class="header-word"><span class="wk">len</span><span class="wv">4096</span></div>
</div>
{{</* /raw */>}}

Re-slicing moves `len`; only growing past `cap` moves `ptr`.
{{</* /term */>}}, not a growable array.
```

A picture goes in the same way, as a plain Markdown image — there is no `img=`
parameter and no need for one. It goes through the article's own render hook,
which resolves the name against the page bundle first and then `assets/img/`,
stamps the intrinsic size, and takes the `alt` from the Markdown; a quoted title
becomes a caption, exactly as in the prose:

```md
the allocator hands out a {{</* term word="span" kind="runtime struct" */>}}
A run of pages carved into objects of one size class.

![how a span is carved](span.png "8 KiB, one size class")

The class decides everything else about the object.
{{</* /term */>}}, never a single object.
```

Four ways this goes quietly wrong:

- **Raw HTML with a blank line in it gets cut in half — use `{{</* raw */>}}`.**
  A blank line ends a Markdown HTML block, and what follows is parsed as
  Markdown again: indented lines (the natural way to write nested `<div>`s)
  come back as a code block full of escaped tags, and the build never says a
  word. The `raw` shortcode captures its body whole, which is why the example
  above uses it. Inline HTML with no blank lines needs no wrapper.
- **The card is narrow.** Roughly 360px of content for a plain definition,
  420px once it holds a list, a table, an image or code, and 480px once it
  holds a diagram or a captioned picture — the card picks the bracket from what
  is inside it. On a phone it is a bottom sheet as wide as the screen, which is
  usually *less*. Anything wider scrolls sideways inside the card, and macOS
  draws no scrollbar to say so. Draw for ~480px, or build the diagram out of
  wrapping rows (`.mem-row`, `.byte-strip`) so it reflows instead.
- **An SVG needs `width` and `height` on its root element.** The render hook
  stamps intrinsic dimensions for raster images only, so a `viewBox`-only SVG
  has no size to reserve: it opens the card at a fraction of the size you drew,
  and the popover gets placed against that wrong height. A raster image is
  safe — its dimensions are in the markup.
- **A card is a `role="dialog"`.** A screen reader reads its whole contents, so
  a picture carries real `alt` text (the `![alt]` part — not a filename), and a
  decorative diagram carries `aria-hidden="true"` on its outer element.

Two more things worth knowing:

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

`bare="true"` drops the frame: no border, no padding, the caption hidden from
the eye but kept as the figure's accessible name. For a figure that has to read
as part of the prose — an explorable sentence, a slider under a paragraph.

### bars — `{{</* bars */>}}` + a table {#bars-shortcode}

Horizontal bars from a Markdown table: one series, grouped, or stacked. See
[Data figures → bars](#bars).

### chart — `{{</* chart */>}}` + a table, or `{{</* chart src="…" /*/>}}` {#chart-shortcode}

A line chart drawn from data alone — a table in the body, or a YAML file in the
bundle. See [Data figures → chart](#chart).

### mk — `{{</* mk blue circle */>}}` {#mk-shortcode}

A series' glyph inline, before the name it marks — in a table's header, a
sentence, a list item: the shape and colour the chart gives that series. See
[Data figures → a series glyph in the text](#series-glyph).

### spanmap — `{{</* spanmap bits="111100" size="24" */>}}` {#spanmap-shortcode}

A span's slots and its allocation bitmap, derived from the bits. See
[Data figures → spanmap](#spanmap).

### bigcard — `{{</* bigcard href="/playground/" k="Playground →" t="…" s="…" */>}}` {#bigcard}

A link card: `k` kicker, `t` title, `s` subtitle. An internal `href` is resolved
to its permalink (and so survives a slug change); an external one passes through.

### raw — `{{</* raw */>}}…{{</* /raw */>}}` {#raw}

Passes its inner HTML through untouched — for the hand-built diagrams below.
Unlike a bare HTML block in Markdown, a shortcode captures its body whole, so
blank lines inside don't cut the block short — at the top level. Inside a
`{{</* term */>}}` the body is Markdown rendered after the shortcode, and there
a blank line in the HTML still ends the block. Before reaching for raw HTML,
look at [Data figures](#data): in Obsidian raw HTML is a wall of source.

### run — `{{</* run sandbox="go1.26.4" */>}}…{{</* /run */>}}` {#run}

Turns the code block above it into a runnable one and carries the output under
it. Documented with the rest of the machinery in
[Runnable snippets](#runnable).

### roadmap — `{{</* roadmap */>}}` {#roadmap}

Renders the roadmap blocks — "in progress" cards, the queue, the rules — from the
site's roadmap data: either a flat `data/roadmap.toml` or, on a multilingual
site, `data/roadmap/<lang>.toml` (what the demo ships). Same data feeds the "in
progress" strip on the home page. See the demo's `roadmap.md`.

### newsletter, newsletter-cta, newsletter-inline — subscription blocks {#newsletter}

Only on a site that runs a newsletter (`params.newsletter.enable`, off by
default). On a site that does not, they **fail the build** rather than render
nothing quietly — a shortcode that vanishes without a word is a question nobody
can answer from the page. A site that pulled the switch on purpose and wants to
keep the markup adds `ignoreLogs = ['newsletter-disabled']`, and the blocks go
silent again: [newsletter.md](newsletter.md#shortcodes).

```md
{{</* newsletter label="series · next" dismiss="sched-1" */>}}
This is part one. Leave your address and I'll send the next one.
{{</* /newsletter */>}}
```

`newsletter` is the quiet mid-text block (with `dismiss=` the reader can close
it for good), `newsletter-cta` the fuller card at the foot of an article, and
`newsletter-inline` a bare form for a page written as prose. Every text is
yours: shortcode params → the page's `newsletterCta` front matter → the theme's
i18n defaults. Two more — `newsletter-archive` and `newsletter-letter-example` —
belong to the subscribe page and appear wherever they are written. All of it,
with the config: [newsletter.md](newsletter.md).

## Code blocks {#code-blocks}

Fenced code as usual, highlighted server-side by Chroma and recoloured to the
theme palette. The lit languages are

```
go  json  yaml/yml  bash/sh/shell/zsh  c  css  html  xml
javascript/js  typescript/ts  sql  diff  python/py
```

and a **bare fence**, ` ```text ` or ` ```txt ` is the plain form — it renders
as `<code class="nohl">`, which is what a shell transcript, a trace or a gc log
wants. Anything else falls through to plain as well; the list is an allowlist
rather than "whatever Chroma can lex", because a language whose central tokens
have no colour in this palette reads worse half-lit than flat. `toml` and `asm`
were tried and rejected on that test — see the note in
`layouts/_markup/render-codeblock.html` before adding one.

Colours mean the same thing in every language: amber a keyword, blue a type or
a structural name (a JSON key, an HTML tag), green a callable, copper a number,
one tone for strings, muted italic for comments.

Two fence attributes:

````md
```go {label="runtime/malloc.go (simplified)" hl_lines=[2]}
func mallocgc(size uintptr) unsafe.Pointer { … }
```
````

- `{label="…"}` — a file caption above the block. Works on any language.
- `{hl_lines=[2]}` — highlight lines; ranges go in as strings, `hl_lines=[2,"5-7"]`.
  Lit blocks only (it is a Chroma option, so a plain fence has nothing to mark).

Every listing carries a **copy button** — nothing to write, nothing to switch
on. It is not there while the block is being read: it appears in the top-right
corner when the pointer enters the listing or the keyboard reaches it, and takes
the code with the trailing newline stripped, so a shell pasted into offers the
command rather than running it. On a runnable snippet in editing mode it copies
what the reader has typed, not the original. Touch screens have no hover to
reveal it, so there it is simply always visible, a tone quieter. Labels are the
`js_copy_*` keys in `i18n/`; styling is `assets/css/27-code-copy.css`.

### Runnable snippets {#runnable}

A code block becomes runnable — and editable — when a `{{</* run */>}}` shortcode
follows it. The runner is [codapi](https://github.com/nalgeon/codapi-js). Point
the site at your sandbox once:

```toml
[params.codapi]
url = "https://run.example.com/v1"
```

and the guide says nothing about it:

````md
```go
func main() { fmt.Println("hi") }
```
{{</* run sandbox="go1.26.4" */>}}
hi
{{</* /run */>}}
````

The theme ships codapi itself (`assets/vendor/codapi/`, MIT) and loads it only on
pages that have a snippet — pinned, fingerprinted and served from your own domain
like the rest of the bundle. A `sandbox=` without `params.codapi.url` **fails the
build**: a Run button wired to nothing is worse than a broken build. To upgrade
or downgrade codapi, drop your own `assets/vendor/codapi/snippet.js` over the
theme's.

There is no per-snippet server: codapi reads the endpoint from one global
setting at request time and never looks at the snippet element, so a `url=` on
the shortcode would look authoritative and change nothing. Writing one is a build
error rather than a silent no-op.

#### The output block {#run-output}

The shortcode's body is **the output the author recorded**, and it is on the page
from the start: most readers never press Run, so this is the primary view, not a
fallback. It renders as a terminal transcript whose first line is a prompt —
`$ go run main.go` — and that line is also the toggle and the status readout.
Folded, the prompt is all that is left, which reads by itself as "the command
ran, its output is put away".

Press Run and the result **replaces** the recorded output in place. codapi would
otherwise render a second, near-identical block right under the author's one and
leave the reader to work out which is theirs; here the page carries exactly one
output, always. The provenance text at the end of the prompt line says whose it
is — `example` → `run · 128 ms` (green) or `error · 89 ms` (copper) — and
**restore example** puts the author's back. The body is taken **verbatim**, so
write it flush left: program output owns its own indentation.

A cache in front of the runner would otherwise make that number a lie. A
replayed answer carries the duration of the **original** run, so a second press
on unchanged code lands in a tenth of the time and still reports the first run's
figure — the same number however often the reader presses, which reads as a
stuck widget rather than as a fast cache. So the theme times the wait itself
whenever an answer arrives faster than the duration it claims: a server cannot
answer in less time than the run took, so that answer was replayed, and the chip
shows what the reader actually waited for. A run that really happened keeps the
server's own figure, which is the better number for a guide about performance —
it has no network in it. Nothing here depends on a particular cache or on its
headers; the snippet's own `result` event carries `cached: true` on a replayed
answer, for a site that wants to say so out loud.

The output is set like the listing above it — the same font, size and line
height — and past 18 rows it scrolls inside the block rather than pushing the
page down. The listing reaches the sandbox as a file that ends with a
newline, the way a file on disk does: codapi trims it off, and a command that
diffs the file (`go fix -diff`, `gofmt -d`) would otherwise report
`\ No newline at end of file` that an output recorded from a real file never
shows. The theme puts it back on the way out, after the template, only where
it is missing.

| param | |
|---|---|
| `sandbox=` | codapi sandbox id. Required, except for a run with no sandbox behind it (see below). |
| `command=` | codapi command. Default `run`. |
| `editor=` | `basic` (editable) · `off` (read-only listing). Default `basic`. |
| `cmd=` | the command shown on the prompt line. Defaults to a readable stand-in for sandbox+command (`go run main.go`, `go test`, `go test -bench=.`). |
| `note=` | a short caption, set as a shell comment after the command: `# stderr — the full trace`. This is what a folded block says about what is inside it. |
| `open=` | `false` ships the output folded away. Default open. |
| `error=` | `true` when the recorded output IS an error — it then reads in the failed colour from the start. With several commands it names the commands whose recorded part is an error instead ([below](#run-modes)). |
| `label=` | the main command's name in the mode switch of a snippet with several commands ([below](#run-modes)). |
| `lang=` | the language the output is written in, to have it highlighted: `diff` ([below](#run-lang)). |

Written self-closing — `{{</* run sandbox="go1.26.4" /*/>}}` — the block ships
hidden and appears with the reader's first result. Written **without** `sandbox=`
it renders alone, with no Run button and nothing to press: for output recorded on
a machine the reader cannot reach (another Go version, another CPU count). Pass
`cmd=` there, since there is no sandbox to derive the prompt from.

Also passed through to `<codapi-snippet>` when given: `url`, `template`, `files`,
`id`, `depends-on`, `actions`, `output-mode`, `engine`, `selector`, `init-delay`,
`status-running`, `status-done`, `status-failed`. The last three are codapi's own
status labels (`Running…` / `✓ Done` / `✗ Failed`), left in English by default
like the rest of the snippet controls. The block's own labels are the `run_*`
keys in `i18n/` — see [i18n.md](i18n.md).

An `output-mode` other than text (`table`, `svg`, `iframe`…) builds DOM of its
own, so those results stay in codapi's own box and the recorded output is left
untouched.

#### Several commands {#run-modes}

codapi's `actions="Label:command"` runs the same listing under another command
of the sandbox — a build with an experiment off, a test run, a benchmark.
Written with actions, the body is a terminal transcript: the main command's
output first, then, for every action in the order `actions=` lists them, a line
starting with `$ ` — that action's prompt — and its output.

```md
{{</* run sandbox="go1.27" command="asm" label="With specialization"
        actions="Without_specialization:asm-nospec"
        cmd="go build -gcflags=-S main.go | grep CALL" */>}}
main.go:7   CALL runtime.mallocgcSmallNoScanSC3(SB)

$ GOEXPERIMENT=nosizespecializedmalloc go build -gcflags=-S main.go | grep CALL
main.go:7   CALL runtime.newobject(SB)
{{</* /run */>}}
```

On the page this is **one** output block with a mode switch in the toolbar:
«With specialization | Without specialization», then Run. Picking a command
runs nothing — it shows that command's part of the transcript, recorded or the
reader's own last run of it, and Run runs the command picked (so does
<kbd>⌘/Ctrl+Enter</kbd> in the editor). Each part keeps its own prompt line,
provenance and **restore example**. The two parts sit in the same place, so
comparing them is flicking between two options. Without JS, in a feed reader
and on paper, every part is there, one under the other.

- `label=` names the main command in the switch; the actions are named by
  their own labels (`_` for a space, as codapi reads them). Without `label=`
  the command's id stands in and the build warns.
- `cmd=` and `note=` describe the main command's part; `open=` holds for the
  whole block.
- `error="true"` marks the main command's part as a recorded error. An
  action's recorded run can be one too — a compile error under another Go
  version — and then `error=` names the parts by their commands,
  space-separated: `error="run-go126"` marks that action's part,
  `error="run run-go126"` both (`run` being `command=`, its default; `true`
  in the list stands for it as well). A marked part reads in the failed
  colour from the start and after **restore example**, like the main one
  does. A name that is no command of the block **fails the build**, so
  without `actions=` the list may name `command=` alone — which is `true`
  spelled longer.

  ```md
  {{</* run sandbox="go1.27" label="Go 1.27"
          actions="Go_1.26:run-go126" error="run-go126" */>}}
  ["1" "2" "3"]

  $ go1.26.4 run main.go
  # sandbox
  ./main.go:10:21: syntax error: method must have no type parameters
  {{</* /run */>}}
  ```

- A part may be just its `$ ` line: nothing is recorded for that command, and
  its part appears with the first run.
- The cut is keyed on `actions=`: without command actions a `$ ` inside the
  output is output. With them, a number of `$ ` lines that does not match the
  number of commands **fails the build** — a stray `$ ` in a program's output
  would otherwise cut the block in the wrong place without a word. So do an
  action repeating a command, `actions=` without `sandbox=`, and an
  `output-mode` other than text.
- An `@event` action is codapi's own business: it keeps its link and takes no
  part of the body.

#### Output as a diff {#run-lang}

When the command prints a unified diff — `go fix -diff`, `gofmt -d` — say so
with `lang="diff"`, and the output reads like a `diff` code block:

```md
{{</* run sandbox="go1.27" command="fix-diff" lang="diff" cmd="go fix -diff ." */>}}
--- main.go (old)
+++ main.go (new)
@@ -3,6 +3,6 @@
 import "fmt"
 
 func main() {
-	var v interface{} = 42
+	var v any = 42
 	fmt.Println(v)
 }
{{</* /run */>}}
```

- Lines are read by their first characters: `+` is an inserted line and `-` a
  deleted one, in the colours a `diff` code block gives them; `---` / `+++`
  (the file header, set a weight above) and `@@` (a hunk header) step back to
  the muted tone; everything else is context and stays as it is.
- It holds for the whole block: every part of a snippet with several
  commands, the recorded output and a live one alike — after a run, after a
  switch, after **restore example**. Nothing is added to the text: what the
  reader selects and copies is the diff, byte for byte.
- `diff` is the only language so far; any other value **fails the build**.
  Not to be confused with codapi's `output-mode=`, which hands the result to
  codapi's own box instead.

#### The editor {#run-editor}

The theme dresses codapi's own chrome (Run, status) in the palette, and
**replaces its editor**. With `editor="basic"` or `editor="external"` the block
gets an **Edit** button; pressing it opens a real editing mode:

- syntax highlighting stays live while typing — a client-side Go lexer emits the
  same Chroma classes the build-time pass does (codapi's own editor strips the
  highlighting on first focus, which is what this replaces);
- the block lifts one surface tone for as long as the mode is open, and stays
  there when focus moves away, so an edit is never lost by clicking elsewhere;
- **Close** leaves the mode, **Esc** does the same, **Reset** appears once the
  code differs from the original and restores it exactly, highlighting included;
- <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> indent, and re-indent whole lines when
  the selection spans more than one; <kbd>Enter</kbd> keeps the indentation and
  opens a body between a `{` `}` pair; brackets and quotes auto-close, wrap a
  selection and type over their own closer; <kbd>⌘/Ctrl+/</kbd> toggles line
  comments; <kbd>⌘/Ctrl+Enter</kbd> runs; undo and redo are the browser's own.

`editor="off"` leaves a read-only listing with a Run button. Reformatting a block
wholesale drops `hl_lines` highlighting for that session — Reset brings it back.
The labels are `js_code_*` in `i18n/`.

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

## Images {#images}

A picture in the text is a plain Markdown image, and the file is found by name —
the exact path next to the article, then the bare file name anywhere in its
bundle, then under `assets/img/`. So the shortest form is usually enough:

```md
![A certificate form: who it was issued to, the public key, who vouched](cert-fields.png)
```

Give the image a Markdown title and it gets a caption under it, centred with the
picture:

```md
![alt](cert-fields.png "What a certificate holds")
```

A name that resolves nowhere warns, and `hugo --panicOnWarning` turns that into
a failed build: a typo cannot ship as a broken `<img>`.

### Floating a picture beside the prose {#img-right}

A supporting picture — one that illustrates the paragraph rather than
interrupting it — can run down the right margin with the text beside it. Mark
the image's own paragraph with `{.img-right}`:

```md
![A certificate form, filled in by a gopher](cert-fields.png)
{.img-right}

**x509.** A certificate is a strict format: who it was issued to, the public
key, who vouched for it…
```

Three things decide whether this works, and two of them fail silently:

- **The attribute line must touch the image's line.** It is a Markdown
  attribute (`markup.goldmark.parser.attribute.block`, which the site turns on
  in its own `hugo.toml` — a theme cannot), and Hugo hangs it on the block
  directly above. A blank line between them and the line is dropped without a
  word: no class, no error, no `{.img-right}` in the output either.
- **The float needs prose to flow beside it.** Code blocks, tables and callouts
  clear it on purpose — a boxed element sharing a line with a floated picture
  reads as broken markup, not as a layout. Text is what the float is for, so
  put enough of it after the image to fill the column.
- **Below 620px there is no second column**, and the picture goes back to full
  width. Nothing to do about it; just do not count the float when judging how
  the section reads on a phone.

The picture takes 44% of the column and keeps its caption if it has one.

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
- A span and its bitmap has a shortcode of its own, `{{</* spanmap */>}}`, and
  numbers have [Data figures](#data): prefer those — in Obsidian raw HTML shows
  as a wall of source.

## Data figures {#data}

Numbers a reader should compare at a glance — a row of promises, two sizes
against each other, a curve with a cliff in it — are written as **data in
Markdown**, and the theme draws them. No HTML in the guide, no widget to write:
the same source reads as a plain list or table in any Markdown viewer, and
Obsidian draws it too (the Taiga theme and the taiga-companion plugin).

| What | Write | Drawn by |
|---|---|---|
| A row of 2–4 big numbers | `> [!stats]` over a list | CSS only |
| A number with its detail in a table | `−41% *9,2 → 5,5 ns*` in a right-aligned cell | CSS only |
| A series' glyph before a name — in a table header, in a sentence | `{{</* mk blue circle */>}}` | CSS, a few lines of JS |
| Horizontal bars — one series, groups, parts | `{{</* bars */>}}` + a table | HTML/CSS, a tiny label fitter |
| A line chart with a reading panel | `{{</* chart */>}}` + a table, or a YAML file | Observable Plot, loaded on demand |
| A span's slots and bitmap | `{{</* spanmap bits="111100" size="24" */>}}` | HTML/CSS |
| The exact values under a figure, folded | `{{</* fold */>}}` inside `bars` or `chart` | native `<details>` |

One grammar runs through all of them: **bold** is the thing, a trailing
*italic* is the quiet addition — a source, a detail, a note. Numbers print the
page language's way (`num_decimal`, `num_group` in i18n) with a real minus sign.

The theme's own `hugo.toml` sets no markup options; a site using these needs
`markup.goldmark.renderer.unsafe = true` (the demo and golang.guide have it) —
the figures are HTML the shortcodes emit into the Markdown flow.

### stats — a row of big numbers {#stats}

```md
> [!stats] promises from the release notes
> - **up to 30%** cheaper small allocations *on a microbenchmark*
> - **~1%** in real code *in programs that allocate a lot*
> - **+60 KB** to the binary *whatever the load*
```

- Each item opens with its value in **bold**; the text after it is the label; a
  trailing *italic* is the quiet line under it (hidden on a phone, where the row
  is three columns of ~110px).
- The text on the marker line is the caption under the row. It may be empty.
- 2–4 items, a tight list (no blank lines between items). The render hook
  warns about anything else — and CI builds with `--panicOnWarning`.
- It stays a `<ul>` in the page: a screen reader reads «list, 3 items», and a
  feed reader shows a list.

### A number with its detail, in a table {#table-details}

```md
| 24 bytes | M4 Pro | Genoa |
|---|---:|---:|
| No pointers | −41% *9,2 → 5,5 ns* | −28% *27,0 → 19,5 ns* |
```

In a **right-aligned** column, a trailing italic after some text becomes a
second, quieter line under the number — the absolute values behind a
percentage. A cell that is all italic stays italic, and other columns are left
alone. This replaces `−41%<br><small>…</small>`.

### A series' glyph in the text {#series-glyph}

```md
| 24 bytes | {{</* mk blue circle */>}} M4 Pro | {{</* mk green square */>}} Genoa (Zen 4) | {{</* mk red triangle */>}} Skylake |
|---|---:|---:|---:|
| No pointers | −41% *9,2 → 5,5 ns* | −28% *27,0 → 19,5 ns* | −21% *52,9 → 41,6 ns* |

The laptop, {{</* mk blue circle */>}} M4 Pro, gains the most.
```

When the names in a table's header or in a sentence are the series of a chart
or a `bars` figure nearby — the machines, the forms — `mk` before a name draws
that series' glyph: the same shape in the same colour the chart's key and the
bars tabs give it, so the text and the figures speak one code. It is a mark
in the text, written where it stands: the table stays an ordinary table (its
detail cells too), and any cell, sentence or list item can carry one.

- **`{{</* mk <color> [<shape>] */>}}`**, or named: `color="blue" shape="square"`.
  **color** is a palette role: `ink` `ghost` `blue` `green` `red` `gold`
  `violet` `copper` `accent`. **shape**: `circle` `square` `triangle`
  `diamond` `star` `cross`; a circle when omitted. A chart gives its series
  these shapes in this order (and so do the bars tabs), so the second series
  of a figure is a `square` unless the figure says otherwise — write the
  colour and the shape the figure has.
- **Before the name, with a space** — the glyph and the name are one unit: a
  line never breaks between them, at the start of a cell or in the middle of
  a sentence. The gap after the glyph is its own margin, not the space you
  type, so it is the same everywhere.
- **Decorative**: `aria-hidden`, never read aloud — the name after it is the
  text. A feed reader, which has no stylesheet, shows nothing in its place
  (the chart it points to is not in the feed either); on paper it keeps its
  ink. Its hue is a palette role, so it repaints with the palette, light
  schemes included.
- **Not in the data of a `bars` or a `chart`** — those tables are read as
  numbers and names, and the figures draw their own glyphs. In their
  [fold](#figure-fold) it is at home.
- An unknown colour warns and prints nothing; an unknown shape warns and
  draws a circle; a third word or an unknown parameter warns.

### bars {#bars}

```md
{{</* bars mark="2" note-color="green" */>}}
| | Binary growth |
|---|--:|
| **Go 1.26** *behind a flag, up to 512 B* | +155 KB |
| **Go 1.27** *in the release, up to 80 B* | +44 KB *3.5× lighter* |
{{</* /bars */>}}
```

- **The first column** labels a row: `**name** *sub*` stacks the two, plain
  text is just a name.
- **A value cell** prints as written; its **first number** is the bar's length
  (a comma is a decimal mark, thousands take a space, `−` and `-` both read as
  minus, the magnitude is drawn). A trailing `*italic*` is a note after the bar.
  `~` or an empty cell shows its text with no bar.
- **Shape follows the table.** One value column: a bar per row. Several: a
  group per row, a bar per column in the column's colour, the column's header
  as the bar's name. `stack="true"`: the columns are parts of one bar, told
  apart by fill (solid, hatched, washed — so three parts at most, a fourth
  warns), the total at the tip, the parts spelled out under it, and a key
  from the header — `**short** *longer*` gives a part its name and its key
  line. A part's trailing italic (`7,53 *−28%*`) is printed after the total:
  `27,0 ns  −28%`, the percentage in the primary ink, the time quieter.
- **A row whose value cells are all empty** is a group heading: `**Genoa**
  *win −28% → −35%*` puts the name left and the italic right.
- **`tabs="true"` turns the groups of a stack or of grouped bars into tabs**
  — a tab per heading row: the chart's series glyph in the group's colour, the
  heading's bold as the name, its italic as a quiet summary beside it
  (`**M4 Pro** *−33…−46%*`). The tabs share one scale, so a switch compares:
  the bars grow or shrink from the old tab's lengths to the new ones (at once
  with reduced motion). ←/→ and Home/End move between tabs; `open="Genoa"`
  picks the one shown first, by its heading's bold. Every row must sit under a
  heading row, and there must be two groups or more — otherwise a warning and
  the figure untabbed. Live, a stack's parts line under each bar is hidden from
  the eye (the key and the bar's end say enough) and still read aloud. Without JavaScript, in a feed and on paper the groups
  stand one under another with their headings and parts lines — nothing is
  hidden. A tabbed figure is framed even without `cap`: the tabs sit on the
  frame's top edge.

  ```md
  {{</* bars stack="true" tabs="true" open="Genoa" digits="1" colors="blue green red" unit=" ns" cap="…" */>}}
  | | **remains** *with the specialization* | **saved** *what it took away* |
  |---|--:|--:|
  | **M4 Pro** *−33…−46%* | | |
  | No pointers | 5.496 | 3.752 *−41%* |
  | **Genoa** *−19…−36%* | | |
  | No pointers | 19.49 | 7.53 *−28%* |
  {{</* /bars */>}}
  ```
- **Grouped bars in tabs** — no `stack`, two or three value columns: a tab is
  a machine, so `colors` is per group, as in a stack (`colors="green red"`).
  Inside a tab each row is a set: its label over its bars, a bar per column
  told apart by fill, not hue. A row reads before → after, so the **last
  column is the result, solid** in the group's colour; the first is washed,
  a middle one hatched — a fourth column, or a `whole`, warns and the figure
  is drawn as plain groups. The key comes from the header (`**short**
  *longer*` works as in a stack) and names the fills, so the bar keeps no
  name of its own (a screen reader still hears it). A cell prints as written
  at the bar's tip, quieter, and its trailing italic follows in the primary
  ink — `19.5 ns  −28%`, as a stack ends.

  ```md
  {{</* bars tabs="true" open="Genoa" colors="green red" cap="…" */>}}
  | | no specialization | with specialization |
  |---|--:|--:|
  | **Genoa** | | |
  | No ballast | 27.0 ns | 19.5 ns *−28%* |
  | 256 MiB ballast | 19.5 ns | 12.8 ns *−35%* |
  | **Skylake** | | |
  | No ballast | 52.9 ns | 41.6 ns *−21%* |
  | 256 MiB ballast | 32.3 ns | 20.1 ns *−38%* |
  {{</* /bars */>}}
  ```
- **`whole="100"`: every bar is the whole**, and a value is the part of it
  marked at the bar's end — the same hue washed out, the label inside that
  part (on the solid just before it when the part is too thin). For a saving
  or a share per machine: `−41%` is the time the change took away from a
  full bar of the old time. Nothing else is drawn — no total, no key; say
  what the bar is in the caption.

| Parameter | Meaning |
|---|---|
| `colors` | Per column (per group in a stack and in tabs): `ink` `ghost` `blue` `green` `red` `gold` `violet` `copper` `accent`. Default: `ink` for one series, the palette order otherwise. |
| `max` | The scale's right end. Default: the longest bar. |
| `mark` | Rows drawn full, 1-based as in the table (`mark="2"`, `mark="1 3"`); every other row turns `ghost`. |
| `stack` | `"true"` — see above. Always written with a value: Hugo cannot mix a bare flag with named parameters. |
| `unit` | After a stack's total, as written (`unit=" ns"`). |
| `digits` | A stack prints its parts and total at this many decimals. Write the parts exact (`32,25` + `20,68`) and the total reads 52,9 — not the 53,0 the rounded parts would add up to. The last part is then printed as the total less the other parts as printed, so the line under the bar adds up to the number at its end: 52,9 − 32,3 = 20,6. |
| `note-color` | The colour of the notes after the bars. Default: the secondary text colour. |
| `whole` | Every bar stands for this much (`whole="100"` for percentages) — see above. Mixes with neither `stack` nor `max`. |
| `tabs` | `"true"` on a stack or on grouped bars: the groups become tabs — see above. |
| `open` | The tab shown first, by its heading's bold (`open="Genoa"`). Default: the first. Needs `tabs`. |
| `cap`, `note` | A caption puts the bars in the widget's frame, the way a widget is captioned. Without one they sit in the prose. |

A label goes inside its bar's end, in an ink picked per hue and palette for
contrast; too short a bar gives it out past the end. That is guessed at build
time and measured on the page (`modules/barsfit.js`). A bar's length comes from
the text as printed, so `−41%` draws 41, not the 40,58 behind it — invisible at
this scale.

### chart {#chart}

A line chart — points joined per series, a crosshair that snaps to the nearest
measured x, a reading panel after Grafana's (numbers and details per series, it
follows the pointer and never covers the point being read), a readout line
above the chart on touch screens, arrow keys on the keyboard. Two forms:

````md
{{</* chart x="object size, B" y="ns per op" x-unit=" B" y-unit=" ns" colors="blue green red" cap="The 128-byte outlier" */>}}
| Size | M4 Pro | Genoa | Skylake |
|--:|--:|--:|--:|
| 80 | 12,65 | 34,99 | 68,07 |
| 96 | *13,18* | 34,61 | 70,30 |
| 128 | 55,48 | 41,40 | 78,31 |
{{</* /chart */>}}

{{</* chart src="charts/alloc-cliff.yaml" cap="Where the speed-up ends" note="— go1.27, off → on" /*/>}}
````

The **inline form** is the simple case — one data set, options as parameters.
The first column is x (its first number), each further column a series named
by its header. The **file form** takes everything from a YAML file in the page
bundle, and must **self-close** (`/>`): a chart reads its body, so an unclosed
tag would swallow the text after it. Its paired form holds a
[fold](#figure-fold) and nothing else.

**The cell grammar** — the same in a table, in YAML, in Obsidian:

| Cell | Meaning |
|---|---|
| `12,65` | a value |
| `*13,18*` | a hollow point from another source — never joined, and it breaks the line |
| `~` | no measurable difference: a hollow point on the zero line, dashed to its neighbours |
| empty, `null`, `—` | no data: the line breaks |
| `12,65 *detail*` | any of the above with a detail for the panel and the no-JS table |

Inline parameters: `x`, `y` (titles), `x-unit`, `y-unit` (after values; a unit
without a leading space — `%` — rides on the tick labels too), `x-digits`,
`y-digits`, `x-domain`, `y-domain` (`"0 136"`; a reversed domain such as
`"0 -50"` draws magnitudes upward), `x-ticks`, `y-ticks`, `x-narrow` (x ticks
below 480px), `colors`, `shapes` (`circle square triangle diamond star
cross`), `rule` + `rule-label`, `zone` (`"80 136"`) + `zone-label`, `legend`,
`same`, `hollow` (legend lines for `~` and hollow points), `rest` (the x the
touch readout shows at rest), `summary` (a sentence for screen readers),
`height` (`"250 290"`: narrow and wide), `cap`, `note`. Unknown parameters
warn.

**The file form**, `charts/alloc-cliff.yaml` beside `index.md`:

```yaml
x: {title: "object size, B", unit: " B", domain: [0, 136], ticks: [8, 24, 80, 128], narrow: [8, 80, 128]}
y: {title: "time saved per allocation", unit: "%", digits: 0, domain: [0, -50]}
series:
  - {name: M4 Pro, color: blue, shape: circle, note: "×4,4"}   # note: bold, after the name in the key
  - {name: Genoa, color: green, shape: square}
rules: [{x: 80, label: "80 B"}]
zones: [{from: 80, to: 136, label: "generic path"}]
jumps: [{series: M4 Pro, from: 80, to: 128, label: "×4,4"}]    # an arrow from one x to another
legend: {title: "80 → 128 B:", same: "~ — no measurable difference", hollow: "another run"}
rest: 80
summary: "Up to 80 bytes every machine saves time; from 88 bytes on, none does."
modes:                                    # a segmented toggle — or `rows:` for one data set
  - label: no pointers
    rows:
      - [80, "-20.47 *12,5 → 10,0 ns*", -25.53]
      - [88, "~", "~"]
  - label: with a pointer
    rows:
      - [80, -29.74, -26.03]
      - [88, "~", -5.62]
```

- Keys are lowercase. `rows` and `modes` exclude each other (a build error).
- **Quote `"~"`**: bare `~` is YAML's null, which draws no point at all. Quote
  anything YAML could read as something else (`yes`, `no`, `0x10`).
- A row is `[x, one cell per series]`; a short or long row warns.
- **Two languages:** Hugo gives `alloc-cliff.ru.yaml` to the Russian page under
  the name `alloc-cliff.yaml`, so a bilingual guide keeps one `src`.
- The file is read at build time and is not published.

**What ships.** The figure carries a table of every mode — the no-JS view, what
a feed reader gets, what stays when Plot fails to load, and what a screen reader
keeps once the chart is drawn — plus the data as JSON. The runtime
(`assets/js/charts/`) and Observable Plot load only on pages with a chart, and
Plot only as the figure comes near the viewport; colours are palette roles, so
switching the palette repaints the chart with no JavaScript.

**The runtime is shared.** The Obsidian plugin draws charts with a byte copy of
`assets/js/charts/{core,fmt}.js` and the same Plot build; its drift check fails
the moment the two part. The grammar's test vectors
(`assets/js/charts/cases.json`) run through the runtime and through the Hugo
partials that print the no-JS tables: `node scripts/check-charts.mjs`.

### A fold under a figure {#figure-fold}

````md
{{</* bars stack="true" tabs="true" open="Genoa" digits="1" colors="blue green red" unit=" ns" cap="Time per 24-byte allocation" */>}}

| | **remains** *with the specialization* | **saved** *what it took away* |
|---|--:|--:|
| **M4 Pro** | | |
| No pointers | 5.496 | 3.752 *−41%* |
| **Genoa** | | |
| No pointers | 19.49 | 7.53 *−28%* |

{{</* fold */>}}

| 24 bytes | {{</* mk blue circle */>}} M4 Pro | {{</* mk green square */>}} Genoa (Zen 4) | {{</* mk red triangle */>}} Skylake |
|---|---:|---:|---:|
| No pointers | −41% *9.2 → 5.5 ns* | −28% *27.0 → 19.5 ns* | −21% *52.9 → 41.6 ns* |

*~ — no measurable difference.*

{{</* /fold */>}}

{{</* /bars */>}}

{{</* chart src="charts/alloc-cliff.yaml" cap="Where the speed-up ends" */>}}
{{</* fold /*/>}}
{{</* /chart */>}}
````

A `fold` written **inside** a `bars` or a `chart` is not printed where it
stands: it becomes the card's footer — a quiet row after the key,
`› Exact values` in the key's mono, that opens into its body. It is a footnote
to a drawing the reader has already understood, so it is a step lighter than
the [fold](#fold) in prose: no icon, no rail, no "Подробнее". The chevron
leads (`›`, `⌄` when open) where the prose fold's trails — that difference is
meant.

- **Only `title=` and `open=`.** `title` is the label, optional — "Exact
  values" by default (i18n `figure_fold`); `open="true"` renders it open.
  `icon`, `more`, `less` and `size` do nothing here and warn.
- **The body is any Markdown** — a table with detail cells and the series
  glyphs in its header (`mk`), a paragraph, a `term`. A paragraph that is all
  italic (`*~ — …*`) is set as a quiet note.
- **An empty fold in a chart** — `{{</* fold /*/>}}` — holds the chart's own
  tables: the no-JS view moves into it rather than being printed twice (for a
  reader without JavaScript, in a feed, for a screen reader). A fold with a
  body of its own leaves that view where it was, so without JavaScript both
  show. In `bars`, which have no tables of their own, an empty fold warns and
  is dropped.
- **A file chart pairs around it**: with `src=` the body holds a fold and
  nothing else — any other text warns, as before. The self-closing form works
  as it did.
- **One per figure**; a second one warns and is dropped. It is drawn at the
  foot wherever it stands in the body — write it last, and the source reads
  top to bottom as the figure does. A tabbed figure has one fold for all its
  tabs, after the key. A figure with a fold is framed, captioned or not.
- **Blank lines around the tables and around `{{</* fold */>}}` /
  `{{</* /fold */>}}` are required.** GFM — Hugo and Obsidian alike — glues a
  line that follows a table onto it as one more row.
- **For a short supplement** — the exact numbers behind the drawing, a line
  about the method. Anything longer is an ordinary `fold` in the text.

A table in the fold takes the card's full width: on a phone it scrolls edge to
edge of the card, its first column stays put with a short fade on its right
edge while the numbers slide under it, and the far edge fades while there are
columns behind it. It is a native `<details>`: the keyboard, a screen reader,
find-in-page and a reader without JavaScript get it for free. It opens by
height (at once with reduced motion) and prints open; a feed gets the
`<details>` as it is.

### spanmap {#spanmap}

```md
{{</* spanmap bits="111100" size="24" */>}}
```

A span of equal slots and its allocation bitmap, one bit per slot. The chosen
slot is the first zero — the allocation rule the figure teaches — and the
measure over the strip and the address in the conclusion are its index times
the slot size. 2–12 bits; `unit` overrides the byte sign; the words come from
i18n (`spanmap_*`). A full map says so instead of picking.

It works inside a `{{</* term */>}}` card — on a line of its own, with blank
lines around it (the card's body is Markdown, and the figure must reach it as
one HTML block).

### Numbers and Plot in your own widgets {#data-helpers}

A widget that needs what the figures have gets it from the theme instead of
carrying a copy:

- `Taiga.fmt(v, digits)` — a number the way the figures print it: the page
  language's decimal mark, a real minus, half-up on the printed digit, never
  `−0`. `Taiga.num("−41%")` reads the first number out of a string.
- `Taiga.plot()` — a promise of the Plot namespace, one request per page;
  `Taiga.plotWhenNear(root, live)` calls `live(Plot)` once `root` comes near
  the viewport. Both need front matter `plot: true` (a chart turns it on by
  itself). The build carries the marks `plot dot link arrow text rect ruleX
  ruleY gridY`; `scripts/vendor-plot/` rebuilds it with more.

In Obsidian, widgets run in a sandboxed frame: `Taiga.fmt` is there,
`Taiga.plot()` rejects and the widget keeps its `figure.html`.

### Which one — a checklist for authors and agents {#data-checklist}

- **Two to four headline numbers** before a section argues with them →
  `[!stats]`.
- **A percentage with the absolute values behind it** in a table → a detail
  cell, not `<br><small>`.
- **Names that are the series of a chart or bars nearby** — a table's
  columns, the machines in a sentence → `{{</* mk <color> <shape> */>}}`
  before each, with the figure's colours and shapes.
- **A few magnitudes side by side** (sizes, costs, times) → `bars`; several
  machines or forms → groups; a total and its share → a stack; the same stack,
  or the same before/after pairs, on several machines → `tabs`; a saving or a share per machine →
  `whole="100"`.
- **How a value changes along x** (sizes, versions, load) → `chart`; one data set
  → the inline table, anything richer → a YAML file.
- **A span, a bitmap, a slot** → `spanmap`.
- **The exact numbers behind a figure**, a line about the method → a `fold`
  inside that figure; anything longer → a `fold` in the text.
- **Anything else** — an interaction that explains a mechanism → a
  [widget](#widgets). Never raw HTML in the Markdown for a figure the list above
  covers.
- Check it: the site's build with `--panicOnWarning` (the shortcodes warn on
  every malformed cell and parameter), then the page in the browser, light
  palette included, and at 360px.

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
clear initial state. Numbers print through `Taiga.fmt`, and a widget that draws
with Observable Plot loads it through `Taiga.plot` — see
[Data figures → helpers](#data-helpers); a figure that must read as part of the
prose drops its frame with `bare="true"`.

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

A guide can also name its own picture. One field carries it, and it feeds both
the feed banner and the share card, so the two can never disagree:

```yaml
cover: cover.webp
```

Precedence, highest first: `cover` → the bundle's `og.png` → `og_image:` → the
drawn cover. Naming a picture therefore switches the generator off for that
page.

The path is resolved the way a Markdown image is: next to the article (the exact
path, or just the file name anywhere in its bundle), then under `assets/` and
`assets/img/`. A leading `/` is dropped before those lookups, so
`/img/cover.webp` still finds `assets/img/cover.webp`. What matches nothing is
passed through as a URL — that is how a file in `static/` or a picture on another
host works — and a bare name that resolves nowhere warns, since it can only be a
typo.

`cover` feeds the share card, the Twitter card and the JSON-LD. The same
picture shows up on the site's own pages too, if it turned those on:
`params.home.feedCover = "banner"` gives each feed card a cover band, and
`params.article.cover` prints the picture above the article's prose. Only
`cover` does that — an image inside the guide's text stays where the author put
it, and the drawn OG cover never leaves the meta tags, since the title baked
into it would double the one printed right beside it.

The band **crops** to `--feed-cover-ratio` (`3 / 1` by default); the article
shows the picture **whole**. Draw a cover at the band's ratio and both places
show the same frame — a taller one loses its top and bottom in the feed. A site
whose artwork wants another shape retunes that one variable in `custom.css`.

A raster cover is re-encoded to WebP at twice the column width and never
upscaled; an SVG, a file in `static/` and an off-site picture pass through
untouched.



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
- A checkpoint after a big block: `> [!recap]` — *"Now you can …"*.
- Short everyday metaphors (a library slip, a parcel tag).
- Widgets woven in with a concrete task: "Play — …".
- `h2` headings are short and substantive — not "Introduction" / "Conclusion".
- End with a "What's next" section and a bridge to the next part.

Prose is copied verbatim when porting — don't silently edit text; fix a real
error and note it.
