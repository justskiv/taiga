---
title: "A series knows itself"
slug: series-knows-itself
date: 2026-05-09
description: "How series work: two fields in the front matter — and the “part N of M” kicker, the panel and the bridge count themselves at build time."
lead: "“Part 2 of 3” in the kicker, the series contents on the left, the bridge with its scale at the bottom and “~5 min left” — none of it was typed by hand. Let's take apart the arithmetic of series: it is simpler than it looks, and all of it happens at build time."
series: ["anatomy"]
series_weight: 20
tags: [series, front-matter, widgets]
mins: 4
version: "v0.0.1"
---

## Contents by hand {#links-by-hand}

The naive model: a series is when every article ends with a list of links to the rest. It works right up to the second change. Add a fourth part — go update three old articles. Reorder the parts — "part 3 of 7" in the headings now lies, and lucky you if you remembered all seven. Contents smeared across the articles go stale the moment you edit anything — because there are as many sources of truth as there are parts.

Worse: half of the series machinery cannot be expressed by hand-written links at all. "~9 minutes left to the end of the series" is arithmetic over every part at once; no article knows that about itself alone.

## Two fields in the front matter {#two-fields}

Here a series has one source of truth. Each part declares two things about itself:

```yaml {label="inside/series-knows-itself/index.md (front matter)"}
series: ["anatomy"]
series_weight: 20
```

This is the front matter of the article you are reading — check it against the kicker above the title. Everything else is computed at build time: the parts are sorted by `series_weight`, the "N" is the position in the sorted list, the "M" is its length. Notice: the order is set by weight, not by publication dates — you can reorder the parts without rewriting the feed's history.

From that same sorted list everything series-shaped on the page is assembled. The kicker is glued from three independent sources: the rubric label (the section's front matter), the series title (the term's front matter) and the computed "part N of M". The panel on the left is the contents with the current part marked. The bridge at the bottom is the prev/next neighbors plus a progress scale. One list, four consumers.

Here is our series through the eyes of the build:

{{< raw >}}
<div class="mem">
  <div class="mem-lab">series/anatomy <span class="tot">→ 3 parts · ~14 min in total</span></div>
  <div class="header">
    <div class="header-word ptr" data-tip="term · the series key, in latin: anatomy"><span class="wk">term</span><span class="wv">→</span></div>
    <div class="header-word" data-tip="parts in the series: 3"><span class="wk">parts</span><span class="wv">3</span></div>
    <div class="header-word" data-tip="the mins of all parts summed: 14"><span class="wk">mins</span><span class="wv">14</span></div>
  </div>
  <div class="mem-arrow">│ term ▼</div>
  <div class="mem-row">
    <div class="word ro" data-tip="part 1 · «A guide is a folder» · weight 10 · ~5 min">w10</div>
    <div class="word live" data-tip="part 2 · this very article · weight 20 · ~4 min">w20</div>
    <div class="word spare" data-tip="part 3 · «A palette is one file» · weight 30 · ~5 min">w30</div>
  </div>
</div>
{{< /raw >}}

The highlighted cell is the article you are standing inside. Hover the neighbors: each tooltip carries its weight and its minutes.

The series title, its description and its order on the rubric page are no magic either: that is the front matter of the *term*, the file `content/series/anatomy/_index.md`. A series is an ordinary taxonomy page — the theme just does not render it at a URL of its own, it takes it apart into metadata. The "whole series" link leads not to a separate page but to the series anchor inside the rubric — the reader needs no extra level of navigation for the sake of three titles.

{{< callout type="internals" label="Under the hood" >}}
The list of parts is assembled by the helper partial `series/pages.html` — with `partialCached` keyed on the term, so the sort runs once per series, however many pages ask for it. The bridge takes its position from there: prev/next are the neighbors in the list, the scale is `flex-grow: mins` of each part, and "~N min left" is the sum of `mins` over the parts after the current one.
{{< /callout >}}

## Check the arithmetic {#check-math}

The bridge's formula is short enough to recompute right here. The widget below runs the same logic over the numbers of this very series:

{{< widget id="w-series-math" note="— put yourself on part 3 and see what the bridge says about the remainder" >}}
<div class="w-cap">The “you are on part k” slider recomputes “~N min left” and the bridge's scale. Turn JS on and we'll count together.</div>
{{< /widget >}}

Notice: the numbers in the widget match the diagram above and the real bridge at the bottom of the page. That is the point — all three have one source.

And what about articles outside series? They get the same kicker, only instead of "part N of M" it says "deep dive", and the panel on the left is filled from the `related` field in the front matter: three to five links to nearby guides. A series is an option, not an obligation.

*Now you can assemble a series out of any articles with two front-matter fields — and reorder the parts by changing one `series_weight`, not N articles.*

## What's next {#what-next}

The bridge below has already worked out that one part is left. It is about color: why all seven palettes of this page live in data files, and how to add your own without touching a line of the theme.
