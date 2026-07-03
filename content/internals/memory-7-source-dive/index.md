---
title: "Source dive: жизнь одной аллокации в runtime"
slug: memory-7-source-dive
date: 2026-06-27
description: "Экскурсия по коду рантайма: от p := new(Point) до mmap — mallocgc, size classes, mcache→mcentral→mheap и место, где физически живёт карта указателей."
lead: "Экскурсия по коду рантайма: от p := new(Point) до mmap — mallocgc, size classes, mcache→mcentral→mheap и место, где физически живёт карта указателей."
series: ["memory"]
series_weight: 7
nav_title: "Source dive"
mins: 13
version: "go1.26"
tags: [runtime, malloc]
stub: true          # series part exists for structure; not a finished guide yet
draft: false
---

<!-- STUB (phase 02): only front matter is final — full prose ships in the
     memory-series content phases. Present now so memory-1's series rail, kicker
     («часть 1 из 7») and bridge resolve against all seven parts. -->

Полный разбор этой части серии появится в контентных фазах.
