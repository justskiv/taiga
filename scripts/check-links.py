#!/usr/bin/env python3
"""Check internal links and anchors in a built site directory.

Usage: check-links.py <public-dir> [--base-path /prefix] [--virtual-hash /url]

Walks every .html file, collects href/src, verifies that internal
targets exist on disk (pretty URLs resolve to <path>/index.html) and
that #anchors point to real ids in the target page. External links,
mailto: and tel: are skipped. Exit code 1 if anything is broken.

--base-path is required when the site is built under a subpath (a
baseURL like https://user.github.io/taiga/). Hugo then emits root-
absolute URLs as /taiga/…, which do NOT correspond to /taiga/… on
disk — public/ IS the subpath root. Pass --base-path /taiga and the
prefix is stripped before resolving. An absolute internal URL that
does not carry the prefix is reported as broken rather than silently
skipped: escaping the subpath is exactly the bug this catches (a
hardcoded "/pagefind/pagefind.js" 404s in production and nowhere
else).

Pages that interpret location.hash in JS (virtual anchors) are
exempt from the anchor check: the tags page by default; add more
with --virtual-hash <url-prefix> (repeatable).
"""
import os
import re
import sys
from html.parser import HTMLParser

VIRTUAL_HASH = ["/tags"]
BASE_PATH = ""


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


def is_virtual(path):
    """True if the target page builds its #anchors in JS.

    Tolerates a language prefix, so /tags/ and /ru/tags/ are both covered
    by a single --virtual-hash /tags — a multilingual site should not have
    to enumerate one entry per language.
    """
    for v in VIRTUAL_HASH:
        if path.startswith(v):
            return True
        if re.match(r"^/[a-z]{2}(-[a-z]{2,4})?" + re.escape(v), path):
            return True
    return False


def strip_base(path):
    """Map a root-absolute URL onto its path inside public/.

    Returns the de-prefixed path, or None if the URL is absolute but
    lives outside the site's base path (a link that escapes the subpath).
    """
    if not BASE_PATH or not path.startswith("/"):
        return path
    if path == BASE_PATH:
        return "/"
    if path.startswith(BASE_PATH + "/"):
        return path[len(BASE_PATH):]
    return None


def resolve(root, page_dir, path):
    """Return filesystem path for an internal URL path, or None."""
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
    global BASE_PATH
    argv = sys.argv[1:]
    while "--virtual-hash" in argv:
        i = argv.index("--virtual-hash")
        VIRTUAL_HASH.append(argv[i + 1])
        del argv[i:i + 2]
    if "--base-path" in argv:
        i = argv.index("--base-path")
        BASE_PATH = "/" + argv[i + 1].strip("/")
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
            raw = url.split("#", 1)[0].split("?", 1)[0]
            path = strip_base(raw)
            if path is None:
                problems.append(f"{p}: {tag} escapes base path {BASE_PATH} → {url}")
                continue
            fs = resolve(root, os.path.dirname(p), path)
            if fs is None:
                problems.append(f"{p}: broken {tag} → {url}")
                continue
            if "#" in url:
                frag = url.split("#", 1)[1]
                if frag and not is_virtual(path):
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
