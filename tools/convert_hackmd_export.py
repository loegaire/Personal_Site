from __future__ import annotations

import argparse
from pathlib import Path

from bs4 import BeautifulSoup
from markdownify import markdownify as to_markdown


def extract_markdown_body(html_path: Path) -> str:
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    markdown_body = soup.select_one(".markdown-body")
    if markdown_body is None:
        raise ValueError(f"Could not find .markdown-body in {html_path}")

    for anchor in markdown_body.select("a.anchor"):
        anchor.decompose()

    markdown = to_markdown(
        str(markdown_body),
        heading_style="ATX",
        bullets="-",
        strong_em_symbol="*",
        strip=["div", "span"],
    )

    cleaned_lines = [line.rstrip() for line in markdown.splitlines()]
    while cleaned_lines and not cleaned_lines[0].strip():
        cleaned_lines.pop(0)
    while cleaned_lines and not cleaned_lines[-1].strip():
        cleaned_lines.pop()
    return "\n".join(cleaned_lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert a HackMD HTML export to Markdown")
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    markdown = extract_markdown_body(args.source)
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_text(markdown, encoding="utf-8")


if __name__ == "__main__":
    main()
