---
title: "Write your first guide"
slug: first-guide
date: 2026-06-13
description: "A guide scaffold in one command, the front matter canon, shortcodes, captions for code and a live widget in two touches."
lead: "A guide in this theme is a folder that holds all of its belongings. We'll walk from the command that creates the scaffold to a live widget in the text — the widget in this article is real, and it was made in exactly the way described here."
weight: 20
tags: [authoring, front-matter, shortcodes]
mins: 5
version: "v0.0.1"
rail_title: "First guide"
---

## A scaffold in one command {#scaffold}

```bash {label="scaffold a guide"}
hugo new content guides/my-first --kind guides
```

The `guides` archetype creates a leaf bundle: an `index.md` with the front matter skeleton filled in, and a starter `widgets.js` beside it. Files that lie in the guide's folder are picked up by the theme itself — nothing to wire up.

{{< callout type="trap" label="Trap" >}}
The path in the command carries no `/index.md`. Write `guides/my-first/index.md` and Hugo switches into single-file mode and silently declines to copy the archetype's sibling files. A folder with no `widgets.js` is the first sign of this mistake.
{{< /callout >}}

## Front matter: what to fill in {#front-matter}

```yaml {label="index.md — front matter", hl_lines=[5,6]}
title: "My first guide"
description: "One sentence — for the feed, for search and for meta."
lead: "The lead paragraph under the title; it may run longer than description."
tags: [example, setup]
mins: 4
version: "v0.0.1"
```

The two highlighted fields have non-obvious rules. `mins` is a handwritten, honest estimate of reading time: it lands in the article's chips and in the arithmetic of the series, which is why it is not trusted to an automatic count (omit the field and the theme will count for you). `version` is an arbitrary string for the version chip: the version of a language, of a DBMS, of your product — the theme renders it as-is. The archetype fills in `date` and `slug` too; the date lives only in the feed and the RSS — it appears nowhere in the text of the article.

A guide becomes a series part by where it lives: its folder sits inside the series folder (`guides/track/my-part/`), and `weight` sets its order among the parts; `rail_title` gives the panel its short name. How "part N of M" comes out of that is taken apart in "[A series knows itself](/inside/anatomy/series-knows-itself/)".

Mark up headings with explicit anchors: `## Section {#section-id}`, in Latin letters — then links and the table of contents do not depend on how the heading text transliterates. That matters the day the page gets a translation.

## Shortcodes {#shortcodes}

Four of them, and that is enough for most guides:

- `callout` — an inset; types `key`, `trap`, `internals`, `note`;
- `widget` — the mount point of a live illustration (below);
- `raw` — a multi-line HTML fragment as-is, for diagrams;
- `bigcard` — a large card link to a neighboring piece.

```md {label="an inset in the text of a guide"}
{{</* callout type="trap" label="Trap" */>}}
Inside it — plain markdown.
{{</* /callout */>}}
```

Code blocks take attributes right in the fence: `` ```toml {label="config.toml (fragment)", hl_lines=[2]} `` — `label` draws a caption above the block, `hl_lines` highlights lines. You have met both already in this article: the caption on every block and the highlighting in the front matter example are done exactly this way.

## A widget in two touches {#widget-two-touches}

A live illustration is added without editing the theme. Touch one — the shortcode in the text; inside it goes a static fallback, which is what readers without JS are left with:

```md {label="touch 1 — the shortcode in the text"}
{{</* widget id="w-demo" note="— a task for the reader" */>}}
<p>A static fallback for readers without JS.</p>
{{</* /widget */>}}
```

Touch two — an initializer with the same id in the `widgets.js` next to `index.md`:

```js {label="touch 2 — widgets.js next to index.md"}
Taiga.widget("w-demo", function (root) {
  root.innerHTML = "";
  // you build the widget out of the theme's building-block classes:
  // .w-row, .w-btn, .w-num, .w-cap — no styles of your own needed
});
```

The theme's runtime waits for the DOM, finds the mount point and calls the callback inside a `try/catch`: a widget that falls over writes to the console and does not bring the page down with it. The one thing to watch is that the id in the shortcode and the id in `Taiga.widget(…)` match letter for letter.

Here is the working proof — an estimate of an honest `mins` for a guide not yet written:

{{< widget id="w-mins" note="— stack up the sections of your future guide and see which mins would be honest" >}}
<div class="w-cap">A mins estimate from the number of sections. Right now this is the static fallback: turn JS on and we'll count.</div>
{{< /widget >}}

It is built exactly as in the examples above: the shortcode here, `Taiga.widget("w-mins", …)` in the `widgets.js` in this article's folder.

*You can now write a guide with a live illustration without opening a single file of the theme.*

## What's next {#what-next}

The guide exists, the site builds — but it still looks like this demo, not like your project. The third part is about a palette in one file, `custom.css`, sections of your own and a second language.
