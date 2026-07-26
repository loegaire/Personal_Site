---
title: "Pwn Ppp — Field Notes"
description: "Scope: authorized SEKAI 2026 pwn challenge in /home/thinh/ctf/sekai2026/pwnppp. Remote: nc ppp.chals.sekai.team 1337. Present files: pwnppp.tar.gz, solveppp.py, notes.md. notes.md was empty at start; no prio…"
published: "2026-06-27"
updated: "2026-06-27"
event: "sekai2026"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "sekai2026", "Field notes"]
readingTime: 2
wordCount: 371
featured: false
sourcePath: "~/ctf/sekai2026/pwn_ppp/notes.md"
---

## 2026-06-27 start

- Scope: authorized SEKAI 2026 pwn challenge in `/home/thinh/ctf/sekai2026/pwn_ppp`.
- Remote: `nc ppp.chals.sekai.team 1337`.
- Present files: `pwn_ppp.tar.gz`, `solve_ppp.py`, `notes.md`.
- `notes.md` was empty at start; no prior confirmed exploit state was preserved here.
- Workflow: preserve original artifacts; use `scratch/`, `dumps/`, `artifacts/` for experiments/extraction.

## Inventory

- `pwn_ppp.tar.gz` SHA256: `6b1b34827cff01538866cece9100bbbcad4c887127c0460a945ff43a69b9c384`.
- Archive members: `Dockerfile`, `afc_list`, `flag.txt`, `hook.sh`, `libc.so.6`, `src/afc_list.c`, `src/readflag.c`.
- Extracted under `artifacts/pwn_ppp/`.
- Existing `solve_ppp.py`: raw socket AFC protocol exploit; grooms 0x20 tcache chunks, overflows an undersized receive buffer, poisons tcache fd to `free@GOT`, writes low 6 bytes of `system`, then frees `/readflag sekai ppp`.
- Current likely blocker: script guesses libc base; need confirm local behavior and derive/handle remote ASLR.

## Confirmed Analysis

- Binary protections: Partial RELRO, stack canary, NX, no PIE, SHSTK/IBT; `free@GOT = 0x404070`.
- Provided libc is Ubuntu GLIBC `2.31-0ubuntu9.18`; `system` offset is `0x52290`.
- Docker `hook.sh` enables `persona_addr_no_randomize: true`, so remote should use a fixed library layout.
- `afc_receive_data()` allocates `entire_length - sizeof(AFCPacket)` but reads `this_length - sizeof(AFCPacket)` first, so responses with `entire_length < this_length` give a heap overflow.
- `make_strings_list()` uses `strdup()` per NUL-terminated token; the solver uses this for 0x20 tcache poisoning into `free@GOT`.
- Built Dockerfile `app` stage locally. Hashes match provided `afc_list` and `libc.so.6`.
- Live app-stage no-ASLR map has libc base `0x7ffff7d63000`; remote attempt with that base crashed with signal 4, so final deployed layout differs or the wrapper shifts mappings.

## Commands Tried

- `python3 solve_ppp.py -v`: tried built-in bases; no flag.
- `python3 solve_ppp.py --base 0x7ffff7d4f000`: no flag, signal 11.
- `python3 solve_ppp.py --base 0x7ffff7dae000`: no flag, signal 11.
- `python3 solve_ppp.py --base 0x7ffff7d63000`: no flag, signal 4.
- Created `scratch/scan_bases.py` for faster concurrent page-aligned base scanning.

## Fix

- Existing payload put `/readflag sekai ppp` after the poisoned fd at offset `0x20`.
- Local Docker/TCP test showed token0's `strdup()` reuses the groomed chunk and clobbers bytes at offset `0x20` while `make_strings_list()` is still parsing, so the command token was not reliably preserved.
- Fixed payload places the shorter shell-expanded command `/*flag sekai ppp` before offset `0x20`; shell expands `/readflag`.
- Local verification: `python3 solve_ppp.py --host 127.0.0.1 --port 5001 --base 0x7ffff7d63000` prints `SEKAI{REDACTED}` from bundled flag.

## Remote Result

- Correct remote libc base: `0x7ffff7d65000`.
- Command: `python3 scratch/scan_bases.py --range 0x7ffff7d00000:0x7ffff7dc0000:0x1000 -j 4`.
- Remote output contained: `SEKAI{du_bist_gut_genuggggggggggggg}`.
- Patched `solve_ppp.py` to try `0x7ffff7d65000` first and added `solve.py` wrapper.
- Final verification: `python3 solve.py` succeeds remotely and prints `SEKAI{du_bist_gut_genuggggggggggggg}`.
