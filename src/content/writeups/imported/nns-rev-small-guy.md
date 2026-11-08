---
title: "small-guy solution"
description: "Verified flag: [flag omitted from preview]"
published: "2026-11-08"
updated: "2026-11-08"
event: "nns"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "nns", "Field notes"]
readingTime: 2
wordCount: 255
featured: false
sourcePath: "~/ctf/nns/rev_small-guy/notes.md"
---

# small-guy solution

Verified flag: `NNS{unw1nd_m3_1f_y0u_c4n_sm4ll_guy!!}`

Run `python3 solve.py` in this directory to recover the flag and verify it against the original executable. Requires Python 3 and binutils (`readelf`).

## How it works

1. Main (0x400450) accepts a 32-byte input, optionally wrapped in `NNS{...}`. It copies the input to 0x4d0000 and uses its first two bytes as a little-endian 16-bit seed.
2. The recursive routine at 0x400618 creates 256 stack frames. Each selects one of 32 call sites using `(schedule[i] + (seed >> (i & 7))) & 31`. Each frame also saves `keys[i] XOR (seed * 0x9e3779b97f4a7c15)` modulo 2^64.
3. The deepest frame throws an integer exception. Its DWARF unwind expressions load the four 64-bit input words into rbx, r12, r13, r14. The other frames transform those registers during unwinding. This is why normal disassembly contains almost no visible flag-check arithmetic.
4. The transformations include additions, odd multiplications, XOR with rotated registers, swaps, and short linear-congruential loops. All are invertible modulo 2^64. Expressions use incoming rcx, so a frame uses the key restored by the deeper frame; the deepest transformation uses rcx = 0.
5. The catch handler stores the four resulting words and compares them to the 32-byte target at 0x401dd0.
6. The solver extracts the expressions with `readelf -wf`, builds inverse operations, and tries the 16-bit seed space. For each seed, it reverses the target transformations in frame order 0 through 255 and checks that the recovered first two bytes match the seed.

The recovered printable input was passed to the unmodified executable, which printed `Correct!`.
