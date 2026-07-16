---
# Standalone container: a tidiness folder so loose guides don't drown the
# series folders. Its children are ordinary standalone guides — a guide
# dropped directly into the rubric root works identically.
title: "Standalone"           # never rendered anywhere
params:
  standalone: true            # the marker the theme dispatches on
build:
  render: never               # no landing page
  list: local                 # visible to the rubric's templates, not globally
---
