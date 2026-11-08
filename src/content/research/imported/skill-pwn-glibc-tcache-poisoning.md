---
title: "Pwn Glibc Tcache Poisoning"
description: "Use when solving CTF pwn challenges with glibc heap bugs, tcache dup/poisoning, use-after-free, double free, safe-linking leaks, malloc/free hooks, or arbitrary allocation primitives. Do not use for non-glib…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Binary Exploitation"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Binary Exploitation", "Agentic Skills", "heap"]
readingTime: 2
wordCount: 364
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/pwn-glibc-tcache-poisoning/SKILL.md"
---

# Pwn Glibc Tcache Poisoning

## When to use

Use this skill when you see:
- glibc heap menu challenges with allocate/edit/free/show
- UAF, double free, off-by-null, overlapping chunks, or tcache freelist corruption
- safe-linking pointer mangling and heap/libc leaks

Do not use this skill when:
- the allocator is jemalloc, Windows LFH, a custom slab, or kernel SLUB
- the bug is a stack-only overflow with no malloc/free surface

## Core idea

Turn a heap memory misuse primitive into a controlled allocation. In modern glibc, first obtain a heap leak for safe-linking, then corrupt tcache metadata so a later `malloc(size)` returns a target address or overlapping chunk.

## Recognition signals

Look for:
- `malloc`, `calloc`, `free`, `realloc`, `puts`/show functions
- one edit after free or free twice path
- fixed-size bins and count-limited tcache behavior
- mangled fd pointers that XOR with heap page address
- __free_hook or IO_FILE targets in older glibc

## Standard workflow

1. Identify glibc version and protections.
2. Map chunk sizes to tcache bins and script deterministic heap grooming.
3. Prove leak primitive for heap and libc before writing.
4. Recover safe-linking key as `heap_base >> 12` when needed.
5. Poison tcache fd to a target with correct alignment and size constraints.
6. Allocate until the poisoned pointer is returned, then overwrite the target.
7. Trigger a benign controlled call before final command/flag read.

## Commands and tools

```bash
checksec --file ./chall
ldd ./chall
python3 - <<'PY'
from pwn import *
e = context.binary = ELF('./chall')
print(e.checksec())
PY
```

## Pitfalls

Common ways agents get this wrong:
- Ignoring tcache count state and wondering why allocation order differs.
- Using pre-safe-linking exploits on glibc 2.32+ without a heap leak.
- Targeting hooks that do not exist in modern glibc.
- Forgetting 16-byte alignment and size-class consistency.

## Verification

Prove the solve path is real with:
- heap/libc leak values are reproducible
- the poisoned allocation returns the intended address
- a benign overwrite changes controlled behavior before final payload

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| HITCON CTF 2018 | Children Tcache | pwn | Classic tcache poisoning workflow around heap grooming and libc control. |
| angstromCTF 2022 | dreams | pwn | Menu heap primitives chained into tcache overwrite behavior. |
| corCTF 2022 | cshell2 | pwn | Modern glibc heap exploitation required leak-first reasoning. |

## Sources

* https://github.com/sajjadium/ctf-writeups/tree/master/HITCON/2018/children_tcache - source used for reusable technique extraction.
* https://github.com/TomasGlgg/CTF-Writeups/blob/master/angstromCTF%202022/dreams/Writeup.md - source used for reusable technique extraction.
* https://ret2school.github.io/post/cshell2/ - source used for reusable technique extraction.
