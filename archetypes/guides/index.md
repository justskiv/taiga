---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
slug: "{{ .File.ContentBaseName }}"   # freeze the URL slug
date: {{ .Date }}
# lastmod: 2026-01-01    # set it when you REVISE a published guide: it is what
                         # dateModified and the sitemap report, and a search
                         # engine has no other way to learn the guide changed.
draft: true
# announce: true         # keep draft:true AND add this to tease a still-unwritten
                         # part: its TITLE shows in the series (locked, non-clickable),
                         # its body never reaches the build. Drop both lines to publish.
# TODO is a SENTINEL, not filler: a guide still carrying it fails the build
# (params.seo.lint). Write one sentence, 70-160 characters — it is the feed
# card, the search result and the share card, in that order of who sees it.
description: "TODO one sentence — the feed, the search result and the card."
# Legacy: the opening paragraph for guides written before the <!--more-->
# divider. Writing the lead in the body instead? Delete this line.
lead: "TODO the article's lead paragraph (may run longer than the description)."
weight: 1                 # part order inside a series folder; omit for standalone
related: []               # for standalone guides: 3–5 content paths for "related"
tags: []
mins: 10                  # "~N min" chip; hand-tuned, not .ReadingTime
version: "go1.26"         # free-form "tested on" chip, e.g. "go1.26", "PostgreSQL 17"
---

The lead and the body of the guide. Code blocks are plain fenced ```go … ```
(Chroma highlights them). Live illustrations go through the `widget` shortcode,
with their code in `widgets/<id>/widget.js` next to this file.
