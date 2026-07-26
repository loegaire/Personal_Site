---
title: "The Counting House — working notes"
description: "Confirmed facts Remote endpoint: 154.57.164.68:30229 (authorized HTB CTF instance). Workspace supplied no challenge artifacts or AGENTS.md; only an empty notes.md. The endpoint is an HTTP app (confirmed visu…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Web Security"
kind: "field-note"
status: "solved"
tags: ["Web Security", "HTB", "Field notes"]
readingTime: 3
wordCount: 444
featured: false
sourcePath: "~/ctf/HTB/salt_crown/the_counting_house/notes.md"
---

# The Counting House — working notes

## Confirmed facts
- Remote endpoint: `154.57.164.68:30229` (authorized HTB CTF instance).
- Workspace supplied no challenge artifacts or `AGENTS.md`; only an empty `notes.md`.
- The endpoint is an HTTP app (confirmed visually by the supplied browser screenshot), not a raw line-protocol service. Initial `nc` probes were therefore uninformative.
- UI identifies itself as “Eastreach Counting House”; visible pages include The Floor, Services, Bearer Notes, Developers, and Clerk's Window.
- User identifies the category as quantum computing.
- `GET /api/market` documents the complete API and all core parameters (saved as `scratch/market.json`): 8-qubit notes, a rank-4 hash-derived parity-check, 6 rivals with 16-bit bids, and a 24-round / 8-strand seal check.
- `POST /api/new` returns a bearer session token; tokens can be created freely for non-destructive schema tests.
- Note circuits are JSON lists of gate tuples. Gate names are lowercase: `["h", 0]` is syntactically accepted (and returns `{"seated":false}` for the non-note test circuit). Uppercase and object representations are rejected; `[["H",0,0]]` revealed the parser error `bad gate`.
- The landing page and JS are saved under `scratch/`; client calls only `/api/market` and `/api/new`.

## Current hypothesis
- Web application with a likely cryptographic/quantum component. Start by enumerating routes and client assets/API calls.
- Prepare the valid uniform subspace state `|A_4919>` from the documented SHA-256 parity check; then use Z measurements to recover each 16-bit rival bid. The settlement seal is likely vulnerable to EPR-pair deferred-basis measurement.

## Next tests
- Fetch the landing page and enumerate linked JavaScript/routes; inspect Developer and Bearer Note functionality.
- Derive and submit a valid note circuit (lowercase `h`/`cx` tuples), then characterize `/api/book` and the full commit → peek → open seal flow with that session.

## Failed / invalid probes
- Treating port 30229 as a raw netcat service: incorrect; it is HTTP.
- First landing-page command: shell quote error, no request was executed.
- Empty/object/uppercase note circuit representations were rejected; lowercase tuple notation is required.

## Final solved state
- Implemented seat forgery from public note parameters:
  - value `4919`
  - rows from `sha256("eastreach-note-v4919-{i}")` low byte, independent-set reduced
  - rows `[0x11, 0xa9, 0xa1, 0x4e]`
  - note circuit synthesized from reduced matrix (`H` on free vars + constrained `CX`)
  - `/api/enter` now returns `{"seated": true}`.
- Recovered all 6 rival bids from `/api/book` by measuring each `(bidder, position)` in both `Z` and `X`:
  - one basis yields constant outcomes (true bit),
  - opposite basis yields random outcomes (BB84 behavior).
- Cleared 24-round seal by committing Bell pair slots `H(a);CX(a,b)` for each strand and answering basis-chosen reads with `/api/seal/peek` and `/api/seal/open`.
- Settlement succeeds after forging the note for the extracted clearing price and posting `/api/settle`.
- Verified challenge flag:
  - `HTB{f0rg3d_r34d_4nd_s3ttl3d_t0_th3_s1lv3r_882b9d30ed8aa2c15a5e39348d3888a9}`

## Current status
- Finalized, documented in `WRITEUP.md`.
- Added reusable knowledge note in `skill.md`.
- All work completed; no further local tests required.
