---
title: "Install and run"
slug: get-started
date: 2026-06-06
description: "What the theme does, three ways to install it, the minimal config and the content layout — from an empty folder to a built site."
lead: "The short path from an empty folder to a working site: what the theme does and who it is for, how to plug it in — as a module, a submodule or a copy — and the minimum config a first build needs."
series: ["handbook"]
series_weight: 10
tags: [setup, config]
mins: 5
version: "v0.0.1"
rail_title: "Install"
---

## What this theme is {#what-it-is}

A theme for learning guides that are read in order, not at random. Content sits on three levels: rubrics → series → guides. A series is declared with two front matter fields; everything else — "part N of M" in the kicker, the panel with the table of contents on the left, the bridge with "~N min left" at the bottom — is counted at build time. A guide is a folder: its interactive widgets, styles and cover lie next to the text, and it moves as a whole, one folder. Everything you see on this demo — the feed, search, palettes, cover generation — is a stock mechanism of the theme: the demo is written in it about it.

Two binaries, and that is the whole toolchain. The first is plain `hugo`, not extended: there is no Sass in the theme, and esbuild for JS is built into the standard binary. The second is `pagefind`, full-text search over the built site. Node, npm and `node_modules` take part in neither the build nor development. The minimum Hugo version is declared in the theme's config: a binary that is too old stops the build with a clear error rather than with strange behavior.

## Three ways to install {#three-ways}

The paths below are placeholders: substitute the address of the theme's repository.

**Hugo Module** — the main way. Into the site config:

```toml {label="hugo.toml — the theme as a module"}
[module]
  [[module.imports]]
    path = "github.com/user/theme"
```

Then `hugo mod get -u` (if the site is not a module yet — `hugo mod init github.com/user/site`, once). Versions resolve against the theme's semver tags; to edit the theme locally, use a `replace` in the site's `go.mod`.

**Git submodule** — if you would rather not have modules:

```bash {label="the theme as a submodule"}
git submodule add https://github.com/user/theme themes/theme
```

plus `theme = "theme"` in the config. In CI, do not forget to check out with `submodules: recursive`.

**A copy in `themes/`** — a clone or an unpacked archive in `themes/theme`, plus the same `theme = "theme"`. Updates are manual; on the other hand this is the way to look at the theme with no commitment.

{{< callout type="key" label="Key idea" >}}
All three ways are equal: the theme keeps its assets in the standard directories and does not require building itself. The only difference is how updates arrive.
{{< /callout >}}

## The minimal config {#minimal-config}

```toml {label="hugo.toml"}
baseURL = "https://example.org/"
title = "My handbook"
theme = "theme"                # not needed when installed as a module
defaultContentLanguage = "en"

[languages.en]
  languageCode = "en"
  languageName = "English"
  weight = 1

[taxonomies]
  tag = "tags"
  series = "series"

[[menus.main]]
  name = "Guides"
  url = "/guides/"
  weight = 10
```

The `[languages.en]` block looks redundant while there is one language, but it makes adding a second one an additive step rather than a config migration. The rest of the behavior is tuned through `[params]` — the home hero line, how many feed posts are visible, the "guide of the week", the default palette — and everything has a default: the site builds without a single param. The full registry is in the theme's `docs/params.md`.

## Content layout {#content-layout}

```text {label="content/"}
content/
├── _index.md              # home: the hero line and data
├── guides/
│   ├── _index.md          # rubric: label, lead
│   └── my-first/
│       └── index.md       # a guide = a folder (leaf bundle)
└── series/
    └── track/
        └── _index.md      # series metadata: title, description
```

The section names are yours: the theme deals in "sections", "series" and "guides" and hardcodes neither rubric names nor subject words. A handbook about databases and a handbook about watercolor lay out the same way.

## Build {#build}

```bash {label="development and production"}
hugo server                        # development
hugo && pagefind --site public     # production: site + search index
```

There are two commands because pagefind indexes a site that is already built. Search does not break in dev without an index: the modal quietly tells you which command builds it.

*You can now stand up a site on the theme from scratch and build it in one pass — all that is left is to fill it.*

## What's next {#what-next}

An empty site builds, but there is nothing to show yet. The next part is about the first guide: a scaffold in one command, the front matter canon and a live widget in two touches.
