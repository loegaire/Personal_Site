from __future__ import annotations

import time
from pathlib import Path

from build_writeups import ROOT, RESEARCH_DIR, WRITEUPS_DIR, build

WATCH_PATHS = [WRITEUPS_DIR, RESEARCH_DIR]


def snapshot() -> dict[Path, float]:
    files: dict[Path, float] = {}
    for path in WATCH_PATHS:
        if path.is_dir():
            for child in path.glob("*"):
                if not child.is_file():
                    continue
                files[child] = child.stat().st_mtime
        elif path.exists():
            files[path] = path.stat().st_mtime
    return files


def main() -> None:
    build()
    print("Watching writeups and research for changes...")
    previous = snapshot()

    while True:
        time.sleep(1)
        current = snapshot()
        if current != previous:
            build()
            previous = current
            print("Rebuilt writeups-data.js")


if __name__ == "__main__":
    main()
