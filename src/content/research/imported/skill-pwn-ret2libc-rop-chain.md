---
title: "Pwn Ret2libc Rop Chain"
description: "Use when solving CTF pwn challenges with stack overflow, NX enabled, libc leak, ROP gadgets, ret2libc, ret2plt, ret2csu, one_gadget, SROP-like stack control, or staged return chains. Do not use for heap-only…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Binary Exploitation"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Binary Exploitation", "Agentic Skills", "buffer-overflow", "ret2libc", "rop", "shellcode"]
readingTime: 2
wordCount: 322
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/pwn-ret2libc-rop-chain/SKILL.md"
---

# Pwn Ret2libc ROP Chain

## When to use

Use this skill when you see:
- buffer overflow with NX enabled
- PIE/ASLR requiring an address leak
- PLT/GOT calls available for leak and re-entry
- need to call `system('/bin/sh')`, ORW, or a syscall chain

Do not use this skill when:
- no control of return address
- the primary primitive is heap metadata corruption
- shellcode execution is available and simpler

## Core idea

Build a two-stage exploit: leak a runtime address, compute libc/base addresses, then return through a minimal aligned ROP chain to the desired libc function or syscall sequence.

## Recognition signals

Look for:
- `gets`, `read`, `scanf('%s')`, `strcpy`, unchecked `fgets` length
- `puts@plt`/`write@plt` and GOT entries
- crash RIP control in cyclic pattern
- stack alignment crashes inside `system` or `movaps`

## Standard workflow

1. Find exact offset with cyclic pattern.
2. Check PIE, RELRO, canary, NX.
3. If canary exists, leak it before returning.
4. Leak libc with `puts(got)` or `write(1, got, 8)` and return to main.
5. Resolve libc version locally or remotely.
6. Build aligned second-stage chain with `ret` padding if needed.
7. Prefer ORW chain when shell is blocked by seccomp.

## Commands and tools

```bash
checksec --file ./chall
ROPgadget --binary ./chall | rg 'pop rdi|ret'
python3 - <<'PY'
from pwn import *
print(cyclic(200))
print(cyclic_find(0x6161616c))
PY
```

## Pitfalls

Common ways agents get this wrong:
- Skipping stack alignment on amd64.
- Using local libc offsets against a remote libc.
- Forgetting PIE base when using binary gadgets.
- Leaking with buffered output but not draining prompts.

## Verification

Prove the solve path is real with:
- RIP offset is proven by crash pattern
- leaked address resolves to expected libc symbol range
- second stage returns shell, ORW output, or verifier response

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| DCTF 2021 | Baby bof | pwn | Basic overflow into leak-then-ret2libc chain. |
| DiceCTF 2022 | babyrop | pwn | ROP chain construction after stack control. |
| SECCON CTF 2021 | gosu bof | pwn | Ret2libc workflow adapted to challenge-specific calling constraints. |

## Sources

* https://github.com/datajerk/ctf-write-ups/tree/master/dctf2021/baby_bof - source used for reusable technique extraction.
* https://0xten.gitbook.io/public/dice-ctf/2022/babyrop - source used for reusable technique extraction.
* https://github.com/datajerk/ctf-write-ups/tree/master/seccon2021/gosu - source used for reusable technique extraction.
