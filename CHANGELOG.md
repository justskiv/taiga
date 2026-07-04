# Changelog

All notable changes to the **taiga** theme are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/): a removed/renamed template or param is
a MAJOR bump, a new optional feature is MINOR, a fix is PATCH.

## [Unreleased]

## [0.1.0] — 2026-07-04

Initial release: a topic-agnostic learning-platform theme (rubrics → series →
guides), packaged as the repository root with a self-documenting `exampleSite`.

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

- **Module path is a placeholder** (`github.com/skiv/taiga`); set it to the real
  repository on first push (`go.mod`, `theme.toml`, README install snippets).
- **One OG cover style** ships (`dots`); additional styles are added as folders.
- The `render-image` hook ships for completeness but is unused until content
  carries an image.
- Screenshots (`images/screenshot.png`, `images/tn.png`) are pending.
