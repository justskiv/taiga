**English** · [Русский](ru/params.md)

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
| `brand.name` | string | `"taiga"` | Wordmark in the header/footer. The default lives in the theme's own `hugo.toml`, not a template fallback — set it in your site config to override. |
| `brand.tld` | string | `""` | Optional wordmark suffix, e.g. `".dev"`. Empty = just the name. |
| `heroLine` | string | — | Home hero line (the lead half). Site-wide unless a language overrides it — see note 2. |
| `heroSat` | string | — | Trailing `· …` clause of the hero line, styled apart. Site-wide unless a language overrides it — see note 2. |
| `featured` | string (content path) | — | "Guide of the week" card on the home page, e.g. `"howto/handbook/get-started"`. Omit to hide the card. Shared across languages — the path resolves to each language's own translation of that page. |
| `feedInitial` | int | `8` | Posts shown on the home feed before the "N more guides" reveal button. |
| `defaultTheme` | string (palette id) | `"taiga"` | Palette applied before the reader picks one — an id of a `data/themes/<id>.toml` file. |
| `accent` | string (`#rrggbb`) | — | Overrides the accent colour across **all** palettes at once (built-in and site) — a brand axis orthogonal to the palettes. Unset ⇒ each palette keeps its native accent. Must be a 6-digit hex, e.g. `"#7aa2f7"`; any other value fails the build. See [customizing.md](customizing.md#recolour). |
| `accentDim` | CSS colour | derived | Override for the dimmed accent (focus rings, tinted fills). Default, when `accent` is set: `rgba(r,g,b,.18)` derived from it. Ignored unless `accent` is set. |
| `accentGlow` | CSS colour | derived | Override for the accent glow (shadows). Default, when `accent` is set: `rgba(r,g,b,.28)` derived from it. Ignored unless `accent` is set. |
| `versionDefault` | string | — | Fallback for a guide's version chip when its front matter omits `version`. Free-form ("go1.26", "PostgreSQL 17") — see note 3. With neither set, the chip is omitted entirely. |
| `linkcheck` | `"error"` \| `"warn"` | `"error"` | A broken internal link fails the build (`error`) or just logs (`warn`). |
| `linkPreviews.enable` | bool | `false` | Hover preview cards on prose links — internal guides/series, your Telegram posts, YouTube, Wikipedia. If your site sets its own `[outputs]`, repeat the `preview` format on `page`/`section` — see [link-previews.md](link-previews.md). |
| `linkPreviews.budgetWords` | int | `1400` | How much of an article an internal preview shows: whole H2 sections until this word budget, the rest listed as "further in the article". |
| `telegram.channels` | list of strings | `[]` | Your OWN channel handles. A t.me post link from these earns a build-time preview card; any other t.me link gets only the ✈ mark. |
| `ogImages.enable` | bool | `true` | Generate Open Graph share images at build time. |
| `ogImages.style` | string (folder) | `"dots"` | Cover style = a folder name under `assets/og/` (see [customizing.md](customizing.md#og-cover-styles)). |
| `rss.fullContent` | bool | `false` | Put the full guide body in the RSS feed rather than a summary — see note 1. |
| `footerTag` | string | falls back to `heroLine` | Tagline line in the footer. Site-wide unless a language overrides it — see note 2. |
| `social.twitter` | string | `""` | `@handle` for `twitter:site`. Empty ⇒ the tag is omitted. |
| `social.github` | string (URL) | — | Repository URL. Sets a source-code icon in the header. Unset ⇒ no icon. |
| `rubricSections` | list of strings | — | Which content sections are **rubrics** — their leaf pages get the full guide layout (two rails, kicker, meta, TOC, series bridge). Every other page gets the plain column. Also drives the home rubric cards and the 404 rubric list. |
| `extraGuideSections` | list of strings | `[]` | Sections whose pages are full guides (feed, search, RSS, article layout) **without** being rubrics — no home card, no 404 entry. For guides outside any rubric, e.g. `["posts"]`; the kicker takes the section `_index.md`'s `label`. See [authoring.md](authoring.md#standalone). |

**Notes**

1. `exampleSite` sets `rss.fullContent = true`; with no value the feed falls
   back to summaries.
2. `heroLine`, `heroSat` and `footerTag` are site-wide params, but in a
   multilingual site they read naturally as per-language copy — `exampleSite`
   sets all three inside `[languages.en.params]` and `[languages.ru.params]`
   rather than at the top level. Everything else in this table (`defaultTheme`,
   `featured`, `rubricSections`, …) is shared across languages unless a
   language block restates it.
3. `exampleSite` sets `versionDefault = "v0.0.1"` — the theme's own version,
   doubling as a live example of the free-form string.

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

## Flat guide URLs

Nested guide URLs (`/howto/handbook/get-started/`) are the default. A site can
flatten its guides to the domain root with a standard Hugo permalink rule in its
own config, one line per rubric:

```toml
[permalinks.page]
  howto = "/:slugorfilename/"
```

This is a site decision, not a theme param — the theme resolves every internal
link through the page's real permalink, so both shapes work. Rubric pages and
series landings are section pages, untouched by `permalinks.page`: they keep
their paths (`/howto/`, `/howto/handbook/`).

## Not parameters

- **The language switcher** (`EN · RU` in the header) takes no param. It
  renders by itself whenever the site has more than one language, and emits
  nothing at all on a single-language site — there is nothing to configure.
- **Palettes** are data files, one per palette (`data/themes/<id>.toml`), not
  params. Add, override or disable them by file — see
  [customizing.md](customizing.md#palettes-are-data). `defaultTheme` above only
  names which one loads first.
- **Roadmap data** is not a param either. It's `data/roadmap.toml` (single
  language) or a folder of per-language files, `data/roadmap/<lang>.toml`,
  read by the `roadmap` shortcode and the home "in progress" strip.
- **Menus** are standard Hugo `[[menus.main]]` / `[[menus.footer]]`. A menu item
  renders a small `<sup>` badge when it carries `params.badge` (e.g. `"β"`) —
  a generic nav feature, used in the demo for the "Playground" section.
- **Search** (the ⌘K modal + Pagefind) is always on; there is no enable flag.
  It degrades quietly to an "index not built yet" hint when the Pagefind index
  is missing (a bare `hugo server` with no second build step).

## Per-page front matter

Article, rubric and series front matter (`title`, `slug`, `weight`, `mins`,
`rail_title`, `placeholder`, `related`, …) is documented where you'll use it —
see [authoring.md](authoring.md).
