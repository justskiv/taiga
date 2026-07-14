#!/usr/bin/env python3
"""Check relative links in the repo's Markdown (README, docs/).

Usage: check-docs.py [root]

Verifies that every relative Markdown link and image target exists on disk, and
that a #fragment points at a real heading in the target file. Absolute URLs,
mailto: and anchors into generated sites are skipped.

This exists because a broken link in the README is the first thing a visitor
meets, and nothing else in the build checks it: `hugo` only ever sees
exampleSite/, never these files.
"""
import os
import re
import sys

LINK = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
ATX = re.compile(r"^#{1,6}\s+(.*?)\s*$", re.M)
EXPLICIT_ANCHOR = re.compile(r"\{#([\w-]+)\}")
FENCE = re.compile(r"^(```|~~~).*?^\1", re.M | re.S)
INLINE_CODE = re.compile(r"`[^`\n]*`")


def strip_code(src):
    """Drop fenced blocks and inline code before scanning for links.

    The docs teach link syntax by showing it, so a fenced example like
    `[the bundle guide](/inside/guide-is-a-bundle)` is a specimen, not a link —
    and it is a site path, which would never resolve on disk anyway.
    """
    src = FENCE.sub("", src)
    return INLINE_CODE.sub("", src)


def slug(text):
    """GitHub's heading slug: lowercase, drop punctuation, spaces to dashes."""
    text = EXPLICIT_ANCHOR.sub("", text)
    text = re.sub(r"`|\*|_", "", text).strip().lower()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    return re.sub(r"\s+", "-", text)


def anchors(path):
    try:
        src = open(path, encoding="utf-8").read()
    except OSError:
        return set()
    out = set()
    for m in ATX.finditer(src):
        out.add(slug(m.group(1)))
    for m in EXPLICIT_ANCHOR.finditer(src):
        out.add(m.group(1))
    return out


def main():
    root = (sys.argv[1] if len(sys.argv) > 1 else ".").rstrip("/")
    targets = []
    for base in ("README.md", "README.ru.md"):
        p = os.path.join(root, base)
        if os.path.isfile(p):
            targets.append(p)
    for dirpath, dirs, files in os.walk(os.path.join(root, "docs")):
        for f in files:
            if f.endswith(".md"):
                targets.append(os.path.join(dirpath, f))

    problems = []
    for p in targets:
        src = strip_code(open(p, encoding="utf-8").read())
        for url in LINK.findall(src):
            if re.match(r"^(https?:)?//|^(mailto|tel|data):|^#", url):
                continue
            path, _, frag = url.partition("#")
            if not path:
                continue
            fs = os.path.normpath(os.path.join(os.path.dirname(p), path))
            if not os.path.exists(fs):
                problems.append(f"{p}: missing target → {url}")
                continue
            if frag and fs.endswith(".md") and frag not in anchors(fs):
                problems.append(f"{p}: missing anchor → {url}")

    if problems:
        print("\n".join(sorted(problems)))
        print(f"\n{len(problems)} problem(s) in {len(targets)} files")
        sys.exit(1)
    print(f"OK: {len(targets)} Markdown files, all relative links resolve")


if __name__ == "__main__":
    main()
