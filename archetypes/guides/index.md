---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
slug: "{{ .File.ContentBaseName }}"   # freeze the URL slug
date: {{ .Date }}
draft: true
description: "One sentence — for the feed, for search and for meta."
lead: "The article's lead paragraph (may run longer than the description)."
series: []                # e.g. ["memory"] — put the part order in series_weight
series_weight: 1
related: []               # for non-series guides: 3–5 content paths for "related"
tags: []
mins: 10                  # "~N min" chip; hand-tuned, not .ReadingTime
version: "go1.26"         # free-form "tested on" chip, e.g. "go1.26", "PostgreSQL 17"
---

The lead and the body of the guide. Code blocks are plain fenced ```go … ```
(Chroma highlights them). Live illustrations go through the `widget` shortcode,
with their code in a `widgets.js` next to this file.
