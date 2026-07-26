---
title: "Simple Calculator — Field Notes"
description: "Confirmed state Challenge artifact: illogical.apk (Android APK, one classes.dex, obfuscated resource filenames). Empty notes at start; original APK preserved. User hints: tap order is XOR-encoded; AES-128-CB…"
published: "2026-07-19"
updated: "2026-07-19"
event: "athenactf"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "athenactf", "Field notes"]
readingTime: 1
wordCount: 119
featured: false
sourcePath: "~/ctf/athenactf/simple_calculator/notes.md"
---

## Confirmed state
- Challenge artifact: `illogical.apk` (Android APK, one `classes.dex`, obfuscated resource filenames).
- Empty notes at start; original APK preserved.
- User hints: tap order is XOR-encoded; AES-128-CBC flag; key derives from two 8-byte fragments in different classes, XOR then SHA-256 first 16 bytes.
- Next: decode APK into `artifacts/`, decompile classes, locate click-order checker and crypto constants.

## Solved
- `MainActivity.w()` computes expected taps as `a[i] ^ ((((i*11)^55)+100)&255)`.
- Required order: `3 7 0 5 2 8 1 6 9 3 5 2 8 0 6 1`; stage markers are 5, 11, 16 and the final stage reflectively invokes `revealFlag`.
- `MainActivity.c XOR defpackage.g9.f786a = 63ac5253e3fdeea1`.
- SHA-256 fragment digest, first 16 bytes: `6fc3b8c31ca7aa49ee0ef7bd734b1bf5`.
- AES/CBC/PKCS5Padding with `d` as IV and `e` as ciphertext decrypts to `athena{2850289b2ace6865dc26fccf571b1f2a}`.
