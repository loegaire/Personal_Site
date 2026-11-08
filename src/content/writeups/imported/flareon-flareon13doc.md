---
title: "flareon13.doc — notes"
description: "FLAG (verified): Ju$74l177l37r34$ur3HUN7@flare-on.com — reproduce with python3 solve.py."
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "flareon", "Field notes", "ecc"]
readingTime: 2
wordCount: 253
featured: false
sourcePath: "~/ctf/flareon/flareon13doc/notes.md"
---

# flareon13.doc — notes

**FLAG (verified): `Ju$7_4_l177l3_7r34$ur3_HUN7@flare-on.com`** — reproduce with `python3 solve.py`.

Archive `3-flareon13_doc.7z`, password `flare` → `artifacts/flareon13.doc` (1.85 MB polyglot).

## Layers (file order)
| Off | Format | Secret (slot in checker MD5 list) |
|---|---|---|
| 0x0 | DOS COM (fake EICAR, self-modifying XOR/SUB → int21/09) | `FLARE-STANDARD-ANTIVIRUS-TEST-FILE!` (0) |
| 0x84 | PDF 1.7, RC4-40 (V1/R2), empty user pw | invisible `3 Tr` text, EBCDIC → `mainframe_ebcdic_ghost` (1); off-page JBIG2 image → `jbig2_fax_geometry` (2) |
| 0 (raw) | Raw CD image, 2352-byte Mode1 sectors, UDF 1.02 (partition @0x9c310) | IUVD string `udf_tagged_descriptor` (3); files `click_me`, `README.TXT` (decoy) |
| click_me | Fat Mach-O: slice0 arm64 "fire" anim, slice1 Crystal checker (subtype 3) | slice0 prints SHA-0(LE)-hex^const → `Ød1n_373rn4l_fl4r3` (5) |
| 0x1c4e3f | ZIP, ZipCrypto + **Reduce1**, `flag.txt` | contents `reduce_not_deflate` (4) |
| EOF-512 | VHD fixed-disk footer (UUID `FLAREONPOLYGLOT!`), checksum valid | nothing |

## Checker (slice1, Crystal, stripped)
- 6 MD5 targets + 80-byte ciphertext at `__literals` 0x35e30 / 0x35ef0, each byte = hex nibble ^ 0x80.
- Needs 6 args (or stdin `flag[N/6]`), each MD5 must match; key = XOR of SHA-256(args); RC4-decrypt ciphertext → flag.

## Key steps / dead ends
- Parse UDF by hand (7z can't): sectors 2352 bytes, headers normal, ECC zeroed.
- slice0 emulated with unicorn (`scratch/emu0.py`); hash loop skips ROTL when stack byte == 0 → SHA-0.
- Slot 4 hunting in strings / XOR / UTF variants / VHD / UDF EAs / code signatures (`totally_fake_flag`, `true_honest_flag` = decoys) failed.
- **Breakthrough:** bkcrack known-plaintext on ZIP: Reduce stream begins with 256×6-bit follower counts (255→0); for ASCII data counts ≥0x80 are 0 → 64 zero bytes known. Keys `0917ed61 cfc8f696 5d3e9072`; custom unreduce → CRC OK.
