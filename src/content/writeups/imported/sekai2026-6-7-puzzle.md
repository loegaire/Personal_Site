---
title: "6-7 Puzzle Hunt notes"
description: "Confirmed facts Challenge: \"6-7 Puzzle Hunt\", Game, author Neobeo, NORMAL, remote https://67-hunt.chals.sekai.team. Description: \"Six (or seven?) handcrafted logic puzzles. Best enjoyed with a pencil, not a…"
published: "2026-06-27"
updated: "2026-06-27"
event: "sekai2026"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "sekai2026", "Field notes"]
readingTime: 2
wordCount: 349
featured: false
sourcePath: "~/ctf/sekai2026/6-7-puzzle/notes.md"
---

# 6-7 Puzzle Hunt notes

## Confirmed facts
- Challenge: "6-7 Puzzle Hunt", Game, author Neobeo, NORMAL, remote `https://67-hunt.chals.sekai.team`.
- Description: "Six (or seven?) handcrafted logic puzzles. Best enjoyed with a pencil, not a solver."
- Workspace initially contains only `notes.md`, `scratch/`, `dumps/`, `artifacts/`, and `extracted/`.
- No `AGENTS.md` present.
- Loaded `solve-challenge` and `ctf-web` workflows.
- Root page is a static SPA served by nginx. `/robots.txt`, `/sitemap.xml`, and `/favicon.ico` all return the same HTML.
- HTML embeds six puzzle entries with `data-src` and `data-ct`; external libraries are `pzpr.js` and `sjcl.min.js`.
- Validation flow: `currentPuzzle.check()` must pass; canonical token is derived from the board; SJCL decrypts each ciphertext using that token with fixed `iv`, `iter`, and `salt`.
- Canonical token mapping:
  - `tapa`, `nurikabe`: all cells in row-major pzpr internal order, `cell.qans`.
  - `skyscrapers`, `kakuro`: all cells in row-major order, `cell.anum + 1`.
  - `fillomino`: all borders in internal scan order, `border.qans | border.isCmp()`.
  - `shikaku`: all borders in internal scan order, `border.qans`.

## Commands tried
- `rg --files -g 'AGENTS.md' -g 'notes.md' ...` -> found only `notes.md`.
- `find . -maxdepth 3 -type f -print` -> found only `./notes.md`.
- `curl -L https://67-hunt.chals.sekai.team/` -> saved `dumps/index.html`; length 17505 bytes.
- Downloaded `dumps/pzpr.js` and `dumps/sjcl.min.js` for local parsing/decryption.
- Downloaded pzpr variety modules into `dumps/pzpr-variety/` so `pzpr.js` works under Node.
- Used pzpr in Node to parse givens and verify candidate boards with `puzzle.check(true)`.
- Solved Skyscrapers and Kakuro with Z3 numeric constraints.
- Solved Shikaku with exact-cover rectangles.
- Solved Nurikabe and Tapa with Z3 connectivity/flow models.
- Solved Fillomino by exact cover of clued 6/7 regions, then treating leftover connected components as clue-less fillomino regions.
- `python3 solve.py` decrypts all six 7-omino clues and prints the final flag.

## Solved tokens
- Tapa: `1110111111101001010100111101011110011111101101010000101001011111111111101010010110101111011111100111`
- Nurikabe: `1111111111000010001001111011100100101010110100101001011110100100010010001111011110010011011111100001`
- Fillomino: `000101010011000001010110100110011011000001100111110011110001100010110110111001011101100010101010110001000011111100011000110010100101111110110010101100010100011010011101100001010111`
- Shikaku: `011011100000000000001101110000000001110110111111101100000011111111000000000001111111100000000000111111111110000000001111111000001100000111011111100001110011101000000000000001110100`
- Skyscrapers: `452396780523489670234578960345267890698725430769854320876943250987632540000000000`
- Kakuro: `000432000000253000006305300423000532350000053235000324004503600000234000000352000`

## Decrypted clue pieces
- Tapa -> J-shaped 7-omino containing `SEKAI67`.
- Nurikabe -> I-shaped 7-omino containing `{SEKAI}`.
- Fillomino -> G-shaped 7-omino containing `CR_E__S`.
- Shikaku -> S-shaped 7-omino containing `ITSENTE`.
- Skyscrapers -> A-shaped 7-omino containing `IBBL_LI`.
- Kakuro -> W-shaped 7-omino containing `_XY_GER`.

## Meta
- The six 7-ominoes tile a 6x7 rectangle.
- Row-major tiling:
  ```
  SEKAI{S
  CRIBBLE
  _67_LIK
  E_ITS_A
  _SEXY_I
  NTEGER}
  ```
- Flag: `SEKAI{SCRIBBLE_67_LIKE_ITS_A_SEXY_INTEGER}`

## Current hypothesis
- Solved. The "six or seven" clue means six 7-ominoes tile a 6x7 rectangle.

## Next tests
- None.
