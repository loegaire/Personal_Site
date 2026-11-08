---
title: "Echoes of a Forgotten Canvas (d5dffde1)"
description: "Technical notes from Echoes of a Forgotten Canvas (d5dffde1)."
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Miscellaneous"
kind: "field-note"
status: "reference"
tags: ["Miscellaneous", "hicybercon", "Field notes", "stego"]
readingTime: 1
wordCount: 178
featured: false
sourcePath: "~/ctf/hicybercon/notes-echoes-canvas.md"
---

# Echoes of a Forgotten Canvas (d5dffde1)
- chall.png 8877501 bytes; PNG 4000x4000 RGBA claimed, IHDR CRC BAD.
- Appended ZIP at offset 5518406 (after IEND): encrypted carrier.jpg (ZipCrypto Deflate, CRC 4230EEBB, comp 3358907).
- IDAT decompresses to 4000x4500 raw (72004500 bytes) => real height 4500; 500 hidden rows.
- Hidden 500 rows: RGB all zero; ALPHA channel has text at rows 4461-4482, cols 3758-3970:
  renders as:  hiCTF{mu1t!14y3r3d_   (appears truncated mid-word "multilayered_")
- zsteg: no other stego in visible region. XMP metadata normal.
- Plan: bkcrack known-plaintext (JFIF FF D8 FF E0 00 10 4A 46 49 46 00 01) to decrypt carrier.jpg.
## Update
- IHDR claims 4000x4000 but IDAT inflates to 4000x4500 -> 500 hidden bottom rows.
- Hidden alpha text (rows 4461-4482, cols 3758-3970): renders "hiCTF{mu1t!14y3r3d_" (truncated mid-word)
- Appended ZIP (offset 5518406) holds encrypted carrier.jpg: ZipCrypto Deflate, crc 4230EEBB, comp 3358907, uncomp 3364164, local hdr: time 0x14cc date 0x345d, data at 69, enc hdr 12B, compressed data at 81.
- Wrote ZipCrypto cracker (brute3.c, verify: decrypt hdr byte11==0x14 AND plaintext FF D8 FF). No hit for <=6 chars [a-z0-9].
- bkcrack known-plaintext running: JFIF 12B, EXIF@6/MM+II, Adobe.
