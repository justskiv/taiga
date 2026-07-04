# Customizing without forking

Everything below is done from **your own site** — a param, a data file, a CSS
file, a mirrored partial. You never edit the theme, so `git pull` / a module bump
keeps working. The order here is roughly cheapest-first.

## 1. Parameters

Behaviour and text are params (full list: [params.md](params.md)). Set them in
your `hugo.toml [params]`. Reach for a param before anything heavier.

## 2. custom.css — restyle anything

If your site has `assets/css/custom.css`, the theme appends it **last** in the
bundle, so your rules win the cascade without a fork:

```css
/* assets/css/custom.css */
:root { --content: 820px; }          /* wider article column */
.article h2 { letter-spacing: -0.01em; }
```

### Stable CSS variables (the public token API)

These names are stable — build on them rather than on internal selectors.

Structure (`assets/css/00-tokens.css`):

| Variable | Meaning |
|---|---|
| `--shell` | Max width of the page shell |
| `--content` | Article column width |
| `--rail` | Left/right rail width |
| `--font-sans` / `--font-mono` | Font stacks |
| `--radius-sm` | Corner radius |

Colours come from the **palette** (see below), so they change per theme:
`--bg-deep`, `--bg-base`, `--bg-surface`, `--bg-raised`, `--bg-hover`,
`--border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-ghost`,
`--text-strong`, `--gtok-str`, and the accents `--accent` (+ `-dim`,
`-glow`), `--accent-green` (+ `-dim`, `-glow`), `--accent-copper` (+ `-dim`),
`--accent-blue` (+ `-dim`), `--accent-gold` (+ `-dim`).

The primary `--accent` is special: a site can repaint it across every palette
with a single param — see [Recolour the accent](#recolour).

## 3. Palettes are data {#palettes-are-data}

Each palette is one file, `data/themes/<id>.toml` — service fields plus the
colour variables (keys = CSS variable names without the `--`):

```toml
name = "Мой цвет"
weight = 25
"bg-base" = "#101418"
"accent"  = "#7aa2f7"
# … the rest of the keys as in data/themes/amber.toml
```

Drop it into **your** `data/themes/` and it appears in the CSS **and** the theme
picker automatically — no theme edit. Because Hugo merges the theme's data with
yours (yours wins on a name clash), you can also **override** a shipped palette
(same filename, new values) or **disable** one (`disabled = true`).

### Recolour the accent {#recolour}

**One line, every palette.** The accent is a brand axis that cuts *across* the
palettes, so one param repaints it everywhere at once:

```toml
# hugo.toml
[params]
accent = "#7aa2f7"
```

Now all seven built-in palettes — and any you added — use that colour instead of
their native amber: links, buttons, active states, the picker's swatch dot, the
favicon square and the logo mark all follow it. `--accent-dim` and `--accent-glow`
are derived from it (`rgba(…, .18)` and `rgba(…, .28)`). Override either
explicitly if the derived alpha isn't what you want:

```toml
accent     = "#7aa2f7"
accentGlow = "rgba(122, 162, 247, .45)"   # a stronger halo
```

`accent` must be a 6-digit `#rrggbb`; any other value stops the build.

**What the handle does *not* reach:**

- **OG cover images** — the accent is baked into `base.png`. For a full rebrand,
  ship your own [cover style](#og-cover-styles) folder rather than expecting the
  param to repaint the artwork.
- **Secondary accents** (`--accent-green`, `--accent-copper`, `--accent-blue`,
  `--accent-gold`) and the code-string colour `--gtok-str` are palette variables,
  not part of the one accent axis. Change them in the palette files (below).

**Different accents per palette.** If you'd rather each palette keep (or set) its
*own* accent than share one colour, don't set `accent` — edit the palette files
instead. The accent is the `accent` key (plus `-dim` / `-glow`) in
`data/themes/<id>.toml`; ship your own palette or override a shipped one (above).
All seven built-ins currently share the same accent, so recolour each file, or
override just the one(s) you use.

## 4. Hook partials — inject head/foot content

The theme calls two empty partials you can fill from your site
(`layouts/_partials/hooks/`):

- `head-extra.html` — analytics, extra meta, fonts.
- `foot-extra.html` — end-of-body scripts.

Create the same path in your site's `layouts/_partials/hooks/` and it's picked up
— nothing to enable.

```html
<!-- layouts/_partials/hooks/head-extra.html -->
<script defer src="https://analytics.example/script.js"></script>
```

## 5. Override any partial

Hugo's lookup order is site-over-theme, so mirroring a partial's path in your
`layouts/` replaces it. The partials are small and named for exactly this —
`logo.html`, `footer.html`, `post.html` (feed card), `home/logos/<section>.html`,
and so on. Copy the theme's version, edit, done.

## 6. i18n — restring the UI

Every UI string is an i18n key. Put a partial `i18n/ru.toml` (or `en.toml`) in
your site with just the keys you want to change; Hugo merges it over the theme's.

```toml
# i18n/ru.toml
[read_more]
other = "дальше →"
```

Strings that live in JS (the popover, minimap hints) are overridden at runtime
via `window.THEME_I18N`:

```html
<!-- via a foot-extra hook -->
<script>window.THEME_I18N = { theme: "Тема", pin: "Закрепить" };</script>
```

## 7. OG cover styles {#og-cover-styles}

A cover **style is a folder** under `assets/og/`; the folder name is the id. Ship
your own without a fork by adding `assets/og/<mystyle>/` to your site:

```
assets/og/mystyle/
├── base.png       # 1200×630 backdrop (all the graphics)
└── layout.toml    # text block placement (see assets/og/dots/layout.toml)
```

Select it site-wide with `params.ogImages.style = "mystyle"`, or per page with
`og_style:`. You can also override a shipped style by mirroring its folder.
(`images.Text` can't letter-space and only right-aligns monospace — the shipped
`dots` style documents both in its `layout.toml`.)

## 8. An author section with no trace in the theme

The theme carries nothing topic-specific, yet a site can add a whole bespoke
section built only from stock mechanisms. The demo's "Песочница" is the worked
example:

- **the page** is `content/playground/index.md` — ordinary Markdown — with a big
  interactive as a `widget` plus `widgets.js`/`widgets.css` in the bundle;
- **the nav badge** is `[[menus.main]]` with `params.badge = "β"` — a generic
  menu feature, not a "playground feature";
- **section-only styles** live in that page's `widgets.css`, not the theme;
- in search and the sitemap it's just another page.

That's the template for any custom section: the theme stays clean, your site
stays as distinctive as you like.
