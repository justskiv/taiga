# taiga

A dark, minimalist Hugo theme for a **learning platform**: rubrics → series →
guides with interactive widgets in the text. Topic-agnostic — the demo teaches
the theme itself, but nothing in the templates is tied to any subject.

![Screenshot](https://raw.githubusercontent.com/justskiv/taiga/main/images/screenshot.png)

**Two binaries and you're done: `hugo` and `pagefind`.** No Node, no npm, no CDN,
no trackers. Vanilla JS bundled by Hugo's built-in esbuild, plain CSS, self-hosted
woff2 fonts, a static search index. That constraint is the whole design.

## Features

- **Interactive widgets as content.** A `widgets.js` next to a guide's `index.md`
  is found, minified and loaded only on that page; one `{{< widget >}}` shortcode
  in the text, and the `Taiga.widget` runtime isolates failures so one broken
  widget never takes down its neighbours.
- **A broken internal link fails the build.** A render hook checks every internal
  link against real pages (`params.linkcheck = "error" | "warn"`).
- **Open Graph covers with no external service.** `images.Text` draws a cover for
  each guide at build time — backdrop, series kicker, title, minutes. Cover
  **styles are folders** (`assets/og/<style>/`); a site adds or overrides one
  without forking.
- **Full-text search without a server.** Pagefind indexes the built site; ⌘K
  finds terms *inside* articles, with stemming and a snippet — in the theme's own
  modal, loaded lazily on first open.
- **Series as a first-class mechanic.** A taxonomy plus `series_weight` gives the
  series panel, "part N of M" kickers, and a bottom bridge scaled by reading time
  with "~N min left" — all server-rendered from one source of truth.
- **Server-side syntax highlighting.** Go is highlighted at build time (Chroma,
  recoloured to the palette) with `hl_lines` support; everything else renders as
  clean plain code. No client-side highlighter, no flash.
- **Palettes are data.** Each of the seven palettes is one `data/themes/<id>.toml`
  file; a site adds its own with a single file and it shows up in the CSS and the
  theme picker. Seven built in, dark by default.
- **Roadmap as data, a guide archetype, and customization as a discipline** —
  hooks, `custom.css`, stable design tokens, everything restylable without a fork.

## Requirements

- **Hugo ≥ 0.146** (developed against v0.154.x). The `extended` build is **not**
  required — this is a plain-CSS theme.
- **[Pagefind](https://pagefind.app/)** for search (a second build step; no Node).

## Installation

Pick one.

**1. Hugo Module** (recommended). Add the import to your site config — with a
module import you do **not** also set `theme`:

```toml
[module]
  [[module.imports]]
    path = "github.com/justskiv/taiga"
```

Then `hugo mod get -u`.

**2. Git submodule.** Add it under `themes/`, then set `theme = "taiga"` in your
config:

```sh
git submodule add https://github.com/justskiv/taiga.git themes/taiga
```

**3. Copy.** Clone or download into `themes/taiga`, then set `theme = "taiga"`.

## Quick start

```sh
hugo new site mysite && cd mysite
# install the theme by one of the methods above, then:
hugo new content howto/get-started --kind guides
hugo server
```

To run the bundled demo from a clone of this repo:

```sh
hugo server -s exampleSite --themesDir ../..
```

(For the full build with search: `hugo -s exampleSite --themesDir ../.. --gc --minify`
then `pagefind --site exampleSite/public`.)

## Configuration & docs

- [docs/params.md](docs/params.md) — every parameter, with defaults.
- [docs/authoring.md](docs/authoring.md) — writing a guide: front matter,
  shortcodes, code, diagrams, widgets, voice.
- [docs/customizing.md](docs/customizing.md) — restyling without a fork:
  params, `custom.css`, palettes, hooks, partials, i18n, cover styles.
- [docs/i18n.md](docs/i18n.md) — adding a language.

The commented [`exampleSite/hugo.toml`](exampleSite/hugo.toml) is the second,
copy-ready reference config.

## License

MIT — see [LICENSE](LICENSE). Bundled fonts (Inter, JetBrains Mono) are under the
SIL Open Font License; see the `.txt` files beside them in `assets/fonts/`.
