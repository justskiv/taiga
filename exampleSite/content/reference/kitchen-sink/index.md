---
title: "Kitchen sink: every component"
slug: kitchen-sink
date: 2026-05-30
lastmod: 2026-07-15
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

Other lit languages wear the same roles — blue for a structural name, copper
for a number, one tone for strings, muted italic for a comment:

```json
{
  "items": [
    {"price": 123, "shipped": true},
    {"price": 101}  // a trailing comment is fine
  ]
}
```

```bash
export GODEBUG=schedtrace=1000
go build ./... && ./app --addr "$HOST:8080"   # both, or nothing
```

A bare fence, `text` or `txt` is the plain form — flat `.nohl`, which is what a
transcript wants:

```text
$ go build ./...
ok  taiga/internals  0.312s
```

### Runnable, several commands {#run-modes}

A snippet with `actions=`: the same listing under two commands of the sandbox,
and a switch in the toolbar that picks which one Run runs. The body is the
transcript of both — the second part opens with its own `$ ` line. There is no
sandbox behind this demo (see `params.codapi` in its config), so Run shows the
failure state; the switch, the parts and the no-JS view are all real.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var n int
	var wg sync.WaitGroup
	for range 2 {
		wg.Add(1)
		go func() { defer wg.Done(); n++ }()
	}
	wg.Wait()
	fmt.Println(n)
}
```
{{< run sandbox="go1.26" label="go run" actions="go_run_-race:run-race" >}}
2

$ go run -race main.go
2
==================
WARNING: DATA RACE
Read at 0x00c000012118 by goroutine 8:
  main.main.func1()
      main.go:14 +0x6c

Previous write at 0x00c000012118 by goroutine 7:
  main.main.func1()
      main.go:14 +0x7e
==================
Found 1 data race(s)
exit status 66
{{< /run >}}

An action's part can be a recorded error too: `error=` names the commands
whose part is one. Here the second command runs the listing under the previous
Go version, which does not compile it, and its part reads in the failed colour
from the start, as `error="true"` makes the first part read.

```go
package main

import "fmt"

type List[T any] []T

func (l List[T]) Map[U any](f func(T) U) List[U] {
	out := make(List[U], 0, len(l))
	for _, v := range l {
		out = append(out, f(v))
	}
	return out
}

func main() {
	fmt.Printf("%q\n", List[int]{1, 2, 3}.Map(func(n int) string { return fmt.Sprint(n) }))
}
```
{{< run sandbox="go1.27" label="Go 1.27" actions="Go_1.26:run-go126" error="run-go126" >}}
["1" "2" "3"]

$ go1.26.4 run main.go
# command-line-arguments
./main.go:7:21: syntax error: method must have no type parameters
{{< /run >}}

### Runnable, output as a diff {#run-lang}

`lang="diff"` says the output is a unified diff: inserted and deleted lines
take the palette's diff colours, and the headers step back. Every part of the
block, recorded or live, is highlighted by the same rules, and what the reader
copies is the plain diff.

```go
package main

import "fmt"

func main() {
	var v interface{} = 42
	fmt.Println(v)
}
```
{{< run sandbox="go1.27" command="fix-diff" lang="diff" cmd="go fix -diff ." >}}
--- main.go (old)
+++ main.go (new)
@@ -3,6 +3,6 @@
 import "fmt"
 
 func main() {
-	var v interface{} = 42
+	var v any = 42
 	fmt.Println(v)
 }
{{< /run >}}


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

## Emphasis in prose {#emphasis}

> [!epigraph] Rob Pike, [Go Proverbs](https://go-proverbs.github.io/), 2015
> Clear is better than clever.

A section may open with an epigraph: the one block set wholly in italic, moved
to the right, its source a mono line. Everything below is plain Markdown — the
same source Obsidian reads natively.

A slice header is three words, and `append` may or may not move the array
behind them. Hence the rule for reading someone else's code:

>> After an `append`, every old header onto the same array is under suspicion.
{#append-rule}

A quote stays somebody else's words — italic and a step quieter — with its rule
on the same vertical as the thesis sign:

> Don't communicate by sharing memory, share memory by communicating.
>
> — Go Proverbs

>> A thesis may run to two paragraphs: the blank line between them is `>>` too.
>>
>> It stays upright and in prose colour, **bold** and *italic* included.

> [!aside]
> By the way, the header is passed by value — which is exactly why a callee's
> `append` never shows in the caller's `len`, and why
> [the rule above](#append-rule) holds.

> [!recap] checkpoint
> Now you can tell from a function's signature whether it may grow your slice
> in place.

Inline emphasis stays small: **bold** for a term at its definition or a run-in
head, *italic* for one to three words of stress — *курсив* in Cyrillic too.

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

Past roughly half a screen of prose the fold switches register on its own: the
summary is set at reading size, the block takes its own air, and the panel ends
with an explicit toggle so a long aside can be closed from where the reading
stopped. `size=` forces either register — here it is used to show the section
one without pasting a wall of text.

{{< fold icon="book" size="section" title="Primer: the aside that grew into a chapter" more="Expand" less="Collapse" >}}
An aside that runs for screens is not a footnote any more, and setting it two
sizes down punished the reader for opening it: the click *is* them agreeing to
read this.

So the revealed panel is prose — same size, same colour as the article around
it — and what says "inset" is structure: this summary row, the rail down the
left, and the closing row below.

The rail is the part that survives scrolling. Past the first screen the summary
is gone, and the line is the only thing left saying you are still inside
something the article offered to skip.
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

A definition renders through the same pipeline as the article, so a listing
inside a card is lit exactly as it would be in the prose:
the path is a {{< term word="JSON Pointer" kind="definition" color="blue" href="https://www.rfc-editor.org/rfc/rfc6901" more="RFC 6901" >}}
A standard for addressing one value inside a JSON document — a string of
slash-separated tokens:

```json
{
  "items": [
    {"price": 123},
    {"price": 101}  // this one is /items/1/price
  ]
}
```

Left to right: field `items`, element `1`, field `price`.
{{< /term >}}, not a dotted path.

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

A definition is block Markdown, so a drawn thing goes in as it does in the
article — the same diagram markup, kept whole by `{{</* raw */>}}`. The card
widens a bracket to hold it:
a slice is a {{< term word="three-word header" title="Slice header" kind="layout" color="gold" >}}
Three machine words, always in this order:

{{< raw >}}
<div class="header">
  <div class="header-word ptr"><span class="wk">ptr</span><span class="wv">0x1040</span></div>
  <div class="header-word"><span class="wk">len</span><span class="wv">4096</span></div>
  <div class="header-word"><span class="wk">cap</span><span class="wv">8192</span></div>
</div>
{{< /raw >}}

Re-slicing moves `len` and `cap`; only growing past `cap` moves `ptr` — which
is why one slice can write through another.
{{< /term >}}, not a growable array.

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

## Data figures {#data}

Numbers the reader compares at a glance — written as Markdown, drawn by the
theme, read by Obsidian from the same source (`docs/authoring.md#data`).

A row of big numbers — a `[!stats]` callout over a list:

> [!stats] promises from the release notes
> - **up to 30%** cheaper small allocations *on a microbenchmark*
> - **~1%** in real code *in programs that allocate a lot*
> - **+60 KB** to the binary *whatever the load*

A table cell with a detail — a trailing italic in a right-aligned column
becomes a quieter second line:

| 24 bytes | laptop | server |
|---|---:|---:|
| No pointers | −41% *9.2 → 5.5 ns* | −28% *27.0 → 19.5 ns* |
| With a pointer | −46% *11.7 → 6.3 ns* | −36% *34.5 → 22.0 ns* |

Bars, one series — the marked row full, the other a ghost, a note after the
bar:

{{< bars mark="2" note-color="green" >}}
| | Binary growth |
|---|--:|
| **Go 1.26** *behind a flag, up to 512 B* | +155 KB |
| **Go 1.27** *in the release, up to 80 B* | +44 KB *3.5× lighter* |
{{< /bars >}}

Bars, grouped — a group per row, a bar per column, framed when captioned:

{{< bars colors="blue green" max="50" cap="Time saved per 24-byte allocation" note="— illustrative numbers" >}}
| 24 bytes | laptop | server |
|---|--:|--:|
| No pointers | −41% | −28% |
| With a pointer | −46% | −36% |
| Through `make([]byte, 24)` | −33% | −19% |
{{< /bars >}}

Bars of a whole — the same saving, but every bar is the full old time and the
saved part is marked at its end:

{{< bars colors="blue green" whole="100" cap="How much of a 24-byte allocation the specialization took away" note="— illustrative numbers, a bar is the time without it" >}}
| 24 bytes | laptop | server |
|---|--:|--:|
| No pointers | −41% | −28% |
| With a pointer | −46% | −36% |
| Through `make([]byte, 24)` | −33% | −19% |
{{< /bars >}}

Bars, stacked — the parts of one bar told apart by fill, a heading row, the
exact parts printed at `digits`:

{{< bars stack="true" digits="1" colors="green" unit=" ns" cap="How much of an allocation was the GC" note="— illustrative numbers" >}}
| | **allocator** *stays with the ballast — the allocator itself* | **GC** *goes with the ballast — the collector's work* |
|---|--:|--:|
| **server** *win −28% → −35% with the ballast* | | |
| off | 19.54 | 7.48 |
| on | 12.79 | 6.70 |
{{< /bars >}}

Bars in tabs — a stack's heading rows become tabs on one scale, `open` picks
the tab shown first; a part's trailing italic is printed after the total:

{{< bars stack="true" tabs="true" open="Genoa" digits="1" colors="blue green red" unit=" ns" cap="Time per 24-byte allocation without the specialization, and how much of it the specialization took away" note="— Go 1.27, specialization off → on" >}}

| | **remains** *what an allocation takes with the specialization* | **saved** *what the specialization took away* |
|---|--:|--:|
| **M4 Pro** *−33…−46%* | | |
| No pointers | 5.496 | 3.752 *−41%* |
| With a pointer | 6.295 | 5.41 *−46%* |
| Through `make([]byte, 24)` | 6.756 | 3.304 *−33%* |
| **Genoa** *−19…−36%* | | |
| No pointers | 19.49 | 7.53 *−28%* |
| With a pointer | 22.01 | 12.48 *−36%* |
| Through `make([]byte, 24)` | 22.45 | 5.28 *−19%* |
| **Skylake** *−11…−28%* | | |
| No pointers | 41.55 | 11.38 *−21%* |
| With a pointer | 46.71 | 17.81 *−28%* |
| Through `make([]byte, 24)` | 48.10 | 5.90 *−11%* |

{{< fold >}}

| No pointers, ns | {{< mk blue circle >}} M4 Pro | {{< mk green square >}} Genoa (Zen 4) | {{< mk red triangle >}} Skylake |
|---|---:|---:|---:|
| specialization off | 9.25 | 27.02 | 52.93 |
| specialization on | 5.50 | 19.49 | 41.55 |
| saved | 3.75 *−41%* | 7.53 *−28%* | 11.38 *−21%* |

*Twenty runs per configuration, compared by {{< term word="benchstat" kind="tool" color="green" >}}The Go team's tool for comparing benchmark runs: it tells a real difference from noise.{{< /term >}}.*

{{< /fold >}}

{{< /bars >}}

A `{{</* fold */>}}` written inside a figure is the card's footer — a quiet
row after the key, one for all the tabs; its body is any Markdown (above: a
table whose headers carry the series glyphs, a note with a term).

Pairs in tabs — grouped bars take tabs too: the colour is the tab's, and the
columns of a row are told apart by fill, the last one (the result) solid:

{{< bars tabs="true" open="Genoa" colors="green red" cap="Time per 24-byte allocation" note="— illustrative numbers, with a ballast and without" >}}

| | no specialization | with specialization |
|---|--:|--:|
| **Genoa** | | |
| No ballast | 27.0 ns | 19.5 ns *−28%* |
| 256 MiB ballast | 19.5 ns | 12.8 ns *−35%* |
| **Skylake** | | |
| No ballast | 52.9 ns | 41.6 ns *−21%* |
| 256 MiB ballast | 32.3 ns | 20.1 ns *−38%* |

{{< /bars >}}

A series' glyph in the text — `{{</* mk blue circle */>}}` before a name
draws the shape and the colour the tabs and the chart give that series,
wherever it stands. In a sentence: the machines above are
{{< mk blue circle >}} M4 Pro, a laptop, {{< mk green square >}} Genoa (Zen 4),
a server, and {{< mk red triangle >}} Skylake, an older server — the glyph
stays on its word's line when the sentence wraps. In a table's header:

| 24 bytes | {{< mk blue circle >}} M4 Pro | {{< mk green square >}} Genoa (Zen 4) | {{< mk red triangle >}} Skylake |
|---|---:|---:|---:|
| No pointers | −41% *9.2 → 5.5 ns* | −28% *27.0 → 19.5 ns* | −21% *52.9 → 41.6 ns* |
| With a pointer | −46% *11.7 → 6.3 ns* | −36% *34.5 → 22.0 ns* | −28% *64.5 → 46.7 ns* |
| Through `make([]byte, 24)` | −33% *10.1 → 6.8 ns* | −19% *27.7 → 22.5 ns* | −11% *54.0 → 48.1 ns* |

A chart, inline — the table is the data, `*n*` a hollow point from another
run:

{{< chart x="object size, B" y="ns per allocation" x-unit=" B" y-unit=" ns" colors="blue green" hollow="laptop at 96 B — another run" cap="Cost by size" note="— illustrative numbers" >}}
| Size | laptop | server |
|--:|--:|--:|
| 8 | 5.67 | 16.02 |
| 24 | 9.00 | 24.42 |
| 80 | 12.65 | 34.99 |
| 96 | *13.18* | 34.61 |
| 128 | 55.48 | 41.40 |

{{< fold title="The table behind the chart" />}}

{{< /chart >}}

An empty `{{</* fold /*/>}}` in a chart holds the chart's own tables — the
view a reader without JavaScript gets — instead of printing them twice.

A chart from a file — `charts/ks-speedup.yaml` beside the page: two data
sets under a toggle, a rule, a zone, `~`, a detail in the panel:

{{< chart src="charts/ks-speedup.yaml" cap="Where the speed-up ends" note="— illustrative numbers" />}}

A span and its bitmap, derived from the bits and the slot size — alone, and
inside a {{< term word="definition" title="Span" kind="Definition" color="green" >}}
A block of memory cut into equal slots, one bit per slot in its bitmap.

{{< spanmap bits="11011000" size="16" >}}

The first zero is where the next object goes.
{{< /term >}}:

{{< spanmap bits="111100" size="24" >}}

A widget without its frame — `bare="true"`, the caption kept for screen
readers:

{{< widget cap="By hand" bare="true" >}}<p><b>1 million</b> allocations a second save <b>3.75 ms</b> every second.</p>{{< /widget >}}

## Widgets {#widgets}

Form 1 — an empty mount, brought to life by `Taiga.widget` from `widgets.js`:

{{< widget id="w-ks-counter" note="— click it, the number ticks" />}}

Form 2 — a mount with a static fallback inside (visible without JS):

{{< widget id="w-ks-fallback" note="— a static diagram sits below it" >}}<div class="mem"><div class="mem-lab">static fallback</div><div class="mem-row"><div class="word live" data-tip="visible without JS">e0</div></div></div>{{< /widget >}}

Form 3 — no id, arbitrary HTML directly in the figure:

{{< widget note="— custom HTML, no mount" >}}<div class="w-row"><span class="w-cap">arbitrary widget markup</span></div>{{< /widget >}}

## Card {#card}

{{< bigcard href="/inside/anatomy/guide-is-a-bundle/" k="To the reference →" t="A guide is a folder" s="A big CTA card: kicker, title, caption." >}}

## Link previews {#link-previews}

On a fine pointer, hover any link below to see its preview card — the physics of
the term card, one popover, built from a build-time fragment (internal) or a
pre-rendered card (Telegram, YouTube).

Internal links open a window into the page: a whole [guide preview](/inside/anatomy/guide-is-a-bundle/),
a [section anchor](/inside/anatomy/guide-is-a-bundle/#bundle) that scopes the card
to one section, and a [series index](/inside/anatomy/) that lists the parts.

Telegram — a post from the author's own channel earns a card scraped at build
time: [post 409](https://t.me/ntuzov/409) and [post 410](https://t.me/ntuzov/410).
A [missing post](https://t.me/ntuzov/99999) degrades to the channel card, and a
[foreign channel](https://t.me/telegram/999) gets only the ✈ mark, no card.

YouTube — [a talk on the Go scheduler](https://www.youtube.com/watch?v=kedW1xO3Zbo)
opens a video card with its thumbnail, duration and view count.

An ordinary [outbound link](https://go.dev/blog/) carries only the ↗ mark.

Wikipedia — a [work-stealing scheduler](https://en.wikipedia.org/wiki/Work_stealing)
and [preemptive multitasking](https://ru.wikipedia.org/wiki/Вытесняющая_многозадачность)
each open a summary card built from Wikimedia's REST API, carrying the W mark.

The Go blog — a [preview of loop-variable scoping](https://go.dev/blog/loopvar-preview)
and the classic [error handling in Go](https://go.dev/blog/error-handling-and-go)
open a card with the italic Go mark, the byline and the post's opening.

## Newsletter {#newsletter}

The subscription blocks, on a site that runs a newsletter
(`params.newsletter.enable` — [newsletter.md](https://github.com/justskiv/taiga/blob/main/docs/newsletter.md)).
This demo has no endpoint behind them, so a submission ends in the error state —
which is itself the degradation worth seeing.

The mid-text block, placed by hand, with a close button (`dismiss=`) whose
verdict is remembered per block:

{{< newsletter label="series · next" dismiss="ks-demo" note="A demo form: there is no endpoint behind it." >}}
This is where a guide makes its own case for the letter — in its own voice, not the theme's.
{{< /newsletter >}}

The bare form for a page written as prose (`newsletter-inline`), the same
component the subscribe page uses:

{{< newsletter-inline note="A demo form: there is no endpoint behind it." >}}

The card at the foot of this page is the third one — `newsletter-cta`, inserted
automatically here by `placements.articleEnd`.

## Edit history {#history}

The «updated» date in this page's meta line opens its edit history. The
history is a note of its own, `updates.md` beside this page (`updates.ru.md`
beside the translation): one `## YYYY-MM-DD · label` heading per entry, then
what changed in ordinary Markdown. The theme reads it into the popover, and
into an appendix at the foot of the page for readers without JavaScript. A
list whose every item is a link into the page becomes the entry's list of
sections.
