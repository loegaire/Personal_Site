---
title: "Flare-On 8 — crux  (SOLVED)"
description: "Flare-On 8 — crux (SOLVED) Flag: Pr4ttPr1M4lItYC3rt54ndWa4aA4aAA4aAA4a4a5M@flare-on.com (printed by check() under node, scratch/run.js)"
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "flareon", "Field notes", "wasm", "aes"]
readingTime: 1
wordCount: 154
featured: false
sourcePath: "~/ctf/flareon/8-crux/notes.md"
---

# Flare-On 8 — crux  (SOLVED)
Flag: `Pr4tt_Pr1M4lItY_C3rt5_4nd_Wa4aA4aAA4aAA4a4a5M@flare-on.com` (printed by check() under node, scratch/run.js)

## Facts
- Chrome MV3 extension; popup calls `window.check(str)` exported by Go→wasm (`main.wasm`), garble-obfuscated (string literals encrypted, ~90% func names zeroed).
- pclntab at mem 0x51660 (magic garbled); names → artifacts/funcnames.txt (wasm func idx = k+20). main.* at 3241..3274.
- Pipeline (func 3270): base64 std → AES-256-CBC decrypt (key cabeba7a…8723, iv 5ff26040…5d91, captured by hooking NewCipher 3184) → PKCS7 unpad → sha256(pt) → 3267 deserialize → 3269 validate → compare root A with N (3254) → AES key = sha256(pt) decrypts flag.
- Serialization: `00` = leaf(prime 2); `01 u32 n {u32 len child}*n u32 len A(LE bignum) u32 len B` — Pratt certificate (children = sorted prime factors of A-1, B = smallest primitive root).
- N = 95681613235744740119807961018865688051340183696570761153419351987106658443873; N-1 = 2^5·1777·117013415621·p61.

## Tooling
- binaryen `--log-execution` for coverage; scratch/mkhook.mjs inserts `gojs.hook(fidx, SP)` at function entry (Function.setBody, keeps indices) → dump Go-stack args.
- scratch/lift.py: crude Go-wasm state-machine lifter.
