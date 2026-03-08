# Personal site

## No local server needed

The site now works by opening [index.html](index.html) directly in the browser.

- Open `index.html`
- Click a writeup
- The content is loaded from [content/writeups-data.js](content/writeups-data.js), so there is no runtime fetch dependency

## Writeup workflow

Source files live in [content/writeups](content/writeups):

- put every writeup `.md` file directly in `content/writeups/`
- put every writeup image directly in that same `content/writeups/` folder too
- rebuild the offline bundle:
	- `/home/thinh/proj/personal-site/.venv/bin/python tools/build_writeups.py`

Optional auto-rebuild while editing, still without any server:

- `/home/thinh/proj/personal-site/.venv/bin/python tools/watch_writeups.py`

Then just refresh `index.html` in the browser.

## Research/blog workflow

Source files for academic/research posts live in [content/research](content/research):

- put every research/blog `.md` file directly in `content/research/`
- put related images in that same `content/research/` folder
- rebuild with the same command:
	- `/home/thinh/proj/personal-site/.venv/bin/python tools/build_writeups.py`

The sidebar now auto-indexes:

- `CTF writeups` from `content/writeups`
- `Academic projects` from `content/research`

### Auto discovery

- Every `.md` file directly inside `content/writeups/` is discovered automatically
- Every `.md` file directly inside `content/research/` is discovered automatically
- `content/writeups/index.json` is no longer needed
- Optional YAML frontmatter is supported:

```yaml
---
title: My New Writeup
summary: One-line description shown on the homepage.
tags:
	- pwn
	- linux
order: 5
---
```

If frontmatter is missing, the build script infers:

- `slug` from the filename
- `title` from the first `# Heading`
- `summary` from the first paragraph

### Automatic folder-based tags

- Any markdown found in `content/writeups/` automatically gets the `ctf` tag
- Any markdown found in `content/research/` automatically gets the `research` tag
- Extra frontmatter tags are still supported and appended after these automatic tags

### Obsidian-friendly layout

Example:

- `content/writeups/ductf-2025.md`
- `content/writeups/ductf20251.png`
- `content/writeups/ductf20252.png`

Use normal relative Markdown image paths inside the note, for example:

```md
![Screenshot](ductf20251.png)
```

This matches the simple Obsidian pattern where notes and attachments live side-by-side in one folder.

## Source of truth

- Markdown source: [content/writeups](content/writeups)
- Generated offline bundle: [content/writeups-data.js](content/writeups-data.js)
- Build script: [tools/build_writeups.py](tools/build_writeups.py)
- Watch script: [tools/watch_writeups.py](tools/watch_writeups.py)

## Troubleshooting Python command mismatch

If `python`/`p` points to a different interpreter, you may see errors like `ModuleNotFoundError: No module named 'markdown'`.

- Recommended: run tooling with the project venv interpreter:
	- `/home/thinh/proj/personal-site/.venv/bin/python tools/build_writeups.py`
- Or install dependencies into your active interpreter:
	- `python -m pip install -r requirements.txt`

## Direct links

- `index.html?writeup=picoctf-2025`
- `index.html?writeup=ductf-2025`
