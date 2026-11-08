---
title: "REV-03 \"Signed, Sealed, Subverted\" — notes"
description: "Confirmed buildNonce (deterministic, PRNG+sha256 in main prologue) = be7f8504a8a5d232a6e88c67a4f47ecdab45d71427e11d653365ea34d147b15f emit output (proof.mod candidate, 89 bytes): \"CSCV-PATCH v1\\nnonce= \\nmod…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "cscv", "Field notes"]
readingTime: 1
wordCount: 171
featured: false
sourcePath: "~/ctf/cscv/re3/notes.md"
---

# REV-03 "Signed, Sealed, Subverted" — notes
## Artifacts (handout/)
- updater-aarch64: static ARM64. modes: argv1=="ota" (verify signed-base.upd vs public-keys.cbor), "emit" (print CSCV-PATCH module), else path-resolution under /opt/recovery-root with pct-decode + .. normalization.
- runner.sh: ORACLE. key=HKDF(HMAC extract "CSCV2026:extract" over canon(proof.json)+"|"+sha256(proof.mod), then "CSCV2026:v2"). Decrypts flag.enc if HMAC tag matches. Need EXACT proof.json+proof.mod author used.
- flag.enc: CSCV-ENC-2 ; base64 line = nonce16|tag32|ct.
- policy.txt: protected=/etc,/usr/bin ; module path /opt/modules/proof.mod
- signed-base.upd: CBOR [bstr(51)="CSCV-OTA-base-v7\nroot=/opt/recovery-root\nversion=7\n", bstr(64)=sig]
- public-keys.cbor: {key_id: 32 bytes} (likely the ed25519 pubkey)
- boot.qcow2: DECOY (guest data all zero, crafted L1/L2).

## Confirmed
- buildNonce (deterministic, PRNG+sha256 in main prologue) = be7f8504a8a5d232a6e88c67a4f47ecdab45d71427e11d653365ea34d147b15f
- emit output (proof.mod candidate, 89 bytes): "CSCV-PATCH v1\nnonce=<buildNonce>\nmodule=/opt/modules/proof.mod\nlen=0\n"
- cbor_bstr only parses SHORT-FORM byte strings (major2, len<24). Long-form 0x58 misparsed -> parser differential = "Subverted".
- ota on signed-base fails "OTA: bad container" because parser starts pos=1 and 2nd bstr misaligns.

## Hypotheses tried & FAILED (runner tag)
- proof={path,digest,version,nonce} with path=/opt/modules/proof.mod, digest=sha256(module) hex/b64, nonce=buildNonce hex/b64, version 7/"7"; payload=emit/empty/base. ~20k combos. None match.

## Next
- Fully reverse OTA success path to learn EXACT manifest bytes.
- Consider proof.json/proof.mod come from a successful forged OTA (signed payload = proof).
