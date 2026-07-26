---
title: "Chronolock — Field Notes"
description: "Original artifact: extractthis.zip (SHA-256 6dcffd8ded67ca62f72114ecc672e586ae55c538172921a039ca0788b9cc73c1). Extracted ELF: artifacts/chronolock (SHA-256 2a9161d0038bbba6cba5cb8f380ce52e663f6e5dda88bbdd523…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Miscellaneous"
kind: "field-note"
status: "reference"
tags: ["Miscellaneous", "athenactf", "Field notes"]
readingTime: 1
wordCount: 154
featured: false
sourcePath: "~/ctf/athenactf/chronolock/notes.md"
---

## Confirmed state

- Original artifact: `extract_this.zip` (SHA-256 `6dcffd8ded67ca62f72114ecc672e586ae55c538172921a039ca0788b9cc73c1`).
- Extracted ELF: `artifacts/chronolock` (SHA-256 `2a9161d0038bbba6cba5cb8f380ce52e663f6e5dda88bbdd5234c8a3d9af67d9`), static x86-64, stripped, Zig/LLD.
- Entry/main prints `[chronolock] deriving key... this will take a while.` and then enters the loop at `0x1003600`.
- `.data` at `0x10073a8` is seed `0x9e3779b97f4a7c15`; byte at `0x10073b0` is `0x5a`.
- The loop adds that seed eight times per iteration and decrements `rcx` by 8. Initial `rcx` is `0xf9ccd8a1c5080000`, equivalent to 2,250,000,000,000,000,000 iterations (about 71.3 years at one iteration/ns; the prompt's century-scale joke is directionally accurate).
- Closed form: `acc = (0xc0ffeed00d1337 + seed * 0xf9ccd8a1c5080000) mod 2^64 = 0xc1c70cf3d9b51337`.
- SplitMix-style finalizer yields `0x7defb1ac745c0756`, exactly the compare constant at `0x1003678`.
- GDB verification on the original binary: break at `0x1003600`, set `rax=0xc1c70cf3d9b51337`, set `rip=0x100363e` (the post-loop `mov rcx,rax`), continue. The unmodified success path prints:

  `athena{4_s1ngl3_byt3_fl1p_s4v3s_c3ntur13s}`

## Failed/clarified hypotheses

- Jumping to `0x1003641` was wrong because it skips the post-loop `mov rcx,rax`, leaving the loop counter in `rcx` and producing `nope`; `0x100363e` is the correct resume address.
