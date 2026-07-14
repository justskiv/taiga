---
title: "Hotkeys and panels"
slug: hotkeys
date: 2026-06-27
description: "Reference for reader controls: search and panel keys, focus mode, the View popover, and what's remembered locally."
lead: "All reader controls on one page: keys, panels, the View popover. None of this is required knowledge — the mouse does the same — but the keyboard is faster."
tags: [hotkeys, panels]
mins: 3
version: "v0.0.1"
related:
  - "howto/get-started"
---

## Keys {#keys}

| keys | action |
|---|---|
| <kbd class="kb">⌘K</kbd> or <kbd class="kb">/</kbd> | search guides |
| <kbd class="kb">[</kbd> or <kbd class="kb">⌘1</kbd> | show/hide the series panel (left) |
| <kbd class="kb">]</kbd> or <kbd class="kb">⌘2</kbd> | show/hide the table of contents (right) |
| <kbd class="kb">F</kbd> | focus mode: hide everything except the article text |
| <kbd class="kb">Esc</kbd> | close search or the popover |

Keys are bound to physical key codes, not characters — they work in any layout, including Russian. They don't fire inside input fields; focus mode only applies on article pages.

## Panels and minimaps {#panels}

A hidden panel doesn't disappear completely — it collapses into a minimap at the edge of the screen: dots and dashes mirror its content. Hovering expands the panel over the text, and you can pin it back from there. Read parts of a series get marks — so you can see where you've already been.

## The "View" popover {#view-popover}

The icon in the top-right corner opens the reading settings: palettes with swatches, toggling the side panels on and off, the list layout variant on rubric pages. The header has no separate setting: it always slides away on scroll down and comes back on scroll up.

## What gets remembered {#storage}

All settings live locally in the browser — no accounts, no network:

| setting | localStorage key |
|---|---|
| palette | `taiga.theme` |
| left/right panels | `taiga.railL`, `taiga.railR` |
| rubric list variant | `taiga.rubvar` |
| read guides | `taiga.visited` |

Clearing the browser's site data resets everything to defaults — that's the standard way to "reset settings."
