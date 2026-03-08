from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import markdown
import yaml
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
WRITEUPS_DIR = ROOT / "content" / "writeups"
RESEARCH_DIR = ROOT / "content" / "research"
OUTPUT = ROOT / "content" / "writeups-data.js"

MD_EXTENSIONS = [
    "fenced_code",
    "tables",
    "sane_lists",
    "toc",
]


def render_html(markdown_text: str) -> str:
    return markdown.markdown(markdown_text, extensions=MD_EXTENSIONS)


def is_relative_url(url: str) -> bool:
    return bool(url) and not (
        url.startswith(("http://", "https://", "mailto:", "tel:", "#", "/", "data:"))
    )


def rewrite_relative_urls(html: str, source_path: Path) -> str:
    source_dir = source_path.parent
    soup = BeautifulSoup(html, "html.parser")

    for tag_name, attribute in (("img", "src"), ("source", "src"), ("audio", "src"), ("video", "src"), ("a", "href")):
        for tag in soup.find_all(tag_name):
            url = tag.get(attribute)
            if not isinstance(url, str) or not is_relative_url(url):
                continue

            resolved = (source_dir / url).resolve()
            try:
                relative = resolved.relative_to(ROOT).as_posix()
            except ValueError:
                continue
            tag[attribute] = relative

    return str(soup)


def extract_preview_image(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    image = soup.find("img")
    if image and isinstance(image.get("src"), str):
        return image["src"]
    return ""


def slug_to_title(slug: str) -> str:
    return slug.replace("-", " ").replace("_", " ").title()


def split_frontmatter(markdown_text: str) -> tuple[dict[str, Any], str]:
    if not markdown_text.startswith("---\n"):
        return {}, markdown_text

    _, raw_frontmatter, body = markdown_text.split("---\n", 2)
    metadata = yaml.safe_load(raw_frontmatter) or {}
    if not isinstance(metadata, dict):
        raise ValueError("Frontmatter must be a YAML mapping")
    return metadata, body.lstrip()


def extract_title(markdown_text: str, slug: str) -> str:
    match = re.search(r"^#\s+(.+)$", markdown_text, flags=re.MULTILINE)
    if match:
      return match.group(1).strip()
    return slug_to_title(slug)


def extract_summary(markdown_text: str) -> str:
    paragraphs = [
        line.strip()
        for line in markdown_text.splitlines()
        if line.strip() and not line.startswith("#") and not line.startswith("```")
    ]
    if not paragraphs:
        return ""
    summary = paragraphs[0]
    return summary if len(summary) <= 140 else summary[:137].rstrip() + "..."


def extract_excerpt(markdown_text: str) -> str:
    lines: list[str] = []
    in_code_block = False

    for raw_line in markdown_text.splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block or not stripped:
            continue
        if stripped.startswith(("#", "![", "---")):
            continue

        cleaned = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", stripped)
        cleaned = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", cleaned)
        cleaned = re.sub(r"[`>*_#-]", "", cleaned).strip()
        if cleaned:
            lines.append(cleaned)
        if len(" ".join(lines)) >= 280:
            break

    excerpt = " ".join(lines)
    return excerpt if len(excerpt) <= 280 else excerpt[:277].rstrip() + "..."


def normalize_tags(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(tag).strip() for tag in value if str(tag).strip()]
    if isinstance(value, str):
        return [tag.strip() for tag in value.split(",") if tag.strip()]
    return [str(value).strip()]


def merge_tags(default_tag: str, explicit_tags: list[str]) -> list[str]:
    tags: list[str] = [default_tag]
    seen = {default_tag.lower()}
    for tag in explicit_tags:
        normalized = tag.strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        tags.append(normalized)
    return tags


def discover_entries(source_dir: Path, *, default_tag: str, section: str) -> list[dict[str, Any]]:
    manifest: list[dict[str, Any]] = []

    if not source_dir.exists():
        return manifest

    for source_path in sorted(source_dir.glob("*.md")):
        raw_markdown = source_path.read_text(encoding="utf-8")
        metadata, markdown_body = split_frontmatter(raw_markdown)
        slug = str(metadata.get("slug") or source_path.stem)
        title = str(metadata.get("title") or extract_title(markdown_body, slug))
        summary = str(metadata.get("summary") or extract_summary(markdown_body))
        tags = merge_tags(default_tag, normalize_tags(metadata.get("tags")))
        order = metadata.get("order")
        if order is None:
            order = 10_000

        html = rewrite_relative_urls(render_html(markdown_body), source_path)
        excerpt = extract_excerpt(markdown_body)

        manifest.append(
            {
                "title": title,
                "slug": slug,
                "file": source_path.relative_to(ROOT).as_posix(),
                "section": section,
                "summary": summary,
            "excerpt": excerpt or summary,
            "previewImage": extract_preview_image(html),
                "tags": tags,
                "order": int(order),
                "markdown": markdown_body,
                "html": html,
            }
        )

    manifest.sort(key=lambda entry: (entry["order"], entry["title"].lower()))
    return manifest


def build() -> None:
    writeups = discover_entries(WRITEUPS_DIR, default_tag="ctf", section="writeups")
    research = discover_entries(RESEARCH_DIR, default_tag="research", section="research")
    js = (
        "window.WRITEUPS_DATA = " + json.dumps(writeups, ensure_ascii=False) + ";\n"
        + "window.RESEARCH_DATA = " + json.dumps(research, ensure_ascii=False) + ";\n"
    )
    OUTPUT.write_text(js, encoding="utf-8")


if __name__ == "__main__":
    build()
