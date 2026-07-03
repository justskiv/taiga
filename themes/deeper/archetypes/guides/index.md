---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
slug: "{{ .File.ContentBaseName }}"   # freeze the URL slug
date: {{ .Date }}
draft: true
description: "Одно предложение — для ленты, поиска и meta."
lead: "Лид-абзац статьи (как в моке, может быть длиннее description)."
series: []                # e.g. ["memory"] — put the part order in series_weight
series_weight: 1
related: []               # for non-series guides: 3–5 content paths for "ещё по теме"
tags: []
mins: 10                  # "~N мин" chip; hand-tuned, not .ReadingTime
go_version: "1.26"
---

Лид и текст гайда. Код-блоки — обычные fenced ```go … ``` (подсветка Chroma).
Живые иллюстрации — шорткодом `widget`, а их код — в соседнем `widgets.js`.
