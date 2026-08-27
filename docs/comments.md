# Comments

A comment thread at the foot of every article, served by a self-hosted
[Comentario](https://comentario.app) instance. Off by default: the small half
of the job is the switch — the feature needs a server of your own, and a theme
cannot provide one.

The engine's bundle is **not loaded with the page**. Until a reader presses
"show comments" the block is a button and one small request that fills in the
number on it. No script, no stylesheet, no WebSocket.

## Switching it on

```toml
[params.comments]
  enable = true
  origin = "https://comments.example.com"
```

`origin` is your instance's base URL. A trailing slash is trimmed for you; the
URL must be `https`, except for a `localhost` instance during development.
Turning the feature on without an origin fails the build rather than shipping a
button with nothing behind it.

In the instance's admin UI, register a domain whose **host** is your site's
host (`example.com`, no scheme, no `www` unless that is where the site lives).
A domain's host cannot be changed after it is created.

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
<section class="cmnt" aria-label="Комментарии" data-pagefind-ignore>
  <button class="cmnt-open">…</button>
  <p class="cmnt-status" role="status" aria-live="polite"></p>
  <div class="cmnt-body" hidden>
    <comentario-comments no-fonts="true" theme="dark" page-id="/gmp-design/">
  </div>
</section>
```

Only articles get it — the same `$isArticle` gate as the rest of the article
machinery (`rubricSections` + `extraGuideSections`).

### The attributes, and why each is there

| | |
|---|---|
| `no-fonts` | without it the engine pulls Source Sans Pro from its own origin and argues with the page's typeface |
| `theme` | `light`/`dark`, printed from the palette the server chose and kept in step afterwards by `modules/comments.js` |
| `page-id` | the thread's identity, stated from `.RelPermalink` rather than left to `location.pathname` — so a reader arriving without the trailing slash lands in the same thread |

`lang` is deliberately **absent**: the engine reads `<html lang>` and ships all
fourteen translations inside its binary.

**`theme` is the only attribute that may change at run time.** `lang` and
`css-override` reinitialise the widget, and reinitialising throws away a comment
the reader is halfway through writing.

## Behaviour

`assets/js/modules/comments.js`, self-guarding on `.cmnt`.

- **The count.** One `POST /api/embed/comments/counts`, fired when the block
  scrolls into view rather than on load, so a reader who leaves from the first
  screen costs the instance nothing. The request is batch-shaped (`paths[]`, up
  to 32) even though it asks about one page. A path with no page behind it yet
  is *absent* from the answer rather than zero.
- **The bundle** is injected on click, from the instance, once — one promise
  guards against a second click. Never proxy it, never vendor it, never add a
  `?v=`: the file is served with its own origin baked in, so a copy goes stale
  silently.
- **Ready state.** The widget announces nothing when it finishes — no event, no
  global. The one observable thing is `.comentario-main-area` filling up, which
  is what the module watches.
- **Deep links.** `#comentario-<uuid>` points at one comment, `#comentario` at
  the block; either opens it without a click. The engine scrolls and highlights
  by itself, so the module adds no scrolling. It never listens for `hashchange`.
- **Errors** put a message and a retry beside the button, and give the button
  back.

## The form, and where the door is

Anonymous commenting is expected to be off, so signing in is the price of
writing. Two decisions follow.

**The engine's profile bar is hidden while signed out.** Signed out it holds
exactly one thing — a "sign in" button — and has no work to do: it is a
fragment of a state machine (avatar / name / settings / sign-out) leaking into
the state where it has a single element, hanging above the editor attached to
nothing. It is *hidden*, never removed: the engine keeps a reference to that
button and Popper anchors the login dialog on it. Which state we are in is read
with `:has()`, so this costs no JavaScript.

**The door moves onto the submit button of every editor.** For a signed-out
reader it reads "Sign in and submit", with a hint under the editor naming the
providers. That is not a promise the theme invented: the engine's
`submitNewComment` calls `loginUser()` and then posts the comment with the same
call, and the editor keeps its draft in `localStorage` across the whole OAuth
round trip. The label is a description of what happens.

The point is *when* the cost is stated: at the moment the editor opens, before
a single keystroke — and in every editor, including the one that opens under a
comment three screens down, where the profile bar was never present. That is
where "I want to reply" actually begins.

Signed in, the bar earns its place: it answers "who am I here, and how do I
leave", and its presence is itself the signal that you are in.

## Buttons

Three roles, one movement. Every button presses down 1px — that shared gesture
is what makes three differently coloured controls read as one set.

| role | recipe | from |
|---|---|---|
| main (submit) | accent wash, accent ink | `.nl-go`, 28-newsletter.css |
| secondary (preview) | surface, border, muted ink; ON state differs by colour | `.w-btn`, 09-widgets.css |
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

The engine hangs it off the login button with Popper — a 500px panel centred on
a 60px button, kept inside the *viewport* rather than the column, so it swung
out over the rail. It is a modal now: fixed, centred, its backdrop over the
whole page. (The engine's own backdrop could not work in any case:
`rgba(var(--cmntr-bg),60%)` expects three comma-separated channels in a
variable no theme puts there.)

The frame follows the search modal — the site's only other modal: body on
`--bg-base`, sections parted by a hairline instead of a filled header strip,
and the title dropped to the mono eyebrow, so the weight sits on the buttons
rather than on the chrome.

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

`assets/css/29-comments.css`, in two halves.

**Ours** — the button, borrowed wholesale from `.sbr-next`, so the foot of an
article reads as a stack of equal cards.

**Theirs** — the widget renders into the page's light DOM (no iframe, no shadow
root), so palette tokens reach it by cascade. The sheet translates the engine's
~41 `--cmntr-*` variables onto the theme's tokens, anchored on
`:root[data-theme] comentario-comments`. That selector is (0,2,1) and the engine
declares its variables at (0,1,1) at most, so ours win in both schemes without
`!important`.

Four things the variables cannot reach, each handled by its own rule:

- **the primary button** redeclares the `--cmntr-btn-*` group *on itself*;
- **badges** are hard-coded `#51cf66` / `#fab005`;
- **avatars and thread rules** ship sixty hard-coded colours
  (`.comentario-bg-0…59`, all `!important`) — folded into the palette here;
- **the closed editor** is a 130px frame with a hard-coded `#e9ecef` border.

The engine's own footer line is hidden. Comentario is MIT (Copyright 2023
Dmitry Kann, Copyright 2018 Commento, Inc.); the licence asks for its notice to
travel with **copies** of the software, and a site running this feature
distributes none — the bundle is served by the instance itself. The attribution
lives in the stylesheet's header comment and here.

## Strings

`cmnt_aria`, `cmnt_open` in `i18n/*.toml`; `js_cmnt_loading`, `js_cmnt_error`,
`js_cmnt_retry` reach the bundle through `js-bridge.html` as
`window.THEME_I18N.cmnt*` (see `docs/i18n.md`).

## Off means off

With `enable = false` the theme renders no markup, `head/css.html` leaves
`29-comments.css` out of the bundle, and `scripts.html` hands esbuild a define
that tree-shakes `modules/comments.js` away. A build with the feature off
carries not one line of it — verify with a scratch build:

```sh
scratch=$(mktemp -d)
HUGO_PARAMS_COMMENTS_ENABLE=false hugo -D --quiet -d "$scratch"
grep -r 'cmnt-\|comentario' "$scratch" --include='*.css' --include='*.js'   # silent
```
