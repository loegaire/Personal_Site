---
title: "Pwn Format String Leak Write"
description: "Use when solving CTF pwn challenges where user input reaches printf-family format strings, enabling stack/libc/PIE leaks, arbitrary writes with %n, GOT/return-address overwrites, or partial-byte/halfword wri…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Binary Exploitation"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Binary Exploitation", "Agentic Skills", "gdb", "format-string"]
readingTime: 2
wordCount: 313
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/pwn-format-string-leak-write/SKILL.md"
---

# Pwn Format String Leak Write

## When to use

Use this skill when you see:
- `printf(buf)`, `fprintf(stream, user)`, `syslog(user)`, `dprintf(fd, user)`
- need to leak canary, PIE, stack, or libc
- need `%n`, `%hn`, or `%hhn` writes

Do not use this skill when:
- format string is constant and user input is only an argument
- target binary has no reachable printf-style sink

## Core idea

Treat the bug as two primitives: indexed reads for leaks and byte/halfword writes for control. First discover argument offset, then perform deterministic writes with sorted padding and architecture-aware widths.

## Recognition signals

Look for:
- output echoes `%p` values
- `%n` is not blocked
- GOT entries writable when RELRO is partial/no
- stack return address or saved function pointer visible near format arguments

## Standard workflow

1. Find the first controlled argument index.
2. Leak stack/libc/PIE/canary values with positional specifiers.
3. Choose target: GOT, return address, fini array, global flag, or hook.
4. Use `fmtstr_payload` or manual sorted halfword writes.
5. Account for already-printed byte count and newline/prompt bytes.
6. Verify each write in a local process/GDB before remote.

## Commands and tools

```bash
python3 - <<'PY'
from pwn import *
print(FmtStr)
print(fmtstr_payload(6, {0x404040: 0xdeadbeef}, write_size='short'))
PY
```

## Pitfalls

Common ways agents get this wrong:
- Using non-positional writes when stack layout changes.
- Forgetting `%n` writes the printed character count.
- Writing full 8-byte values when halfword writes are more reliable.
- Ignoring RELRO when choosing GOT targets.

## Verification

Prove the solve path is real with:
- argument offset is stable
- leaks decode into valid mapped ranges
- write target changes to exact expected bytes
- final target call is reached

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| corCTF 2024 | format-string | pwn | Direct format-string exploitation with controlled writes. |
| DCTF 2021 | formats_last_theorem | pwn | Format string leak/write scripting against a remote service. |
| ImaginaryCTF 2021 | Formatting | pwn | CTF-style format offset discovery and payload construction. |

## Sources

* https://sashactf.gitbook.io/pwn-notes/ctf-writeups/cor-ctf-2024/format-string - source used for reusable technique extraction.
* https://github.com/datajerk/ctf-write-ups/tree/master/dctf2021/formats_last_theorem - source used for reusable technique extraction.
* https://github.com/Pynard/writeups/blob/main/2021/IMAGINARYCTF/challenges/formatting.md - source used for reusable technique extraction.
