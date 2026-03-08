from __future__ import annotations

import argparse
import re
from pathlib import Path

from build_writeups import ROOT, WRITEUPS_DIR, build


def slugify(value: str) -> str:
    slug = value.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "new-writeup"


def next_order() -> int:
    highest = 0
    for path in WRITEUPS_DIR.glob("*.md"):
        text = path.read_text(encoding="utf-8")
        match = re.search(r"^order:\s*(\d+)\s*$", text, flags=re.MULTILINE)
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def make_template(title: str, order: int) -> str:
    return f"""---
title: {title}
summary: TODO
tags:
  - TODO
order: {order}
---

# {title}

Write your notes here.
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a new writeup Markdown file")
    parser.add_argument("title", help="Writeup title")
    args = parser.parse_args()

    slug = slugify(args.title)
    destination = WRITEUPS_DIR / f"{slug}.md"
    if destination.exists():
        raise SystemExit(f"Writeup already exists: {destination}")

    destination.write_text(make_template(args.title, next_order()), encoding="utf-8")
    build()
    print(destination.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()