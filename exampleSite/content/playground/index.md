---
title: "Playground"
description: "A custom section of the demo site: assembled from the theme's stock mechanisms — a page bundle, a widget next to the text, and a menu item with a badge."
lead: "This section isn't part of the theme. It exists to show what a site's own section looks like: a page, a widget, a menu item — and not a single edit to the theme."
---

The theme has no "playground" shortcode, no styles for it, no mentions of it at all. The whole section is three things on the site's side: this page bundle, `widgets.js` next to it (the widget mechanism works for any bundle, not just guides), and a menu entry in the config with `params.badge = "β"` — the theme's navigation draws the badge on the entry; that's a generic feature of it.

So the playground has something to show — a toy built on the theme's building blocks:

{{< widget id="w-reflex" note="— press 'start', wait for the word 'go!' and click as fast as you can" >}}
<div class="w-cap">Reaction time test. Right now this is a static fallback: turn on JS, and we'll check your milliseconds.</div>
{{< /widget >}}

Any section of your own gets added the same way — a glossary, a catalog, a trainer: a page, widgets if you need them, a menu item. It's covered step by step in "[Make it yours](/howto/make-it-yours/)".
