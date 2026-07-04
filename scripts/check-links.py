#!/usr/bin/env python3
"""Check internal links and anchors in a built site directory.

Usage: check-links.py <public-dir>

Walks every .html file, collects href/src, verifies that internal
targets exist on disk (pretty URLs resolve to <path>/index.html) and
that #anchors point to real ids in the target page. External links,
mailto: and tel: are skipped. Exit code 1 if anything is broken.

Pages that interpret location.hash in JS (virtual anchors) are
exempt from the anchor check: the tags page by default; add more
with --virtual-hash <url-prefix> (repeatable).
"""
import os
import re
import sys
from html.parser import HTMLParser

VIRTUAL_HASH = ["/tags"]


class Scan(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []   # (attr_value, tag)
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d:
            self.ids.add(d["id"])
        for k in ("href", "src"):
            if k in d and d[k]:
                self.links.append((d[k], tag))
        if tag == "a" and "name" in d:
            self.ids.add(d["name"])


def resolve(root, page_dir, target):
    """Return filesystem path for an internal URL target, or None."""
    path = target.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return "SELF"
    if path.startswith("/"):
        fs = os.path.join(root, path.lstrip("/"))
    else:
        fs = os.path.normpath(os.path.join(page_dir, path))
    cands = [fs]
    if path.endswith("/"):
        cands = [os.path.join(fs, "index.html")]
    elif not os.path.splitext(fs)[1]:
        cands = [fs + "/index.html", fs + ".html", fs]
    for c in cands:
        if os.path.isfile(c):
            return c
    return None


def main():
    argv = sys.argv[1:]
    while "--virtual-hash" in argv:
        i = argv.index("--virtual-hash")
        VIRTUAL_HASH.append(argv[i + 1])
        del argv[i:i + 2]
    if len(argv) != 1:
        print(__doc__)
        sys.exit(2)
    root = argv[0].rstrip("/")
    pages, problems = {}, []
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.endswith(".html"):
                p = os.path.join(dirpath, f)
                s = Scan()
                s.feed(open(p, encoding="utf-8", errors="replace").read())
                pages[p] = s
    for p, s in pages.items():
        for url, tag in s.links:
            if re.match(r"^(https?:)?//|^(mailto|tel|data|javascript):", url):
                continue
            fs = resolve(root, os.path.dirname(p), url)
            if fs is None:
                problems.append(f"{p}: broken {tag} → {url}")
                continue
            if "#" in url:
                path_part, frag = url.split("#", 1)
                if frag and not any(path_part.startswith(v) for v in VIRTUAL_HASH):
                    target = pages.get(fs) if fs != "SELF" else pages.get(p)
                    if target is not None and frag not in target.ids:
                        problems.append(f"{p}: missing anchor → {url}")
    if problems:
        print("\n".join(sorted(problems)))
        print(f"\n{len(problems)} problem(s) in {len(pages)} pages")
        sys.exit(1)
    print(f"OK: {len(pages)} pages, all internal links and anchors resolve")


if __name__ == "__main__":
    main()
