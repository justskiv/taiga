---
title: "Kitchen sink: every component"
slug: kitchen-sink
date: 2026-05-30
description: "A regression testbed: every shortcode, callout, code block, diagram and widget on one page."
lead: "A testbed for every component in the theme: one instance of each shortcode, callout, code block, diagram and widget on a single page — so design changes have something to test against, and guide authors have something to peek at and copy."
---

## Headings and anchors {#headings}

Level two — with the `#` character, level three — with `##`. Inline: *italic*, **bold**,
`code`, an internal link to the [reference guide](/inside/anatomy/guide-is-a-bundle/).

### Third-level subheading {#sub}

Checks that render-heading attaches `##` and an anchor to h3.

## Code {#code}

Go is highlighted server-side (Chroma in the palette's colors):

```go
type Point struct {
	X, Y int64
}
func dist(a, b Point) int64 { return (a.X-b.X)*(a.X-b.X) }
```

With a file caption and line highlighting (`{label=… hl_lines=[2]}`):

```go {label="runtime/malloc.go (simplified)" hl_lines=[2]}
func mallocgc(size uintptr) unsafe.Pointer {
	c := getMCache()          // hot path — no locks
	return c.alloc(size)
}
```

Non-Go — flat `.nohl` (fence `text` or no language):

```text
$ go build ./...
ok  taiga/internals  0.312s
```

## Table {#table}

A Markdown table; render-table attaches the `.tbl-wrap` wrapper:

| Type     | Size   | Alignment    |
|----------|-------:|:------------:|
| `bool`   |      1 |      1       |
| `int64`  |      8 |      8       |
| `[]T`    |     24 |      8       |

## Callouts {#callouts}

{{< callout type="key" >}}
The main idea with the default label. Inside — **markdown** and `code`.
{{< /callout >}}

{{< callout type="trap" >}}
A trap with the default label.
{{< /callout >}}

{{< callout type="internals" label="Under the hood: a custom label" >}}
An "under the hood" callout with an overridden label.
{{< /callout >}}

{{< callout type="note" >}}
A historical footnote — the quietest type.
{{< /callout >}}

{{< callout type="warn" >}}
A caution — the loudest type, in red.
{{< /callout >}}

## Fold {#fold}

A collapsible inline note — icon, summary, and a toggle; the panel slides open
by height. `title=` is inline Markdown, the body is Markdown.

{{< fold icon="video" title="There is also a [video version](https://youtu.be/dQw4w9WgXcQ) of this guide." >}}
Watch first, then read to cement it — some things land better on screen,
others in text. The link above opens the video **without** toggling the panel.
{{< /fold >}}

{{< fold icon="tip" title="A simplification made on purpose." >}}
The real thing is a little more involved, but the simpler model is right in
the essentials — the details come later.
{{< /fold >}}

{{< fold icon="code" more="Show code" less="Hide" open="true" title="A full listing, rendered already open." >}}
```go
func main() { println("hello") }
```
{{< /fold >}}

## Terms {#terms}

Hover an underlined word and its definition opens as a card; a click pins the
card so you can read it and follow the link inside. With JavaScript off every
definition sits as a list at the foot of the page, and each word links to its own.

The plainest form — a word and a definition, default type:
every P owns an {{< term "mcache" >}}
A per-P cache of small objects. Allocating from it takes **not a single atomic** —
that is the whole point: the fast path never touches shared state.
{{< /term >}}, and hitting it is the cheapest allocation there is.

With a type label, its colour, and a link in the card's footer:
the compiler inserts a {{< term word="write barrier" title="Write barrier" kind="trap" color="copper" href="/inside/anatomy/palette-is-a-file/" more="Deep dive: barriers and the GC" >}}
A snippet the runtime runs **before every pointer write** into the heap while the
GC is running concurrently.

```go
// simplified: runtime/mbarrier.go
func writePointer(slot *unsafe.Pointer, ptr unsafe.Pointer) {
	shade(*slot)        // shade the old value grey
	*slot = ptr
}
```

Hence the invariant: a pointer written while the GC runs can never be lost.
{{< /term >}} — which is why a pointer write costs more than an `int` write.

When the word reads differently in the sentence than it should in the card's
heading, `title=` splits the two:
the data lives in the {{< term word="core's caches" title="CPU cache" kind="hardware" color="green" >}}
Three levels — L1, L2, L3. The closer to the core, the smaller and faster:

- **L1** — tens of kilobytes, ~4 cycles
- **L2** — hundreds of kilobytes, ~12 cycles
- **L3** — megabytes, shared per socket, ~40 cycles

A miss past L3 means a trip to main memory — hundreds of cycles, and that trip
is exactly what the word "locality" is hiding.
{{< /term >}}, not in RAM.

## Diagrams {#diagrams}

A memory diagram and a byte strip — raw HTML via `{{</* raw */>}}`:

{{< raw >}}
<div class="mem">
  <div class="mem-lab"><code>Point{X, Y int64}</code> <span class="tot">→ 16 bytes, zero padding</span></div>
  <div class="byte-strip" aria-hidden="true">
    <div class="byte-seg"><div class="cells"><div class="byte-box f1" data-tip="X · int64 · 8 B">0</div><div class="byte-box f1" data-tip="X · int64 · 8 B">1</div></div><div class="seg-tag">X (int64)</div></div>
    <div class="byte-seg"><div class="cells"><div class="byte-box f2" data-tip="Y · int64 · 8 B">8</div><div class="byte-box f2" data-tip="Y · int64 · 8 B">9</div></div><div class="seg-tag">Y (int64)</div></div>
  </div>
</div>
{{< /raw >}}

## Widgets {#widgets}

Form 1 — an empty mount, brought to life by `Taiga.widget` from `widgets.js`:

{{< widget id="w-ks-counter" note="— click it, the number ticks" />}}

Form 2 — a mount with a static fallback inside (visible without JS):

{{< widget id="w-ks-fallback" note="— a static diagram sits below it" >}}<div class="mem"><div class="mem-lab">static fallback</div><div class="mem-row"><div class="word live" data-tip="visible without JS">e0</div></div></div>{{< /widget >}}

Form 3 — no id, arbitrary HTML directly in the figure:

{{< widget note="— custom HTML, no mount" >}}<div class="w-row"><span class="w-cap">arbitrary widget markup</span></div>{{< /widget >}}

## Card {#card}

{{< bigcard href="/inside/anatomy/guide-is-a-bundle/" k="To the reference →" t="A guide is a folder" s="A big CTA card: kicker, title, caption." >}}
