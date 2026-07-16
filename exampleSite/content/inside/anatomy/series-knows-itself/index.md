---
title: "A series knows itself"
slug: series-knows-itself
date: 2026-05-09
description: "How series work: a series is a folder in its rubric — and the “part N of M” kicker, the panel and the bridge count themselves at build time."
lead: "“Part 2 of 3” in the kicker, the series contents on the left, the bridge with its scale at the bottom and “~5 min left” — none of it was typed by hand. Let's take apart the arithmetic of series: it is simpler than it looks, and all of it happens at build time."
weight: 20
tags: [series, front-matter, widgets]
mins: 4
version: "v0.0.1"
---

## Contents by hand {#links-by-hand}

The naive model: a series is when every article ends with a list of links to the rest. It works right up to the second change. Add a fourth part — go update three old articles. Reorder the parts — "part 3 of 7" in the headings now lies, and lucky you if you remembered all seven. Contents smeared across the articles go stale the moment you edit anything — because there are as many sources of truth as there are parts.

Worse: half of the series machinery cannot be expressed by hand-written links at all. "~9 minutes left to the end of the series" is arithmetic over every part at once; no article knows that about itself alone.

## A folder, not a field {#membership}

Here a series has one source of truth. A part declares almost nothing about itself — it simply lies in the series folder, a sub-section of the rubric:

```text {label="content/inside/ — the folder of this very series"}
content/inside/
  anatomy/                  ← the series
    _index.md               ← series metadata: title, description, order
    guide-is-a-bundle/      ← part, weight: 10
    series-knows-itself/    ← part, weight: 20 — you are here
    palette-is-a-file/      ← part, weight: 30
```

This is the folder of the article you are reading — check it against the kicker above the title. Membership is location; the one thing a part carries itself is `weight` in its front matter, its order among the parts. Everything else is computed at build time: the parts are sorted by `weight`, the "N" is the position in the sorted list, the "M" is its length. Notice: the order is set by weight, not by publication dates — you can reorder the parts without rewriting the feed's history.

From that same sorted list everything series-shaped on the page is assembled. The kicker is glued from three independent sources: the rubric label (the section's front matter), the series title (the front matter of the series' `_index.md`) and the computed "part N of M". The panel on the left is the contents with the current part marked. The bridge at the bottom is the prev/next neighbors plus a progress scale. One list, four consumers.

Here is our series through the eyes of the build:

{{< raw >}}
<div class="mem">
  <div class="mem-lab">inside/anatomy/ <span class="tot">→ 3 parts · ~14 min in total</span></div>
  <div class="header">
    <div class="header-word ptr" data-tip="folder · the series slug, in latin: anatomy"><span class="wk">folder</span><span class="wv">→</span></div>
    <div class="header-word" data-tip="parts in the series: 3"><span class="wk">parts</span><span class="wv">3</span></div>
    <div class="header-word" data-tip="the mins of all parts summed: 14"><span class="wk">mins</span><span class="wv">14</span></div>
  </div>
  <div class="mem-arrow">│ folder ▼</div>
  <div class="mem-row">
    <div class="word ro" data-tip="part 1 · «A guide is a folder» · weight 10 · ~5 min">w10</div>
    <div class="word live" data-tip="part 2 · this very article · weight 20 · ~4 min">w20</div>
    <div class="word spare" data-tip="part 3 · «A palette is one file» · weight 30 · ~5 min">w30</div>
  </div>
</div>
{{< /raw >}}

The highlighted cell is the article you are standing inside. Hover the neighbors: each tooltip carries its weight and its minutes.

The series title, its description and its order on the rubric page are no magic either: that is the front matter of the folder's `_index.md` — here, `content/inside/anatomy/_index.md` (scaffold one with `hugo new content inside/anatomy/_index.md --kind series`). The same file gives the series a **landing page** at `/inside/anatomy/`: the title with its tagline, the description, the file's own body as an epigraph, the list of parts and a "start the series" button. The "whole series" links in the panel and the bridge lead exactly there; on the rubric page the same series stands as an anchored block. And a series announced with an `_index.md` but no parts yet is not an error: the rubric shows it as an "in the works" teaser, and its landing renders the announcement.

{{< callout type="internals" label="Under the hood" >}}
The series context is resolved by the helper partial `article/series-ctx.html`: the series is simply the page's `.CurrentSection` whenever the page sits deeper than its rubric, and the parts are that section's regular pages — `weight`-ascending, Hugo's default sort. The bridge takes its position from there: prev/next are the neighbors in the list, the scale is `flex-grow: mins` of each part, and "~N min left" is the sum of `mins` over the parts after the current one.
{{< /callout >}}

## Check the arithmetic {#check-math}

The bridge's formula is short enough to recompute right here. The widget below runs the same logic over the numbers of this very series:

{{< widget id="w-series-math" note="— put yourself on part 3 and see what the bridge says about the remainder" >}}
<div class="w-cap">The “you are on part k” slider recomputes “~N min left” and the bridge's scale. Turn JS on and we'll count together.</div>
{{< /widget >}}

Notice: the numbers in the widget match the diagram above and the real bridge at the bottom of the page. That is the point — all three have one source.

And what about articles outside series? They get the same kicker, only instead of "part N of M" it says "deep dive", and the panel on the left is filled from the `related` field in the front matter: three to five links to nearby guides. A series is an option, not an obligation.

*Now you can assemble a series out of any guides by gathering them into one folder — and reorder the parts by changing one `weight`, not N articles.*

## What's next {#what-next}

The bridge below has already worked out that one part is left. It is about color: why all seven palettes of this page live in data files, and how to add your own without touching a line of the theme.
