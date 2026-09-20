#!/usr/bin/env python3
"""Download all portfolio project images from media.base44.com into public/projects/<slug>/.

Reads the extracted projects.json (from the target app bundle) and fetches every
image referenced there into deterministic local filenames so the clone is
self-contained (no external media dependency at runtime).
"""
import json
import os
import sys
import urllib.request

ROOT = "/home/z/my-project"
PROJECTS = json.load(open(f"{ROOT}/research/projects.json"))
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}


def local_name(url: str, kind: str, idx: int | None = None) -> str:
    ext = os.path.splitext(url.split("?")[0])[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".svg"):
        ext = ".jpg"
    if idx is None:
        return f"{kind}{ext}"
    return f"{kind}-{idx:02d}{ext}"


def fetch(url: str, dest: str) -> str:
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return "skip"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())
    size = os.path.getsize(dest)
    if size < 1000:
        os.remove(dest)
        return "TOO_SMALL"
    return f"{size//1024}KB"


def main() -> int:
    failures: list[str] = []
    for p in PROJECTS:
        slug = p["slug"]
        out_dir = os.path.join(ROOT, "public", "projects", slug)
        os.makedirs(out_dir, exist_ok=True)
        jobs: list[tuple[str, str, int | None]] = [
            ("hero", p.get("heroImage"), None),
            ("cover", p.get("image"), None),
            ("process", p.get("processImage"), None),
        ]
        for i, img in enumerate(p.get("images") or []):
            jobs.append(("gallery", img, i + 1))
        for kind, url, idx in jobs:
            if not url:
                continue
            name = local_name(url, kind, idx)
            dest = os.path.join(out_dir, name)
            try:
                status = fetch(url, dest)
                print(f"{slug}/{name}: {status}")
                if status == "TOO_SMALL":
                    failures.append(f"{slug}/{name} {url}")
            except Exception as e:  # report and continue
                print(f"{slug}/{name}: FAIL {e}", file=sys.stderr)
                failures.append(f"{slug}/{name} {url} {e}")
    print(f"\nDone. failures={len(failures)}")
    for f in failures:
        print("FAIL:", f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
