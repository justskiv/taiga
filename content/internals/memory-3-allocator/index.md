---
title: "Аллокатор: как рантайм выдаёт память"
slug: memory-3-allocator
date: 2026-05-09
description: "Наивное «попросим у ОС» дорого: size classes, spans и три этажа mcache → mcentral → mheap — почему мелкая аллокация почти бесплатна."
lead: "Наивное «попросим у ОС» дорого: size classes, spans и три этажа mcache → mcentral → mheap — почему мелкая аллокация почти бесплатна."
series: ["memory"]
series_weight: 3
nav_title: "Аллокатор"
mins: 11
go_version: "1.26"
tags: [mcache, spans]
draft: false
---

<!-- STUB (phase 02): only front matter is final — full prose ships in the
     memory-series content phases. Present now so memory-1's series rail, kicker
     («часть 1 из 7») and bridge resolve against all seven parts. -->

Полный разбор этой части серии появится в контентных фазах.
