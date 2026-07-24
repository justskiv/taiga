**English** · [Русский](ru/customizing.md)

# Customizing without forking

Everything below is done from **your own site** — a param, a data file, a CSS
file, a mirrored partial. You never edit the theme, so `git pull` / a module bump
keeps working. The order here is roughly cheapest-first.

## 1. Parameters

Behaviour and text are params (full list: [params.md](params.md)). Set them in
your `hugo.toml [params]`. Reach for a param before anything heavier.

### Home page look {#home-look}

Four independent axes under `[params.home]` retune the home page; each one
unset falls back to the classic layout, so an existing site changes nothing:

```toml
[params.home]
  hero = "wordmark"        # heading scene above the kicker: the header brand writ large
  grid = "fade"            # markup behind the hero: "grid" | "fade" (dissolves) | "dots"
  rubricCards = "naked"    # drop the card boxes, grow the rubric logos to 112px
  feedPreview = "summary"  # feed previews = each guide's own lead + a "read →" tail
```

With the hero on, the kicker line becomes its centered subtitle. The grid ink
derives from the active palette's text ramp, so it survives palette switches —
light ones included. `feedPreview = "summary"` uses the lead **before a
`<!--more-->` divider**; a guide without the divider keeps showing its
front-matter description. The hero can also carry a mascot: ship
`layouts/_partials/home/mascot.html` (inline SVG artwork) and it renders
beside the mark — the same site-side slot pattern as the rubric logos.

## 2. custom.css — restyle anything

If your site has `assets/css/custom.css`, the theme appends it **last** in the
bundle, so your rules win the cascade without a fork:

```css
/* assets/css/custom.css */
:root { --content: 820px; }          /* wider article column */
.article h2 { letter-spacing: -0.01em; }
```

### Stable CSS variables (the public token API)

These names are stable — build on them rather than on internal selectors.

Structure (`assets/css/00-tokens.css`):

| Variable | Default | Meaning |
|---|---|---|
| `--shell` | `1104px` | Max width of the page shell (home, rubrics) |
| `--content` | `760px` | Article column width |
| `--rail` | `236px` | Left/right rail width |
| `--font-sans` / `--font-mono` | Inter / JetBrains Mono | Font stacks |
| `--radius-sm` / `--radius` | `8px` / `12px` | Corner radii |
| `--dur` / `--ease` | `.14s` / `cubic-bezier(.2,0,0,1)` | Transition duration and easing |

Colours come from the **palette** (see below), so they change per theme:
`--bg-deep`, `--bg-base`, `--bg-surface`, `--bg-raised`, `--bg-hover`,
`--border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-ghost`,
`--text-strong`, `--gtok-str`, and the accents `--accent` (+ `-dim`,
`-glow`), `--accent-green` (+ `-dim`, `-glow`), `--accent-copper` (+ `-dim`),
`--accent-blue` (+ `-dim`), `--accent-gold` (+ `-dim`),
`--accent-violet` (+ `-dim`).

The primary `--accent` is special: a site can repaint it across every palette
with a single param — see [Recolour the accent](#recolour).

## 3. Palettes are data {#palettes-are-data}

Each palette is one file, `data/themes/<id>.toml` — metadata plus the colour
variables (keys = CSS variable names without the `--`):

```toml
# data/themes/mine.toml
name = "Mine"        # label in the picker
weight = 25          # position in the picker
"bg-base" = "#101418"
"accent"  = "#7aa2f7"
# … the rest of the keys as in data/themes/amber.toml
```

Drop it into **your** `data/themes/` and it appears in the CSS **and** the theme
picker automatically — no theme edit. Because Hugo merges the theme's data with
yours (yours wins on a name clash), you can also **override** a shipped palette
(same filename, new values) or **disable** one (`disabled = true`).

`name` is the picker label — a plain string, or a table of translations keyed
by language: `name = { en = "Mine", ru = "Моя" }`. The picker shows the current
language's entry and falls back to `en`. It lives in the palette file, not in
`i18n/`, so a palette stays one self-contained file.

The metadata keys — `name`, `weight`, `light`, `disabled` — are never emitted as
CSS variables. Everything else in the file is.

`light = true` also stamps the root element with `data-scheme="light"` (any
other palette yields `data-scheme="dark"`), so CSS can target all light
palettes at once — the theme itself keys the home hero grid density off it.

### Recolour the accent {#recolour}

**One line, every palette.** The accent is a brand axis that cuts *across* the
palettes, so one param repaints it everywhere at once:

```toml
# hugo.toml
[params]
accent = "#7aa2f7"
```

Now every built-in palette — and any you added — uses that colour instead of its
native one: links, buttons, active states, the accent dot in the picker's swatch,
the crown of the logo mark and the same crown in the favicon.

The native accent is glacier teal, and it is **not one hex**: the dark palettes
carry `#55c0b7` and `Light ☀` carries `#0e7a71`. That is not an inconsistency —
it is forced. The accent is also a button *background* (`.btn-cta` paints
`--bg-deep` on it), so on a dark palette it has to be light enough to hold
near-black text, and on a light palette dark enough to hold near-white text.
Those two demands do not overlap, so one hue is held at two luminances. Setting
`accent` yourself collapses both to your single value — check it against a light
palette before you ship. `--accent-dim` and `--accent-glow` are derived
from it (`rgba(…, .18)` and `rgba(…, .28)`). Override either explicitly if the
derived alpha isn't what you want:

```toml
accent     = "#7aa2f7"
accentGlow = "rgba(122, 162, 247, .45)"   # a stronger halo
```

`accent` must be a 6-digit `#rrggbb`; any other value stops the build.

The logo (`layouts/_partials/logo.html`) is inline SVG whose crown reads
`var(--accent)`, so it follows the palette the reader picks, live. The favicon
cannot: it is a data-URI SVG, and a data-URI cannot read CSS variables — so its
crown colour is **baked at build time** from `params.accent`, falling back to the
accent of `params.defaultTheme`. It stays put when the reader switches palette.

**What the handle does *not* reach:**

- **OG cover artwork** — whatever colour lives in `base.png` is baked. The
  *text* blocks can follow the axis: a layout block with `color = "accent"` is
  baked with the resolved brand colour (the shipped `dots` kicker does this;
  the `taiga` kicker stays a literal on purpose — its teal belongs to the
  artwork). For a full rebrand, still ship your own
  [cover style](#og-cover-styles) folder rather than expecting the param to
  repaint the artwork.
- **Secondary accents** (`--accent-green`, `--accent-copper`, `--accent-blue`,
  `--accent-gold`) and the code-string colour `--gtok-str` are palette variables,
  not part of the one accent axis. Change them in the palette files (below).

**Different accents per palette.** If you'd rather each palette keep (or set) its
*own* accent than share one colour, don't set `accent` — edit the palette files
instead. The accent is the `accent` key (plus `-dim` / `-glow`) in
`data/themes/<id>.toml`; ship your own palette or override a shipped one (above).
All seven built-ins currently share the same accent, so recolour each file, or
override just the one(s) you use. Note that the favicon still takes one colour —
the default palette's.

## 4. Roadmap data {#roadmap-data}

The `roadmap` shortcode and the home page's "in progress" strip read one data
file, which the **site** owns. It comes in two shapes:

```
data/roadmap.toml         # one language
                          # — or —
data/roadmap/en.toml      # one file per language
data/roadmap/ru.toml
```

Hugo's `data/` is not language-aware, so the templates resolve it by hand: take
`site.Data.roadmap`; if it has a key equal to the current language code, use that
sub-map, otherwise use the map as-is. The flat file therefore keeps working
untouched, and the folder gives each language its own copy. A language with no
file in the folder renders no roadmap blocks at all — silently, not as an error.

Whatever the shape, the templates read three tables: `[[items]]` (`title`,
`status`, `progress`, `note`, `ready`), `[[queue]]` (`title`) and `[[rules]]`
(`title`, `note`). An `item` that is not `ready` is what the home-page strip
lists. A working pair of files is in
[`exampleSite/data/roadmap/`](../exampleSite/data/roadmap/); the shortcode that
renders them is in [authoring.md](authoring.md).

## 5. Hook partials — inject head/foot content {#hooks}

The theme calls two empty partials you can fill from your site
(`layouts/_partials/hooks/`):

- `head-extra.html` — analytics, extra meta, fonts. Rendered last in `<head>`.
- `foot-extra.html` — end-of-body scripts.

Create the same path in your site's `layouts/_partials/hooks/` and it's picked up
— nothing to enable.

```html
<!-- layouts/_partials/hooks/head-extra.html -->
<script defer src="https://analytics.example/script.js"></script>
```

## 6. Override any partial

Hugo's lookup order is site-over-theme, so mirroring a partial's path in your
`layouts/` replaces it. The partials are small and named for exactly this —
`logo.html`, `footer.html`, `post.html` (feed card), `home/logos/<section>.html`
(per-rubric glyph on the home cards; the theme falls back to
`home/logos/default.html`), and so on. Copy the theme's version, edit, done.

One partial is load-bearing: `scripts.html` ends with
`{{ partial "js-bridge.html" . }}`, which emits `window.THEME_I18N` (every UI
string that lives in JS) and `window.TAIGA_PAGEFIND` (the search bundle's URL,
resolved through `baseURL`). If you override `scripts.html`, keep that line. Both
have fallbacks, and both fallbacks are worse than the real thing: the UI freezes
in the theme's English defaults, and search falls back to a root-absolute
`/pagefind/pagefind.js`, which 404s on any site served from a subpath — quietly,
as an "index not built yet" hint.

## 7. i18n — restring the UI {#i18n}

Every UI string is an i18n key. Put a partial `i18n/en.toml` (or `ru.toml`) in
your site with just the keys you want to change; Hugo merges it over the theme's,
key by key — you don't restate the catalogue.

```toml
# i18n/en.toml
[read_guide]
other = "start reading →"
```

Adding a whole language (not just restringing one) is a different job:
[i18n.md](i18n.md).

### Strings that live in JS {#js-strings}

The search modal, the theme/view popover, the focus button, the minimaps and the
tags filter build their text in the browser. They are **still i18n keys**: they
are the `js_*` keys of the catalogue (plus `mins_abbr`), and
`layouts/_partials/js-bridge.html` renders them into the page as
`window.THEME_I18N`.

So the ordinary way to change a JS string is the ordinary way — override the
`js_*` key in your `i18n/<lang>.toml`. No JavaScript involved:

```toml
# i18n/en.toml
[js_search_placeholder]
other = "find a guide…"
```

**The runtime escape hatch.** The bridge merges its catalogue *underneath* an
existing object:

```js
window.THEME_I18N = Object.assign({ …the catalogue… }, window.THEME_I18N || {});
```

so keys you set yourself win — provided your script runs **first**. It will, if
it is an **inline** `<script>` in either hook (`head-extra.html` or
`foot-extra.html`): both are rendered before the bridge, and the theme's own
bundle is `defer`red, so an inline script always beats it. A `defer`/`async`
script is too late — the bundle reads the catalogue as it loads.

```html
<!-- layouts/_partials/hooks/foot-extra.html -->
<script>window.THEME_I18N = { themeHead: "Colours", pinPanel: "keep open" };</script>
```

The JS names are **not** the i18n key names. The full contract:

| JS key | i18n key | Where it shows |
|---|---|---|
| `themeHead` | `js_theme_head` | Popover: "Theme" heading |
| `viewHead` | `js_view_head` | Popover: "View" heading |
| `railLeft` | `js_rail_left` | Popover: left rail toggle |
| `railRight` | `js_rail_right` | Popover: right rail toggle |
| `lists` | `js_lists` | Popover: list-style group |
| `on` / `off` | `js_on` / `js_off` | Popover: toggle states |
| `listRows` | `js_list_rows` | Popover: list style "rows" |
| `listLoud` | `js_list_loud` | Popover: list style "loud" |
| `listShelf` | `js_list_shelf` | Popover: list style "shelf" |
| `popoverAria` | `js_popover_aria` | `aria-label` of the popover button |
| `hint` | `js_hint` | Keyboard hint in the popover (carries `<kbd>` markup) |
| `pinPanel` | `js_pin_panel` | Rail minimap: the pin control |
| `keyOr` | `js_key_or` | Rail minimap: "or" between the two shortcuts |
| `focusEnter` | `js_focus_enter` | Chip shown in focus mode |
| `focusTitle` | `js_focus_title` | Focus button `title` |
| `focusAria` | `js_focus_aria` | Focus button `aria-label` |
| `searchAria` | `js_search_aria` | Search modal `aria-label` |
| `searchPlaceholder` | `js_search_placeholder` | Search input placeholder |
| `searchEmpty` | `js_search_empty` | "Nothing found" line |
| `searchUnbuilt` | `js_search_unbuilt` | Shown when the Pagefind index is missing |
| `scrollTop` | `js_scrolltop` | "Back to top" button |
| `minutes` | `mins_abbr` | Reading-time unit in search results |
| `tagFeedHead` | `js_tag_feed_head` | `/tags/`: heading over the filtered feed |
| `tagReset` | `js_tag_reset` | `/tags/`: reset the filter |
| `tagEmptyTail` | `js_tag_empty_tail` | `/tags/`: tail of the "no such tag" line |
| `guideForms` | `js_guides_word` | `/tags/`: the word "guide", pluralised |

`guideForms` is the odd one: the browser counts the guides, so Hugo cannot render
the phrase. It renders the *word* at probe counts 1, 2 and 5 and ships an object,
`{ "1": …, "2": …, "5": … }`; at runtime `Intl.PluralRules` decides which probe
shares a plural category with the real number. Override it in `i18n/<lang>.toml`
(`js_guides_word` with the usual `one` / `few` / `many` / `other` forms) and this
takes care of itself. If you override it through `window.THEME_I18N` instead,
keep the object shape.

The English strings hardcoded in `assets/js/modules/i18n.js` are a last-resort
fallback for the case where the bridge never ran (a site that replaced
`scripts.html`), not the source of truth.

## 8. OG cover styles {#og-cover-styles}

A cover **style is a folder** under `assets/og/`; the folder name is the id. Ship
your own without a fork by adding `assets/og/<mystyle>/` to your site:

```
assets/og/mystyle/
├── base.png       # 1200×630 backdrop (all the graphics)
├── layout.toml    # text block placement (see assets/og/dots/layout.toml)
└── home.png       # optional: a fully-baked poster for the non-guide pages
```

Select it site-wide with `params.ogImages.style = "mystyle"`, or per page with
`og_style:`. You can also override a shipped style by mirroring its folder.
(`images.Text` can't letter-space and only right-aligns monospace — the shipped
`dots` style documents both in its `layout.toml`.)

A block's `color` in `layout.toml` is a `#rrggbb` literal, or the word
`accent`: the brand accent resolved at build time exactly like the favicon's —
`params.accent` first, else the accent of the `params.defaultTheme` palette.

Styles are for the pages that let the theme draw their cover. A page that names
a picture of its own — `cover:`, `og_image:`, or an `og.png`
in its bundle — skips the generator entirely; see
[authoring.md](authoring.md#covers-og-images) for the order and how the path is
resolved.

## 9. An author section with no trace in the theme

The theme carries nothing topic-specific, yet a site can add a whole bespoke
section built only from stock mechanisms. The demo's "Playground" is the worked
example:

- **the page** is `content/playground/index.md` — ordinary Markdown, an ordinary
  leaf bundle — with a big interactive as a `widget` shortcode plus
  `widgets/w-reflex/widget.js` in the same bundle (the widget mechanism works
  for any bundle, not just guides);
- **the nav badge** is `[[menus.main]]` with `params.badge = "β"` — a generic
  menu feature, not a "playground feature";
- **section-only styles**, if the section needs any, go in that bundle as
  `widgets/w-reflex/widget.css` (or `widgets/_shared/shared.css` for more than
  one widget) — the theme links them on that page alone and carries none itself;
- in search and the sitemap it's just another page.

That's the template for any custom section: the theme stays clean, your site
stays as distinctive as you like.
