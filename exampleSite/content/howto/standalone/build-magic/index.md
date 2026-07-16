---
title: "Covers, search and other build-time magic"
slug: build-magic
date: 2026-05-23
description: "What the theme does at build time: OG covers from a style folder, Pagefind full-text search and the version chip."
lead: "The cover for social networks, the full-text search and the version chip in an article's meta look like runtime magic — but all of it happens at build time. We'll take all three mechanisms apart: each has a simple design and one honest caveat."
tags: [og, search, build]
mins: 6
version: "v0.0.1"
related:
  - "inside/anatomy/guide-is-a-bundle"
  - "inside/anatomy/series-knows-itself"
  - "inside/anatomy/palette-is-a-file"
---

## A cover without a designer {#og-covers}

The naive model: covers for sharing are drawn by hand. By the thirtieth article that is a pain, and after a title is renamed it is twice the pain: the picture now lies, go redraw it.

Here the build generates the covers, and the look is described by a **style** — a folder in `assets/og/`, folder name = style key. Two files inside are mandatory: `base.png`, the 1200×630 backdrop where all the graphics live, and `layout.toml`, the layout of the text blocks on top of it:

```toml {label="assets/og/dots/layout.toml (fragment)"}
[[block]]
text = "{title}"
font = "Inter-ExtraBold.ttf"
size = 66
color = "#e6dfd2"
x = 76
y = 270
width = 1010     # long titles wrap on their own
```

The placeholders — `{title}`, `{kicker}`, `{meta}`, `{domain}`, `{part}` — are assembled by a partial, so a style is language-neutral: the texts come from the article, the layout from the style. Blocks are drawn in order; unknown keys are ignored — an old style survives a new version of the theme. The optional `home.png` is a fully baked poster for the home page and the rubrics; without it, the shared cover is generated from `base.png` by the same pipeline. And a folder with no `layout.toml` simply does not count as a style.

The style is chosen with the site param `ogImages.style`, and for a single page with `og_style` in the front matter. On top of any style the author's override works: drop an `og.png` into the article's bundle and the generator gives way to your picture. A site adds a style of its own with a folder: the theme's assets and the site's are merged, and the site wins.

{{< callout type="trap" label="Trap" >}}
The text on the cover is drawn by Hugo's image engine, and it has limits: letter-spacing is not supported (it is approximated with the font size), and right alignment works only for monospace fonts — the width of a line is counted in characters. Design your styles with this in mind rather than finding it out on a finished cover.
{{< /callout >}}

## Search that reads everything {#search}

The naive model of search on a static site is an index of titles and descriptions: it finds an article by its name and stays silent about a term from the middle of the text. The engine here is a different one: **Pagefind** builds a full-text index over the already-built site. Which is why a build is two commands:

```bash {label="a full site build"}
hugo && pagefind --site public
```

Pagefind is a standalone binary; Node is not needed. It walks the finished HTML and takes only what the theme marked up: the body of the article in full, the breadcrumb and the minutes for the result card as separate metadata, while panels, widgets and the rest of the chrome do not get into the index at all. Code blocks are indexed with a lowered weight: a search by function name has to work, but code must not clog the results. Stemming comes out of the box, by the language of the page: a query for "covers" finds "cover", and on the Russian version of this page the Russian morphology does the same job. The search script and the index itself load lazily, on the first opening of the modal: search nothing and you download not a byte.

Check it on this page: open search and type a word from the middle of the text — "monospace", say. It will be found, with highlighting and an excerpt. And if you run a bare `hugo server` without the second command, the modal honestly tells you what builds the index — quietly, without red errors.

{{< callout type="key" label="Key idea" >}}
All three mechanisms are build-time. The browser gets a finished picture, a finished index and a finished string; at runtime nobody computes anything and nobody goes off to any service.
{{< /callout >}}

## The version chip {#version-chip}

The meta of this article carries a "v0.0.1" chip. The theme has no idea what that means: the chip is an arbitrary string from `version` in the front matter, or, if the field is absent, from the site's `versionDefault`. A site about a programming language writes the version of the language there, a site about a database writes "PostgreSQL 17", and this demo writes the version of the theme itself — and the theme renders all of it the same way, as-is. A small detail, but agnosticism is made of exactly these: the theme does not know what your site is about.

*You can now build a site with covers and full-text search in two commands — and explain why there are exactly two.*

## What's next {#what-next}

That was the view from outside — what the build does for the reader. The view from inside — how the pages themselves are put together — is in the "Anatomy of the theme" series: leaf bundles, the arithmetic of series, palettes as files.
