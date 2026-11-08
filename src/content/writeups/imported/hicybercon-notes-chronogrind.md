---
title: "Notes Chronogrind — Field Notes"
description: "ChronoGrind (chal 61784143-ff04-444c-868d-faa4c53939e5) - 2026-10-30"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "hicybercon", "Field notes"]
readingTime: 1
wordCount: 210
featured: false
sourcePath: "~/ctf/hicybercon/notes-chronogrind.md"
---

## ChronoGrind (chal 61784143-ff04-444c-868d-faa4c53939e5) - 2026-10-30

### Files
- flag.enc: 68 bytes, container `CGFX`|ver(1)|nonce(12)|tag(16)|ct(35). chacha20-poly1305.
- state.dat: 1358 bytes, XOR 0x4c obfuscated, then TLV records: tag(1)+len(4 LE)+data.
  - Header 6 bytes (0f 0b 08 7d 00 4c).
  - rec[01] = team=testrun
  - rec[11] = anchor  (base241, big-endian digits) -> 2048-bit composite N
  - rec[22] = seed    (base241)
  - rec[33] = "9000000000" (decimal) -> cycles = 9e9
  - rec[44] = chk = sha256("anchor:seed:cycles")[:8]  (VERIFIED matches)
  - rec[55] = note "the anchor holds. keep grinding."
  - rec[66] = 259 bytes base241 (<N) - decoy/unknown, does NOT decrypt flag
  - rec[77] = device notes (derivation spec)
  - rec[88] = 21 bytes (not base241-valid)
- Derivation: v=seed; repeat 9e9 times: v=v*v mod N; k=sha256(v as 256-byte BE);
  flag = chacha20-poly1305_decrypt(k, nonce, ct) (tag must verify).

### Approach
- N is composite 2048-bit, no small factors (<2e5), Fermat fails, no easy shortcut.
- Must grind 9e9 sequential modular squarings (single-thread, per hint).
- Implemented grind_final.c: OpenSSL BN Montgomery (fastest, ~0.6us/iter idle, ~1.0us loaded).
- grind3.c GMP mpn_redc_1 ~1.08us; grind2.c GMP addmul ~1.3us (idle). OpenSSL best.
- Verified grind implementations against Python reference for 1000 steps (match).
- Resumable via chk.txt (iteration + montgomery value hex). ETA ~2.4-2.5h on this laptop.
- decrypt.py computes k=sha256(v.to_bytes(256,'big')) and decrypts flag.enc.
- PARI factor(N) attempt launched (bounded) - expected to fail (hard semiprime).
