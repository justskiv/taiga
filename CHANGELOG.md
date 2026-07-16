# Changelog

All notable changes to the **taiga** theme are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/): a removed/renamed template or param is
a MAJOR bump, a new optional feature is MINOR, a fix is PATCH.

## [Unreleased]

### Changed — BREAKING

- **Series are rubric sub-sections now, not a taxonomy.** A series is a folder:
  `content/<rubric>/<series>/<part>/`, its metadata in the folder's `_index.md`,
  part order in each part's plain `weight` (was `series_weight`). The
  `series: [...]` front-matter field, the `series` taxonomy and the
  `content/series/` metadata tree are gone; migrate by `mv`-ing each part into
  its series folder and its term `_index.md` to `content/<rubric>/<series>/_index.md`.
  Why: one tree instead of two, membership you can see in the file manager, and
  a series you can reorganize with `mv` alone.
- **Every series now renders a landing page** at `/<rubric>/<series>/` — title,
  tagline, description, the `_index.md` body as an epigraph, the parts list and
  a start CTA (`_partials/series/landing.html`; body class `series`). The rubric
  page keeps the anchored block, its heading now linking to the landing. A
  series with an `_index.md` but no parts yet shows as an "in the works" teaser
  on the rubric and an announcement on its landing.
- **`_partials/series/pages.html` is retired** (the section's own `RegularPages`
  ordering replaced it) and `series/slug.html` now slugs a section, not a term.
  A site overriding either must revisit the override. Sites relying on the
  default page sort of `site.RegularPages` should know guide feeds are now
  explicitly date-sorted in `guides.html` — series parts carry `weight`, which
  would otherwise hijack the default order.
- New i18n keys: `series_start`, `series_soon`. New archetype: `series.md`
  (scaffolds a series `_index.md`).

### Added

- **Standalone containers.** A rubric with many loose guides can tuck them into
  a sub-folder so they don't drown the series folders: a sub-section whose
  `_index.md` sets `params.standalone: true` (+ `build.render: never`,
  `list: local`) is a tidiness container, not a series — its children render,
  list and search exactly like guides sitting directly in the rubric, and both
  homes stay valid at once, so adoption is per-guide, not flag-day.
- **`params.extraGuideSections`** — sections listed here (e.g. `["posts"]`)
  join the guide feed, search, RSS and get the full article layout, but are
  NOT rubrics: no home card, no 404 entry. For guides that belong to no
  rubric. The kicker reads the section `_index.md`'s `label`, as on rubrics.

- **Multilingual, for real.** The theme claimed to be language-agnostic while
  shipping no way to switch languages. Now:
  - a **language switcher** appears in the header by itself once a site has a
    second language — no param, no partial to write;
  - **`hreflang` alternates** (plus `x-default`) are emitted. The docs used to
    claim this already worked. It did not;
  - **UI strings reach JavaScript.** `window.THEME_I18N` was read by `i18n.js` and
    **emitted by nothing** — so the ⌘K modal, the popover, the focus button, the
    minimap and the tags filter were hardcoded Russian on every site. A
    `js-bridge.html` partial now renders the catalogue from i18n;
  - **plurals are CLDR-driven on both sides** (`Intl.PluralRules` against Hugo's
    own plural forms), instead of a hand-rolled Russian rule;
  - **dates are language-aware**: month names come from `month_1`…`month_12`.
  - The i18n catalogues went from 67 to 106 keys, `ru` and `en` in lockstep.
- **`params.accent`** — a single param repaints the accent across **every**
  palette at once (built-in and site), a brand axis orthogonal to the palettes.
  `accentDim` / `accentGlow` override the derived `rgba(…, .18)` / `rgba(…, .28)`.
  The favicon and the logo mark follow it too. Unset ⇒ each palette keeps its
  native accent and the output is byte-for-byte unchanged. A non-`#rrggbb` value
  fails the build. See [customizing.md](docs/customizing.md#recolour).
- **Localizable palette names.** A palette's `name` may be a table of
  translations (`name = { en = "Amber", ru = "Янтарь" }`); the picker shows the
  current language's entry, falling back to `en`. Plain strings work as before.
  The four names that translate ship both languages; GitHub/Nord/Obsidian/One
  Dark are proper names and stay strings.
- **`color = "accent"` in OG layouts.** A cover text block may name the brand
  accent instead of retyping a hex; og-image.html resolves it like the favicon
  does (`params.accent`, else the default palette's accent) and bakes it. The
  `dots` kicker uses it; the `taiga` kicker deliberately keeps its literal —
  that teal belongs to the artwork, not the brand axis.
- **Per-language roadmap data.** A site ships either a flat `data/roadmap.toml`
  (unchanged) or a folder `data/roadmap/<lang>.toml`. Hugo's `data/` is not
  language-aware, so a bilingual site had no way to translate its roadmap.
- **`scripts/check-links.py --base-path`** for sites built under a subpath, and it
  now reports a link that *escapes* the subpath as an error rather than skipping it.
- Russian mirrors of the documentation under `docs/ru/`.

### Changed

- **A new brand mark.** The four-square block gave way to a conifer that is also a
  hierarchy — a crown over two tiers over a trunk, one level per content tier
  (rubric → series → guides). Only the crown takes the accent. The favicon and the
  fallback rubric glyph follow.
- **Renamed the primary accent token** `--accent-amber` → `--accent` (with its
  `-dim` / `-glow`; palette key `accent-amber` → `accent`). A site that references
  the old name in `custom.css` or a palette file must rename it. The secondary
  accents (`--accent-green` / `-copper` / `-blue` / `-gold`) are unchanged.
- **The demo is bilingual** (English at `/`, Russian at `/ru/`) and is deployed to
  GitHub Pages, which is what makes `demosite` in `theme.toml` a real URL.

### Removed

- **`layouts/_partials/date-ru.html`.** Its replacement is `date.html`, which takes
  month names from i18n. The old partial hardcoded Russian months, and its *name*
  was language-bound — one site physically could not render both `ru` and `en`
  dates. A site that overrode `date-ru.html` must move that override to `date.html`.
- **`params.search.enable`** from the example config. No template ever read it:
  search is always on and degrades to a hint when the index is missing.

### Fixed

- **`partialCached` ignored the language.** The header was cached per section and
  the footer had no cache variant at all, so on a multilingual site `/howto/` and
  `/ru/howto/` collided on one key and both rendered whichever language built
  first — wrong menus, wrong strings, wrong feed link.
- **Search 404'd on any site served from a subpath.** `search.js` hardcoded
  `/pagefind/pagefind.js`; it now derives the path from `baseURL`. This broke every
  GitHub Pages *project* site, which is the most common way to host a Hugo demo.
- **Root-absolute links to generated files escaped the subpath.** A `/index.xml`
  or `/sitemap.xml` written in content was emitted verbatim, pointing at the domain
  root. `render-link.html` now rebases them through `relURL`.
- **The coming-soon card ignored `params.accent`.** It read the accent straight
  from the default palette's data file, bypassing the brand axis — the one page
  a pre-launch site actually shows was the one page the rebrand param missed.

## [0.0.1] — 2026-07-04

First cut: a topic-agnostic learning-platform theme (rubrics → series → guides),
packaged as the repository root with a self-documenting `exampleSite`. Beta — see
the status note in the [README](README.md#status): until the first stable tag,
anything here can be renamed without a deprecation path.

### Added

- **Content model.** Rubric sections (`params.rubricSections`), leaf-bundle
  guides, a `series` taxonomy with `series_weight` driving kickers, the left
  rail, and a reading-time-scaled series bridge — all server-rendered. A `tags`
  taxonomy with a cloud + filtered feed. Placeholder guides (`placeholder: true`)
  that count in structure but stay out of RSS and search.
- **Interactive widgets** as page-bundle `widgets.js`, loaded per page, with the
  `Taiga.widget` runtime (isolates failures, skips missing mounts).
- **Render hooks:** internal-link checking that fails the build (`linkcheck`),
  server-side Go syntax highlighting (Chroma → palette, `hl_lines`, `{label=…}`
  code captions), heading anchors, table wrappers.
- **Open Graph covers** generated at build (`images.Text`); cover styles as
  folders under `assets/og/` (ships `dots`); per-page override via `og.png` /
  `og_image` / `og_style`.
- **Full-text search** via Pagefind in a lazy ⌘K modal (no server, no Node).
- **Seven palettes as data files** (`data/themes/<id>.toml`) generating the
  `[data-theme]` CSS blocks and the picker; a site adds/overrides/disables by
  file. Inline pre-paint applies the saved theme with no FOUC.
- **Self-hosted fonts** (Inter + JetBrains Mono, Latin + Cyrillic woff2, subset,
  `font-display: swap`, preload) — no CDN.
- **RSS** (full-content, guides only), `sitemap.xml`, `robots.txt`, a `404`.
- **Multilingual-ready** from day one (`[languages.…]` shape, English UI strings
  shipped, suffix translations).
- **Customization without forking:** `custom.css` appended last, stable design
  tokens, empty `head-extra`/`foot-extra` hooks, `window.THEME_I18N`, site-over-
  theme partial overrides.
- **Authoring ergonomics:** a `guides` archetype (`hugo new … --kind guides`),
  a `roadmap` data file feeding both the roadmap page and the home WIP strip, a
  kitchen-sink demo page exercising every component.
- **Docs** (`docs/params.md`, `authoring.md`, `customizing.md`, `i18n.md`) and a
  fully commented `exampleSite`.

### Known limitations

- **One OG cover style** ships (`dots`); additional styles are added as folders.
- The `render-image` hook ships for completeness but is unused until content
  carries an image.
- Screenshots (`images/screenshot.png`, `images/tn.png`) are pending.
