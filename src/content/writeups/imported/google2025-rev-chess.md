---
title: "Google CTF 2025 rev/chess notes"
description: "Confirmed facts Challenge archive extracted to rev-chess/; original artifacts left unmodified. chess.py implements simplified chess. Win occurs only when White captures black king; then decodeflag(board) sam…"
published: "2026-06-02"
updated: "2026-06-02"
event: "google2025"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "google2025", "Field notes"]
readingTime: 4
wordCount: 869
featured: false
sourcePath: "~/ctf/google2025/rev/chess/notes.md"
---

# Google CTF 2025 rev/chess notes

## Confirmed facts
- Challenge archive extracted to `rev-chess/`; original artifacts left unmodified.
- `chess.py` implements simplified chess. Win occurs only when White captures black king; then `decode_flag(board)` samples final board.
- `board1`: 8x8, pieces: White K at (8,1), White N at (4,8), black king at (8,8), black rooks at (7,8),(7,6),(1,2), pawns at (7,7),(8,7).
- `board2`: 2048 columns x 76280 rows; huge text board. Piece counts are very large; unique K at (2047,76274), k at (2006,76166), unique black bishop at (2042,76278).
- Initial `decode_flag(board2)` is mostly `888...`, because sampled bit cells contain `N` at the “1” position for nearly all bits. One sample is missing/unknown.
- Need be mindful of resources: avoid dumping all non-empty board2 squares (previous attempt generated a 1.6GB persisted output). Use targeted scripts/regions only.

## Immediate hypothesis
- `board2` is likely an encoded chess-move gadget. `decode_flag` samples pairs of cells at columns 15 and 19 on rows spaced 384 apart. Moving knights between these cells changes bits. Need determine intended move sequence and then capture black king.

## Next steps
- Analyze the sampled bit cells and local repeated gadget structure with bounded scripts.
- Find legal move route(s) near black king for final capture.

## Progress update
- Board1 solved/tested with moves: `4,8-6,7`, `7,6-7,1`, `6,7-8,8`.
- For board2, exact decode sample positions are row coordinates `H - ((i*48+29)*8+9)` / fileline `(i*48+29)*8+10`; columns 15 and 19 (1-based). Both positions often initially contain `N`, and decode prioritizes col15 => bit 1.
- A sampled bit can likely be set to 0 by moving the col15 knight away to its empty legal square at `(17,row+1)` while leaving the col19 knight.
- Direct legal capture of black king at (2006,76166) is currently not available; nearby potential bishop lines are blocked.

## More progress
- Black has an easy reversible dummy move with the unique bishop: `2042,76278-2043,76279` and back `2043,76279-2042,76278`. Use this to alternate turns while changing flag bits.
- Tested prefix encoding: moving sampled col15 knights to `(17,row+1)` for zero bits successfully changes output prefix to `CTF{...}`.
- Need derive full flag target bits; likely hidden in board gadget pattern or mate path.
- Local BFS near black king did not find mate because region initially has no legal local white moves in selected cells; final capture may require clearing/using a longer path or a specific remote piece.


## Agent independent analysis update
- Re-read `rev-chess/chess.py`: `decode_flag` uses 199 sample bits, forming 33 flag characters plus one trailing unused bit. Initial decode is 33 chars of `8`, with bit 198 unknown/trailing.
- Confirmed every sampled bit 0..197 has the same local toggle: col 15 contains `N`, col 19 also contains `N`, and the col15 knight has exactly one empty legal destination at `(17, sample_row+1)` in checked samples. Moving it there changes the sampled bit to 0.
- Exact sample rows in board coordinates are `76039 - 384*i` for bit i (i=0..197). File/top row is `(i*48+29)*8+9` zero-based.
- Around black king at `(2006,76166)`, immediate legal white captures are absent. Knight attack squares `(2007,76168)`, `(2005,76168)`, `(2007,76164)` are empty/blocked context; nearby black pawns at row 76168 have no legal moves because row 76167 is blocked by white pawns.
- Unique black bishop at `(2042,76278)` is boxed by pawns except reversible dummy `(2042,76278)<->(2043,76279)` as already found.

## Immediate next analytical step
- Investigate multi-move local mechanism near king: identify which nearby white piece can be repositioned to one of the empty knight-attack squares or clear a line to `k`, using black dummy moves between white moves.
- In parallel, derive intended zero-bit set from board2 structure above/before each 384-row bit block; first 24 target bits should match `CTF{` under alphabet encoding and can be used as known-plaintext to infer the pattern.

## Solution found
- Movable bishops at column 1113 encode a raw bitstream: for sample row `r=76039-384*i`, `(1113,r+4)=='B'` and `(1112,r+5)=='.'` => raw 0, otherwise raw 1. This raw stream decodes to `C0TkPkBP2ddP1d0MBxUtndtN4mWg}NU3D` under the challenge alphabet.
- XOR raw bits with the 24-bit repeating mask derived from `C0Tk` -> known prefix `CTF{`: mask bits `000000000111010010001101`.
- Target flag is `CTF{PhjE2_rE1_IHBAGyn_bK4fEb}`.
- `solve.py` now recovers the target bits, toggles decode knights for zero bits with the reversible black bishop dummy move, and asserts `chess.decode_flag` starts with the recovered flag.

## Correction 2026-06-02
- User reports `CTF{PhjE2_rE1_IHBAGyn_bK4fEb}` is wrong. Treat the repeating-mask derivation as overfit and invalid.
- Keep confirmed primitives (decode knight toggles, reversible black bishop dummy), but re-derive the target bitstream/flag.

## Independent reanalysis 2026-06-02
- Invalidated previous final-capture assumption: a naive BFS accidentally allowed moving into the occupied king square in its local state string; corrected BFS shows no immediate local white legal move/capture near `(2006,76166)` in the bounded king region. The apparent `2006,76165-2006,76166` pawn capture is illegal because pawns cannot capture forward.
- Full-board movable-white scan (resource-bounded, no dumps) finds 797 initially movable white pieces. The dominant intended primitives are repeated decode knights at columns 15/19, movable bishops at 1113/1697, plus a few outlier movable bishops near board extremes. No direct final capture found yet.
- Direct one-column/one-offset repeated marker searches across board2 did not reveal a stream starting with `CTF{`; hits starting `CT...` looked like false positives. This reinforces that col1113/1697 stream alone plus known-prefix XOR was overfit.
- Immediate next step: model the repeated movable-piece streams as constraints on legal move count/turn parity and identify the non-repeated outlier bishop/king-region mechanism that unlocks final capture; do not assume any XOR mask without an independent board-encoded source.
