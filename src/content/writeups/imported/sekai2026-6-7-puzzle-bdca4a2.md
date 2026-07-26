---
title: "6-7 Puzzle Hunt Writeup"
description: "The page is a static pzpr-based puzzle hunt. The six puzzle definitions and six ciphertexts are embedded directly in the HTML as data-src and data-ct attributes."
published: "2026-06-27"
updated: "2026-06-27"
event: "sekai2026"
category: "Miscellaneous"
kind: "writeup"
status: "solved"
tags: ["Miscellaneous", "sekai2026", "Writeup"]
readingTime: 1
wordCount: 205
featured: false
sourcePath: "~/ctf/sekai2026/6-7-puzzle/writeup.md"
---

# 6-7 Puzzle Hunt Writeup

## Summary

The page is a static pzpr-based puzzle hunt. The six puzzle definitions and six ciphertexts are embedded directly in the HTML as `data-src` and `data-ct` attributes.

When a puzzle is solved, the frontend builds a canonical answer token from pzpr's internal board state and uses it as the SJCL password:

```js
sjcl.decrypt(solution_token, JSON.stringify({
  ct,
  iv: "sixsevenSIXSEVEN",
  iter: 6767,
  salt: "sixseven+67="
}))
```

So the task is to solve each puzzle exactly, reproduce the token order, and decrypt the six clues.

## Solving

I downloaded `pzpr.js`, `sjcl.min.js`, and the needed `pzpr-variety/*.js` files, then used pzpr under Node to parse givens and verify solutions with `puzzle.check(true)`.

The puzzle solves were:

- Tapa: Z3 boolean shading model with clue-neighborhood runs, no 2x2 shaded blocks, and connected shaded cells.
- Nurikabe: Z3 region model with fixed island sizes, no adjacent islands, no 2x2 sea, and connected sea.
- Fillomino: exact cover for clued 6/7 regions, with leftover connected clue-less regions.
- Shikaku: exact cover by clue-sized rectangles.
- Skyscrapers: Z3 Latin-square and visibility constraints.
- Kakuro: Z3 run-sum and no-duplicate constraints.

Successful decryptions revealed six lettered 7-ominoes: J, I, G, S, A, and W.

## Meta

The title clue "6-7" points to tiling six 7-ominoes into a 6x7 rectangle. Reading the tiled rectangle row-major gives:

```text
SEKAI{S
CRIBBLE
_67_LIK
E_ITS_A
_SEXY_I
NTEGER}
```

## Flag

```text
SEKAI{SCRIBBLE_67_LIKE_ITS_A_SEXY_INTEGER}
```

Run the included solver to reproduce the decryptions:

```bash
python3 solve.py
```
