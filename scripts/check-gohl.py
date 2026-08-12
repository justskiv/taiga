#!/usr/bin/env python3
"""Check the editor's Go highlighter against Chroma.

Usage: check-gohl.py [content-dir ...] [--max-diff PERCENT] [--verbose]

The theme highlights listings twice. On the build it is Hugo's Chroma; inside
the live code editor (assets/js/modules/codeedit.js) it is our own lexer,
assets/js/modules/gohl.js, which has to reproduce Chroma's classes so a snippet
does not change colour the moment a reader starts typing in it. Nothing in the
normal build compares the two — Hugo never runs the JS, and the JS never sees
Chroma — so they can drift apart silently on any Hugo upgrade.

This harvests every ```go fence from the given content directories (default:
exampleSite/content), runs both highlighters over them, and compares the result
CHARACTER BY CHARACTER — not by class name but by the colour group 20-chroma.css
paints that class in, because `.mi` and `.m` are two names for one pixel.

Requires `hugo` and `node` on PATH; skips (exit 0) if either is missing.
"""
import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser

HERE = pathlib.Path(__file__).resolve().parent
THEME = HERE.parent
GOHL = THEME / "assets/js/modules/gohl.js"
FENCE = re.compile(r"```go[^\n]*\n(.*?)```", re.S)

# Colour groups exactly as 20-chroma.css paints them; anything unlisted is left
# at the body colour and counts as "plain".
GROUPS = {
    "kw": "k kd kn kp kr kc",
    "typ": "kt",
    "fn": "nf nb fm",
    "str": "s sa sb sc dl sd s2 se sh si sx sr s1 ss",
    "num": "m mb mf mh mi il mo",
    "com": "c ch cm cp cpf c1 cs",
}
GROUP_OF = {cls: name for name, spec in GROUPS.items() for cls in spec.split()}

HUGO_CONFIG = """baseURL="/"
title="gohl-check"
disableKinds=["taxonomy","term","RSS","sitemap","404"]
[markup.highlight]
noClasses=false
"""
HUGO_LAYOUT = """{{- range $i, $s := site.Data.snips -}}
<div class="snip">{{ transform.Highlight $s "go" }}</div>
{{ end -}}
"""
NODE_SCRIPT = """
import { highlightGo } from %(gohl)s;
import fs from 'node:fs';
const snips = JSON.parse(fs.readFileSync(%(snips)s, 'utf8'));
const un = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const out = snips.map((src) => {
  const res = [];
  const re = /<span class="([a-z0-9]+)">([\\s\\S]*?)<\\/span>|([^<]+)/g;
  const html = highlightGo(src);
  let m;
  while ((m = re.exec(html))) {
    if (m[3] !== undefined) res.push(['', un(m[3])]);
    else res.push([m[1], un(m[2])]);
  }
  return res;
});
fs.writeFileSync(%(dest)s, JSON.stringify(out));
"""


class ChromaParser(HTMLParser):
    """Collect [(class, text)] per .snip block from Chroma's output."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.snips = []
        self.cur = None
        self.stack = []

    def handle_starttag(self, tag, attrs):
        cls = (dict(attrs).get("class") or "").strip()
        if tag == "div" and cls == "snip":
            self.cur = []
            self.snips.append(self.cur)
        elif tag == "span":
            self.stack.append(cls)

    def handle_endtag(self, tag):
        if tag == "span" and self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.cur is None or not data:
            return
        cls = ""
        for c in reversed(self.stack):
            if c not in ("line", "cl", "w", "chroma", "highlight", ""):
                cls = c
                break
        self.cur.append((cls, data))


def harvest(dirs):
    snips = []
    for d in dirs:
        for md in sorted(pathlib.Path(d).rglob("*.md")):
            for m in FENCE.finditer(md.read_text(errors="ignore")):
                code = m.group(1).rstrip("\n")
                if code.strip():
                    snips.append(code)
    return snips


def run_chroma(snips, work):
    site = work / "site"
    (site / "data").mkdir(parents=True)
    (site / "layouts").mkdir(parents=True)
    (site / "hugo.toml").write_text(HUGO_CONFIG)
    (site / "layouts/index.html").write_text(HUGO_LAYOUT)
    (site / "data/snips.json").write_text(json.dumps(snips))
    subprocess.run(["hugo", "--quiet", "-d", "out"], cwd=site, check=True)
    parser = ChromaParser()
    parser.feed((site / "out/index.html").read_text())
    return parser.snips


def run_gohl(snips, work):
    snips_path, dest = work / "snips.json", work / "ours.json"
    snips_path.write_text(json.dumps(snips))
    script = work / "run.mjs"
    script.write_text(NODE_SCRIPT % {
        "gohl": json.dumps(str(GOHL)),
        "snips": json.dumps(str(snips_path)),
        "dest": json.dumps(str(dest)),
    })
    subprocess.run(["node", str(script)], check=True)
    return json.loads(dest.read_text())


def char_colours(tokens):
    """Flatten [(class, text)] to (per-character colour group, text)."""
    colours, text = [], []
    for cls, txt in tokens:
        group = GROUP_OF.get(cls, "plain")
        colours.extend([group] * len(txt))
        text.append(txt)
    return colours, "".join(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dirs", nargs="*", default=[str(THEME / "exampleSite/content")])
    ap.add_argument("--max-diff", type=float, default=0.05,
                    help="fail above this %% of differing characters (default 0.05)")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    for tool in ("hugo", "node"):
        if not shutil.which(tool):
            print(f"check-gohl: {tool} not found, skipping")
            return 0

    snips = harvest(args.dirs)
    if not snips:
        print("check-gohl: no ```go fences found in " + ", ".join(args.dirs))
        return 0

    with tempfile.TemporaryDirectory() as tmp:
        work = pathlib.Path(tmp)
        chroma = run_chroma(snips, work)
        ours = run_gohl(snips, work)

    total = differing = lossy = 0
    cases = {}
    for src, a_tokens, b_tokens in zip(snips, chroma, ours):
        a_colours, a_text = char_colours(a_tokens)
        if a_text.endswith("\n"):            # Chroma appends one
            a_text, a_colours = a_text[:-1], a_colours[:-1]
        b_colours, b_text = char_colours(b_tokens)
        if b_text != src or a_text != b_text:
            # The lexer must be lossless: codapi executes code.textContent.
            lossy += 1
            continue
        i = 0
        while i < len(a_colours):
            if a_colours[i] == b_colours[i]:
                i += 1
                continue
            j = i
            while j < len(a_colours) and a_colours[j] != b_colours[j]:
                j += 1
            key = f"{a_colours[i]} → {b_colours[i]}"
            case = cases.setdefault(key, {"chars": 0, "samples": []})
            case["chars"] += j - i
            if len(case["samples"]) < 5:
                case["samples"].append(a_text[i:j].replace("\n", "⏎"))
            differing += j - i
            i = j
        total += len(a_colours)

    pct = 100 * differing / total if total else 0
    print(f"check-gohl: {len(snips)} snippets, {total} chars, "
          f"{differing} differ in colour ({pct:.3f}%)")
    for key, case in sorted(cases.items(), key=lambda kv: -kv[1]["chars"]):
        print(f"  {key}  chars={case['chars']}  e.g. {' | '.join(case['samples'])}")

    if lossy:
        print(f"check-gohl: FAIL — {lossy} snippet(s) came back with different TEXT; "
              "the lexer must never alter the code it highlights")
        return 1
    if pct > args.max_diff:
        print(f"check-gohl: FAIL — colour drift {pct:.3f}% exceeds {args.max_diff}%")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
