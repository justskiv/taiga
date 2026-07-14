---
title: "Make it yours"
slug: make-it-yours
date: 2026-06-20
description: "Customization without a fork: a palette in one toml file, custom.css, hook partials, a section of your own and a second language."
lead: "Everything in this part is a file in your site: the palette, the styles, the partials, the interface strings, the second language. Not one edit lands in the theme, and updating it stays an ordinary git pull."
series: ["handbook"]
series_weight: 30
tags: [customize, palettes, i18n]
mins: 5
version: "v0.0.1"
rail_title: "Your theme"
---

## A palette is one file {#own-palette}

The signature color of a site is a toml file in `data/themes/` **on the site side**:

```toml {label="data/themes/mine.toml (fragment)"}
name = "Mine"     # the name in the picker
weight = 80       # position in the picker's list

"bg-deep" = "#101418"
"bg-surface" = "#1a2027"
"text-primary" = "#d8dee6"
```

Hugo merges the data of the theme and of the site (on a name clash the site wins), so the file finds its own way both into the CSS and into the palette picker in the header. Don't need one of the palettes the theme ships with — override its file with `disabled = true`, and it disappears everywhere. How CSS blocks and swatches come out of the toml is taken apart in "[A palette is one file](/inside/palette-is-a-file/)".

## custom.css and hooks {#css-hooks}

Pointed edits on top of the palette go into the site's `assets/css/custom.css`: if the file exists, the theme appends it last to the CSS bundle, so your rules win without `!important`. The design tokens are a public API: the names of the CSS variables are stable and are listed in the theme's `docs/customizing.md`.

For analytics, meta tags of your own and third-party scripts there are hook partials: `hooks/head-extra.html` and `hooks/foot-extra.html` are empty in the theme, the site puts files of the same names into its `layouts/_partials/` — and their contents land in the head and at the end of the body. And if the render itself needs changing — any partial of the theme is overridden by a site file of the same name: Hugo's lookup order always prefers the site's files. The small named partials — the logo, the footer, the feed card — exist for exactly this kind of pointed override.

## A section of your own {#own-section}

You need a section the theme does not have — a glossary, a catalog, a playground with a drill. It needs neither a new layout nor edits to the theme: it is an ordinary page or bundle, and the interactivity is the same `widgets.js` next to the text — the mechanism works for any bundle, not only for guides. A menu item is added to `[[menus.main]]` in the config; the item's `params.badge = "β"` draws a badge — that is a generic feature of the navigation, not the mark of a special section.

The "[Playground](/playground/)" on this demo is built exactly that way: in the theme there is not a trace of it, the whole section is three files on the site side.

## Strings of your own {#own-strings}

The texts of the interface are not hardcoded in the templates. The server-side strings live in `i18n/*.toml`: the site puts down its own file with a partial set of keys, and it merges with the theme's file — you override only what you need. Strings that live in JS — the "View" popover, the hints of the minimap — are overridden with the `window.THEME_I18N` object; the list of keys is in `docs/customizing.md`.

## A second language {#second-language}

Adding a language is an additive step, not a migration. A `[languages.ru]` block is written into the config (plus `[languages.ru.params]` for the hero line and `[languages.ru.menus]` for the menu). The translations come as file suffixes: `index.ru.md` next to `index.md`, including the `_index` of the rubrics and the terms of the series; Hugo pairs the versions itself. A language switcher appears in the header when the site has more than one language, and Pagefind builds a separate index per language, by the page's `lang`. Template edits: zero. The step-by-step checklist is in the theme's `docs/i18n.md`.

This page is the proof: you are reading the English version, and the Russian one lies next to it as `index.ru.md`.

{{< callout type="key" label="Key idea" >}}
The invariant of this whole part: customization is the files of your site. Not one edit lands in the theme's directory, so updating the theme is a `git pull` or a bump of the module version, with no hand-merging of your own changes.
{{< /callout >}}

*You can now take your site as far from this demo as you like — without forking the theme.*

## What's next {#what-next}

The handbook ends here: the theme is installed, guides are being written, the site looks like its own. If you are curious why it is built this way, "Inside" has the "Anatomy of the theme" series: the leaf bundle, the arithmetic of series, palettes-as-data. And every component at once is laid out on the kitchen-sink page in "Reference".
