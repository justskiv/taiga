---
title: "Widget anatomy"
slug: widget-anatomy
date: 2026-07-04
description: "A reference page bundle: the widgets/ folder laid out for both classes of widget — static and interactive — plus the _shared layer, to copy from."
lead: "Every other page on this demo site puts its widget code somewhere useful; this one exists only to show the folder itself. Copy its widgets/ layout when you start your own."
---

## The two classes of widget {#classes}

A widget in this theme's `widgets/` folder is one of two things.

**Static** — a `figure.html` and nothing else. It renders once, at build time,
and stays that way forever; there is no matching `widget.js` to hand off to.
That is the whole widget below:

{{< widget id="w-anatomy-static" note="— the widgets/ folder of this very bundle, drawn from itself" />}}

**Interactive** — a `widget.js` that registers itself with `Taiga.widget(id, fn)`,
usually paired with a `figure.html` that stands in until JS runs, and a
`widget.css` for anything the theme's own building-block classes
(`.w-row`/`.w-btn`/`.w-num`/`.w-cap`) don't already cover:

{{< widget id="w-anatomy-toggle" note="— click it: it names the file that's driving the mount right now" />}}

Both are the same `{{</* widget id="…" */>}}` shortcode with no inline body — the
id is all it takes for the shortcode to go looking for `widgets/<id>/figure.html`
as the page resource to fill the mount with. See "[A guide is a folder](/inside/anatomy/guide-is-a-bundle/)"
for the other form, an inline fallback written straight into the shortcode.

## The _shared layer {#shared}

Both widgets above load `widgets/_shared/lib.js` and `widgets/_shared/shared.css`
before their own files — the build sorts every `widgets/**.js` and `widgets/**.css`
of a bundle by name, and `_shared` sorts ahead of any `w-*` folder. Concretely,
in this bundle:

- `_shared/lib.js` holds the one guard (`var W = window.Taiga; if (!W || …) return;`)
  that every `widgets/<id>/widget.js` in the bundle relies on, plus a tiny `h()`
  element builder that `w-anatomy-toggle/widget.js` calls without importing or
  redeclaring it — they're concatenated into one script and share a scope.
- `_shared/shared.css` holds `.wa-tag`, the little pill both widgets above use to
  label a filename. It earns its place in `_shared` for the least exotic reason
  there is: two widgets on this page actually use it.

Nothing here is shared out of necessity — a bundle with one widget could just as
well put the guard straight into `widgets/<id>/widget.js`. It's split out on
purpose, so this page has an `_shared/` to point at. A bundle where the split
carries real weight looks the same in shape, just heavier: a shared engine and
its spec table sit in `_shared/lib.js`, and every id that engine drives gets
its own `widgets/<id>/` folder for whatever is genuinely its own — a figure, a
`widget.css` override, sometimes nothing at all.

## Reading the source {#source}

The whole bundle, next to this file:

```text {label="reference/widget-anatomy/ — this page bundle"}
widget-anatomy/
  index.md, index.ru.md    ← this text, in both languages
  widgets/
    _shared/
      lib.js               ← guard + the h() helper
      shared.css            ← .wa-tag
    w-anatomy-static/
      figure.html           ← the whole widget — no widget.js
    w-anatomy-toggle/
      figure.html           ← no-JS fallback
      widget.js             ← Taiga.widget('w-anatomy-toggle', …)
      widget.css             ← .wa-hl, only this widget's class
```

Every file in `widgets/` is optional except the ones that give a widget its
substance: a static id needs `figure.html`, an interactive id needs `widget.js`,
and either can add a `widget.css`. A widget can also skip `figure.html` entirely
and start from an empty mount — `w-ks-counter` on the
"[Kitchen sink](/reference/kitchen-sink/)" page does exactly that.
