---
title: "Easy RE — Field Notes"
description: "Challenge directory: /home/thinh/ctf/bangladesh/easyRE Artifact: e4syRE.bdsec SHA-256: 65b9139481b00c69bd8ddbc7521d4ff0eca3e00571c315028b1c8ab30f26fcf8 File: ELF64 x86-64 PIE, dynamically linked, not strippe…"
published: "2026-07-20"
updated: "2026-07-20"
event: "bangladesh"
category: "AI"
kind: "field-note"
status: "solved"
tags: ["AI", "bangladesh", "Field notes"]
readingTime: 2
wordCount: 373
featured: false
sourcePath: "~/ctf/bangladesh/easy_RE/notes.md"
---

## Confirmed state

- Challenge directory: `/home/thinh/ctf/bangladesh/easy_RE`
- Artifact: `e4sy_RE.bdsec`
- SHA-256: `65b9139481b00c69bd8ddbc7521d4ff0eca3e00571c315028b1c8ab30f26fcf8`
- File: ELF64 x86-64 PIE, dynamically linked, not stripped; 16,768 bytes.
- Entry point `0x1700`; `main` at `0x10e0`, size 1557 bytes.
- No `AGENTS.md` found in the initial file inventory; `notes.md` was empty.
- Named local `.rodata` objects: `expected.0` (24 bytes), `expected.1` (26), `expected.3` (41), `expected.2` (29), `key_part_b` (8), `key_part_a` (8).
- Imports include `fgets`, `strcspn`, `time`, `srand`, `rand`, `clock`, and output functions.
- Strings include the banner, `Enter the flag:`, success/incorrect messages, and `Your lucky number: %u`.

## Current hypothesis

The checker is probably a compact flag transformation with several expected byte arrays and a time-seeded decoy/lucky-number branch. Need confirm from `main` disassembly and constants.

## Commands tried

- `file`, `stat`, `sha256sum`, `readelf -h/-S/-Ws`, `strings`, `checksec`.
- `checksec` is unavailable in the environment.

## Next tests

- Disassemble `main` and dump `.rodata`.
- Run a copied executable under controlled inputs, then model/recover the checker.

## Confirmed solve

- Accepted input lengths are 24, 26, 29, and 41 bytes; the checker uses separate transform branches.
- 24-byte branch inverts to `CFLAG{y0u_f0uNd_4_d3c0Y}` and is explicitly a decoy.
- 26-byte branch inverts to `BFLAG{r3v3rS1ng_1s_4n_4rT}` and is accepted, but is not the final BDSEC flag.
- The 29-byte branch has an inconsistent SIMD/scalar target comparison: the SIMD part checks `expected.2[0:16]`, while the scalar loop starts at `expected.2+0x10`; the natural inverse is non-printable and is rejected by the original binary.
- The 41-byte branch is the real checker. For input byte `i`, it computes:
  - `mixed = input[i] XOR key_part_a[i mod 8] XOR key_part_b[i mod 8]`
  - `rotated = ROL8(mixed, (i mod 7)+1)`
  - stores `(rotated + ((11*i) XOR 0x23)) mod 256` at destination `(13*i) mod 41`.
- Inverting the 41-byte branch gives the verified flag:
  `BDSEC{e4SY_r3v3rS3_eNg1N33r1nG_cH4LL4ng3}`
- `python3 solve.py --verify` runs an exact temporary copy through `/lib64/ld-linux-x86-64.so.2` and checks the success message, preserving the original artifact.
- Original artifact was restored from the validated scratch copy after an unexplained loader-side mutation during an earlier direct verification attempt; final status is mode `0644`, SHA-256 `65b9139481b00c69bd8ddbc7521d4ff0eca3e00571c315028b1c8ab30f26fcf8`.

## Failed hypotheses

- Initially inverted the 41-byte branch as `ROR(target) - addend`; disassembly order is rotate first, then addend. Correct inverse is `ROR(target - addend)`.
- Initially treated the 29-byte scalar target as the complete transform target; its pointer intentionally overlaps the tail of `expected.2` and start of `expected.3`, and the SIMD precheck makes that path inconsistent.
