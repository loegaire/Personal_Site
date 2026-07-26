# Field Archive

Astro-powered personal archive for CTF writeups, working notes, and academic research.

## Content model

Astro content collections are the source of truth:

- `content/writeups/` — upload/drop folder for new writeups
- `src/content/writeups/imported/` — generated snapshot imported from `~/ctf`
- `src/content/writeups/local/` — generated snapshot of the upload/drop folder
- `src/content/research/` — academic and research Markdown
- `src/content.config.ts` — collection schemas
- `src/data/content-manifest.json` — source-to-route import receipt
- `src/data/content-stats.json` — generated archive counts
- `public/media/` — referenced images and PDF attachments

There is only one CTF route template, `src/pages/ctf/[...slug].astro`, and one shared
post UI, `src/layouts/PostLayout.astro`. Astro applies them to every Markdown entry
and generates the individual static HTML URLs at build time. The old
`window.WRITEUPS_DATA` bundle and browser-side Markdown rendering are no longer used.

## Add a new writeup

Drop a Markdown file into `content/writeups/`:

```text
content/writeups/my-new-writeup.md
```

Or use folders as categories:

```text
content/writeups/reverse/my-new-writeup.md
content/writeups/pwn/heap-challenge.md
content/writeups/crypto/rsa-challenge.md
```

The file only needs a level-one heading and the original body:

```md
# My new writeup

The challenge starts with...
```

Then run:

```bash
npm run build
```

The preparation step infers metadata, preserves the Markdown body, and Astro generates
the HTML page using the shared post UI. No Astro page or JavaScript entry needs to be
created for an individual post. See `content/_writeup-template.md` for a copyable example.

## Import all local CTF notes

```bash
npm run import:content
```

By default the importer reads `~/ctf`. Override it when needed:

```bash
CTF_ROOT=/path/to/ctf npm run import:content
```

The importer:

- finds authored `notes*.md`, `*writeup*.md`, `wu.md`, `report.md`, and solution documents;
- imports the direct Markdown files in `~/ctf/writeups`;
- excludes virtual environments, dependencies, cloned package documentation, scratch trees, generated skill corpora, and oversized analysis dumps;
- keeps each original Markdown body;
- copies referenced images and preserved PDF attachments;
- preserves local paths, commands, usernames, and other writeup evidence;
- redacts obvious CTF instance tokens and cloud credentials;
- infers event, discipline, status, dates, and reading time for the archive UI;
- deduplicates byte-identical documents.

The same preparation command processes new uploads from `content/writeups`. If `~/ctf`
does not exist (for example, in hosted CI), the checked-in imported snapshot is preserved
and only the upload folder is refreshed.

## Develop

```bash
npm install
npm run dev
```

The configured project base is `/Personal_Site`, matching the GitHub repository name.

## Validate and build

```bash
npm run check
npm run build
npm run preview
```

The static build produces:

- homepage and about page;
- searchable/filterable archive;
- one static route per CTF/research Markdown document;
- per-article table of contents, reading progress, and focus mode;
- RSS feed;
- sitemap.

## Design

The interface uses an original “field archive” identity: aggressive editorial geometry, oversized type, cut-paper transitions, engraved/tactile panels, warm ornament, and high-contrast interaction feedback. It does not ship artwork, logos, fonts, or other assets from Persona 5 Royal or Hades.
