#!/bin/sh
# Rebuilds the theme's assets/vendor/plot/ (plot.js, LICENSE, LICENSE-d3) from
# the pinned packages here: `npm ci && ./build.sh`. The output is meant to be
# byte-identical for the same lockfile — compare sha256 before committing.
# An optional argument writes somewhere else (a scratch dir, for that compare).
set -eu
cd "$(dirname "$0")"
OUT=${1:-../../assets/vendor/plot}
BANNER='/*! Observable Plot 0.6.17 (custom build: plot, dot, link, arrow, text, rect, ruleX, ruleY, gridY) | ISC License | Copyright 2020-2025 Observable, Inc. | https://github.com/observablehq/plot
 *  bundles d3 7.9.0 modules (array, axis, color, format, geo, interpolate, path, scale, scale-chromatic, selection, shape, time, time-format), internmap, isoformat | ISC License | Copyright 2010-2026 Mike Bostock | https://github.com/d3/d3
 *  d3-geo: parts derived from GeographicLib | MIT License | Copyright 2008-2012 Charles Karney
 *  d3-scale-chromatic: ColorBrewer schemes | Apache License 2.0 | Copyright 2002 Cynthia Brewer, Mark Harrower, and The Pennsylvania State University
 *  full license texts: LICENSE, LICENSE-d3 beside the source of this file */'
npx esbuild entry.js --bundle --format=iife --global-name=Plot --minify \
  --target=es2018 --legal-comments=none --alias:d3=./d3-shim.js \
  --banner:js="$BANNER" --metafile=meta.json --outfile="$OUT/plot.js"
cp node_modules/@observablehq/plot/LICENSE "$OUT/LICENSE"
# every third-party package that contributes bytes to the output, with its
# license verbatim
node -e '
const fs = require("fs");
const o = Object.values(require("./meta.json").outputs)[0];
const pk = new Set();
for (const [f, i] of Object.entries(o.inputs)) {
  if (!i.bytesInOutput || !f.includes("node_modules/")) continue;
  const k = f.replace(/^.*node_modules\//, "").split("/");
  const n = k[0].startsWith("@") ? k[0] + "/" + k[1] : k[0];
  if (n !== "@observablehq/plot") pk.add(n);
}
const names = [...pk].sort();
let s = "Third-party code bundled into plot.js next to Observable Plot.\n" +
  "Each package is reproduced with its license verbatim.\n";
for (const n of names) {
  const v = require("./node_modules/" + n + "/package.json").version;
  s += "\n" + "=".repeat(72) + "\n" + n + " " + v + "\n" + "=".repeat(72) + "\n\n" +
    fs.readFileSync("node_modules/" + n + "/LICENSE", "utf8").trim() + "\n";
}
fs.writeFileSync(process.argv[1] + "/LICENSE-d3", s);
console.log(names.join(" "));
' "$OUT"
