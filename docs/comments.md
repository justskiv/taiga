# Comments

A comment thread at the foot of every article, served by a self-hosted
[Comentario](https://comentario.app) instance. Off by default: the small half
of the job is the switch — the feature needs a server of your own, and a theme
cannot provide one.

The thread is **open**. Comments are part of the guide, and hiding them behind
a press buys nothing. What is withheld is the engine's bundle — 95 KB of script
and 51 KB of stylesheet, with fonts of its own — and it is withheld until the
reader gets near. A guide that is read and left costs the instance **nothing at
all**: not a script, not a stylesheet, not a socket, not one request.

## Switching it on

```toml
[params.comments]
  enable = true
  origin = "https://comments.example.com"
```

`origin` is your instance's base URL. A trailing slash is trimmed for you; the
URL must be `https`, except for a `localhost` instance during development.
Turning the feature on without an origin fails the build rather than shipping a
thread with nothing behind it.

In the instance's admin UI, register a domain whose **host** is your site's
host (`example.com`, no scheme, no `www` unless that is where the site lives).
A domain's host cannot be changed after it is created — a site served from
`localhost:1313` during development needs its own domain registered under that
host, or the widget answers "this domain is not registered".

Opt a single article out with front matter:

```yaml
comments: false
```

## What it renders

`layouts/_partials/comments/block.html`, last of all inside an article's
`<main>` — below the series bridge, the newsletter card and the author's own
closing note. Everything above is the article finishing itself; this is the one
block that can grow to several screens.

```html
<section id="comments" class="cmnt" aria-labelledby="cmnt-h" data-pagefind-ignore>
  <div class="cmnt-head">
    <h2 id="cmnt-h">Discussion</h2>
    <span class="cmnt-n"></span>
  </div>
  <p class="cmnt-status" role="status" aria-live="polite"></p>
  <comentario-comments no-fonts="true" theme="dark" page-id="/gmp-design/">
</section>
```

Only articles get it — the same `$isArticle` gate as the rest of the article
machinery (`rubricSections` + `extraGuideSections`).

**`id="comments"` is load-bearing, not decoration.** The whole stylesheet hangs
off it (see [Styling](#styling)). Rename it and the widget silently loses every
rule.

The header is rendered here rather than injected by the module, so it is on the
page in the first paint, before any of the engine exists. The count beside it
stays empty until the widget reports one: from outside, an empty thread and an
unloaded one look identical, and "no comments yet" is a claim rather than a
placeholder.

### The attributes, and why each is there

| | |
|---|---|
| `no-fonts` | without it the engine pulls Source Sans Pro from its own origin and argues with the page's typeface |
| `theme` | `light`/`dark`, printed from the palette the server chose and kept in step afterwards by `modules/comments.js` |
| `page-id` | the thread's identity, stated from `.RelPermalink` rather than left to `location.pathname` — so a reader arriving without the trailing slash lands in the same thread |

`auto-init` is absent on purpose: the element upgrades and starts itself the
moment the injected bundle lands, so a second switch would only be one more
thing to keep in step. `lang` is absent too — the engine reads `<html lang>`
and ships all fourteen translations inside its binary.

**`theme` is the only attribute that may change at run time.** `lang` and
`css-override` reinitialise the widget, and reinitialising throws away a comment
the reader is halfway through writing.

## Behaviour

`assets/js/modules/comments.js`, self-guarding on `#comments`.

- **Loading.** The bundle is fetched once the block comes within 900 px of the
  viewport, measured with a plain distance check on scroll and resize. Not
  `IntersectionObserver`: an observer in a tab that has never been painted can
  stay silent until the tab is focused, and a thread that exists only in a
  focused tab is a trap for the reader who opened five guides in background
  tabs. The bundle comes from the instance, once — never proxied, never
  vendored, never given a `?v=`: the file is served with its own origin baked
  in, so a copy goes stale silently and a cache-buster only defeats the cache
  the instance manages itself.
- **No count request.** An earlier version asked the instance for the number on
  the way in, to fill a button before the bundle landed. With the thread open
  the bundle arrives before the block does and brings a count of its own, so
  the request was dropped. The header takes its figure from the engine's own
  counter, which is the only number that knows about a comment posted a moment
  ago.
- **Ready state.** The widget announces nothing when it finishes — no event, no
  global, no promise. Everything the module rewrites is re-applied by a
  `MutationObserver` on the widget, detached while it works so its own writes
  cannot feed it back into itself.
- **Deep links.** `#comentario-<uuid>` points at one comment, `#comentario` at
  the block; either loads the bundle at once rather than waiting for a scroll
  that has already happened. The engine scrolls and highlights by itself, so
  the module adds no scrolling. It never listens for `hashchange`.
- **Errors.** The one failure the engine cannot report is its own bundle never
  arriving. That puts a message and a retry in `.cmnt-status`; everything else
  the engine explains for itself.

## The thread

**Sorting** is four orders behind three buttons: the score button is a radio
that becomes a direction toggle once chosen, and the only sign of its second
state was an 8px caret flipping over. The behaviour stays; what changes is that
the state says its own name — "Best" ⇄ "Worst" — and the two time buttons are
renamed to match, because "Score · Oldest · Newest" mixes a criterion with two
values where three values of one thing are wanted. The group is marked with a
glyph rather than the word "order": a fourth piece of mono caps that is not
even an option reads as one.

The labels are written with `textContent`, never a `::before`, so the
accessible name changes with the visible one — a CSS text swap leaves voice
control saying something else (WCAG 2.5.3). The score button is found by the
icon the engine gives only to it, never by position: on a domain with voting
off it is absent entirely.

**Reply** is the one action the thread exists for, so it is the one that gets a
word instead of a glyph. The votes stay arrows.

**The moderator badge reads "Author".** It means "this account owns the
domain", which on a blog with one author is the author; "Moderator" promises a
role nobody plays.

**Collapsing is half-implemented in the engine** — it fades the replies to
`opacity:0` and leaves them holding half a screen of space. The stylesheet
folds them for real, and the module puts the way back where the hole was: "2
replies — show".

**A comment that has just arrived** gets a wash of accent for a few seconds.
The engine animates a background colour and nothing else, so with no padding it
stops flush against the first letter and reads as a slab under the text. Here
it gets padding and an equal negative margin — the fill spreads outward while
the content box stays exactly where it was, which matters because the class is
added and removed around the animation.

## The form, and where the door is

Anonymous commenting is expected to be off, so signing in is the price of
writing. Two decisions follow.

**The engine's profile bar is hidden while signed out.** Signed out it holds
exactly one thing — a "sign in" button — and has no work to do: it is a
fragment of a state machine (avatar / name / settings / sign-out) leaking into
the state where it has a single element, hanging above the editor attached to
nothing. It is *hidden*, never removed: the engine keeps a reference to that
button and Popper anchors dialogs on it. Which state we are in is read with
`:has()`, so this costs no JavaScript.

**The door moves onto the submit button of every editor.** For a signed-out
reader it reads "Sign in and submit". That is not a promise the theme invented:
the engine's `submitNewComment` calls `loginUser()` and then posts the comment
with the same call, and the editor keeps its draft in `localStorage` across the
whole OAuth round trip. The label is a description of what happens.

The point is *when* the cost is stated: at the moment the editor opens, before
a single keystroke — and in every editor, including the one that opens under a
comment three screens down, where the profile bar was never present. That is
where "I want to reply" actually begins. There is no hint line beside the
button: the label already says what the press costs, and naming the providers
here would repeat what the dialog shows a moment later.

Signed in, the bar earns its place: it answers "who am I here, and how do I
leave", and its presence is itself the signal that you are in.

**Three rings come off the editor**, all three drawn by the engine and none of
them earned. A `required` textarea gains `.comentario-touched` at first focus,
so an empty box someone has just clicked into paints itself `#f03e3e` and keeps
it after blur — an error reported before anything can be wrong. `:focus` adds
an indigo border and, separately, a `0.25rem` indigo `box-shadow`; the shadow
survives `border:0`, and clipped by the panel's overflow it shows up as a
bright line under the toolbar, which reads as a rendering fault. What is left
to mark focus is the caret, which is what marks focus in a text field
everywhere else. The submit button already refuses an empty comment, at the
moment someone actually asks.

## Buttons

Three roles, one movement. Every button presses down 1px — that shared gesture
is what makes three differently coloured controls read as one set.

| role | recipe | from |
|---|---|---|
| main (submit) | accent wash, accent ink | `.nl-go`, 28-newsletter.css |
| secondary (preview) | surface, border, muted ink | `.w-btn`, 09-widgets.css |
| quiet (cancel, sort, votes) | bare text, accent on hover | the theme's link idiom |

The main button is a *wash*, not a fill: the theme has no solid-filled buttons
except the home CTA, and a solid accent block under every article would be a
second exception.

Four engine defects are undone in the same place, none of them visible until
measured: a bootstrap `box-shadow` hung on five classes (which a plain host
anchor loses to), `:focus` painted the same as `:hover` (so a button stayed lit
after a mouse click), a `.4s` transition against the site's `--dur`, and
`disabled` at `opacity:.3` — unreadable on the one button that carries the
price of entry in its label.

## The sign-in dialog

With anonymous commenting off this is the main entrance to the discussion, so
it gets designed rather than inherited.

The engine hangs every dialog off the login button with Popper (`ref:
this._btnLogin`), whatever was actually pressed — and this design has no such
button, so the anchor is a zero-sized node and the panel lands in the top-left
corner. Two ways out: keep a button nobody needs purely to be an anchor, or
take the placement. Taken: fixed, centred, its backdrop over the whole page,
which is the plainer thing for "GitHub or Google" in any case. The `!important`
is aimed at Popper's inline transform and nothing else; if the engine ever
changes strategy, its own placement comes back.

The frame follows the search modal — the site's only other modal: body on
`--bg-surface`, sections parted by a hairline instead of a filled header strip,
and the title dropped to the mono eyebrow, so the weight sits on the buttons
rather than on the chrome.

**The explanatory line.** The engine titles the dialog "Sign in" and heads the
provider list with "Sign in with", saying the same thing twice while never
saying why a dialog appeared at all — the reader landed here by pressing reply
or a vote arrow. That sentence takes its place. It is found by the buttons:
the engine builds the block as `div.dialog-centered( "Sign in with",
div.oauth-buttons( … ) )`, so the line to replace is the one *carrying* them —
not the first one on the page, and not one matched against the engine's own
wording in one of fourteen languages. An instance renders a second `.dialog-centered` for
its sign-up row whenever `localSignupEnabled` is set — a flag of its own, which
the engine honours even with password login switched off — and rewriting every
one of them prints our sentence twice.

**Provider buttons.** v3.18.0 ships no logos — it draws text on brand fill
(`#000` GitHub, `#4285f4` Google). A black button all but vanishes on a very
dark palette, and the blue is the only blue on the page. So the brand moves out
of the fill and into the logo, and both become the same control as everything
else. GitHub's mark is licensed for single-colour use and is painted with a
mask from `--text-strong`; Google's "G" may not be recoloured or masked at all,
so it is an image on a white chip, and the word "Google" is left exactly as the
server sends it.

Focus moves to the first provider button when the dialog opens — the engine
focuses the *close* button, which is both the wrong target and where the
browser's blue ring came from.

## Styling

`assets/css/29-comments.css`. Everything in it is prefixed with `#comments`,
the section's own id — which puts every rule at (1,x,y) and out of the fight
for good. The engine's rules run to (0,5,0) and reach for `!important` on
avatar and thread-line colours; an id beats all of it without a specificity
war. The `!important` here is aimed at exactly two things: the engine's own,
and Popper's inline transform.

The widget renders into the page's light DOM — no iframe, no shadow root — so
palette tokens reach it by cascade. The sheet translates the engine's ~41
`--cmntr-*` variables onto the theme's tokens in a single block, and everything
the engine draws, including dialogs a reader meets rarely (settings, delete
confirmation, RSS), follows the palette for free, in all twelve, with not one
media query for colour.

What the variables cannot reach, each with its own rule:

- **the primary button** redeclares the `--cmntr-btn-*` group *on itself*;
- **badges** are hard-coded `#51cf66` / `#fab005`;
- **avatars and thread rules** ship sixty hard-coded colours
  (`.comentario-bg-0…59`, all `!important`) — folded into the palette here;
- **the closed editor** is a 130px frame with a hard-coded `#e9ecef` border;
- **the comment header** stacks a name over a timestamp in a column and gives
  the column `flex:1 1` — basis zero, so the timestamp is handed less width
  than its own text and breaks mid-phrase. Turned into a row with
  `flex-basis:auto`, and the timestamp is `nowrap`: a relative time is one
  phrase, and «1 минуту / назад» across two lines reads as two facts.

The engine's own footer line is hidden. Comentario is MIT (Copyright 2023
Dmitry Kann, Copyright 2018 Commento, Inc.); the licence asks for its notice to
travel with **copies** of the software, and a site running this feature
distributes none — the bundle is served by the instance itself. The attribution
lives in the stylesheet's header comment and here.

## Strings

`cmnt_head` is rendered straight into the markup by Hugo. The `js_cmnt_*` keys
reach the bundle through `js-bridge.html` as `window.THEME_I18N.cmnt*` (see
`docs/i18n.md`), and only on a site with the feature on.

`js_cmnt_word` and `js_cmnt_reply_word` are plural **probes**, not words: Hugo
owns the CLDR catalogue and renders one word per probe count, then
`modules/i18n.js` asks `Intl.PluralRules` which probe shares a category with
the real number. The engine carries a single form per language — Russian gets
«комментариев», so it writes «1 комментариев» — and English is no better past
one.

## Off means off

With `enable = false` the theme renders no markup, `head/css.html` leaves
`29-comments.css` out of the bundle, `scripts.html` hands esbuild a define that
tree-shakes `modules/comments.js` away, and `js-bridge.html` omits the strings.
A build with the feature off carries not one line of it — verify with a scratch
build:

```sh
scratch=$(mktemp -d)
HUGO_PARAMS_COMMENTS_ENABLE=false hugo -D --quiet -d "$scratch"
grep -r 'cmnt\|comentario' "$scratch"   # silent
```
