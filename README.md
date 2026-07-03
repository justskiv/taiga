# deeper.go

The deeper.go site, built on the bundled `deeper` theme (`themes/deeper/`).

## Build

Search is a **two-step** build — Hugo renders the site, then Pagefind indexes
the rendered HTML:

```sh
hugo --gc --minify
pagefind --site public
```

The index lands in `public/pagefind/`. `hugo server` alone does **not** serve it;
until the second step runs, the ⌘K search modal shows a quiet "index not built
yet" hint instead of erroring.

### Pagefind

No Node required. Pin the version:

```sh
pip install 'pagefind[bin]==1.5.2'   # then: python3 -m pagefind --site public
```

or drop the standalone `pagefind` binary (same release tag) on the `PATH`. The
standard release covers Russian stemming; `extended` is only needed for CJK.

## Requirements

- Hugo ≥ 0.146 (developed against v0.154.x), extended not required.
- Pagefind 1.5.2 (search index).
