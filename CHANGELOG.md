# Changelog

All notable changes to the **taiga** theme are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/): a removed/renamed template or param is
a MAJOR bump, a new optional feature is MINOR, a fix is PATCH.

## [Unreleased]

### Changed

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
