**English** · [Русский](ru/newsletter.md)

# Email subscription

**Off by default — and flipping the switch is the small half of the job.** The
theme draws the form and nothing else: it stores no address, sends no mail and
holds no credentials. Three things have to exist outside it first.

1. **A sending engine** — whatever owns the list, sends the double opt-in letter
   and handles unsubscribes: [listmonk](https://listmonk.app), Buttondown,
   Mailchimp, a script of your own over a mail API. Self-hosted, it also means a
   domain allowed to send mail: SPF, DKIM, DMARC, and a reputation to keep.
2. **An endpoint of your own** for the form to post to — a few lines on a
   Cloudflare Worker, a serverless function, a route in your backend. It exists
   because a static site cannot keep a secret, and the engine's API key is one.
3. **A bot check** in front of that endpoint —
   [Turnstile](https://developers.cloudflare.com/turnstile/), a rate limit, or
   both. An open subscribe endpoint is found and abused within days, and the
   bill for the letters it sends is yours.

That is infrastructure with a bill and an inbox attached, not theme
configuration. Until it exists, leave the switch alone: with `newsletter.enable`
false the theme adds **nothing** — no markup, no `nl-` rule in the CSS bundle,
no module in the JS bundle, no config script, no extra i18n keys. The smallest
config that makes anything appear at all is three lines:

```toml
[params.newsletter]
  enable = true
  endpoint = "/api/subscribe"   # your proxy — see "The two modes" below
```

What that buys is the interface: a bell button in the header with a popover,
blocks an author can place inside a guide, a CTA under a series' chapter list, a
link in the footer, and a bare form for a page written as prose. One form, one
state machine, one set of texts — and every one of the five places is an
independent switch.

The **subscribe page itself is yours**, not the theme's: it is an ordinary
content page (`content/subscribe.md` in the demo) that the header popover and
the footer link point at. Turning the feature off empties it of forms but does
not unpublish it — that is a `build.render = "never"` in its front matter, or a
deleted file.

## Turn it on

```toml
[params.newsletter]
  enable = true
  mode = "worker"                    # "worker" | "direct"
  endpoint = "/api/subscribe"        # where the form posts
  turnstileSiteKey = ""              # public site key; empty = no challenge
  contactEmail = ""                  # who a failing form offers to write to
  subscribePage = "/subscribe/"      # what the popover and the footer link to
  [params.newsletter.placements]
    header = true                    # bell button beside the feed icon
    footer = true                    # a link in the footer row
    articleEnd = false               # automatic block after the series bridge
    seriesLanding = false            # CTA under a series' chapter list
```

| Key | Type | Default | What it does |
|---|---|---|---|
| `newsletter.enable` | bool | `false` | Master switch. `false` ⇒ nothing renders anywhere, whatever the flags below say. |
| `newsletter.mode` | `"worker"` \| `"direct"` | `"worker"` | How the browser reaches your list. Any other value fails the build. |
| `newsletter.endpoint` | string | `"/api/subscribe"` | Where the form posts. Emitted **verbatim** — it is never resolved through `baseURL`, because in worker mode it is a route on your origin and in direct mode an absolute URL. |
| `newsletter.listUUID` | string | `""` | Direct mode only, and **required** there: the list's UUID. Missing ⇒ the build fails rather than ship a form that silently drops every address. |
| `newsletter.turnstileSiteKey` | string | `""` | Public [Turnstile](https://developers.cloudflare.com/turnstile/) site key. Empty ⇒ no challenge in the browser. The secret half belongs to your endpoint, never here. |
| `newsletter.contactEmail` | string | `fromAddress` | The address the error state offers to write to, as a `mailto:` link. Falls back to `newsletter.fromAddress`; empty on both ⇒ the line is not rendered, because an offer to write to nobody is worse than no offer. |
| `newsletter.subscribePage` | string | `"/subscribe/"` | The page the popover's footer link and the footer link point at. Resolved through `relLangURL`, so it follows a subpath and a language. |
| `newsletter.placements.header` | bool | `true` | The bell button + popover, fourth in the header's right-hand cluster. |
| `newsletter.placements.footer` | bool | `true` | A link in the footer row, between the site's own links and the feed. |
| `newsletter.placements.articleEnd` | bool | `false` | An automatic block at the foot of every guide, below the series bridge. Skipped on a page that writes its own `{{</* newsletter-cta */>}}`. |
| `newsletter.placements.seriesLanding` | bool | `false` | A CTA under the chapter list of every series landing. |

The two **chrome** placements default to on — turning the feature on and finding
no way to subscribe would be the surprising outcome. The two **content**
placements default to off: dropping a form into every guide is a decision about
someone else's writing, so it is opted into. The mid-text block has no flag at
all — it is a shortcode an author places by hand, one guide at a time.

## The two modes

**`worker`** — the form posts JSON to a proxy on your own origin:

```jsonc
{ "email": "reader@example.com", "list": "main", "website": "", "ts_token": "…" }
```

`website` is the honeypot (always empty for a human), `ts_token` the Turnstile
token when there is one. The proxy answers **202** for "accepted, confirmation
letter sent", **400** for a malformed address, anything else for a failure. It
is where the secrets live: the Turnstile secret, whatever credentials your list
needs, the rate limit. The page never learns your provider's name.

**`direct`** — the form posts straight at
[listmonk](https://listmonk.app)'s public subscription endpoint:

```jsonc
{ "email": "reader@example.com", "name": "", "list_uuids": ["<listUUID>"] }
```

A degradation path: local development, or a proxy that is down. There is no bot
check of ours in front of it, so it is not a resting configuration.

Either way the reader is told one of three things — accepted, "that looks like a
typo", or "that didn't work". The form never says whether an address is already
subscribed: with double opt-in that is the letter's job, and saying it on the
page would tell anyone who asks who is on the list.

## Turnstile, and why it may not run

The widget is **invisible** and executed at submit time. Its script is loaded
only where it can be used — worker mode, a site key set, and a page that
actually carries a form — and it is never waited on: if no token arrives within
**2 seconds**, the request goes without one and the endpoint decides. Readers
who block challenges are a large minority on a technical site, and none of them
should be unable to subscribe.

The honeypot works regardless: a real, named `website` field, hidden by a class
rather than an inline style (a share of bots skip anything inlined as hidden),
out of the tab order and out of the accessibility tree.

## Shortcodes

Five. **On a site with the feature off they fail the build**, one error per
occurrence, naming the shortcode and the page:

```
ERROR newsletter: {{</* newsletter */>}} on page "/guides/scheduler" rendered nothing,
because params.newsletter.enable is false. …
```

The alternative — render nothing and say nothing — is how a theme earns the
question *"I wrote the shortcode, nothing appeared, why?"*. It cannot be
answered from the page: the markup is right, the shortcode exists, and the
reason is a boolean in a config file the author may not even own.

The switch stays a switch, though. Pulling `enable` on a live site — the
endpoint is down, the engine is being replaced, a lawyer asked — must not turn
into editing every guide that carries a block first, so the error is
**suppressible by id**:

```toml
ignoreLogs = ['newsletter-disabled']
```

With that line the shortcodes go back to rendering nothing, quietly, and a guide
keeps its markup through a launch and a rollback alike. It is the deliberate
half of a deliberate act — one line in the same file where the switch was
pulled.

### newsletter — the mid-text block

```md
{{</* newsletter label="серия · продолжение" dismiss="sched-1" */>}}
This is part one of the series. Leave your address and I'll send the next one.
{{</* /newsletter */>}}
```

A quiet block set off by whitespace alone: a mono eyebrow, the offer in the
article's own voice, the form. With `dismiss=` it grows a collapse button.

The button is a 12px glyph in a 34px target — the theme's control square — sat
on the optical line of the block's first line rather than in its corner: the
block is frameless, so the first line is the only edge the eye can pair it
with. The block's first line gives up 40px so prose can never run under it (a
`max-width` on the eyebrow when there is one, a float in `.nl-txt::before` when
there is not); everything below keeps the full measure. It rests at `opacity:.4`
and comes up to full on hover or keyboard focus — visible enough to be found,
including on a touch screen, where there is no hover to reveal it and it rests
a shade stronger still. It is **last in the source**: a keyboard reaches the
field and the submit first, and "put this away" after them.

Collapsing does not delete the block — it folds into one muted line
("Subscription form collapsed — bring it back") sitting where the block was, and
the link unfolds it again. **Both states persist**, keyed per **block**
(`localStorage`, `nl.dismiss.<key>`): the same offer can appear in every part of
a series, stays folded once folded, and stays unfolded once brought back. The
stored value is unchanged from the version that deleted the block, so a reader
who dismissed one under the old behaviour now meets the ghost line instead of
nothing.

| Parameter | Meaning |
|---|---|
| `label=` | the mono eyebrow above the text. Optional. |
| `dismiss=` | localStorage key suffix; enables the collapse button and the ghost line it folds into |
| `note=` | the promise line under the form. **Optional, no default** — omit it and the block has no promise line. Unlike every other placement, this one never falls back to i18n: a mid-text block speaks in the article's voice, so the sentence is the author's or it is absent. |

### newsletter-cta — the end-of-article block

```md
{{</* newsletter-cta title="Next, by mail" note="No spam, one-click unsubscribe." */>}}
That was part one. Leave your address and I'll send the rest.
{{</* /newsletter-cta */>}}
```

The fuller card, the same one `placements.articleEnd` inserts automatically —
writing it by hand only replaces its texts and suppresses the automatic copy for
that page. Text priority: **shortcode params → the page's `newsletterCta` front
matter → i18n defaults**.

```yaml
newsletterCta:
  title: "Next, by mail"
  body: "The series goes on…"
  note: "Announcements only."
```

Put that in a series' `_index.md` and every part of it inherits the wording
through the section cascade; put it on a section and it also becomes the text of
the series-landing CTA.

### newsletter-inline — a bare form in prose

```md
{{</* newsletter-inline id="form" note="You'll get a confirmation letter." */>}}
```

No frame, no fill, no heading — for the subscribe page and the support page,
where every other offer on the page is a plain sentence too. `id="form"` is what
the header popover's footer link points at (`#form`), and the field is focused
on arrival.

### newsletter-archive, newsletter-letter-example — the subscribe page's optional blocks

**Visibility is presence.** Write the shortcode and the block is there; delete
it and it is gone. Neither one is gated by front matter any more — that split a
single decision across two files, and the usual result was a shortcode sitting
in the markdown for months rendering nothing while nobody could tell from the
text whether the page had the block at all. No "coming soon" placeholder ever
ships, because a block you are not ready for is a line you have not written yet.

```md
{{</* newsletter-archive url="https://news.example.com/archive/" */>}}

{{</* newsletter-letter-example subject="Queues: GRQ, LRQ and work stealing" */>}}
…the sample letter, in markdown…
{{</* /newsletter-letter-example */>}}
```

The archive row carries its `url=` on the shortcode, so the whole feature is one
line. Keep that line commented out in the markdown until the archive is open,
and uncomment it when it is.

The letter example is a mail-client window (title bar, Subject, From) around a
canvas, and on that canvas a 600px sheet — the shape a letter actually has in a
client. The **frame and canvas** are the theme's; the **letter** is your
markdown. Everything inside the sheet stays light in every palette on purpose:
the reader is being shown what lands in their inbox, and a dark sample would be
a lie about the product.

**"unsubscribe" in the letter and "unsubscribe in one click" on the form are
not a drift.** `nl_letter_unsub` in the sample's footer is a bare
"unsubscribe"; `nl_note_short` under the form still promises "no spam,
unsubscribe in one click". The wording differs on purpose: on a form it is a
promise made *before* signing up, answering the fear of not getting out later;
in the letter the reader is already subscribed and wants the door, not an
advert for how easy it is. Do not unify them — the sending template says
exactly the same thing.

**The sheet's typography is generated, not written.** The rules under
`.nl-letter-body` in `28-newsletter.css` are lifted verbatim from the sending
template's own `<style>` and rescoped, so the sample cannot drift from the
letter. Regenerate after touching the campaign template:

```sh
cd local/mocks/newsletter/listmonk/tools/render-sample && go run .
```

It writes `out/letter-content.css` (paste over the generated block) and
`out/letter-full.html` — the reference render to compare the page against. A
neutraliser block above the generated rules cancels the site's own prose styles,
which the email never has to fight; keep it to neutralisers only. Do not tune
the generated half by hand — that is how the sample came to draw links as a
hairline underline where the letter sends a solid one, and inline code as a grey
chip where the letter sends bare mono.

| Parameter | Meaning |
|---|---|
| `subject=` | the Subject line (required) |
| `from=` | sender's display name (default: `params.author`, then the site title) |
| `address=` | the From address (default: `params.newsletter.fromAddress`) |

## Texts

Every string is i18n (`i18n/*.toml`, prefix `nl_`) — see the block at the foot of
those files. The seven the browser needs (the form's messages) ride to JS through
`js-bridge.html` as `window.THEME_I18N.nlMsg*`, and only on a site that has the
feature on. `nl_msg_ok` carries a `{email}` placeholder, replaced with the
address the reader typed and set in bold.

Two results carry a second, quieter line under the status. `nl_msg_ok_hint`
points at the spam folder — the letter is sent again on every attempt, so an
invisible one is being filtered rather than lost. `nl_msg_fail_hint` offers the
way out of the one dead end a retry cannot clear (an address the list blocked
after a bounce is refused every time); its `{email}` is
`newsletter.contactEmail`, rendered as a plain `mailto:` link, and the whole
line is skipped where no address is configured.

Long copy — the subscribe page, the argument a particular guide makes for its
own block — is **content, not i18n**. It lives in the site's markdown, where its
author can edit it without touching a template.

## Accessibility

The popover is a disclosure, not a modal: `aria-expanded` + `aria-controls` on
the button, `hidden` on the panel, Escape closes it and returns the focus, a
click outside closes it, and the field takes focus when it opens. Every status
line is `role="status" aria-live="polite"`, so a result is announced without
stealing focus — and a result's second line is written into that same region in
the same breath, so it is one announcement rather than two; a rejected address
gets `aria-invalid`, cleared as soon as the reader types. On success the form is hidden rather than disabled — a dead input
you can still click reads as a bug — and a quiet "use another address" button
brings it back.

Every block inside an article carries `data-pagefind-ignore`: a subscription
form is chrome, and search must not answer with it.

There are **no modals and no scroll- or timer-triggered popups**. Every
placement is static. That is a product decision, not a missing feature.

## Once the reader has subscribed

A successful subscription writes one boolean to `localStorage`
(`nl.subscribed = '1'`) — **never the address**. On every later page every
placement folds down to one muted line instead of pitching again: the same form
under every article reads as a site that is not listening.

Two things are deliberately untouched. The **header bell** stays where it is —
it is navigation, and a control that comes and goes with state is worse than one
that is always in the same place. The **subscribe page** keeps its form: it is
the canonical way in, and someone may arrive there to add a second address.

Every line keeps a route back to a form, because the flag can be wrong — it only
records that a subscription happened *in this browser*, and it cannot hear about
an unsubscribe made from a letter. The popover carries that route itself
("subscribe another address"), since it is the one placement reachable from
anywhere. Where a block would otherwise be collapsed, **subscribed wins**: it
explains why the form is gone, and the ghost line's offer would be noise.

Clearing site data resets it. There is no server-side notion of "this reader" —
that is the point.

## Password managers & masked-email extensions

Bitwarden, 1Password, Firefox Relay and DuckDuckGo find the field by its
semantics — `type="email"` and `autocomplete="email"` — and put their own button
on it. **That is correct behaviour and the theme does not fight it.** A reader
who keeps a masked address per site is exactly the reader a privacy-minded blog
wants, and breaking their extension to protect the layout is the wrong trade.

The field gets along with them through two properties, both easy to undo by
accident:

- **Width.** The extension button sits on the field's right edge. A field wide
  enough has room for it; a cramped one does not. This is why the header
  popover's form stacks (`.nl-pop .nl-form`) instead of putting the field and
  the submit button on one row.
- **A real `label[for]` and a unique `id`.** Managers pair a field with its
  label to decide what a form is, and an `aria-label` gives them nothing to
  pair with — so the field carries a visually hidden `<label>` (`.nl-vh`) and
  no `aria-label`. A page can hold this form up to six times, so `form.html`
  takes a `place` slug and builds `id="nl-email-<place>"` from it; the two
  shortcodes mix in their `.Ordinal` because they can repeat. If you add a new
  placement, pass a `place` nobody else on the page uses.
- **No geometry animation above the field.** Bitwarden measures the field once
  and only repositions on scroll and resize, so a panel that slides into place
  after layout strands its button at the old coordinates. The popover fades
  (opacity only, via `@starting-style`) and never moves.
- **Symmetric horizontal padding.** Never add `padding-right` to `.nl-field` to
  "reserve a lane". Both families read the field's computed padding and anchor
  to its **content** box, so extra right padding pushes their button *left,
  into the text*, and Relay additionally scales its hover slab and click
  hit-zone to `2 × padding-right + 25`px. The exact formulas, and the measured
  numbers behind them, are in the comment above `.nl-field` in
  `assets/css/28-newsletter.css`.

If a site really wants Bitwarden's in-field button gone, add `data-bwignore` to
the input by overriding `layouts/_partials/newsletter/form.html`. **The theme
does not set it.** It removes the inline button only — filling by keyboard
shortcut or from the extension's popup still works — but it also removes the
affordance most readers use, so treat it as a deliberate opt-in, not a fix.

## Files

- `assets/css/28-newsletter.css` — every placement, both schemes, all palettes.
- `assets/js/modules/newsletter.js` — the state machine, the popover, dismissal.
- `layouts/_partials/newsletter/` — `cfg.html` (resolved config), `form.html`,
  `header-btn.html`, `cta.html`, `article-end.html`, `series-cta.html`,
  `letter-example.html`, `js-config.html`.
- `layouts/_shortcodes/newsletter*.html` — the five shortcodes;
  `layouts/_partials/newsletter/off.html` — what they say when the feature is off.
- `i18n/{en,ru}.toml` — the `nl_*` block.
