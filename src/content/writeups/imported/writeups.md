---
title: "CTF Skill Library Build Notes"
description: "Confirmed facts Workspace: /home/thinh/ctf/writeups. CTF.md exists and has 12,620 lines. It is a copied CTFtime CTF index, not a small hand-curated list. CODEXSKILLSDIR is unset, so the requested install tar…"
published: "2026-06-03"
updated: "2026-06-04"
event: "CTF Archive"
category: "Cryptography"
kind: "field-note"
status: "partial"
tags: ["Cryptography", "CTF Archive", "Field notes"]
readingTime: 3
wordCount: 648
featured: false
sourcePath: "~/ctf/writeups/notes.md"
---

# CTF Skill Library Build Notes

## Confirmed facts
- Workspace: `/home/thinh/ctf/writeups`.
- `CTF.md` exists and has 12,620 lines. It is a copied CTFtime CTF index, not a small hand-curated list.
- `CODEX_SKILLS_DIR` is unset, so the requested install target is `$HOME/.agents/skills`.
- Existing user-global CTF skills are broad category skills under `$HOME/.agents/skills/ctf-skills/`: crypto, forensics, malware, misc, osint, pwn, reverse, web, and solve-challenge.
- No repo-local `./.agents/skills` or `$REPO_ROOT/.agents/skills` skills were found.
- Git worktree has many unrelated changes outside `/home/thinh/ctf/writeups`; do not revert or touch them.

## Immediate next step
- `ctf_skill_research/research_index.md` created with all 1,403 parsed CTF entries.
- Research pass is prioritizing high-signal public sources with reusable technical mechanics, then mapping lessons into focused Codex skills.

## Search/research sources accepted so far
- Google CTF official challenge repository: official source archive for 2017-2025 Google CTF challenge files.
- DownUnderCTF 2024 public repository: official challenge files and solutions; useful for complete challenge-list structure.
- hxp blog/writeups: author writeups with reusable advanced web, crypto, pwn, and forensics techniques.
- UIUCTF writeups: reusable web upload and crypto/math lessons.
- Hack.lu BabyElectron writeup: reusable Electron local-file-origin and XSS-to-file-read/RCE workflow.

## Final state for this pass
- `ctf_skill_research/research_index.md` records all 1,403 parsed CTF entries from `CTF.md`.
- Online triage was completed for a focused subset: Google Capture The Flag, DownUnderCTF, hxp CTF, Hack.lu CTF, UIUCTF, SECCON CTF, and PlaidCTF.
- Created and installed 9 new persistent skills in `/home/thinh/.agents/skills`:
  - `web-url-parser-differential`
  - `web-nextjs-server-actions-ssrf`
  - `web-php-lfi-nginx-tempfile`
  - `web-electron-file-origin-ipc-rce`
  - `web-node-prototype-pollution-gadgets`
  - `misc-bash-ast-parser-jail-bypass`
  - `crypto-algebraic-rsa-special-primes`
  - `crypto-ring-lwe-implementation-leakage`
  - `forensics-usb-pcap-reconstruction`
- Installed skill validation passed: frontmatter, `name`, `description`, required sections, examples table, and source URLs.
- `ctf_skill_research/ctf_skill_update_report.md` summarizes created skills, skipped sources, and explicit coverage gaps.
- No existing skill directories were overwritten or deleted.

## Exhaustive pass requested
- User explicitly requested full completion across all CTFs.
- Created active goal: complete exhaustive `CTF.md`-driven public writeup research and skill installation.
- Programmatic sources confirmed accessible:
  - `https://ctftime.org/api/v1/events/?limit=5`
  - `https://ctftime.org/ctfs`
  - `https://github.com/ctfs/write-ups-*` via GitHub API
- Current index status before expanded mining: 1,398 sparse, 5 partial.
- Next: build archive miner for `ctfs/write-ups-2012` through current available years, map repository directories to parsed CTF names, collect challenge/readme links, and summarize reusable technique candidates.

## Expanded mining results
- `ctf_skill_research/scratch/mine_public_archives.py` completed.
  - `ctfs/write-ups-*` matched 86 CTF names.
  - CTFtime events API matched 830 CTF names.
  - Combined with CTFtime writeup rows below, 846/1,403 parsed CTF names have at least one public-index hit.
  - One GitHub tree endpoint error was recorded for `ctfs/write-ups-2012`; repo did not abort the pass.
- `ctf_skill_research/scratch/mine_ctftime_writeups.py` completed.
  - Located 1,300 CTFtime writeup pages.
  - Scraped 38,971 writeup rows with 0 page errors.
  - Mapped writeup rows to 440 parsed CTF names.
- Largest mapped CTFtime writeup counts: picoCTF 1,188; CSAW Quals 1,069; Google CTF 702; ASIS Quals 673; TAMUctf 666; PlaidCTF 442; DEF CON Qualifier 412; Hack.lu 407.
- High-frequency tags across CTFtime writeups: web, pwn, crypto, forensics, misc, reverse, python, osint, RSA, XSS, PHP, SQLi, ROP, steganography, XOR, heap, PCAP, Android, shellcode, RCE, LFI, AES, SSTI, SSRF, JWT.

## Final expanded pass state
- Installed 18 focused topic skills into `/home/thinh/.agents/skills`.
- Backed up and updated 9 broad CTF category skills already present at top-level by adding the required CTF skill wrapper sections while preserving their existing detailed content.
- Backup path for broad skill edits: `ctf_skill_research/backups/broad-ctf-skills-20260603/`.
- Validated all 27 top-level skills in `/home/thinh/.agents/skills`, including symlinked broad category skills.
- `research_index.md` status after all mining/search passes: 1,053 partial sections, 350 sparse sections.
- `research_index.md` contains 4,478 data rows excluding repeated table headers/separators.
- Authenticated GitHub no-hit pass:
  - searched 557 previously no-hit CTFs
  - 203 candidate-hit sections
  - 354 no-repo-hit sections
  - 0 errors
- DuckDuckGo sparse broad-web pass:
  - attempted 354 sparse CTFs
  - 4 candidate-hit sections
  - 132 clean no-result sections
  - 218 search errors from 403/timeouts
- Bing secondary retry for the 218 DuckDuckGo errors:
  - attempted 218 sparse CTFs
  - 0 candidate-hit sections
  - 218 clean no-result sections
  - 0 errors
- Final report rewritten at `ctf_skill_research/ctf_skill_update_report.md`.
- Final validation command result: 27 installed top-level skills have YAML frontmatter, `name`, `description`, required CTF skill sections, examples tables, source URLs, and non-empty bodies.
