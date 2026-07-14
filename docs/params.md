# Configuration parameters

Everything the theme reads lives under `[params]` in your site's `hugo.toml`.
Set only what you need — every key has a sensible default (shown below), and the
theme fills the rest. Palettes are **not** configured here; they are data files
(see [customizing.md](customizing.md#palettes-are-data)).

A minimal working config is in [`exampleSite/hugo.toml`](../exampleSite/hugo.toml),
fully commented — copy it and edit.

## Site parameters

| Key | Type | Default | What it does |
|---|---|---|---|
| `brand.name` | string | `"taiga"` | Wordmark in the header/footer. |
| `brand.tld` | string | `""` | Optional wordmark suffix, e.g. `".dev"`. Empty = just the name. |
| `heroLine` | string | — | Home hero line (the lead half). |
| `heroSat` | string | — | Trailing `· …` clause of the hero line, styled apart. |
| `featured` | string (content path) | — | "Guide of the week" card on the home page, e.g. `"howto/get-started"`. Omit to hide the card. |
| `feedInitial` | int | `8` | Posts shown on the home feed before the "ещё N гайдов" reveal button. |
| `defaultTheme` | string (palette id) | `"amber"` | Palette applied before the reader picks one — an id of a `data/themes/<id>.toml` file. |
| `accent` | string (`#rrggbb`) | — | Overrides the accent colour across **all** palettes at once (built-in and site) — a brand axis orthogonal to the palettes. Unset ⇒ each palette keeps its native accent. Must be a 6-digit hex, e.g. `"#7aa2f7"`; any other value fails the build. See [customizing.md](customizing.md#recolour). |
| `accentDim` | CSS colour | derived | Override for the dimmed accent (focus rings, tinted fills). Default, when `accent` is set: `rgba(r,g,b,.18)` derived from it. Ignored unless `accent` is set. |
| `accentGlow` | CSS colour | derived | Override for the accent glow (shadows). Default, when `accent` is set: `rgba(r,g,b,.28)` derived from it. Ignored unless `accent` is set. |
| `versionDefault` | string | — | Fallback for a guide's version chip when its front matter omits `version`. Free-form ("go1.26", "PostgreSQL 17"). Unset ⇒ no chip. |
| `linkcheck` | `"error"` \| `"warn"` | `"error"` | A broken internal link fails the build (`error`) or just logs (`warn`). |
| `ogImages.enable` | bool | `true` | Generate Open Graph share images at build time. |
| `ogImages.style` | string (folder) | `"dots"` | Cover style = a folder name under `assets/og/` (see [customizing.md](customizing.md#og-cover-styles)). |
| `rss.fullContent` | bool | `false`¹ | Put the full guide body in the RSS feed rather than a summary. |
| `footerTag` | string | `heroLine` | Tagline line in the footer. |
| `social.twitter` | string | `""` | `@handle` for `twitter:site`. Empty ⇒ the tag is omitted. |
| `rubricSections` | list of strings | — | Which content sections are **rubrics** — their leaf pages get the full guide layout (two rails, kicker, meta, TOC, series bridge). Every other page gets the plain column. Also drives the home rubric cards and the 404 rubric list. |

¹ `exampleSite` sets `rss.fullContent = true`; with no value the feed falls back
to summaries.

## Coming-soon mode

A site with nothing published yet still wants its domain, its TLS and its deploy
pipeline live, so that launch day is a flag flip rather than an infra project.
`comingSoon.enable` makes the theme answer **every** route with one standalone
card — the wordmark and a short "soon" line — and nothing else.

| Key | Type | Default | What it does |
|---|---|---|---|
| `comingSoon.enable` | bool | `false` | Turn the mode on. |
| `comingSoon.title` | string | `site.Title` | `<title>` and `og:title`. |
| `comingSoon.description` | string | `heroLine` | Meta + `og:description`. |
| `comingSoon.words` | list of strings | `["Soon", "Скоро", "近日公開"]` | The "soon" line, one word per language. The third is rendered with a CJK font stack. |
| `comingSoon.foot` | string | — | Muted line under the card. Omit to hide it. |

The branch sits in `baseof.html`, above `head.html` — so in this mode the CSS
bundle, the search modal, the menus and the OG graph are never *built*, not
stripped after the fact. The published source contains the card and nothing that
hints at the site being written behind it. The card reuses `logo.html`,
`head/fonts.html` and `hooks/head-extra.html`, so the wordmark, the faces and the
favicon have no second source of truth.

Pair it with `disableKinds` so Hugo does not even generate the other pages —
that way a guide which loses its `draft: true` by accident still cannot reach the
public build. Keep both in an overlay config the normal commands do not load, so
`hugo server -D` keeps rendering drafts while you write:

```toml
# hugo.stub.toml — used only via: hugo --config hugo.toml,hugo.stub.toml
disableKinds = ["page", "section", "taxonomy", "term", "rss", "sitemap"]
[outputs]
  home = ["html"]
[params]
  [params.comingSoon]
    enable = true
```

`robots.txt` switches to `Disallow: /` on its own — there is nothing to crawl,
and an empty page indexed today is a bad first impression tomorrow.

## Not parameters

- **Palettes** are data files, one per palette (`data/themes/<id>.toml`), not
  params. Add, override or disable them by file — see
  [customizing.md](customizing.md#palettes-are-data). `defaultTheme` above only
  names which one loads first.
- **Menus** are standard Hugo `[[menus.main]]` / `[[menus.footer]]`. A menu item
  renders a small `<sup>` badge when it carries `params.badge` (e.g. `"β"`) —
  a generic nav feature, used in the demo for the "Песочница" section.
- **Search** (the ⌘K modal + Pagefind) is always on; there is no enable flag.
  It degrades quietly to an "index not built yet" hint when the Pagefind index
  is missing (a bare `hugo server` with no second build step).

## Per-page front matter

Article, rubric and series front matter (`title`, `slug`, `series`, `mins`,
`rail_title`, `placeholder`, `related`, …) is documented where you'll use it —
see [authoring.md](authoring.md).
