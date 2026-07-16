---
title: "A guide is a folder"
slug: guide-is-a-bundle
date: 2026-05-02
description: "The theme's content model: an article is a leaf bundle, where its widgets, styles and cover sit next to the text."
lead: "This article has a live widget, a script of its own and a slot for its own cover — and all of it lies in one folder next to the text. Let's take apart the “article = bundle” content model and see why it spares you from editing templates."
weight: 10
tags: [bundle, widgets, shortcodes]
mins: 5
version: "v0.0.1"
---

## I want a live picture {#naive-picture}

The naive model goes like this: I'm writing a text, and at one spot I need an interactive illustration. A button, a counter, anything. Feels like ten lines of JS.

Now the pain. In an ordinary theme there is nowhere to put those ten lines. The script has to be wired into `<head>` — so you edit a template. The template is shared — so the script ships to every page at once. To stop it, you need a registry of which script belongs to which page — so you add config. A month later you have three articles with widgets and one template file nobody dares to touch. The text lives in one place, its code in three others, and you can no longer move the article as a whole: it has grown roots into the theme.

## An article is a folder {#bundle}

Here an article is a **leaf bundle**: a folder that holds everything it owns. Here is the file strip of the bundle — the very folder this page was built from:

{{< raw >}}
<div class="byte-strip" aria-hidden="true">
  <div class="byte-seg"><div class="cells"><div class="byte-box f0" data-tip="index.md · text and front matter · required">md</div></div><div class="seg-tag">index.md</div></div>
  <div class="byte-seg"><div class="cells"><div class="byte-box f1" data-tip="widgets.js · the page's widgets · the theme wires it in itself">js</div></div><div class="seg-tag">widgets.js</div></div>
  <div class="byte-seg"><div class="cells"><div class="byte-box f2" data-tip="widgets.css · styles of your own · when the building-block classes run out">css</div></div><div class="seg-tag">widgets.css</div></div>
  <div class="byte-seg"><div class="cells"><div class="byte-box pad" data-tip="og.png · your own cover · overrides the generated one">og</div></div><div class="seg-tag padtag">↳ opt.</div></div>
</div>
{{< /raw >}}

Only `index.md` is required. Everything else is an optional neighbor: drop `widgets.js` beside it and the theme finds it, minifies it, fingerprints it and wires it in **on this page only**. Drop `widgets.css` — the same for styles. Drop `og.png` — the social cover is taken from you instead of being generated.

{{< callout type="key" label="Key idea" >}}
Everything an article needs lies next to the article. Moving a guide to another site means moving one folder. Deleting it means deleting one folder. No loose ends in templates and configs.
{{< /callout >}}

## Two touches {#two-touches}

The full cycle of "add a live illustration" is two touches. First: in the text you place a shortcode with an id and a prompt. Second: in `widgets.js` you register an initializer with the same id:

```js {label="inside/guide-is-a-bundle/widgets.js (excerpt)"}
Taiga.widget("w-hello", function (root) {
  root.innerHTML = ""; // drop the static fallback
  // …button, counter, badge — all the code in the file next door
});
```

No templates, no `<head>`, no registries. The shortcode has a paired form: inside it goes a static fallback that lives in the mount point until JS replaces it — and if JS is off, it stays for good. A page without scripts degrades into meaningful text, not into a hole.

Notice what the example above does not have: styles of its own. The building-block classes — `.w-row` for a row of controls, `.w-btn` for buttons, `.w-num` for a big number, `.w-cap` for the output line — live in the theme's CSS, and the widget looks native without hauling in a single rule of its own. `widgets.css` is needed only when that set runs out — and then it, like everything else, simply goes into the folder.

## The runtime catches the fall {#runtime}

`Taiga.widget` is a small runtime in the theme. It waits for the DOM, finds the mount point by id and calls your callback wrapped in a `try/catch`: a widget that throws writes to the console and does not take its neighbors down. And if there is no mount point — the shortcode was taken out of the text — the initializer is skipped in silence.

{{< callout type="trap" label="Trap" >}}
"In silence" cuts both ways. The id in the shortcode and in `Taiga.widget(…)` must match letter for letter: on a typo the runtime decides the shortcode is gone, and you get neither a widget nor an error. An empty square where the illustration should be — check the id first.
{{< /callout >}}

Now check all of it on a live specimen. The widget below was mounted by that very runtime, out of that very `widgets.js` that lies in this article's folder:

{{< widget id="w-hello" note="— click the button a few times, then reload the page: the counter lives in a closure, not in the theme" >}}
<div class="w-cap">A click counter lives here. Right now you see the static fallback: turn JS on and it comes alive.</div>
{{< /widget >}}

One last thing: the mechanism is not tied to guides. `widgets.js` is picked up from **any** bundle — an interactive page here is not a separate type with a template of its own, but an ordinary markdown page with a script lying next to it.

*Now you can add a live illustration to any guide without opening a single file of the theme.*

## What's next {#what-next}

This article is part of a series, and the panel to the left of the text already carries its contents, while the kicker says "part 1 of 3". Nobody typed that by hand. Where the theme knows it all from — in part two.
