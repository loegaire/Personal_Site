---
title: "Crypto Aes Mode Oracle Attacks"
description: "Use when solving CTF crypto challenges involving AES modes, CBC padding oracles, ECB block cut-and-paste, CTR/GCM nonce reuse, tag forgery, bit flipping, or custom block-mode wrappers. Do not use for RSA/ECC…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Cryptography"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Cryptography", "Agentic Skills", "aes"]
readingTime: 2
wordCount: 303
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/crypto-aes-mode-oracle-attacks/SKILL.md"
---

# Crypto AES Mode Oracle Attacks

## When to use

Use this skill when you see:
- AES-CBC/ECB/CTR/GCM appears in source or traffic
- encrypt/decrypt/check oracle available
- nonce/IV reuse or user-controlled plaintext/ciphertext
- authentication tag or padding error leaks behavior

Do not use this skill when:
- no block cipher mode is involved
- problem is only a password/KDF brute force

## Core idea

Identify the exact mode and attacker controls. ECB leaks block equality, CBC permits padding-oracle and bit-flip attacks, CTR/GCM fail under nonce reuse, and unauthenticated encryption allows malleability even when decryption is unavailable.

## Recognition signals

Look for:
- fixed IV or nonce
- different error for padding vs MAC
- base64 ciphertext with block-size multiples
- `AES.MODE_ECB/CBC/CTR/GCM`
- same nonce with multiple ciphertexts

## Standard workflow

1. Determine block size and encoding.
2. Classify mode from code or chosen-plaintext tests.
3. For ECB, align blocks and splice/cut-and-paste.
4. For CBC, test padding oracle and IV/previous-block bit flips.
5. For CTR, XOR known plaintexts under nonce reuse.
6. For GCM, check nonce reuse and tag-verification misuse.
7. Keep oracle requests logged and replayable.

## Commands and tools

```bash
python3 - <<'PY'
from Crypto.Cipher import AES
print(AES.block_size)
PY
python3 - <<'PY'
import base64, sys
ct=base64.b64decode(sys.argv[1]) if len(sys.argv)>1 else b''
print(len(ct), len(ct)%16)
PY
```

## Pitfalls

Common ways agents get this wrong:
- Assuming AES is broken instead of the mode/nonce/oracle.
- Confusing IV control with key control.
- Treating padding and MAC errors as equivalent without testing timing/messages.
- Forgetting URL/base64 encoding when flipping bytes.

## Verification

Prove the solve path is real with:
- mode classification proof
- oracle transcript or local reproduction
- forged plaintext/ciphertext accepted by challenge verifier

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| SEC-T CTF | Bad AES | crypto | Mode misuse made AES challenge solvable through structural analysis. |
| Insomni'hack teaser 2023 | GCM | crypto | GCM misuse required nonce/tag reasoning. |
| WolvCTF 2024 | Blocked1 | crypto | Block-mode behavior drove the solve workflow. |

## Sources

* https://pequalsnp-team.github.io/writeups/Bad-Aes - source used for reusable technique extraction.
* https://sylvainpelissier.gitlab.io/posts/2023-01-12-insomnihackteaser23-gcm/ - source used for reusable technique extraction.
* https://nightxade.github.io/ctf-writeups/writeups/2024/Wolv-CTF-2024/crypto/blocked-1.html - source used for reusable technique extraction.
