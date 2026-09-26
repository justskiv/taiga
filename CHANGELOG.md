# Changelog

All notable changes to the **taiga** theme are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/): a removed/renamed template or param is
a MAJOR bump, a new optional feature is MINOR, a fix is PATCH.

## [Unreleased]

### Changed

- **Bold in prose is weight 600, not 650.** The fonts ship 400/500/600/700,
  so 650 was never drawn at 650: the browser took the 700 file, and every term
  at its definition and every run-in head was set in the heaviest weight the
  site has — a shout where a stress was meant. 600 is a real face, and it is
  what Obsidian's own bold already resolves to, so the note and the page now
  agree. Definition cards and the text of a Telegram card follow; headings
  keep their 650/700.

- **A quote's text starts at 22px, the list inset** (3px rule + 19px, was 18px).
  One pixel, but it puts the quote on the same vertical as the new thesis and
  aside and as list items: a quote and a thesis on one page must not show two
  geometries.

- **The site name is appended to `<title>` only while the line still fits.**
  Every page used to read `<page> — <site>`, and on a long title that pushed the
  whole line past what a search result prints. What gets cut there is the END of
  the line — the page's own title, the half that says what the page is — while
  the site name survives at the front of nothing. The budget is
  `params.seo.titleMax` (60 characters, counted as CHARACTERS: `len` counts
  bytes and would halve the budget on any non-Latin title), and past it the
  page's title stands alone. Nothing is lost by dropping the suffix: a result
  already prints the domain on its own line above the title. Per-page escape
  hatch: `titleSuffix: false` on a page that fits, `true` on one that does not.

- **A series landing prints `lead` when it has one, `description` otherwise.**
  The landing used to print `description`, which gave a series exactly one
  string for two jobs that pull apart: the paragraph that opens the page, and
  the line a search result and a share card cut at around 160 characters. This
  is the split a rubric already had (`params.lead` on the page, `description`
  in the tags), so it is one rule now instead of two. A series carrying only a
  `description` renders exactly as before.

- **Only guides are indexed now.** A plain page — about, support, the legal
  pages — is out of the Pagefind index unless it asks in with `search: true` in
  its front matter, and a guide can ask out with `search: false`. The modal is
  announced as a search of the guides, and on a small site the other pages were
  a large share of everything indexed: on the theme's own demo the legal pages
  alone are long texts assembled out of exactly the words a reader types — data,
  code, comments — so they surfaced against real guides. They are one click away
  in the header and the footer; a guide pushed off the first screen by them is
  not. A whole section of pages that deserve searching still belongs in
  `extraGuideSections`, which makes them guides outright.

- **A fold reads as prose once it is open, and long ones get two extra parts.**
  The panel used to be set two sizes down and one tone back (14.5px in
  `--text-secondary` against 17px prose) — right for the two-line aside the
  shortcode was drawn for, punishing for the ones that have since grown to
  several screens. Three things stacked up: the glyph shrank ~15%, the measure
  *grew* (the column is fixed, so smaller type means more characters per line),
  and a reader past the first screen had nothing left telling them they were
  inside an inset. The dimming is also backwards as a signal — clicking
  "Развернуть" is the reader agreeing to read this. So the revealed body now
  takes the article's own size and colour, and what marks the inset is
  structure: the summary row, a 2px `--border` rail growing out of the icon
  (never `--accent` — blockquote owns that rule, callout owns the frame), and,
  on long folds, a closing row.

  The rail is a control, not only a marker: a 20px transparent strip over it
  collapses the fold on click, and hovering it warms the line and lights the
  closing row, so the two read as one exit seen from two places. It is the only
  way out that is in reach from anywhere in a multi-screen panel. Mouse only
  (`hover:hover` + `pointer:fine`) — on touch a band down the left margin of a
  scrolling page would collect stray taps with no hover to announce it — and
  deliberately out of the tab order and hidden from screen readers, where it
  would be a third duplicate path per fold.

  The return scroll after a collapse is finicky in three ways, each of which was
  a visible miss before it was fixed: position and scroll offset are read before
  `open` changes (a clamped `scrollY` lands the page elsewhere); `scroll-behavior`
  is forced to `auto` for the call, since `:root` is `smooth` and a smooth scroll
  is still travelling while the panel shrinks under it, aiming at a target that
  has already moved; and the landing subtracts the sticky header, which an
  upward scroll brings back out right on top of the summary. Focus then moves to
  the summary — the control that had it has just been collapsed away, and the
  summary is the same switch in its other position.

  With it the fold picks one of two registers from the body's length
  (`data-size`, threshold 900 runes, overridable with `size=note|section`). A
  note is the old footnote. A section sets its summary at reading size and
  weight, gets its own air, reveals in 0.12s instead of 0.2s (that duration
  across four screens read as a jolt, not a slide) and ends with a "Свернуть"
  button that collapses the panel *and* scrolls back to the summary —
  collapsing four screens from the bottom otherwise drops the reader into an
  unrelated paragraph. The button carries the theme's focus ring: it is the
  only way to close a long fold from the keyboard without scrolling back up.

  `--strong-fg` is no longer set on the fold body — it existed so a bold
  lead-in would not punch through a dimmed paragraph, and the body is not
  dimmed any more. Link previews still use it.

- **The footer is two tiers instead of one flat row.** Identity and strapline
  on one baseline hard left, navigation hard right — the bracket the header
  already makes — and, for a site that fills `menus.legal`, a closing line set
  as a source comment (`// privacy · terms`) with the copyright at its far end.
  Legal links have to be findable without pulling attention off the navigation,
  and a flat row of six links at one size and tone could not say that these are
  different kinds of link.

  The row of links still wraps rather than splitting into columns: entries
  disappear on their own terms — a `devOnly` item in production, the newsletter
  link with its feature — and a wrapping row only gets shorter, while columns
  rebalance. The size ramp's middle now belongs to the navigation (15px, up
  from 12): those links are what a footer is for, and they had been the
  smallest text on the page. New `footerCopy` param names the copyright line;
  `menus.legal` fills the closing tier. Both optional — a site that sets
  neither gets tier 1 alone.

  Fixed with it: on a wrapped row `margin-left:auto` parked the navigation hard
  against the right edge under empty space, which reads as broken markup rather
  than as a two-line footer.

### Added

- **The author's own voice has blocks of its own, in plain Markdown: a thesis
  (`>>`), an aside (`> [!aside]`), a recap (`> [!recap] label`) and an epigraph
  (`> [!epigraph] source`).** `>` used to mean two things — somebody else's
  words and the author's conclusion — and drew both as a quote, italic and a
  step quieter, so the sentence a section was written for read as a citation.
  The one-sentence idea put in `callout type="key"` had the opposite trouble: a
  frame and a label pull the eye out of the text exactly where the thought
  should close it. The new blocks stay in the flow and differ by their sign and
  the tone of the text, never by position — every sign sits on the column edge
  and every text at the list inset. They are Markdown rather than shortcodes so
  that Obsidian renders the same source natively: the alerts are its callouts,
  and `>>` is a nested quote a stylesheet can find. A new
  `render-blockquote.html` does the work; a plain quote comes out byte for byte
  as before, `{#id .class}` survive on every block, and an unknown type, text on
  an aside's marker line or a fold sign warn (so a strict build fails instead of
  a marker silently turning into a quote). An epigraph that opens a guide is
  lifted out of the lead and printed above it, and kept out of the meta
  description. Demo: the kitchen sink; docs: `authoring.md#emphasis`.

- **A true Inter italic.** Every `<em>` used to be the upright face slanted by
  the browser — 14° in Chrome and Safari, ~17° in Firefox on Windows, against
  the designed 9.4° — with the upright's spacing around `»`, `)` and `—`. The
  italic ships at 400 only (latin + cyrillic, ~33 KB) and is never preloaded:
  a page fetches it the first time it draws an italic glyph, so a page with no
  italic pays nothing. Bold italic now fakes the weight over this face rather
  than the slant over the 700; the "Go" link mark, which is bold italic by
  design, keeps its look by drawing the slant itself.

- **A term card carries a diagram or a picture properly now.** Block content in
  a `{{< term >}}` body always worked — the shortcode renders the body as block
  Markdown and the card is emitted after `.Content` precisely so a `<div>` can
  live in it — but three things about it were left to the article's own styles,
  which the card loses the moment `term.js` moves it out of `.wrap` and onto
  `<body>`. So the same definition looked like two different cards depending on
  whether JavaScript ran: a captioned image (`![alt](x.png "caption")`) came out
  as body-size text glued to the side of the picture, the dark-palette dimming
  applied in one life and not the other, and a block dropped in with no margins
  of its own fused with the sentence under it. The card now states all three
  itself — the last as a ZERO-specificity fallback carrying the theme's figure
  rhythm (16/18px, matching `.span-fig`) rather than the 9px paragraph gap, so
  a figure that sets its own margins keeps them and one gap is never owned by
  two files at once. It also picks
  a wider bracket (520px) when it holds a diagram, an `<svg>` or a captioned
  picture — a drawn thing is laid out in fixed cells and cannot reflow into a
  narrower column the way prose does; a card carrying a highlighted code fence
  is explicitly *not* caught by that rule, so nothing existing moved.

  No new shortcode parameter: an `img=` would only duplicate what a plain
  Markdown image already gets from the render hook — bundle-then-`assets/img`
  resolution, intrinsic dimensions, `alt`, and a caption. `docs/authoring.md`
  gains the recipe and the four quiet ways it breaks (a blank line cutting a raw
  HTML block in half, the card's real width, a `viewBox`-only SVG, and what a
  screen reader does with a `role="dialog"`).

- **SEO lint, in the templates that assemble the tags.** `params.seo.lint`
  (`"error"` | `"warn"` | `"off"`, default `"warn"`) checks the front matter
  where the tags are built, so a rule sees the FINAL string — after every
  fallback — rather than what the file happens to say. Hard rules are facts,
  not taste: the archetype's `TODO` sentinel reaching production, a guide with
  no description of its own, a description that only repeats the title, two
  guides sharing one. Soft rules (the lengths, a guide with no tags, a
  `lastmod` older than its `date`) log under the id `seo-hint`, so a site that
  disagrees silences them with `ignoreLogs` instead of editing the theme.
  Drafts are skipped entirely — an unfinished guide is expected to carry the
  sentinel, and `hugo server -D` has to stay usable while it does.

  The archetypes now ship that sentinel: `description: "TODO …"` fails the
  build under `"error"` instead of quietly shipping a guide that describes
  itself as TODO, and a commented `# lastmod:` line says what to do when a
  published guide is revised.

- **`noindex`, and pages that keep themselves out of search.** A page with
  `noindex: true`, a placeholder, the 404 page, and — automatically — a rubric
  or series with no published guide under it get `noindex, follow` and are
  dropped from `sitemap.xml`. A series landing whose parts are all still
  ANNOUNCED does not count as empty: those parts are drafts, so they are
  invisible to `.RegularPages`, and announcing the series is exactly what that
  page is for. An empty rubric is a heading, a lead and nothing else: it is
  soft-404 shaped and it competes with real guides for crawl budget, and the
  moment a guide lands in it, it is indexable again with no list to maintain.
  One partial (`seo/indexable.html`) answers the question for both the robots
  tag and the theme's own `sitemap.xml`, so the two cannot contradict each
  other — a sitemap listing a URL the page then refuses is a contradiction a
  crawler reports. That `sitemap.xml` is Hugo's embedded template plus this one
  filter: `sitemap.disable`, `changefreq`, `priority` and the hreflang
  alternates all keep working, because overriding a built-in template inherits
  its contract.

- **`author` in the JSON-LD.** `params.author` becomes a `Person` on every
  guide, with `authorURL` for where that person is on this site and
  `authorSameAs` for profiles elsewhere that are the same person. A guide with
  a named author is the one entity in that graph a reader can follow.

- **A robots tag that says only what is not the default.** Not `index,follow`
  (that IS the crawler's default, and saying it adds nothing) but the preview
  budget: `max-image-preview:large` — what puts a guide's cover on a result
  card — plus the snippet and video caps, which are conservative by default.

- **The search modal opens on something.** Before the first keystroke it now
  shows two sections — the guides this reader opened before, then the newest
  guides, at most seven rows between them — instead of a grey placeholder line.
  ⌘K on a site of series is navigation as much as it is search, and the panel
  that answered it was empty. Deleting a query back to nothing returns to the
  same state, so it is somewhere you can arrow back to rather than a screen you
  lose by erasing a word.

  The history comes from `taiga.visited`, the same localStorage list that draws
  the ✓ marks in a series list, and `visited.js` now moves a path to the tail
  when it is reopened — without that, "recently opened" meant "first opened, a
  year ago". The current page is dropped from it: offering the page you are
  standing on is offering nothing.

  The titles behind those paths, and the newest guides themselves, come from a
  manifest Hugo publishes beside the site — `search/guides.<lang>.json`, one
  small file per language, fetched the first time the modal opens
  (`_partials/search/manifest.html`, bridged as `window.TAIGA_SEARCH_INDEX`).
  Not from Pagefind, though `search(null)` could have sorted by date: the
  manifest is the same list the feed renders, so the two cannot drift; it
  resolves a path from any depth of history, which the reader's own list cannot
  do on its own; and it arrives whether or not the second build step has run,
  so the modal is useful under a bare `hugo server`, where until now search was
  simply dead. It is a file rather than an inline island because it is the whole
  corpus, and every reader who never presses ⌘K would otherwise pay for it on
  every page.

  Four new i18n keys (`js_search_recent`, `js_search_latest`,
  `js_search_latest_total`, `js_search_hint`), and the result list grew from
  46vh to 62vh — at 46 the new panel ended mid-card, which reads as broken
  rather than scrollable.

- **A picture can float beside the prose.** `{.img-right}` on a stand-alone
  image's own paragraph sends it down the right margin at 44% of the column and
  lets the text run past it; below 620px it goes back to full width. Written for
  the supporting illustration — the one that belongs *to* a paragraph and does
  not earn the full column a diagram gets. It had been living in one guide's own
  bundle stylesheet, which meant every other guide that wanted it had to copy
  the rule.

  Boxed elements (`pre`, `table`, `.callout`) clear the float rather than share
  a line with it: a code block set beside a floated picture reads as broken
  markup, not as a layout. A titled image keeps its caption inside the float.

  The class rides in on Markdown block attributes, which only the site can turn
  on (`markup.goldmark.parser.attribute.block` — a theme cannot touch the
  markup parser), and Hugo hangs them on the block directly above: the attribute
  line has to touch the image's line, or it is dropped silently. Both facts are
  in `docs/authoring.md`, since neither shows up as an error.

- **Comments.** An optional comment thread at the foot of every article,
  served by a self-hosted [Comentario](https://comentario.app) instance
  (`params.comments`, off by default — see `docs/comments.md`). The thread is
  open: comments are part of the guide, and hiding them behind a press buys
  nothing. What is withheld is the engine's bundle — 95 KB of script and 51 KB
  of stylesheet, with fonts of its own — fetched once the reader comes within
  900 px of the block, by a plain distance check rather than an
  IntersectionObserver, which in a tab that has never been painted can stay
  silent until the tab is focused. A guide that is read and left costs the
  instance nothing at all: not a script, not a socket, not one request. A
  single guide opts out with `comments: false`.

  The widget renders into the page's own DOM, so the sheet translates its ~41
  `--cmntr-*` variables onto palette tokens and every palette is covered
  without a media query for colour. Every rule hangs off the section's own id,
  which beats the engine's (0,5,0) selectors without a specificity war. What
  the variables cannot reach is repainted by name: the primary button, the
  badges, sixty hard-coded avatar colours, a `#e9ecef` frame around the closed
  editor.

  The widget's own UI is designed rather than inherited. With anonymous
  commenting off, the engine's profile bar — one lone "sign in" button attached
  to nothing — is hidden, and the door moves onto the submit button of every
  editor: "Sign in and submit", stated when the editor opens rather than after
  the reader has finished writing, and present in the editors that open deep in
  a thread where that bar never was. The login dialog becomes a real modal (the
  engine anchors every dialog on that missing button with Popper, so they
  landed in the corner), and its provider buttons move the brand out of the
  fill and into the logo. Sorting names which of its four orders is in force
  instead of flipping an 8px caret nobody sees; reply gets a word; the owner's
  badge reads "Author" rather than "Moderator".

  Engine defects undone along the way: three rings on one empty textarea — a
  `required` border reported before anything could be wrong, a focus border,
  and a focus shadow that survived `border:0` and showed as a bright line under
  the toolbar; a name stacked over a timestamp in a column narrower than the
  timestamp's own text; collapsed replies faded to zero opacity while still
  holding half a screen; a new-comment highlight with no padding, stopping
  flush against the first letter; a five-class bootstrap shadow a plain anchor
  loses to; `:focus` painted as `:hover`; a `.4s` transition; and `disabled` at
  `opacity:.3` on the button that carries the price of entry in its label.

### Fixed

- **A guide left out of search (`search: false`) or a placeholder printed its
  lead twice** when it had a `<!--more-->` divider: the lead above the body,
  then the whole `.Content` — lead included — as the body. The indexed branch
  already printed only what follows the divider; now both branches share one
  body.

- **An empty `<meta name="description">` is no longer emitted.** A site that
  sets neither a description nor `heroLine` used to get `content=""` on every
  system page, which tells a crawler the page has been described, and described
  as nothing. No tag at all is the honest answer, and the audit script reports
  it.

- **The search index no longer glues the two halves of a title together.** An
  `<h1>` split at `": "` is two lines around a `<br>`, and the minifier drops
  the whitespace on either side of it — so Pagefind stored
  "Цена одновременности:треды", one word that matches nothing a reader would
  type. The title now reaches the index as a value
  (`data-pagefind-meta="title:…"`) instead of being scraped out of the markup.

- **A breadcrumb could ship with an empty URL, which cost the whole
  breadcrumb.** The JSON-LD put `.FirstSection` in the trail unconditionally,
  and a guide section that is not a browsable rubric (`build.render: never` —
  the shape `extraGuideSections` is for) has no page and therefore no
  permalink. The rung came out as `"item": ""`: invalid markup, and a search
  engine drops the entire `BreadcrumbList` rather than the one bad rung. Such a
  rung is skipped now and the positions renumber around it.

- **`<meta name="description">` and `og:description` were computed twice, and
  differently.** `og.html` ran the string through `plainify` and a 200-character
  cap; `head/meta.html` emitted it raw. So a page falling back to a `lead` with
  inline markdown put backticks in the search snippet while the share card
  showed clean text, and a long rubric lead was cut for one and not the other.
  Both now call `head/description.html`, which is the single answer to "what is
  this page about" — the tag, the card and the JSON-LD cannot disagree again.
  That partial renders `lead` before it flattens it — `lead` is markdown by
  contract and the page prints it through RenderString anyway, so a backtick in
  it now becomes a tag `plainify` can strip instead of reaching the search
  result verbatim. `description` is NOT rendered: it is a plain attribute, and
  on a technical blog its vocabulary collides with markdown — `*T` would lose
  the star and `2*3*4` would silently become `23*4`, which stops the sentence
  from being true rather than merely unformatted. The lint warns about the one
  thing that does go wrong there: a stray backtick.

  Only the fallbacks are capped at 200 characters, because a `lead` or a
  summary is as long as the page needs; an explicit description passes through
  whole, and og.html does its own capping for the cards.

- **A guide with no description of its own no longer inherits the site's hero
  line.** The fallback chain ended at `heroLine`, one string for the whole
  site — so every such guide got the SAME description, which is the duplicate
  a search engine reports, and it was invisible because the tag was never
  empty. A guide falls back to its own `.Summary` instead (it always has prose)
  and the lint says so out loud; `heroLine` is reachable only from the system
  pages it was written for.

- **An `<h1>` split into title and subtitle read as one word to a crawler.**
  `{{ $main }}<br><span class="sub">` puts no whitespace between the two, so
  text extraction produced "Go 1.27:большой интерактивный разбор". Browsers
  break the line either way; a parser that flattens the markup did not.

- **A hover card could open on top of the very link that summoned it.**
  Placement put the card below the link, flipped it above when below had no
  room, and then clamped the result into the viewport — and a clamp knows
  nothing about the anchor it is supposed to point at. When neither side had
  room for the whole card, the clamp slid it up over the link, which then could
  not be clicked at all; the reader had to scroll the page until the card
  happened to land somewhere else. Arithmetic made that a certainty rather than
  bad luck — "does not fit below" is exactly
  `innerHeight - height - EDGE < link.bottom + GAP` — and on a 780px window an
  article card covered 60% of the positions a link can hold.

  There is no final clamp any more. The card climbs a ladder instead: below,
  above, a trim of at most 80px there rather than move for the sake of a few
  pixels, beside the link (right, then left), and finally whichever side has the
  most room, where the body shrinks to fit while the head and the action row
  keep their height. Every rung derives its coordinate from an edge of the link,
  so covering the link is not something the card can do. Running off the edge of
  the window is, and that is the better failure — the link stays clickable. A
  card that has to hang hangs downwards, where what is lost is a repeatable
  action row rather than the title.

  The rung is decided once per card and frozen. A scroll moves the card without
  re-deciding it, which would have reflowed the card's text under a reader
  mid-sentence; a resize does re-decide, since it invalidates both the side that
  fitted and the vh-based heights inside the cards. Two smaller things went with
  it: the entry motion now leans away from the link rather than towards it (at
  5px towards, the halo lay on the link for the opening frames), and the halo
  itself is down from 12px to exactly the 10px gap it bridges — at 12 it had
  been quietly eating the link's last two pixels even when the card sat
  correctly below. Link previews and term cards share the geometry; both are
  fixed.

- **Opening a folded block could throw the reader past it, thousands of pixels
  down the page.** Both Gecko and Blink keep a node in the viewport visually
  still when content above it changes size — right for a late image, wrong for
  a disclosure. When the node the browser had picked happened to sit BELOW a
  `fold` or a `run` output, expanding the panel scrolled the page by the panel's
  full height: on one guide a 2044px panel moved the page 2008px and left the
  summary 1705px above the top of the screen. Closing it was the same jump
  upside down. Which node gets picked is the browser's business and depends on
  where the reader happens to be standing, so it struck at random and could not
  be reproduced on demand.

  The page now switches anchoring off for half a second around a disclosure the
  reader opens or closes (`modules/scrollhold.js`) rather than correcting the
  scroll afterwards — a correction has to guess how many frames the adjustment
  takes, paints the wrong position while it waits, and cannot tell the browser's
  adjustment apart from a scroll that was meant, such as following a link to a
  heading inside a closed panel.

  Two rules keep the suppression honest. Only when the block is ON SCREEN: a
  block that grows off-screen is exactly what anchoring is for, and switching it
  off there would move the paragraph the reader is actually reading — so a run
  output landing from the network while the reader has read on below is left to
  the browser. And always BEFORE the change: `overflow-anchor` is read when the
  browser selects an anchor, not when it applies an adjustment, so nothing that
  observes the DOM after the fact can help — a MutationObserver on `open` does
  fire before the next frame and the page still moved the full height. Covered
  are the reader's click and the keyboard (activating a `<summary>` dispatches a
  click of its own) and the run block opening itself once codapi answers; code
  that opens a disclosure from script arms the hold itself with
  `window.Taiga.holdScroll(el)`, which is also the way in for a page-bundle
  widget, built as its own iife and unable to import the module.

- **A Wikipedia card dropped every formula from the article it was showing.**
  The card was built from the summary API's `extract`, which is plain text, and
  Wikimedia strips `<math>` out of it entirely rather than transcribing it —
  «разложить число ␣ за время ␣, используя ␣ логических кубитов» reached readers
  with a hole where each formula had been, and nothing in the pipeline could
  notice, because a hole is valid text. The card now reads `extract_html`, whose
  formulas survive as Wikimedia's own SVG renders, and inlines each of them
  (`article/lp/math.html`). Inlining rather than linking the image is what makes
  the colours work: MathJax paints those renders with `fill="currentColor"`, so
  a formula takes the card's text colour in every palette, where the `<img>`
  Wikipedia itself ships is black on transparent and would need a per-palette
  invert to be visible at all. Ids inside each SVG are namespaced per formula —
  several cards live in one page's hidden store and `<use>` resolves
  document-wide — and renaming them again when a card is cloned out of that
  store keeps the open card drawing from itself rather than from the hidden
  copy it was cloned from. The TeX from the render's `<title>` becomes the
  formula's `aria-label`. A formula that fails to fetch drops the whole card back to the
  plain-text path rather than shipping a broken one.

- **A hover card floated into the middle of the paragraph when its link had
  wrapped.** Both `place()` and the scroll tracker anchored on
  `getBoundingClientRect()`, which for an inline element broken across two lines
  returns a box spanning both of them and the whole column in between — so the
  card centred on a point the link never occupied and covered the prose instead
  of pointing at anything. `getClientRects()` gives one rect per line box, and
  the card now anchors on the one the pointer entered, falling back to the first
  line when there is no pointer to ask (keyboard focus). Whether the card should
  live at all stays a question about the whole element: a line box can scroll out
  while the rest of the link is still being read, and a pinned term card used to
  vanish at that moment. Link previews and term cards both had it; both are
  fixed.

- **A link's classifier mark could wrap to the next line without its link.** The
  mark is an `::after` inline-block, an atomic inline, so the line breaker is
  free to put it on the next line on its own — a stray "w" opening a line under
  the "SHA-512" that ended the one above — and the same break splits a
  hyphenated one-word link ("где-нибудь") under its mark. Nowrap now goes on the
  link itself, and everything before its last word is handed back normal
  wrapping, so the tail and its mark are welded while a longer phrase still
  breaks at its own spaces. (A nowrap span around the text alone does not do it:
  the break opportunity between that span and the pseudo-element after it
  survives.)

- **Bold and italic ignored the dimming of the block they sat in.** A fold's
  body is set in `--text-secondary`, but `strong` and `em` state their colours
  on the element, so a bold lead-in kept punching through a muted paragraph at
  full `--text-strong` brightness and italics lifted themselves back to
  `--text-primary`. `em` no longer sets a colour at all — in prose it only ever
  restated the body colour, which is why the bug could only ever show up
  somewhere dimmed — and `strong` reads `--strong-fg`, which a dimmed container
  sets to say what "brighter than this text" means there. `.fold-body` and the
  internal preview card's `.ic-body` set it to a small mix toward
  `--text-strong`, not to the next rung of the ramp: the gap from
  `--text-secondary` to `--text-primary` runs about three times the gap prose
  keeps between its own text and its bold, so borrowing the rung above left the
  lead-in still reading as white. What has to carry over from prose is the size
  of the lift, not its position on the ramp.

- **In a runnable snippet the caret drifted further from its glyph with every
  row.** The editing surface is a transparent textarea laid over the highlighted
  `<pre>`, and the two agree only while they lay text out identically.
  `--font-mono` was stated on `code` and on the textarea but never on the
  `<pre>` itself, so the block's strut fell back to whatever the browser
  resolves for bare `monospace` — a different face on every platform — while the
  text ran in the JetBrains Mono the theme ships. An explicit line-height makes
  both boxes the same height, but the baseline sits at a different depth in
  each, and the two stack into a line box taller than the leading they were
  given. Every row gained a fraction; a reader clicking after `func` twenty
  rows down watched the letters land a line below the caret. Chroma's per-line
  flex rows never consult the strut, which is why a snippet looked right until
  the first keystroke re-rendered it through the client-side highlighter — and
  why this reached readers at all: on the Chrome/macOS the theme is written on,
  the default resolves to a face whose metrics agree with JetBrains Mono, so
  nothing showed there. `.ced > pre` now names the family it was already using.

  Fixed alongside it: `.ced-eol` — the empty inline-block that gives a trailing
  newline a line of its own — stated a height. A zero-width inline-block rests
  its bottom edge on the baseline, so all of that height counted above the line,
  where the strut asks only for the font's ascent: the last empty row measured
  29.89px against 22.95px for a real one. Being an atomic inline is the whole
  job, and the strut sizes the row.

- **iOS rendered a listing in two sizes at once.** With `text-size-adjust`
  left at its `auto` default, mobile WebKit rescales text on its own inside
  blocks whose content runs wider than the viewport — which is every code
  listing here, since `white-space:pre` makes the longest line as wide as it
  needs to be and the box scrolls. The boost is applied per text node, so in
  one `<pre>` the longest line came out about a third larger than its
  neighbours while its own leading whitespace stayed at `--code-fs`: a block
  out of alignment with itself, and, the moment the editor opened over it, a
  caret a whole size away from the glyph it is meant to sit on. Runnable
  snippets showed it first — `.ced` puts the small size on the `<pre>` itself
  and the heuristic hunts for small text — but any listing with a long enough
  line could be hit. `html` now states `100%`, which turns the automatic boost
  off and leaves pinch-zoom alone; desktop engines do not implement boosting
  at all, which is why none of this was ever visible there.

- **A run served from a cache reported the time of the original one.** A
  cache went in front of the runner, and codapi's answer is replayed byte for
  byte — `duration` among those bytes. A second Run on unchanged code came
  back in about 100 ms and still said `run · 949 ms`, the figure from the
  first press, and said it again on every press after that. Formally true and
  useless: the reader waited a tenth of it, and a number that never moves
  reads as a widget stuck on an old value rather than as a cache doing its
  job.

  The correction needs no cache header, and no list of caches to recognise. A
  server cannot answer in less time than it says the run itself took, so an
  answer arriving faster than its own `duration` was replayed rather than
  computed, and the only figure left that describes something that happened is
  the one measured in the browser. A run that really did happen keeps the
  server's own number, which is the better one for a guide about performance:
  there is no network in it.

  It is a wrapper — `assets/js/modules/runclock.js` — rather than a fork of
  the vendored client. codapi resolves its engine by name on every single run,
  so the transport underneath (the health check, the five HTTP error texts,
  the request timeout) stays exactly as shipped, and upgrading `snippet.js`
  carries none of it into the theme to be re-checked by hand. A transport
  failure still rejects, so a snippet fires its own `error` event as before;
  a replayed answer also reaches the `result` event with `cached: true`, which
  the theme does not render and a site can.

### Changed

- **The newsletter is off by default, and "off" now means the build carries no
  trace of it.** The master switch already defaulted to `false`, but two things
  never read it: `28-newsletter.css` rode into the bundle through the numbered
  glob in `head/css.html`, and `modules/newsletter.js` was imported
  unconditionally by `main.js` — so a site that had never heard of the feature
  served every reader 13 KB of minified subscription CSS and 6 KB of
  subscription JS it could not use, while the docs promised "not one `nl-`
  class". Both bundles now read the switch: the sheet is left out (and the
  bundle renamed with it, because `resources.Concat` is keyed by target path
  alone and one fixed name would hand every language whichever build won the
  race), and `scripts.html` passes esbuild a `TAIGA_NEWSLETTER` define so the
  call folds away and the module is tree-shaken out whole. The module's ten
  fallback strings moved from `modules/i18n.js` into `modules/newsletter.js` for
  the same reason — anything parked in the shared catalogue outlives the module
  that reads it. Config validation (`mode`, `listUUID`) is gated on the switch
  too: off means the theme has no opinion about the settings of a feature nobody
  asked for. Measured on the demo, a build with the feature off now contains no
  `nl-`, no `TAIGA_NL` and no `nl_*` string in any HTML, CSS or JS it publishes.

- **A newsletter shortcode on a site with the feature off now fails the build
  instead of quietly rendering nothing.** Silence is how a theme earns the
  question *"I wrote the shortcode, nothing appeared, why?"* — and it cannot be
  answered from the page: the markup is right, the shortcode exists, and the
  reason is a boolean in a config file the author may not even own. The error
  names the shortcode and the page. The master switch stays a switch, though,
  which is why it is an `erroridf` and not a plain `errorf`: pulling `enable` on
  a live site — the endpoint is down, the engine is being replaced, a lawyer
  asked — must not begin with editing every guide that carries a block. Such a
  site adds one line in the same file where the switch was pulled,
  `ignoreLogs = ['newsletter-disabled']`, and the blocks go silent again.
  **Migration:** none for a site with the feature on; a site with it off that
  keeps newsletter shortcodes in its content adds that line or deletes them.

- **The mid-text block's collapse button was redesigned.** It used to be a 26px
  target pinned to the block's top-right corner, hidden until hover — and the
  corner is nothing to align to in a block that has no frame, so it read as a
  mark floating above the text: measured, its centre sat 10px above the
  eyebrow's, and where the block carries no eyebrow the first line of prose ran
  *under* it (11px of overlap at 1440px, 11px again at 390px). It is now a 12px
  glyph in a 34px target — the theme's control square — sitting on the optical
  line of the block's first line, and that line reserves 40px for it so text can
  never reach it at any width (`max-width` on the eyebrow, a float in
  `.nl-txt::before` without one; the rest of the paragraph keeps the full
  measure). It rests at `opacity:.4` instead of being invisible: the block has no
  frame to advertise where its chrome is, and on a touch screen there is no
  hover to reveal it — that case now rests a shade stronger, and print drops the
  button, both following `.cc-btn`. The button also moved to **last** in the
  block's markup, so a keyboard meets the field and the submit before "put this
  away"; it is still `<button type="button">` with an i18n label, and focus
  brings it up with the theme's accent ring. Fixes a latent bug on the way: the
  subscribed state sets `hidden` on the button, which `display:inline-flex` had
  been overriding, so the control stayed reachable in a state that has no form.

- **The header's right-hand controls now read as one cluster.** Search, palette,
  feed and the newsletter bell sat in `.head-in`'s single `gap:18px` — the same
  distance the row uses between the brand, the nav and the tools — so four 34px
  squares stood as far apart as the header's big parts and the row looked
  sparse. The row now carries two spacings: `--head-gap` between the controls
  (10px, 8px under 720px, measured against the old 18/12) and `--head-block-gap`
  for the row's blocks, which stays where it was. Only `.brand` adds the
  difference back — every other block boundary falls on `.head-sp`, which is
  `flex:1` and swallows any gap around it — so no markup changed and the row
  holds with any combination of the optional controls. Verified at
  1440/1280/900/720/430/390 in both palettes: nothing wraps, nothing overflows,
  and the focus rings (2px + 2px offset) still clear their neighbours.

- **The mid-text `newsletter` block lost its rules, its extra air and its
  default promise line.** The two hairlines above and below read as editorial
  dividers rather than as the edges of a block; an author who wants a rule there
  writes `hr`. Without them the old 54px gap looked like a hole in the article,
  so the block now sits ~28px from its neighbours — prose rhythm, not an island.
  `note=` on this shortcode is now **optional with no fallback**: omit it and
  there is no promise line at all. A mid-text block speaks in the article's
  voice, and the theme's generic sentence bolted underneath read as boilerplate
  the author never wrote. Every other placement keeps its i18n default. A guide
  that relied on the fallback and wants the line back passes `note="…"`.

- **A reader who has subscribed stops being pitched to.** A successful
  subscription writes one boolean to `localStorage` (`nl.subscribed`, never the
  address), and every later placement folds into a single muted line. The header
  bell and the subscribe page are untouched — the first is navigation, the
  second is the canonical way in and may be visited to add a second address. The
  popover's line offers "subscribe another address", because the flag only knows
  about *this browser* and cannot hear an unsubscribe made from a letter. Where a
  block would also be collapsed, subscribed wins. New i18n keys: `nl_subscribed`,
  `nl_subscribed_pop`, `nl_sub_other`; `newsletter/js-config.html` now also
  publishes `subscribePage`.

- **The letter example is generated from the sending template, not imitated.**
  Its typography used to be hand-written CSS approximating the email, and it
  drifted: links were a hairline underline where the letter sends a solid one,
  inline code was a grey chip where the letter sends bare mono, and every margin
  and size was a few pixels off. The rules under `.nl-letter-body` are now lifted
  verbatim from the campaign template's own `<style>` by
  `local/mocks/newsletter/listmonk/tools/render-sample`, which also renders the
  reference letter to diff against; a small neutraliser block above them cancels
  the site's prose styles, which an email never has to fight. Verified 1:1
  against the reference render on every compared property.

  The sample also sits on a canvas now — the template's own `#f2f0ec` ground with
  the 600px sheet centred on it — instead of being stretched edge to edge inside
  the window. That float is most of what makes it read as a letter.

- **The letter example shows the letter that actually sends.** The sample used to
  sit in a simplified frame of the theme's own invention, which made the one
  place a reader can inspect the product a rough impression of it. It now
  reproduces the campaign template: the 3px amber rule, the wordmark-and-date
  row, and the full footer — why they are getting this, one-click unsubscribe,
  the sender line, and the note that there are no tracking pixels. Every link in
  it is an inert `<span>`: this is a picture of a letter. The mail-client window
  around it is unchanged. New params `wordmark=` and `date=`, new i18n keys
  `nl_letter_why`, `nl_letter_unsub`, `nl_letter_notrack`.

- **`newsletter-letter-example` and `newsletter-archive` are no longer gated by
  front matter.** Visibility is presence: write the shortcode and the block is
  there, delete it and it is gone. Both used to need a second agreement in the
  page's `newsletter:` params, which split one decision across two files and let
  a shortcode sit in the markdown for months rendering nothing. The archive's URL
  moves onto the shortcode as a required `url=`, so the whole feature is one
  line. **Migration:** delete `newsletter.letterExample` from front matter, and
  move `newsletter.archiveURL` onto the shortcode as `url="…"`.

- **The mid-text block's close button collapses it instead of deleting it.**
  Dismissing used to remove the block with no undo anywhere in the interface —
  a one-way door a reader could walk through by accident. It now folds into a
  single muted line where the block was ("Subscription form collapsed — bring it
  back"), and the link unfolds it. Both directions persist, so an unfolded block
  stays unfolded on the next page as well.

  The `localStorage` value is deliberately unchanged: `nl.dismiss.<key> = '1'`
  used to mean "removed" and now means "collapsed", so a reader who dismissed a
  block under the old behaviour meets the ghost line rather than an empty spot —
  the offer comes back within reach instead of silently reappearing in full.
  `'0'` is new and records an explicit unfold. Nothing to migrate by hand.

  New i18n keys: `nl_ghost`, `nl_ghost_restore`, `nl_ghost_aria`,
  `nl_restore_tip`; `nl_dismiss_tip` now reads "Collapse this block".

- **Subscription fields carry a real `label[for]` and a per-instance `id`.**
  Password managers pair a field with its label to work out what a form is, and
  the `aria-label` this replaces gave them nothing to pair with. `form.html`
  takes a `place` slug and builds `id="nl-email-<place>"`; the two shortcodes mix
  in their `.Ordinal`, since a page can carry the form up to six times and a
  duplicated id makes every copy after the first ambiguous. The label is
  visually hidden, not `display:none` — it stays in the a11y tree.

- **The header popover stacks, narrows to 316px, and fades without moving.**
  The field and the submit button no longer share a row, which takes the input
  from ~190px to 286px: password-manager and masked-email buttons sit on a
  field's right edge, and a cramped field put them on top of the placeholder.
  The open animation is now an opacity transition out of `@starting-style`
  instead of a keyframe slide — Bitwarden measures the field once and only
  repositions on scroll and resize, so a panel that moves after layout strands
  its button at stale coordinates. The transition also fixes a panel that could
  render fully invisible: the old keyframe held `opacity:0` until it advanced,
  and a throttled tab never advanced it.

- **`.nl-field` horizontal padding is symmetric and must stay that way.**
  The `padding-right` lane meant to reserve room for extension buttons did the
  opposite: both Bitwarden and Firefox Relay anchor to the field's *content*
  box, so the reserved space pushed their button left into the text, and Relay
  sized its hover slab and click hit-zone to `2 × padding-right + 25`px — 109px
  of a 189px field, most of it swallowing clicks meant for the input. The
  formulas and the measurements are in the comment above `.nl-field`.

- **The home look ships on.** `home.hero = "wordmark"`, `home.grid = "fade"` and
  `home.rubricCards = "naked"` move into the theme's own `hugo.toml`, so a site
  that says nothing now gets the display brand over a dissolving backdrop with
  boxless rubric tiles — the page the theme was designed around. They were
  optional and off, which meant the look existed and nobody saw it: a fresh
  install, and the demo the theme links to as its own shop window, both rendered
  the plainest thing the templates could produce.

  The three axes stay independent, and each switches off with an empty string:

  ```toml
  [params.home]
  hero = ""    # no display brand
  grid = ""    # no backdrop
  ```

  `rubricCards = "boxed"` brings the framed card back. Note this changes an
  existing site's home page with no config change of its own — the snippet above
  restores it exactly.

- **The brand mark drops its plate at display size.** The mark carries a filled
  rounded square because the tree has to survive a 16px favicon: the tiers
  measure ~1.6:1 against a dark canvas, so the silhouette of that square is what
  the eye reads, not the conifer inside it. At hero size the same square became a
  hole punched through the backdrop, with an unreadable tree in the middle of it.

  The plate and the tiers now carry classes (`mark-plate`, `mark-tier`), and the
  hero hides one and repaints the other in `currentColor` — the mark is drawn in
  the wordmark's own ink, held back so it reads as a drawing beside the word
  rather than a second word. Taking the colour from the text is also what makes
  it work across all twelve palettes, the light one included. A site that redraws
  `logo.html` keeps the two classes to keep the behaviour; without them it gets
  the plated mark everywhere, exactly as before.

### Added

- **Syntax highlighting is no longer Go-only.** A definition card in a guide
  carried a ` ```json ` block and rendered it flat, and so did the same block in
  the prose: the code-block hook lit Go and dropped everything else into a
  plain `<code class="nohl">`. That was right when the theme had one language
  to show and wrong the moment a guide quoted a config, a shell line or a
  wire format — the reader sees a listing that looks like program output and
  has to parse it as code anyway.

  Now an allowlist is lit — `go json yaml/yml bash/sh/shell/zsh c css html
  xml javascript/js typescript/ts sql diff python/py` — and `hl_lines` works
  in all of them, not just Go. A **bare fence**, ` ```text ` and ` ```txt `
  stay plain on purpose: that is the form a transcript, a trace or a gc log
  wants, and it is the overwhelming majority of the fences on the site.

  It is an allowlist rather than "whatever Chroma can lex" because the token
  map in `20-chroma.css` is a map of ROLES — amber a keyword, blue a type or
  a structural name, green a callable, copper a number — and a language whose
  central tokens have no role reads worse half-lit than flat. `toml` (keys
  arrive as the same class as an ordinary Go identifier, which is
  deliberately uncoloured) and `asm` (the GAS lexer files every Plan 9
  register under numbers) were tried and left out on that test; the hook
  carries the note.

  The map grew the classes the new lexers emit — JSON/YAML keys, HTML tags
  and attributes, shell and CSS variables, decorators, entities, diff
  markers — all onto existing palette variables, so every one of the twelve
  palettes re-themes them for free and no palette file changed. Nothing about
  a Go listing moved.

- **Email subscription.** A reader who liked a guide had exactly one way back to
  the site: remembering it. The theme now ships the whole front end of a
  newsletter — a bell button in the header with a popover, a quiet block an
  author drops into a guide, a card at the foot of an article, a CTA under a
  series' chapter list, a link in the footer, and a bare form for a page written
  as prose. One form, one state machine, one set of texts.

  It owns the interface and nothing else: no addresses, no sending, no
  credentials. The form posts to an endpoint the site names — a proxy on its own
  origin (`mode = "worker"`) or listmonk's public endpoint for local development
  (`mode = "direct"`) — so the provider is a detail the pages never learn.

  ```toml
  [params.newsletter]
  enable = true                  # master switch; off ⇒ not one nl- class ships
  endpoint = "/api/subscribe"
  [params.newsletter.placements]
  header = true                  # bell beside the feed icon      (default on)
  footer = true                  # link in the footer row         (default on)
  articleEnd = false             # card at the foot of a guide     (default off)
  seriesLanding = false          # CTA under a series' chapters    (default off)
  ```

  Four shortcodes come with it — `newsletter` (mid-text, dismissible per block),
  `newsletter-cta` (end of article, every text overridable per guide),
  `newsletter-inline` (bare form) and the subscribe page's two self-gating
  blocks, `newsletter-archive` and `newsletter-letter-example`. Turnstile is
  optional, invisible and never blocking: no token in two seconds and the
  request goes without one, because a reader who blocks challenges must still be
  able to subscribe. Full documentation: `docs/newsletter.md`; every placement is
  live on the demo.

  Two of the form's three results carry a quieter second line, added after
  watching a live backend answer real addresses. A success now says where the
  letter is if the inbox looks empty — it is sent again on every attempt, so an
  invisible one is being filtered, not lost. A failure offers a way out of the
  one dead end retrying cannot clear: an address the list blocked after a bounce
  is refused on every try, and only a human on the other end can unblock it. The
  address that line offers is the site's to name, and without one the line is
  not rendered at all:

  ```toml
  [params.newsletter]
  contactEmail = "news@example.com"   # default: fromAddress; empty ⇒ no line
  ```

  Both lines live inside the existing `aria-live` region and are written with
  the status in one go, so a screen reader announces one message, not two.

  The field keeps a reserved lane on its right (`padding-right: 3em`) because
  password and relay extensions — Bitwarden, 1Password, Firefox Relay, DDG Email
  Protection — inject their own button into the right edge of every
  `input[type=email]`, and no page can opt out of it. Without the lane that
  button sat on the tail of the placeholder. The width is sized against the
  worst case seen in the wild, a 28px button held 12px off the border, and
  `text-overflow: ellipsis` catches whatever a longer translation or a fallback
  font might still overflow. Two knock-on changes: the header popover grew from
  316px to 348px, because it holds the one form on the site with no room to
  spare, and `nl_placeholder` is now the shorter `your@mail.com`.

- **The theme carries codapi itself.** Making a snippet runnable used to mean
  pasting a `raw` block into the guide with a `<script>`, a `<link>` and a
  `<codapi-settings>` in it — so the library version, the stylesheet and the
  address of the sandbox all lived in prose, repeated once per guide. Bumping
  codapi meant editing every article that had ever run anything, and a guide
  written on a Tuesday could be a version behind one written on Monday.

  Now the sandbox is named once in the site config and the guide says nothing:

  ```toml
  [params.codapi]
  url = "https://run.example.com/v1"
  ```

  `{{< run sandbox="…" >}}` raises a flag on `.Page.Store`; `scripts.html`
  renders after the content, reads it back and puts codapi in the foot of
  exactly the pages that asked for one. `snippet.js` is vendored under
  `assets/vendor/codapi/` (MIT), so the version is pinned in one place and the
  file goes out fingerprinted, with an integrity hash, from the site's own
  domain — a guide is no longer one CDN outage away from a dead Run button. A
  site upgrades by dropping its own `assets/vendor/codapi/snippet.js` over the
  theme's.

  codapi's stylesheet is **not** loaded at all: all it did was lay the parts out,
  and the theme now writes those rules itself (`25-code-editor.css`). That is one
  less request, and it ends a quiet fight — snippet.css loaded from the body and
  won any layout property on order, so every change had to be routed through
  codapi's own custom properties.

  A `sandbox=` without `params.codapi.url` now **fails the build**. A Run button
  wired to nothing looks exactly like a working one until it is pressed. The
  `url=` attribute the shortcode used to pass through is gone for the same
  reason: codapi reads its endpoint from the one global `<codapi-settings>` at
  request time and never looks at the snippet element, so a per-snippet `url=`
  sat in the markup looking authoritative while every run went elsewhere.
  Writing one is now an error rather than a silent no-op.

- **A copy button on every code listing.** The one thing a reader wants out of a
  listing that the page could not give them: taking the code required selecting
  it by hand, and in a long block that means dragging past the edge of the
  viewport and hoping the selection did not pick up the line the scroll ran into.

  The button is not there while the block is being read. It appears in the
  top-right corner when the pointer enters the listing or focus lands inside it,
  which is the language the rest of the theme already speaks — a prose link shows
  its accent only under the cursor, a heading's hash anchor fades in on hover, an
  image in a dark palette lifts out of its dimming the same way. A listing is
  read far more often than it is copied, so at rest the affordance costs the
  reading nothing; the alternative, an always-visible control, would have had to
  reserve the corner of **every** block (`padding-right`) so that a line running
  up to the button could not hide beneath it. Touch screens have no hover to
  reveal it and get it always visible, a tone quieter, instead.

  It is mounted on both kinds of listing — a plain fence and a runnable snippet —
  because to the reader they are the same object with the same thing worth taking
  out of it. On a snippet in editing mode it copies what the reader has typed
  rather than the original, and the trailing newline is stripped, so a shell
  pasted into offers the command instead of running it. Copy → check (green) or
  cross (copper) for ~1.5 s; the outcome also goes to a live region, since
  swapping an icon says nothing to a screen reader. Without a secure context
  (a `hugo server` reached over plain http) it falls back to the old
  `execCommand` path and still works.

  Nothing to write and nothing to switch on — `modules/codecopy.js` finds the
  listings the codeblock render hook emitted and wraps each in a non-scrolling
  `.cc-wrap`, so the button holds its corner while the code scrolls sideways
  under it. Styling is `assets/css/27-code-copy.css`; labels are the new
  `js_copy_code` / `js_copy_done` / `js_copy_fail` i18n keys.

- **`run` shortcode: one output block per runnable snippet.** A guide almost
  always ships the output its author recorded — most readers never press Run, so
  that output is the primary view, not a fallback — and until now it was written
  by hand as a bare `<details>` inside a `raw` block. It came out unstyled (a UA
  triangle, no pointer cursor on a row that toggles), and pressing Run stacked
  codapi's own result right on top of it: two near-identical outputs, and the
  reader left to work out which was theirs.

  `{{< run sandbox="go1.26.4" >}}…{{< /run >}}` replaces both the
  `<codapi-snippet>` element and the hand-written disclosure. The body is the
  recorded output; a run replaces it **in place** (`modules/runout.js` listens
  for codapi's `execute`/`result` and keeps codapi's own box hidden), so the page
  carries exactly one output, always.

  The block is a terminal transcript: the first line is a prompt — `$ go run
  main.go` — and that line is also the toggle and the status readout, so no
  separate "Output" caption is needed and a folded block still says what ran.
  The `$` goes green or copper once the reader has run it themselves, the
  provenance text at the end of the row turns from `example` into `run · 128 ms`
  or `error · 89 ms`, and **restore example** puts the author's output back.
  Params: `cmd=` (the prompt line), `note=` (a caption, set as a shell comment),
  `open=`, `error=`, plus pass-through of codapi's own attributes. Written
  without `sandbox=` it renders alone, for output recorded on a machine the
  reader cannot reach. Labels are the `run_*` i18n keys; styling is
  `assets/css/26-run-output.css`.

- **Runnable code snippets get a real editor.** The theme already dressed
  [codapi](https://github.com/nalgeon/codapi-js) in the palette; it now replaces
  the editing half of it. codapi's `editor="basic"` makes the `<code>` element
  contenteditable and, on the first focus, runs `code.textContent =
  code.textContent` — the Chroma markup is gone the moment a reader touches the
  block, and never comes back. There was no editing MODE either: "Edit" is a
  bare `focus()` call, so there was nothing to leave, no way back to the
  original, and no signal that the block was live beyond a caret.

  In its place, the overlay model: a transparent `<textarea>` lies exactly on
  top of the highlighted `<pre>`, so caret, selection, IME, undo and the mobile
  keyboard stay native while the colours below are real markup, re-rendered on
  every keystroke by a small client-side Go lexer that emits the same Chroma
  classes as the build-time pass. Editing is a state of the BLOCK — one step of
  surface that stays put when focus moves away — with **Edit** / **Close** /
  **Reset** as buttons rather than a dashed-underline link, and Reset restoring
  the server-rendered listing byte for byte, `hl_lines` included. `Tab` and
  `Shift+Tab` indent (whole lines when the selection spans several), `Enter`
  keeps the indentation and opens a body between braces, brackets and quotes
  auto-close and wrap a selection, `⌘/Ctrl+/` toggles comments and
  `⌘/Ctrl+Enter` runs. Execution still belongs to codapi, which reads the same
  `textContent` it always did.

  The lexer follows Chroma's rules rather than approximating them, including
  the one that carries meaning: a word in front of `(` is a call site, so
  `uintptr(n)` is a conversion (builtin green) while `var a uintptr` is a type
  (blue), and `new := 5` is a plain variable while `new(int)` is the builtin.
  `scripts/check-gohl.py` keeps it honest — it harvests every ```go fence from
  a content tree, runs both highlighters over it and compares character by
  character, by the colour 20-chroma.css actually paints rather than by class
  name. On the 600-snippet corpus this theme was developed against: 0.018% of
  characters differ, all of them either invisible (a newline inside a comment)
  or deliberate (the name of a generic function declaration, which Chroma
  leaves uncoloured).

  Nothing is required of a site that carries snippets already: the module
  upgrades any `codapi-snippet` with an `editor` attribute on the page, and
  stays inert where there are none. New tokens `--code-fs`, `--code-lh`,
  `--code-pad` and `--code-tab` (03-typography.css) carry the listing's metrics,
  because the editor has to match them to the pixel. Sites styling codapi in
  their own `custom.css` can drop those rules — see `docs/authoring.md`.

- **go.dev documentation links get a hover card.** The Go blog had one; a link to
  the release notes, the spec or Effective Go — the pages a Go guide cites most —
  was a plain external link with an arrow. `/doc/`, `/ref/`, `/wiki/` and
  `/security/` now open a card of the same family: the shelf as a kicker (GO DOCS
  / GO REFERENCE / GO WIKI / GO SECURITY), the page title, its subtitle where it
  has one, and its first paragraphs. A link into a section
  (`/ref/spec#Method_declarations`) shows the page's card and every anchor into
  that page shares a single build-time fetch.

  Its own scraper rather than the blog's: a docs page has no byline and no
  `<div class='markdown'>`, and half of them open straight with an
  `<h2>Introduction</h2>`, so "everything before the first h2" comes back empty.
  It takes the first `<h1>` under `<main id="main-content">`, the
  `<h2 class="subtitle">` where the spec and the memory model date themselves, and
  the first three paragraphs of real prose. Marketing pages and the tour stay
  plain external links, and a page that yields no `<h1>` degrades to one too.
- **`{short="…"}` on a heading names it for the tables of contents.** A section
  title carries a colon and a clause; the same string in a rail is three wrapped
  lines. The short name now rides in the markdown, right after the words it
  shortens — `## Runtime: allocations, traceback labels, timers {short="Runtime:
  allocations and timers"}` — and both lists read it, the boxed block and the
  rail, `h2` and `h3` alike. The heading, its id and its anchor are untouched.

  This replaces `toc_labels`, which asked for a map keyed by heading **id** —
  ids the author had to reconstruct by hand from a Cyrillic title with slashes
  and brackets in it, kept in a different file from the heading, and silently
  stale the moment the heading was reworded. It is still read, after the
  attribute and before the heading's own text, so nothing written against it
  breaks. It is a Goldmark heading attribute, the mechanism `{#custom-id}`
  already uses; `render-heading.html` files it into the page store for the Hugo
  side and leaves `data-short` on the element for the browser side.
- **`lead_deck: true` sets the standfirst as a display deck.** An article's lead
  is prose by default — the piece's opening sentence, at the size of what
  follows. A survey or a release write-up opens differently: the paragraph says
  what this is before the article starts, and it wants to read as an
  introduction. The flag restores the deck (19px, quieter tone) the plain `.lead`
  has on rubric and taxonomy pages, and keeps the light-scheme correction, so a
  lead never looks weaker on white than the prose under it.
- **`toc_inline: true` keeps the boxed TOC on wide screens.** A wide screen gets
  the live right rail and the block in the prose is hidden, which is right for a
  guide — the two would list the same sections twice. A long survey wants both:
  the block is a map read BEFORE the article (h2 only, two columns, the whole
  shape at a glance), the rail answers "where am I" during it, h3s included. The
  page opts in and the block stays; nothing changes anywhere else.

  They do not, however, share the screen. While the block is in view the rail is
  hidden outright — not folded to its minimap, which beside a full table of
  contents reads as debris — and fades back in once the block has scrolled under
  the header. The rail ships hidden from the server on such a page, so it never
  flashes in beside the block; with JS off it stays hidden, which is the right
  degradation for a page that carries its contents in the prose.
- **The right rail honours `toc_labels`.** The map of heading id → short label
  was read by the inline TOC alone, so one page listed its own sections two
  different ways — "Generic methods" in the block, "Generic methods: Go reversed
  its own «never»" wrapped over three lines in the rail. The rail is built in the
  browser and simply had no way to see front matter; `rail-right.html` now hands
  it the map on `#tocRail`. A heading with no label keeps its own text, and the
  minimap's tooltips name entries the way the panel does.
- **The footer is pinned to the bottom of the viewport on short pages.** The
  page is a full-height flex column and the content block takes the slack, so
  an empty rubric or the 404 no longer leaves the footer floating mid-screen.
  Sites carrying this as a local override can drop it.

  It arrives with the fix for the overflow it used to cause. The column centres
  itself with `margin:0 auto`, and auto side margins on a flex item swap its
  cross size from stretch to fit-content — max(min-content, available). A
  `<pre>` reports its longest line as min-content (`white-space:pre` makes that
  line unbreakable), so one code block wider than the viewport stretched the
  whole column past the screen edge and took the headings and the right-hand
  padding with it: text cut off on the right on every page carrying a listing,
  while the listing's own `overflow-x` sat unused. The column's width is
  pinned now. Note that `min-width:0`, the usual reflex, does nothing here —
  the automatic minimum size applies to the main axis, which is vertical.
- **The header collapses into a disclosure menu below 900px.** The rubric links
  and the round buttons stopped fitting one row at ~845px (~897px on an article,
  which adds the focus toggle), so the links were being cut off rather than
  wrapped. They now live behind a burger that keeps its place in the row, right
  after the brand. Above the breakpoint the whole mechanism is inert —
  `display:contents` on the wrapper — so a wide header renders exactly as
  before. Esc, an outside click, focus leaving the panel, a >24px scroll and a
  resize past the breakpoint all close it; `aria-expanded`/`aria-controls` and
  the new `nav_menu` string carry it to assistive tech. Below 560px the source
  link joins the menu as a labelled row; the feed icon stays in the row, where
  a reader of a guides site looks for it.

### Changed

- **The "by codapi" tail is no longer shown** next to a finished status
  (`codapi-ref` is hidden in `26-run-output.css`, and its colours are gone from
  `25-code-editor.css`). codapi is MIT and asks for no attribution in the UI; a
  permanent vendor stamp two words from the reader's own exit code read as if
  the result belonged to someone else. The status itself — `Running…` / `✓ Done`
  / `✗ Failed` — is untouched.

- **The TOC rail is wider, quieter and wraps better.** Above 1500px the right
  rail alone goes to 264px (~230px of text against ~202px): its track has slack
  to spare, while the left one already fills its own to the pixel at 1728px — and
  a rail wider than its track would not spill into the page margins but narrow
  the reading column, since `1fr` is `minmax(auto,1fr)` and the middle track is
  the one that gives way. The scrollbar is gone from both rails (the scroll
  stays): a bar running down beside the entries read as a second border on a
  panel that has none, and the scroll-spy is what keeps the current entry in
  view. Entries wrap with `text-wrap: balance`, so a two-line one no longer
  leaves a word stranded on its second line.
- **The home page is composed for a phone, not merely stacked onto one.** The
  rubric showcase spends its vertical budget freely because it spends it in
  three columns; dropped to one column that budget became ~290px per rubric, so
  a reader thumbed past three full-height glyph towers before the first guide
  title. Below 880px — the width where the grid collapses anyway — each rubric
  is a ROW instead: the glyph keeps being the card's hero but moves left of its
  words, and the three text lines stack beside it. Same information, ~110px per
  rubric, and the whole row is one tap target. The hero scene loses the desktop
  air above it, and the kicker's trailing clause takes a line of its own with
  its leading separator dropped — a "·" at the head of a line divides nothing.
- **The footer becomes a signature and a navigation instead of three grey
  lines.** Stacked into a column, brand, tagline and links all read at the same
  weight, so nothing said which of them could be clicked. The mark now leads at
  15px with the tagline bound to it, the links are set in the mono face the
  theme reserves for service rows, and all the air goes between the two groups.
  Each link is padded to a 43px touch target, and the plank gained a floor —
  the old 32px left the last line sitting on the edge of the screen.
- **The focus toggle is dropped below 560px.** It hides the header and both
  rails to leave the text alone on a wide canvas: a phone has neither rails nor
  an F key to toggle it back, so the button spent a slot in a row that has none
  to spare. `display:none` takes it out of the tab order too — an inert control
  is worse than a missing one.
- **The Light palette is rebuilt.** Four accents — `--accent-green`,
  `--accent-blue`, `--accent-gold`, `--accent-copper` — had been the dark
  palettes' values byte for byte, and lost 63-82% of their presence on a white
  canvas (green fell to 1.77:1, gold to 2.17:1). Not cosmetic: `20-chroma.css`
  maps function names to green, built-in types to blue and numbers to copper, so
  three of the five colours in a Go listing were illegible.

  Darkening them in place is not the fix either — that reads as no highlighting
  at all. How much chroma a hue can carry at a given contrast varies ~3x by hue
  on a light canvas, and the hues that stay rich near white are the opposite of
  those that stay rich near black, so the contrast-to-hue allocation has to
  invert between schemes rather than mirror. The accents now sit at 4.2-5.7:1
  with OKLCH lightness 0.50-0.57, separated by hue rather than by lightness
  (worst pair dE 0.109 in OKLab, was 0.054). Three hues moved where the cost was
  only visual: green 123°→145°, blue 238°→248°, `--gtok-str` 75°→95°. The `-dim`
  and `-glow` washes stay cut from the *bright* shades — on white, ink and tint
  want opposite ends of the scale, and a wash diluted from dark ink turns grey.
  Numbers move onto violet and comments step down to `--text-ghost`, both scoped
  to `[data-scheme="light"]`.

  Neutrals dropped their Primer blue cast (hue ~210°) for achromatic greys, so
  the warm brand accent no longer sits on near-complementary ground. The text
  ramp is derived from the dark palettes' *relative* step down from primary
  rather than their absolute ratios — light's primary is far blacker against its
  canvas, so equal ratios read a step weaker. `body-glow` is a faint warm wash
  instead of `none`.
- **The Light ramp has four distinct steps again.** `bg-base` and `bg-surface`
  were both `#ffffff`, which collapsed the four-step ramp into three and made
  every card-inside-a-panel invisible — a widget's buttons against its own
  frame, the selected row in the search modal, the keycaps in the header.
  Lowering the canvas makes room for the step. Ordering is unchanged: on a light
  canvas `bg-raised` is a chip tone *below* the canvas (hover darkens) and
  `bg-base` is a step *up* from `bg-deep` — see the new
  [Writing a light palette](docs/customizing.md#light-palettes) section, which
  writes those rules down for the first time.
- **Intro prose is inked as prose on light** — a rubric lead, a series
  description and a feed card's summary take `--text-primary` there instead of
  `--text-secondary`, which against near-black body copy read as greyed-out and
  left the intro looking weaker than what it introduced.
- **Covers get a real edge on light**, on the article and in the feed: a
  picture's light field and the page's meet, and the palette hairline was not
  enough to say where one ended.
- **Palette swatches are exaggerated, not accurate.** The six closest canvases
  sit 0.006-0.014 apart in OKLab — invisible at 32×24, and doubly so on a light
  palette's white popover. The chip is now saturated so each palette's real hue
  reads; the achromatic ones stay neutral.
- `--accent-red` (+ `-dim`) is documented in `customizing.md` at last. It has
  been a real token since every palette got it — `.callout.warn`,
  `.term-card.c-red`, `.l1-tip.c-red` — and was simply missing from the list.

### Fixed

- **A standalone guide with no `related:` still got a left rail.** The panel
  drew its "related" heading over an empty list, and collapsed into a minimap
  with no marks — chrome around nothing. The rail is now skipped altogether
  when there is nothing to list: no series parts, and no `related:` path that
  resolves to a page. The prose does not move — it is pinned to the middle
  grid track, so the left track simply stays empty.
- **A feed card's cover was cropped on a phone.** The banner ratio tightened to
  `2.2 / 1` below 640px, and since covers are drawn at 3:1 `object-fit: cover`
  then ate 26.6% of the picture off its sides. The mobile override is gone: one
  ratio everywhere shows the whole cover and makes the card 41px shorter.
- **The feed meta row left a hairline cut dangling at the end of a wrapped
  line.** The row now breaks at a seam rather than wherever it runs out of
  width: rubric with series, then reading time with date, each group taking a
  full basis on a narrow screen, so the separator of a group's last item can be
  dropped unconditionally.
- **A fold's icon sat against the middle of a multi-line summary.** On a narrow
  screen the row is a two-row grid now, so the icon catches the FIRST line of
  the title, the title takes the full width, and the toggle drops to the body's
  own left edge instead of squeezing the text into a third of the panel.
- **A double tap on a fold's summary zoomed the page.** A tap on an ordinary
  element is held ~300ms in case a second one follows, and the pair means
  zoom-to-fit — so opening and closing a panel twice ran the gesture. The row
  is `touch-action: manipulation`; panning and pinch-zoom are untouched.
- **The series bridge advertised "~0 min left".** When everything ahead is an
  announced part it carries no reading time, and the sum was printed anyway.
  The clause is dropped in that case, the same guard the next-part chip has.
- **The `.byte-box` value swatches went unreadable on light palettes.** Their
  ink is a fixed near-black, which assumes a light mid-tone fill — true of every
  dark palette, but not of a light one whose accents must be dark to work as
  text. The ink now flips to the surface colour under `[data-scheme="light"]`.
  The `.f0` swatch, already marginal at 3.72:1, improves to 5.16:1 with it.

### Changed — BREAKING

- **Series are rubric sub-sections now, not a taxonomy.** A series is a folder:
  `content/<rubric>/<series>/<part>/`, its metadata in the folder's `_index.md`,
  part order in each part's plain `weight` (was `series_weight`). The
  `series: [...]` front-matter field, the `series` taxonomy and the
  `content/series/` metadata tree are gone; migrate by `mv`-ing each part into
  its series folder and its term `_index.md` to `content/<rubric>/<series>/_index.md`.
  Why: one tree instead of two, membership you can see in the file manager, and
  a series you can reorganize with `mv` alone.
- **Every series now renders a landing page** at `/<rubric>/<series>/` — title,
  tagline, description, the `_index.md` body as an epigraph, the parts list and
  a start CTA (`_partials/series/landing.html`; body class `series`). The rubric
  page keeps the anchored block, its heading now linking to the landing. A
  series with an `_index.md` but no parts yet shows as an "in the works" teaser
  on the rubric and an announcement on its landing.
- **`_partials/series/pages.html` is retired** (the section's own `RegularPages`
  ordering replaced it) and `series/slug.html` now slugs a section, not a term.
  A site overriding either must revisit the override. Sites relying on the
  default page sort of `site.RegularPages` should know guide feeds are now
  explicitly date-sorted in `guides.html` — series parts carry `weight`, which
  would otherwise hijack the default order.
- New i18n keys: `series_start`, `series_soon`. New archetype: `series.md`
  (scaffolds a series `_index.md`).

### Added

- **Feed cards can wear a cover band** — `params.home.feedCover = "banner"`
  (unset ⇒ off, exactly as before). The picture is the one the
  guide names in front matter as `cover`; a guide without one keeps the plain
  card, and a picture already in the lead stays where the author put it. The frame
  owns the shape: `--feed-cover-ratio` (default `3 / 1`) crops with object-fit,
  so the ratio is a site's to retune and no two cards disagree; on hover the
  image scales inside the fixed frame. Raster covers are re-encoded to WebP and
  capped at the column's 2× width, never upscaled; SVG and off-site pictures
  pass through untouched.
- **A page can name its own cover** with `cover:` in front matter — one field
  for both the feed banner and the share card, so the two can never disagree.
  It wins over `og.png` / `og_image:` and switches
  the drawn cover off for that page; the path resolves like a Markdown image
  (bundle, then `assets/` and `assets/img/`, leading `/` dropped), and anything
  that resolves nowhere is passed through as a URL, so a file in `static/` or a
  picture on another host works too. New partial `og-cover.html` — `og-image.html`
  keeps its contract and stays the generator.
- **An article can show its cover** — `params.article.cover = true` prints the
  same `cover:` picture between the meta line and the prose, WHOLE: the band is
  the feed's crop, an article shows the artwork. Unset ⇒ nothing above the lead,
  as before.
- **A breathing home** — four independent axes under `params.home`, each unset
  by default, so the page stays byte-for-byte the old one until a site opts in.
  `hero = "wordmark"` puts the header brand above the kicker as a heading scene
  (a site may hang a mascot beside it through `_partials/home/mascot.html`);
  `grid = "grid" | "fade" | "dots"` draws background markup behind that zone in
  the palette's own hairline ink; `rubricCards = "naked"` drops the card box and
  grows the logo, letting the markup hold the composition instead of borders;
  `feedPreview = "summary"` swaps the front-matter description for the guide's
  own lead up to `<!--more-->`, narrows the column to a ~75-char measure and
  closes it with a quiet "read →" (new i18n key `feed_read`). The feed heading
  gives way to a centred rule that fades at both ends.
- **Standalone containers.** A rubric with many loose guides can tuck them into
  a sub-folder so they don't drown the series folders: a sub-section whose
  `_index.md` sets `params.standalone: true` (+ `build.render: never`,
  `list: local`) is a tidiness container, not a series — its children render,
  list and search exactly like guides sitting directly in the rubric, and both
  homes stay valid at once, so adoption is per-guide, not flag-day.
- **`term` shortcode — a word in the prose with a definition card behind it.**
  `{{< term "mcache" >}}…markdown…{{< /term >}}`: hover opens the card, a click
  pins it, Escape closes; the body takes anything Markdown does, including code
  blocks and images. `kind=` labels it, `color=` picks its colour by name
  (accent|green|copper|blue|gold|red), `href=`/`more=` add an optional "read
  more" link, `title=` splits the card's heading from the inflected word in the
  sentence. Colour is named, not derived from a semantic type: when the only
  visible difference between "internals" and "trap" is green versus copper, the
  mapping is something to memorise, not something that means anything.

  It is a **non-modal `role="dialog"`, not a tooltip** — a tooltip may not hold
  a link, and this one usually does (W3C APG). Behaviour meets WCAG 2.1 SC
  1.4.13: the card is hoverable (a short close delay covers the gap),
  dismissible (Escape, click outside, pointer away) and persistent — it follows the word on
  scroll rather than vanishing, and never auto-hides on a timer. On touch it
  becomes a bottom sheet; hover is gated behind `(hover: hover)`.

  The cards do **not** render inside the paragraph — a `<pre>` there would close
  the `<p>` and split the prose — so `article/term-cards.html` collects them
  after `.Content`. With JS off that block is the article's "Definitions"
  appendix and every term links into it; it is also what prints. The existing
  `.l1-tip` engine is untouched: it stays the plain-text hint for diagram cells,
  which it does well and which this deliberately is not.

  New: `assets/css/23-term.css`, `assets/js/modules/term.js`, four i18n keys
  (`term_more`, `term_back`, `term_cards_head`, `term_cards_aria`).
  A site that overrides `page.html` must add the `article/term-cards.html` call
  to pick this up.
- **`params.extraGuideSections`** — sections listed here (e.g. `["posts"]`)
  join the guide feed, search, RSS and get the full article layout, but are
  NOT rubrics: no home card, no 404 entry. For guides that belong to no
  rubric. The kicker reads the section `_index.md`'s `label`, as on rubrics.

- **Multilingual, for real.** The theme claimed to be language-agnostic while
  shipping no way to switch languages. Now:
  - a **language switcher** appears in the header by itself once a site has a
    second language — no param, no partial to write;
  - **`hreflang` alternates** (plus `x-default`) are emitted. The docs used to
    claim this already worked. It did not;
  - **UI strings reach JavaScript.** `window.THEME_I18N` was read by `i18n.js` and
    **emitted by nothing** — so the ⌘K modal, the popover, the focus button, the
    minimap and the tags filter were hardcoded Russian on every site. A
    `js-bridge.html` partial now renders the catalogue from i18n;
  - **plurals are CLDR-driven on both sides** (`Intl.PluralRules` against Hugo's
    own plural forms), instead of a hand-rolled Russian rule;
  - **dates are language-aware**: month names come from `month_1`…`month_12`.
  - The i18n catalogues went from 67 to 106 keys, `ru` and `en` in lockstep.
- **`params.accent`** — a single param repaints the accent across **every**
  palette at once (built-in and site), a brand axis orthogonal to the palettes.
  `accentDim` / `accentGlow` override the derived `rgba(…, .18)` / `rgba(…, .28)`.
  The favicon and the logo mark follow it too. Unset ⇒ each palette keeps its
  native accent and the output is byte-for-byte unchanged. A non-`#rrggbb` value
  fails the build. See [customizing.md](docs/customizing.md#recolour).
- **Localizable palette names.** A palette's `name` may be a table of
  translations (`name = { en = "Amber", ru = "Янтарь" }`); the picker shows the
  current language's entry, falling back to `en`. Plain strings work as before.
  The four names that translate ship both languages; GitHub/Nord/Obsidian/One
  Dark are proper names and stay strings.
- **`color = "accent"` in OG layouts.** A cover text block may name the brand
  accent instead of retyping a hex; og-image.html resolves it like the favicon
  does (`params.accent`, else the default palette's accent) and bakes it. The
  `dots` kicker uses it; the `taiga` kicker deliberately keeps its literal —
  that teal belongs to the artwork, not the brand axis.
- **Per-language roadmap data.** A site ships either a flat `data/roadmap.toml`
  (unchanged) or a folder `data/roadmap/<lang>.toml`. Hugo's `data/` is not
  language-aware, so a bilingual site had no way to translate its roadmap.
- **`scripts/check-links.py --base-path`** for sites built under a subpath, and it
  now reports a link that *escapes* the subpath as an error rather than skipping it.
- Russian mirrors of the documentation under `docs/ru/`.

### Changed

- **The palette picker reads as a list of palettes again.** Three things had
  quietly stopped working. The swatch was four 5px dots — three near-black
  greys and an accent that `params.accent` paints identically in every palette,
  so twelve rows looked like one row twelve times; it is a miniature page now
  (canvas, a card on it, a heading and a body line over the card, from
  `bg-deep` / `bg-surface` / `text-primary` / `text-muted`, no accent), and the
  hue cast that actually separates Gruvbox from Nord has room to show. Every
  dark canvas sits within a few points of `#141414`, so the temperature rides
  almost entirely on the text tones — they get the area, and the frame is
  tinted with the row's own text rather than the current palette's, which puts
  a warm outline around a warm palette instead of two 2px lines. The flat
  twelve-item list is grouped — new optional `group` key in a palette file,
  same string-or-translations shape as `name`, shipped palettes split into
  *Originals* / *Classics* / *Light*; a palette without one lands in an
  unlabelled block, so a site that ignores the key keeps the old flat list.
  The popover heading is "Palette", not "Theme" — `theme` in a Hugo project
  already means the thing in `themes/`. `light = true` now carries the light
  palette's badge on its own: the `☀` was dropped from the shipped palette's
  name, where it was a label doing a flag's job. The popover also scrolls
  instead of running off a short screen. "Coal" is **Onyx** now — a stone, like
  its neighbour Graphite, instead of a fuel; the id stays `coal`, so a saved
  preference and a site's `defaultTheme` keep pointing at it.

- **The feed card's meta line got a hierarchy.** Five items at one size and one
  colour, split by a flat gap, read as a single grey smear — and the loudest of
  them (the tags) mattered least. The row is grouped now: rubric first as the
  only accent, then series·part, reading time and date, hairline cuts between
  them (the article head's device, reused), and the tags pushed to the card's
  right edge. That last move also squares the card — the row now ends where the
  cover band ends, so the banner stops looking shifted right against text that
  never reached it. Deliberately NO rule under the row: a full-width hairline
  there is indistinguishable from the one between posts, and two equal lines per
  card leave the reader guessing which one ends what. The cover and the title
  each gained air, and the `read →` tail grew to 13.5px with the underline moved
  to hover (on the word only — the arrow keeps its own small motion). Markup:
  meta items carry `p-cut` where a divider follows, and the tail's label sits in
  its own `<span class="tx">`.
- **Image dimming is keyed on `data-scheme` now**, not on "any palette that
  isn't `light`". Same behaviour on every shipped palette, but a new dark or
  light palette now inherits it by declaring its own lightness instead of by
  being remembered in a selector here — and the feed's cover band joins the
  same mechanic rather than growing a second one.
- **The article standfirst reads as body text.** The prose before `<!--more-->`
  is the article's opening, not a display deck: it loses the size step, the
  brighter colour and the hairline under it. Headings breathe a little tighter
  above (`h2` 52px → 42px), and the footer row aligns on the shared baseline
  instead of on box centres, so brand and tagline stop drifting apart.
- **Prose links are quiet now.** Inside the article column, links read in the
  body colour with a translucent accent underline instead of a full-accent
  fill; hover warms the word to the accent over a soft `--accent-dim` pill.
  In link-dense guides the old accent-filled links pulled the eye on every
  line and blurred the accent's structural roles (list markers, blockquote
  rule, callouts). The always-on underline also closes WCAG 1.4.1, which the
  hover-only border never did. Chrome links (cards, nav, TOC, series bridge)
  keep the accent fill.
- **A new brand mark.** The four-square block gave way to a conifer that is also a
  hierarchy — a crown over two tiers over a trunk, one level per content tier
  (rubric → series → guides). Only the crown takes the accent. The favicon and the
  fallback rubric glyph follow.
- **Renamed the primary accent token** `--accent-amber` → `--accent` (with its
  `-dim` / `-glow`; palette key `accent-amber` → `accent`). A site that references
  the old name in `custom.css` or a palette file must rename it. The secondary
  accents (`--accent-green` / `-copper` / `-blue` / `-gold`) are unchanged.
- **The demo is bilingual** (English at `/`, Russian at `/ru/`) and is deployed to
  GitHub Pages, which is what makes `demosite` in `theme.toml` a real URL.

### Removed

- **`layouts/_partials/date-ru.html`.** Its replacement is `date.html`, which takes
  month names from i18n. The old partial hardcoded Russian months, and its *name*
  was language-bound — one site physically could not render both `ru` and `en`
  dates. A site that overrode `date-ru.html` must move that override to `date.html`.
- **`params.search.enable`** from the example config. No template ever read it:
  search is always on and degrades to a hint when the index is missing.

### Fixed

- **The header's frost cancelled every blur inside it.** `backdrop-filter` on
  `.site-head` turns that box into a *backdrop root*, so the palette popover —
  a child of the header — filtered an empty backdrop: its own `blur(14px)` did
  nothing and the page showed through its 7% transparency perfectly sharp,
  headlines and all. The header's frost moved to `.site-head::before`, which
  leaves the header itself an ordinary box; as a bonus it is the arrangement
  Firefox needs to stop rasterizing the header buttons together with the blur.

- **The picker ticked the wrong palette on a first visit.** Nothing stamps
  `data-theme` on `<html>` until the reader picks one, and with no saved
  preference `curTheme()` fell back to a hardcoded `'amber'` — correct only for
  a site whose `defaultTheme` happened to be amber, and silently wrong for
  every other one. The default id now travels with the palette list
  (`data-default` on the `#dg-themes` script).

- **`partialCached` ignored the language.** The header was cached per section and
  the footer had no cache variant at all, so on a multilingual site `/howto/` and
  `/ru/howto/` collided on one key and both rendered whichever language built
  first — wrong menus, wrong strings, wrong feed link.
- **Search 404'd on any site served from a subpath.** `search.js` hardcoded
  `/pagefind/pagefind.js`; it now derives the path from `baseURL`. This broke every
  GitHub Pages *project* site, which is the most common way to host a Hugo demo.
- **Root-absolute links to generated files escaped the subpath.** A `/index.xml`
  or `/sitemap.xml` written in content was emitted verbatim, pointing at the domain
  root. `render-link.html` now rebases them through `relURL`.
- **The coming-soon card ignored `params.accent`.** It read the accent straight
  from the default palette's data file, bypassing the brand axis — the one page
  a pre-launch site actually shows was the one page the rebrand param missed.

## [0.0.1] — 2026-07-04

First cut: a topic-agnostic learning-platform theme (rubrics → series → guides),
packaged as the repository root with a self-documenting `exampleSite`. Beta — see
the status note in the [README](README.md#status): until the first stable tag,
anything here can be renamed without a deprecation path.

### Added

- **Content model.** Rubric sections (`params.rubricSections`), leaf-bundle
  guides, a `series` taxonomy with `series_weight` driving kickers, the left
  rail, and a reading-time-scaled series bridge — all server-rendered. A `tags`
  taxonomy with a cloud + filtered feed. Placeholder guides (`placeholder: true`)
  that count in structure but stay out of RSS and search.
- **Interactive widgets** as page-bundle `widgets.js`, loaded per page, with the
  `Taiga.widget` runtime (isolates failures, skips missing mounts).
- **Render hooks:** internal-link checking that fails the build (`linkcheck`),
  server-side Go syntax highlighting (Chroma → palette, `hl_lines`, `{label=…}`
  code captions), heading anchors, table wrappers.
- **Open Graph covers** generated at build (`images.Text`); cover styles as
  folders under `assets/og/` (ships `dots`); per-page override via `og.png` /
  `og_image` / `og_style`.
- **Full-text search** via Pagefind in a lazy ⌘K modal (no server, no Node).
- **Seven palettes as data files** (`data/themes/<id>.toml`) generating the
  `[data-theme]` CSS blocks and the picker; a site adds/overrides/disables by
  file. Inline pre-paint applies the saved theme with no FOUC.
- **Self-hosted fonts** (Inter + JetBrains Mono, Latin + Cyrillic woff2, subset,
  `font-display: swap`, preload) — no CDN.
- **RSS** (full-content, guides only), `sitemap.xml`, `robots.txt`, a `404`.
- **Multilingual-ready** from day one (`[languages.…]` shape, English UI strings
  shipped, suffix translations).
- **Customization without forking:** `custom.css` appended last, stable design
  tokens, empty `head-extra`/`foot-extra` hooks, `window.THEME_I18N`, site-over-
  theme partial overrides.
- **Authoring ergonomics:** a `guides` archetype (`hugo new … --kind guides`),
  a `roadmap` data file feeding both the roadmap page and the home WIP strip, a
  kitchen-sink demo page exercising every component.
- **Docs** (`docs/params.md`, `authoring.md`, `customizing.md`, `i18n.md`) and a
  fully commented `exampleSite`.

### Known limitations

- **One OG cover style** ships (`dots`); additional styles are added as folders.
- The `render-image` hook ships for completeness but is unused until content
  carries an image.
- Screenshots (`images/screenshot.png`, `images/tn.png`) are pending.
