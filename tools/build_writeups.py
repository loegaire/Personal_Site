from __future__ import annotations

import json
import math
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

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"}
TAG_STOPWORDS = {
    "a",
    "an",
    "and",
    "for",
    "from",
    "into",
    "of",
    "on",
    "the",
    "to",
    "with",
    "writeup",
    "notes",
}

TAG_KEYWORDS = {
    "android": ["android", "apk", "jadx"],
    "crypto": ["crypto", "rsa", "aes", "sha", "hash", "cipher"],
    "forensics": ["forensics", "disk", "memory"],
    "ida": ["ida", "idapro"],
    "linux": ["linux", "kernel", "ubuntu"],
    "misc": ["misc", "general"],
    "network": ["network", "osi", "tcp", "udp"],
    "notes": ["note", "notes", "summary", "guide"],
    "os": ["os", "operating", "system"],
    "pwn": ["pwn", "binary", "exploit", "stack", "heap"],
    "python": ["python", "pwntools"],
    "reverse-engineering": ["reverse", "reversing", "decompile", "debug", "anti-debug"],
    "web": ["web", "http", "xss", "sqli", "csrf"],
}

SLUG_TAG_ALLOWLIST = {
    "android",
    "crypto",
    "forensics",
    "ida",
    "linux",
    "misc",
    "network",
    "notes",
    "os",
    "pwn",
    "python",
    "reverse-engineering",
    "web",
}


def preprocess_markdown(markdown_text: str) -> str:
    def replace_obsidian_embed(match: re.Match[str]) -> str:
        raw_target = match.group(1).strip()
        if not raw_target:
            return ""
        file_target = raw_target.split("|", 1)[0].strip()
        return f"![]({file_target})"

    return re.sub(r"!\[\[([^\]]+)\]\]", replace_obsidian_embed, markdown_text)


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


def fallback_preview_image(source_path: Path, slug: str) -> str:
    slug_base = re.sub(r"[^a-zA-Z0-9]+", "", slug).lower()
    file_base = re.sub(r"[^a-zA-Z0-9]+", "", source_path.stem).lower()
    candidates = sorted(
        [
            path
            for path in source_path.parent.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ],
        key=lambda path: path.name.lower(),
    )
    for candidate in candidates:
        candidate_base = re.sub(r"[^a-zA-Z0-9]+", "", candidate.stem).lower()
        if not candidate_base:
            continue
        if candidate_base.startswith(file_base) or candidate_base.startswith(slug_base):
            return candidate.relative_to(ROOT).as_posix()
    return ""


def slug_to_title(slug: str) -> str:
    return slug.replace("-", " ").replace("_", " ").title()


def split_frontmatter(markdown_text: str) -> tuple[dict[str, Any], str]:
    if not markdown_text.startswith("---\n"):
        return {}, markdown_text

    closing_index = markdown_text.find("\n---\n", 4)
    if closing_index == -1:
        return {}, markdown_text

    raw_frontmatter = markdown_text[4:closing_index]
    body = markdown_text[closing_index + len("\n---\n"):]

    try:
        metadata = yaml.safe_load(raw_frontmatter) or {}
    except yaml.YAMLError:
        return {}, markdown_text

    if not isinstance(metadata, dict):
        raise ValueError("Frontmatter must be a YAML mapping")
    return metadata, body.lstrip()


def extract_title(markdown_text: str, slug: str) -> str:
    match = re.search(r"^#\s+(.+)$", markdown_text, flags=re.MULTILINE)
    if match:
      return match.group(1).strip()
    return slug_to_title(slug)


def extract_summary(markdown_text: str) -> str:
    text = plain_text(markdown_text)
    if not text:
        return ""
    summary = text.split(". ", 1)[0].strip()
    if len(summary) < 45:
        summary = text[:140].strip()
    return summary if len(summary) <= 140 else summary[:137].rstrip() + "..."


def extract_excerpt(markdown_text: str) -> str:
    text = plain_text(markdown_text)
    excerpt = text[:280].strip()
    return excerpt if len(excerpt) <= 280 else excerpt[:277].rstrip() + "..."


def plain_text(markdown_text: str) -> str:
    html = render_html(markdown_text)
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["code", "pre", "script", "style"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def estimate_read_time(markdown_text: str) -> tuple[int, int]:
    text = plain_text(markdown_text)
    if not text:
        return 1, 0
    word_count = len(re.findall(r"\b\w+\b", text, flags=re.UNICODE))
    minutes = max(1, math.ceil(word_count / 220))
    return minutes, word_count


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


def infer_tags(slug: str, markdown_text: str, default_tag: str) -> list[str]:
    inferred: list[str] = []
    seen = {default_tag.lower()}

    def add(tag: str) -> None:
        normalized = tag.strip().lower()
        if not normalized or normalized in seen:
            return
        seen.add(normalized)
        inferred.append(normalized)

    slug_tokens = re.split(r"[^a-zA-Z0-9]+", slug.lower())
    for token in slug_tokens:
        if len(token) < 3 or token in TAG_STOPWORDS or token not in SLUG_TAG_ALLOWLIST:
            continue
        add(token)

    searchable = f"{slug} {markdown_text}".lower()
    for tag, keywords in TAG_KEYWORDS.items():
        if any(re.search(rf"\b{re.escape(keyword)}\b", searchable) for keyword in keywords):
            add(tag)

    return inferred


def discover_entries(source_dir: Path, *, default_tag: str, section: str) -> list[dict[str, Any]]:
    manifest: list[dict[str, Any]] = []

    if not source_dir.exists():
        return manifest

    for source_path in sorted(source_dir.glob("*.md")):
        raw_markdown = source_path.read_text(encoding="utf-8")
        metadata, markdown_body = split_frontmatter(raw_markdown)
        markdown_body = preprocess_markdown(markdown_body)
        slug = str(metadata.get("slug") or source_path.stem)
        title = str(metadata.get("title") or extract_title(markdown_body, slug))
        summary = str(metadata.get("summary") or extract_summary(markdown_body))
        inferred_tags = infer_tags(slug, markdown_body, default_tag)
        tags = merge_tags(default_tag, inferred_tags + normalize_tags(metadata.get("tags")))
        order = metadata.get("order")
        if order is None:
            order = 10_000

        html = rewrite_relative_urls(render_html(markdown_body), source_path)
        excerpt = str(metadata.get("excerpt") or extract_excerpt(markdown_body))
        preview_image = str(metadata.get("previewImage") or extract_preview_image(html) or fallback_preview_image(source_path, slug))
        read_time, word_count = estimate_read_time(markdown_body)
        if isinstance(metadata.get("readTime"), int):
            read_time = max(1, int(metadata["readTime"]))

        manifest.append(
            {
                "title": title,
                "slug": slug,
                "file": source_path.relative_to(ROOT).as_posix(),
                "section": section,
                "summary": summary,
                "excerpt": excerpt or summary,
                "previewImage": preview_image,
                "readTime": read_time,
                "wordCount": word_count,
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
