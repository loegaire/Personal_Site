---
title: "Flare-On — 5 catthief (SOLVED)"
description: "Flag: th3r3b3tr34sure1nth4tpc4p@flare-on.com (text on the scroll in the exfiltrated catcatcat.jpg, checked on a full-resolution crop)"
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Web Security"
kind: "field-note"
status: "solved"
tags: ["Web Security", "flareon", "Field notes", "pcap"]
readingTime: 1
wordCount: 179
featured: false
sourcePath: "~/ctf/flareon/5-cattheif/notes.md"
---

# Flare-On — 5 catthief (SOLVED)

**Flag:** `th3r3_b3_tr34sure_1n_th4t_pc4p@flare-on.com` (text on the scroll in the exfiltrated catcatcat.jpg, checked on a full-resolution crop)

## Facts
- Archive pw `flare` → `catthief.exe` (Rust PE64, ureq 2.12.1) + `capture.pcapng`
- C2: `POST http://192.168.56.102:8080/exfil`, 6 TCP streams
- Main logic: `fcn.1400029aa` (bounds from .pdata; r2 needs `analyze` level 3 to decompile it)
- Key: 25 bytes at 0x1400c9010 (16 B) + imm 0x407576c41004a6c + 0x07, XOR 0x33 → `i11_b3_p1und3r1n_y3r_d474`
- Cipher: plain RC4 (KSA at 0x1400052e2, PRGA at 0x140005281), re-keyed for every message → same keystream every time
- Protocol: client sends compressed "READY" → server replies with an RC4-encrypted file path → client reads the file (CreateFileW/NtReadFile), compresses it, sends it → loop
- Compression (src\compress.rs): MSB-first bitstream: 11b nsym(256) | 32b (unused) | 256×8b code lengths | canonical Huffman data (sorted by (len, sym)), zero-padded
- Files taken: important, anothercat, yetanothercat, catcatcat, myfavoritecat (.jpg, 2816x1536)

## Dead ends
- Running it under wine hangs (no C2 reachable)
- There is no flag in the EXIF metadata or strings (only C2PA certificate timestamps)

## Files
- dumps/bodies: raw HTTP objects; artifacts/dec: RC4-decrypted; artifacts/*.jpg: recovered images
- solve.py reproduces everything from the pcap
