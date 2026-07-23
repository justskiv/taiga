**English** · [Русский](ru/link-previews.md)

# Link previews

On a fine pointer, a prose link grows a floating **preview card** on hover — the
term card's physics, one popover per page. Five genres, one family:

- **Internal** links (to a guide or a series) open a window into the target page:
  the article's header in miniature, its opening plus whole H2 sections up to a
  word budget, a "further in the article" list, and a "read the article" footer.
  A `#anchor` link scopes the card to one section; a link to a series landing
  shows a table of contents.
- **Telegram** links to a post from one of *your own* channels open a card
  scraped from t.me at build time — avatar, name, subscriber count, the post text
  (with photos, reply quotes, reactions and custom emoji), views and date.
- **YouTube** links open a video card — thumbnail (a link to the video), duration,
  channel, view count.
- **Wikipedia** links (`*.wikipedia.org/wiki/*`) open a summary card — the serif W
  mark, the article title, its short description and lead extract.
- **Go blog** links (`go.dev/blog/<slug>`, and legacy `blog.golang.org/<slug>`
  normalised to it) open a card with the italic *Go* mark, the post title, its
  byline (the date localised) and its opening.

Every outbound link also gets a small classifier mark: ↗ elsewhere on the web,
✈ your Telegram, ▶ your YouTube, W Wikipedia, *Go* the Go blog. Internal links
carry no mark. The
mark is suppressed in component chrome (a fold summary, a callout label, a CTA
card) so it never doubles up with a component's own icon — the hover card still
works there, only the little mark is muted.

The feature is **off** on touch (a tap must follow the link) and honours
`prefers-reduced-motion` (fade only, no shimmer).

## Hover physics

One shared rhythm with the term cards: a **250 ms** hover intent before a card
opens (`OPEN_DELAY` in `term.js` uses the same value — a passing cursor opens
nothing), a **120 ms** close grace that re-checks `:hover` before hiding, and a
~450 ms "warm" window after a close in which the next card opens almost at
once. The popover also wears an invisible **12 px halo** that bridges the gap
back to the anchor link and forgives near-miss cursor exits (term cards keep
the temporal grace only — their `overflow:hidden` clips any halo). Cards
reposition on scroll and resize, flip above the link when there is no room
below, and close on Escape.

## Turn it on

```toml
[params.linkPreviews]
  enable = true          # off by default
  budgetWords = 1400     # how much of an article a preview shows, by whole H2s

[params.telegram]
  channels = ["your_handle"]   # your OWN channels — their t.me posts earn a card
```

Internal previews are served as a **secondary output format** — a bare fragment
at `/<slug>/index.preview.html`. The theme declares the `preview` format and
enables it for `page` and `section`. **If your site sets its own `[outputs]`**,
Hugo overrides that map key by key (it does not append), so you must repeat
`preview` there:

```toml
[outputs]
  page    = ["html", "preview"]
  section = ["html", "preview"]   # for series-landing cards
  # home / taxonomy / term need no preview output
```

A t.me post from a channel **not** in `telegram.channels` gets only the ✈ mark,
no card. Any `youtube.com/watch` or `youtu.be` link gets a card.

## What is fetched at build time

Telegram and YouTube cards are built with `resources.GetRemote` while Hugo runs —
there is **no** runtime call to t.me or YouTube from the browser (t.me closes CORS
anyway). The build:

- scrapes `t.me/<ch>` (name, subscribers, description, avatar) and
  `t.me/<ch>/<id>?embed=1` (text, photo, views, date, reply, reactions, custom
  emoji), downloading every media file — t.me CDN URLs carry expiring tokens;
- reads YouTube's inline `videoDetails` from the watch page (no API key) and
  downloads the thumbnail (`maxresdefault`, falling back to `mqdefault`);
- fetches Wikipedia's official REST summary JSON
  (`<lang>.wikipedia.org/api/rest_v1/page/summary/<title>?redirect=true`) — the
  same endpoint Wikipedia's own hover previews use, so there are no regexes.
  **Wikimedia requires a descriptive `User-Agent`** or it answers `403`; the theme
  sends one built from your `baseURL`. Cyrillic titles are percent-encoded. The
  text is **CC BY-SA** — attribution is carried by the card itself, which links
  back to the article. A `disambiguation` or extract-less page renders no card (the
  link stays a plain external link with the W mark), and a long auto-generated
  `description` (common on ru.wikipedia) is dropped so it doesn't duplicate the
  extract.
- scrapes the **Go blog** post page: the title (first class-less `<h1>`), the
  `<p class="author">` byline (authors + date, the date localised to the page
  language), and the opening from the `<div class='markdown'>` container — the
  top-level blocks before the first `<h2>`, or, when the post opens straight with
  an `<h2>`, the blocks after it. No `<h1>` (or a failed fetch) → no card, the link
  stays external with the *Go* mark.

Fetches are `partialCached` by URL, so each post/video is fetched **once** per
build, and Hugo caches the responses on disk between builds.

### Degradations (the build never fails)

Every fetch is wrapped so a network error or a missing resource degrades instead
of breaking the build — **an offline build still completes**:

- a t.me post that cannot be parsed (removed, private, or a post published after
  the last build) → the **channel card** (avatar, name, subscribers, description);
- a channel that cannot be fetched → a minimal card that still names the channel;
- a YouTube page that yields no `videoDetails` → **no card**, the link stays a
  plain external link;
- a custom emoji whose artwork cannot be fetched → its Unicode glyph shows through.

Because the cards are baked at build time, a post's counters refresh on every
deploy, and the only gap — a post created after the last build — is covered by
the channel card.

## What a preview shows of an article

The preview fragment carries the *whole* article, sliced into sections. The JS
shows the intro and whole H2 sections until their combined text reaches
`budgetWords` (at least one section), then lists the remaining H2s under "further
in the article". Interactive parts are neutralised at build time so the preview
stays a quiet reading window:

- a `{{</* widget */>}}` figure → a placeholder card (⚙ + its caption);
- a codapi snippet → the code `<pre>` stays, followed by a quiet "runs in the
  article" badge;
- any stray `<script>` / `<style>` / `<iframe>` in the fragment → stripped.

Callouts, folds, tables and images are kept as they are.

## Scope

Only links in the article prose are previewed; the TOC, footnotes, the series
bridge and the rails are excluded. A link to the current page is not previewed.

## Files

- `assets/css/24-linkpreview.css` — the cards, both palettes, reduced-motion.
- `assets/js/modules/linkpreview.js` — the hover physics and the five providers.
- `layouts/_markup/render-link.html` — classifies links at build time.
- `layouts/page.preview.html`, `section.preview.html`, `baseof.preview.html` —
  the preview output fragments.
- `layouts/_partials/article/link-cards.html` and `article/lp/*.html` — the
  build-time t.me / YouTube scrape and the hidden card store.
