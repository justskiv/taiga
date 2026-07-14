---
title: "About this demo"
description: "What this site is, what it's built from, and where to find the theme itself."
lead: "This is the theme's exampleSite: a demo and its own documentation at once. Every piece of content is a guide about the theme itself, and every mechanism it describes works right on the page that describes it."
---

## What this is {#what}

The demo site of a live theme, built for learning guides. Nothing here is invented: the How-to rubric is the theme's user manual, Inside is a teardown of its internals, Reference is a component testbed and a controls reference. Any gap between the text and the page's actual behavior counts as a bug.

## What it's built from {#stack}

Hugo (the regular binary, not extended) plus Pagefind for full-text search — two standalone tools, no Node. The full build:

```bash {label="demo build"}
hugo && pagefind --site public
```

The Playground section is an author's section of this site — the theme itself carries no trace of it: a live example of using the theme without forking it.

## Where the theme is {#links}

The paths below are exampleSite placeholders; on your own site, put in the real addresses:

- theme repository — `github.com/user/theme`;
- documentation — the theme's `docs/` directory: `authoring.md` (how to write guides), `customizing.md` (customizing without a fork), `i18n.md` (how to add a language), `params.md` (parameter registry);
- this demo's feed — [/index.xml](/index.xml), reader controls are covered in "[Hotkeys](/reference/hotkeys/)".
