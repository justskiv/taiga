---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
slug: "{{ .File.ContentBaseName }}"   # freeze the URL slug
date: {{ .Date }}
draft: true
# announce: true         # keep draft:true AND add this to tease a still-unwritten
                         # part: its TITLE shows in the series (locked, non-clickable),
                         # its body never reaches the build. Drop both lines to publish.
description: "One sentence — for the feed, for search and for meta."
lead: "The article's lead paragraph (may run longer than the description)."
weight: 1                 # part order inside a series folder; omit for standalone
related: []               # for standalone guides: 3–5 content paths for "related"
tags: []
mins: 10                  # "~N min" chip; hand-tuned, not .ReadingTime
version: "go1.26"         # free-form "tested on" chip, e.g. "go1.26", "PostgreSQL 17"
---

The lead and the body of the guide. Code blocks are plain fenced ```go … ```
(Chroma highlights them). Live illustrations go through the `widget` shortcode,
with their code in a `widgets.js` next to this file.
