---
title: "Notes Obfuscated Flow — Field Notes"
description: "Obfuscated Flow (rev) — SOLVED Flag: hiCTF{m4thc0ntr0lfl0w3ll1pt1cdlog4f7b2c9e} (submit returned badAlreadySolvedChallenge → accepted/correct)"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "hicybercon", "Field notes"]
readingTime: 1
wordCount: 213
featured: false
sourcePath: "~/ctf/hicybercon/notes-obfuscated-flow.md"
---

## Obfuscated Flow (rev) — SOLVED
Flag: `hiCTF{m4th_c0ntr0l_fl0w_3ll1pt1c_dlog_4f7b2c9e}`
(submit returned badAlreadySolvedChallenge → accepted/correct)

### How
- `challenge` reads a 47-byte line: `hiCTF{` + 40-byte passkey + `}` (checked: strlen 47,
  prefix `hiCTF{` strncmp 6, buf[46]=='}').
- Main is control-flow flattened (state var dispatched at 0x401740, tables at 0x4030e0..).
  Accept path: 0x2f71a8d4(401b9d,constant) -> 0x6b3e91f2(4016dd) -> 0x19c45d80(401822/401c76)
  -> 0x43b7e025(4015ad) -> 0x51e29f3a(4017db) -> 0x3d087b16(40176a) -> 0x38a5f41c(401a9a print).
- Prologue reads 10 little-endian dwords of the passkey (offsets 6,10,...,42) as W0..W9
  and builds modular checks (mod 2^31-1, 10^9+7, 2^32-5).  Helper 0x4028f0 = 128-bit mod;
  0x401f80 = ARX(4x64) mix (8 rounds, ChaCha-like); 0x402010 = Miller-Rabin primality.
- Check1 (W0,W1): W0^2 -31337*W1^2 = 0x1e054920, W0*W1 = 0x37c0f52c (mod 2^31-1)
  -> W0="m4th", W1="_c0n".
- Check4 (W6,W7): 2 linear eqns mod 2^32-5 -> W6="1c_d", W7="log_".
- Check5 (W8,W9): sum/prod eqns mod 2^31-1 (+primality of W8^9, W9^0x11)
  -> W8="4f7b", W9="2c9e".
- Check3 (W4,W5): 7^(W4 mod 2^31-2)=0x7bb949ec and 11^(W5 mod 2^31-2)=0xb3bbfc8 (mod 2^31-1)
  -> discrete logs (BSGS, group smooth) -> W4="w_3l", W5="l1pt".
- Check2 (W2,W3) uses 0x402220 (heavy crypto); NOT needed: the final print buffer
  (`out` = expand(state) ^ table@0x4031a0, 98 bytes) depends only on constants, W0/W1 and W8/W9.
  Simulated state evolution (XORs + 0x401f80) and the 98-byte expansion -> plaintext flag.
- Passkey = bytes W0..W9 = "m4th_c0ntr0l_fl0w_3ll1pt1c_dlog_4f7b2c9e"; running the binary with
  hiCTF{<that>} prints ACCESS GRANTED + the flag (verified exit 0).
