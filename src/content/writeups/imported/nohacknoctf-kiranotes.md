---
title: "kiranotes CTF notes"
description: "Confirmed facts Workspace contains places.sqlite, a Firefox Places SQLite database. sha256sum places.sqlite = fc02bae8fea3d03810aab4ab9cd7b5810315ce6d700e87f2ce7743caf2d99d4a. File size: 5242880 bytes. file…"
published: "2026-07-04"
updated: "2026-07-04"
event: "nohacknoctf"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "nohacknoctf", "Field notes"]
readingTime: 3
wordCount: 512
featured: false
sourcePath: "~/ctf/nohacknoctf/kiranotes/notes.md"
---

# kiranotes CTF notes

## Confirmed facts
- Workspace contains `places.sqlite`, a Firefox Places SQLite database.
- `sha256sum places.sqlite` = `fc02bae8fea3d03810aab4ab9cd7b5810315ce6d700e87f2ce7743caf2d99d4a`.
- File size: `5242880` bytes.
- `file places.sqlite`: SQLite 3.x database, user version 86, page size 32768, 114 database pages, 61 free pages.
- Tables include `moz_places`, `moz_historyvisits`, `moz_bookmarks`, `moz_annos`, `moz_inputhistory`, `moz_places_metadata_search_queries`, and related Firefox history/bookmark metadata.
- Proton share was accessible and contained three files: `noth*****.png`, `Some Backup 01.png`, and `of.img`.
- Downloaded `of.img` to `artifacts/proton_downloads/of.img`; size `524288000` bytes, sha256 `187f9d97c99d86028245652a86c3ced7c114a9c7afb3e4a2c60dace0747756ec`.
- `of.img` is a GPT disk image with one ext4 Linux partition starting at sector `2048` (byte offset `1048576`), label `CASE`, size about 498 MiB.
- `7z l of.img` shows live files under `home/ctf/Downloads/`: empty files spelling `I will not let you see it`.
- Raw strings in `of.img` show multiple `flag.txt` references, apparently outside live directory listings.
- Ext4 journal and unallocated carving recovered:
  - `wtf.png`, damaged PNG, from inode `64779`, size `1300330`, extent start block `507905`.
  - `final_from_sig.zip`, WinZip AES ZIP, from raw ext4 offset `277349376` (disk offset `278397952`), containing encrypted `flag.txt`.
- Recovered `wtf.png` with Pillow truncated-image loading to `artifacts/recovered/wtf_pil.png`; it reveals the full note as visually similar to `0x0Kira1337`.
- Correct ZIP password is `0x0kira1337` (lowercase `kira`), not the visible-case `0x0Kira1337`.
- Flag: `NHNC{n0w_y0u_kn0w_h0w_t0_f0r3ns1c_0x00000Easyyyyyyyyy}`.

## Commands tried
- `find .. -name AGENTS.md -print` -> no local AGENTS.md found.
- `sqlite3 places.sqlite '.tables'`
- `sqlite3 places.sqlite '.schema' | head -200`
- `sqlite3 ... count(*)`: `moz_places` 41, `moz_historyvisits` 46, default `moz_bookmarks` 6, `moz_annos` 0, `moz_inputhistory` 0, search queries 0.
- Queried `moz_places` and `moz_historyvisits` ordered by visit date.
- Downloaded Proton files through the shared link/browser session.
- `file`, `fdisk -l`, `parted -s unit s print`, `binwalk`, `7z l`, and targeted `strings` on `artifacts/proton_downloads/of.img`.
- `dd if=of.img of=artifacts/of_extracted/0.primary.img bs=512 skip=2048 count=1019904`
- `debugfs` on the ext4 partition: `ls`, `stat`, `dump <8>` to extract the journal, and old inode/directory block inspection.
- Wrote `scratch/parse_journal.py` and `scratch/recover_journal_inodes.py` to map JBD2 records and decode old inode states.
- Carved `artifacts/recovered/final_from_sig.zip` from the raw ext4 partition at offset `277349376`.
- Wrote `scratch/aes_zip_try.py` to verify/decrypt WinZip AES candidates and generated clue-derived password candidates.
- Wrote `solve.py`; verified `python3 solve.py artifacts/proton_downloads/of.img` prints the flag.

## Interesting live history
- `https://drive.proton.me/urls/00MNVW0SHG#do4wWWpAQ0Lw` title `Kira-Notes - Proton Drive`, visited `2026-07-03 16:20:12`.
- `http://151.158.224.74:31337/` title `Kira Notes // Retro Hacker Archive`, description says mirrored tools/status logs/read-only download index.
- `http://151.158.224.74:31337/#guestbook`
- Failed downloads: `/dl/eyeswap.bin`, `/dl/notebook-crack.tgz` (history title `404 Not Found`).
- `https://github.com/UmmItKin/Kira-Notes` and profile/org reconnaissance pages.
- No live `moz_places` URL/title/description directly contains a flag-like token.

## External fetches / repo findings
- `http://151.158.224.74:31337/` is live and matches the repository source.
- Download links listed on the page all returned `404` when tested (`/dl/deathscan.exe`, `/dl/ryuk-ping.zip`, `/dl/notebook-crack.tgz`, `/dl/eyeswap.bin`, `/dl/kira-sniff.tar.gz`, `/dl/shinigami-keygen.exe`, `/dl/L-crypt.dll`, `/dl/deathnote-rootkit.tgz`).
- The page/repo include contact `kira-notes.countdown368@slmails.com`; historical Git commit changed it from `kira@darknet.void`.
- Full `UmmItKin/Kira-Notes` history was fetched. Deleted `README.md` is the default Astro starter README; deleted `Caddyfile` has only basic static hosting config.
- Commit `98f38fc` added and later kept a source TODO: `github.com/ummit-kira/deathnote-tools`; that exact GitHub repo/user currently returns 404/not public.
- GitHub repo/user search for `ummit-kira/deathnote-tools` did not find a public exact repo; only `UmmItKin/Kira-Notes` is relevant.

## Current hypothesis
- Solved. Browser history led to Proton share; Proton `of.img` contained an ext4 filesystem with deleted artifacts recoverable from journal/unallocated data.

## Next tests
- None required for solve. Optional cleanup/writeup only.
