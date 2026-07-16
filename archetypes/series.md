---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
weight: 10                # order of series on the rubric page
description: "One line for the series block on the rubric page and the landing."
params:
  tagline: ""             # extra kicker line, e.g. "the road to the GC"
  # label: ""             # short lowercase name for kickers; default = lower title
---

Optional series epigraph — renders on the series landing between the lead and
the parts list. Delete this body if the series needs none.
