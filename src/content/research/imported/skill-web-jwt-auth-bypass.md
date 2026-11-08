---
title: "Web Jwt Auth Bypass"
description: "Use when solving CTF web challenges with JWT/JWS/JWE authentication, HS256/RS256 confusion, none alg, weak secrets, kid/jku/jwks abuse, claim tampering, or token replay. Do not use for unrelated cookie sessi…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills", "sqli", "ssrf", "jwt", "rsa"]
readingTime: 2
wordCount: 325
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-jwt-auth-bypass/SKILL.md"
---

# Web JWT Auth Bypass

## When to use

Use this skill when you see:
- Bearer token or cookie has three base64url JWT parts
- `alg`, `kid`, `jku`, `x5u`, `jwks`, or role claims are trusted
- server mixes HMAC and RSA/ECDSA keys
- weak shared secret is crackable

Do not use this skill when:
- token is opaque and only server-side state
- bug is unrelated to token verification

## Core idea

JWT attacks target verification decisions, not just decoding. Identify accepted algorithms, key lookup behavior, and claims used for authorization; then forge a token that passes verification and changes only the necessary claims.

## Recognition signals

Look for:
- `jsonwebtoken`, `pyjwt`, `jose`, `jwt.verify`
- `alg: none`, `HS256`, `RS256`, `kid` path strings
- JWKS endpoints or remote key URLs
- claims like `admin`, `role`, `isAdmin`, `aud`, `iss`, `exp`

## Standard workflow

1. Decode header/payload without trusting them.
2. Fingerprint library and allowed algorithms from source/errors.
3. Test `none` only if library/version suggests it.
4. Test HS/RS confusion by using public key as HMAC secret.
5. Audit `kid` for path traversal, SQLi, command injection, or cache confusion.
6. Check `jku`/`x5u` remote key allowlists and SSRF potential.
7. Crack weak HS secrets only after algorithm/key paths are understood.

## Commands and tools

```bash
python3 - <<'PY'
import jwt
print(jwt.get_unverified_header('TOKEN'))
print(jwt.decode('TOKEN', options={'verify_signature': False}))
PY
hashcat -m 16500 token.txt wordlist.txt
```

## Pitfalls

Common ways agents get this wrong:
- Changing claims but not resigning correctly.
- Assuming `alg:none` works in modern libraries.
- Forgetting `aud`, `iss`, or `exp` validation.
- Using a PEM public key with wrong line endings for HS/RS confusion tests.

## Verification

Prove the solve path is real with:
- server accepts forged token
- only required claim changed
- privileged endpoint response or flag-format check

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| UIUCTF 2024 | Fare Evasion | web | JWT claim/verification behavior controlled authorization. |
| LINE CTF 2024 | jalyboy-baby | web | JWT handling was central to auth bypass. |
| SekaiCTF 2023 | Chunky | web | Token and web-stack behavior combined into auth bypass. |

## Sources

* https://cryptocat.me/blog/ctf/2024/uiu/web/fare_evasion/ - source used for reusable technique extraction.
* https://adragos.ro/line-ctf-2024/#jalyboy-baby - source used for reusable technique extraction.
* https://fireshellsecurity.team/sekaictf-frog-waf-and-chunky/#challenge-chunky-16-solves - source used for reusable technique extraction.
