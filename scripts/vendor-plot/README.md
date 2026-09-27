# vendor-plot — rebuild of assets/vendor/plot/

A custom build of [Observable Plot](https://github.com/observablehq/plot) 0.6.17
for the theme's charts (`{{< chart >}}`) and for page-bundle widgets that draw
with Plot (front matter `plot: true`). An iife with the global `Plot`, only the
marks listed in `entry.js`, and d3's umbrella package replaced by `d3-shim.js`,
which leaves out d3-transition: its side effect would drag transition, brush,
zoom and drag into the build, and Plot uses none of them. About 82 KB gzip.

    cd scripts/vendor-plot
    npm ci
    ./build.sh              # writes ../../assets/vendor/plot/
    ./build.sh /tmp/plot    # or somewhere else, to compare first

The same lockfile gives a byte-identical `plot.js`; check `shasum -a 256`
against the committed file before replacing it.

**Adding a mark:** export it in `entry.js`, add its name to `BANNER` in
`build.sh`, rebuild. `LICENSE` (Plot) and `LICENSE-d3` (every other package that
contributes bytes, each licence verbatim) are regenerated from `node_modules`;
the notice also rides in the file's banner, because each visitor downloads a
copy.

**Upgrading Plot:** bump the exact version in `package.json`, `npm install`,
rebuild, and update the version in `BANNER`. The Obsidian plugin bundles the
same version with the same entry points — its drift check compares them.
