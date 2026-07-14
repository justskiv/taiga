---
title: "A palette is one file"
slug: palette-is-a-file
date: 2026-05-16
description: "Palettes as data: a toml file in data/themes/, out of which the build makes CSS blocks and the picker's swatches."
lead: "The picker in this page's header knows several palettes — and not one of them is hardcoded, neither in CSS nor in JS. Every palette is a toml file, and the build generates all the rest out of it. Let's take apart how that works, and repaint the page from inside the article."
series: ["anatomy"]
series_weight: 30
tags: [palettes, data]
mins: 5
version: "v0.0.1"
---

## Your own theme without a fork {#no-fork}

The naive model: I want to repaint the site my way — I'll open the theme's CSS and change the colors. The pain arrives with the very first theme update: your edits lie in its files, and every update is a merge conflict. The classic choice of "fork it and drop off upstream — or put up with somebody else's colors". Both options are bad, and both grow from one mistake: color is treated as *styling*, when in fact it is *data* — a table of "variable name → value" that has nowhere to live except somebody else's CSS.

## One toml {#one-toml}

Here a palette is data, not styles. Each one is a file `data/themes/<id>.toml`: a couple of housekeeping fields plus color variables whose keys are literally the names of the CSS variables without the `--`:

```toml {label="data/themes/mine.toml", hl_lines=[1,2]}
name = "Mine"     # name in the picker
weight = 80       # position in the picker's list

"bg-deep" = "#101418"
"bg-surface" = "#1a2027"
"border" = "#2b3138"
"text-primary" = "#d8dee6"
```

Highlighted are the only two lines that are not CSS variables. All the rest is a straight "name → color" table. The key ones:

| Key | What it paints |
|---|---|
| `bg-deep` | the deepest background of the page |
| `bg-surface` | surfaces: cards, callouts, widgets |
| `border` | frames and hairlines |
| `text-primary` | the main text |
| `text-muted` | captions, metas, the secondary |

At build time the partial `head/palettes.html` turns these files into CSS: a `:root { … }` block for the default palette plus one `[data-theme="<id>"] { … }` block per palette — and pours the result into the common CSS bundle first. Which palette is the default is decided by the site parameter `defaultTheme`: it is just the id of one of the files. Switching the theme is switching one `data-theme` attribute on `<html>`; the cascade does the rest. That is also why the switch is instant: the browser has nothing left to fetch, every palette is already in the CSS it got with the page's first byte.

{{< callout type="note" label="Historical note" >}}
In the theme's prototype the palettes lived as a JS table: the "View" popover held an array of colors and swapped the variables through `style.setProperty` right on `<html>`. During the move the table was taken apart into toml files, and CSS generation was carried off to the build. Now JS does not know the palette values at all — it only reads their list.
{{< /callout >}}

## The picker and its JSON {#picker-json}

Where does the picker learn which palettes exist? From the same data: the partial puts a `<script type="application/json" id="dg-themes">` on the page with a list of `{id, name, weight, swatch colors}` — the swatches are taken from four fixed keys of the palette, so the thumbnail in the picker honestly shows the surfaces and the text to come. The popover in the header reads that list and draws the buttons. The widget below reads **the very same** list — and on a click sets the very same attribute:

{{< widget id="w-palette" note="— repaint the page; the picker in the header does exactly the same, only it also remembers the choice" >}}
<div class="w-cap">The swatches of every palette in the theme go here — clickable, with real switching. Turn JS on to repaint the page.</div>
{{< /widget >}}

Notice the honest difference: the widget changes only the attribute, while the picker also writes the choice into storage — which is why after a reload its version wins. And the saved choice is applied before the first paint, by a tiny inline script in `<head>`: the page does not flash the default palette, not for a single frame.

Now the main thing — extensibility. Your site needs a house palette? Put `data/themes/mine.toml` **on the site side**: Hugo merges the theme's data with the site's (the site wins on a name clash), and the file finds its own way into both the CSS and the picker. Don't like a palette that ships with the theme — override its file with `disabled = true`, and it disappears everywhere. Not a line in the theme, no fork.

*Now you can give a site a palette of its own with one file — without touching the theme's CSS, JS or templates.*

## What's next {#what-next}

The "Anatomy of the theme" series ends here: a guide is a folder, a series is a taxonomy, a palette is a file. Everything shown — and a dozen components we never got to — is gathered on one proving-ground page:

{{< bigcard href="/reference/kitchen-sink/" k="Proving ground →" t="Kitchen-sink" s="Every component of the theme on one page — to look at and to copy" >}}

And as for what happens at build time — covers, search, the version chip — there is a deep dive of its own in "How-to".
