---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
weight: 10                # order of series on the rubric page
# `description` is the meta tag and the share card — one line, 70-160 chars.
# `lead` (optional) is the paragraph the landing PRINTS; without it the landing
# prints the description.
description: "One line — the meta tag and the share card of the landing."
# lead: "The paragraph the landing shows, as long as the page can carry it."
params:
  tagline: ""             # extra kicker line, e.g. "the road to the GC"
  # label: ""             # short lowercase name for kickers; default = lower title
---

Optional series epigraph — renders on the series landing between the lead and
the parts list. Delete this body if the series needs none.
