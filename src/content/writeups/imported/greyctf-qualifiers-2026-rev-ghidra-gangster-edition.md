---
title: "Ghidra Gangster Edition — Field Notes"
description: "Artifacts: Outer zip: drive-download-20260530T102636Z-3-001.zip (393,512,463 bytes) Inner distro zip: extracted/ghidra12.2DEV.zip (393,451,754 bytes) builddetails.txt: Ghidra 12.2 DEV, commit 3d92a003fcd9a99…"
published: "2026-05-30"
updated: "2026-06-06"
event: "GreyCTF Qualifiers 2026"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "GreyCTF Qualifiers 2026", "Field notes"]
readingTime: 4
wordCount: 787
featured: false
sourcePath: "~/ctf/GreyCTF Qualifiers 2026/Rev/ghidra gangster edition/notes.md"
---

## 2026-05-30 continuation

Artifacts:
- Outer zip: `drive-download-20260530T102636Z-3-001.zip` (393,512,463 bytes)
- Inner distro zip: `extracted/ghidra_12.2_DEV.zip` (393,451,754 bytes)
- `build_details.txt`: Ghidra 12.2 DEV, commit `3d92a003fcd9a9949d78a172dc7295b95af12965`, Windows x64 build.

Confirmed searches:
- Broad direct zip byte search for `grey{`, `grey`, `flag`, `gangster`, `talking`, `three in the morning`, `decompiler started`, `LLM`, `agent` found no direct flag. Lots of normal Ghidra/debugger `flag`/`agent` noise.
- Nested zip/JAR recursive string search found only two meaningful challenge edits:
  - `Ghidra/application.properties`: `application.name=Ghidra Gangster Edition`
  - `Ghidra/Configurations/Public_Release/lib/Public_Release.jar!splash.txt`: "this version of Ghidra is for REAL GANGSTERS."
- Timestamp anomaly scan of the inner zip:
  - Most files are timestamped `1980-02-01 00:00:00`.
  - `Ghidra/Features/Decompiler/os/win_x86_64/decompile.exe` has timestamp `2026-05-28 21:17:56`, size `3014144`.
  - `Ghidra/Processors/x86/data/languages/x86-64.sla.lock` has timestamp `2026-05-28 20:34:10`, size `0`.

Current hypothesis:
- The challenge payload is probably a modified Windows `decompile.exe`, matching "my decompiler started talking to me" and "drop in a binary".

Next tests:
- Extract and inspect `decompile.exe` strings/imports/resources.
- Compare `decompile.exe` against an upstream build/source if a direct string/recovery path does not pop quickly.

## decompile.exe static diff findings

Confirmed:
- `decompile.exe`: PE32+ x86-64 console binary, static MSVC runtime style, imports mostly KERNEL32 only, no PDB path, no plaintext flag.
- `wine decompile.exe` and `wine decompile.exe --help` exit code 1 with no useful output.
- Upstream source checkout at Ghidra commit `3d92a003fcd9a9949d78a172dc7295b95af12965`; distro x86 language source matches upstream after line-ending normalization. `x86-64.sla.lock` timestamp anomaly appears harmless.
- Four challenge strings are present in `.rdata` but absent from upstream Decompiler source:
  - VA `0x14021dfb0`: `you called it '%s' -- I want a nicer name...`
  - VA `0x14021dfe0`: `I don't like this function size (%llu bytes)...`
  - VA `0x14021e010`: `this block count (%llu) tells me nothing...`
  - VA `0x14021e040`: `I want the function name to be nice too...`
- Message pointer table around VA `0x1402b9510`:
  - `0x1402b9510 -> 0x14021dfb0`
  - `0x1402b9518 -> 0x14021dfb0`
  - `0x1402b9520 -> 0x14021dfe0`
  - `0x1402b9528 -> 0x14021e010`
  - `0x1402b9530 -> 0x14021e040`
- Key injected function is around `0x1401ea6b0`, called by loop function around `0x1401ea2d0`, which is called from function around `0x140093040` at `0x140093180`.
- `0x1401ea2d0` loops index `0..3`, calls `0x1401ea6b0(arg1, i, outbuf)`, and emits/forwards the resulting talking-decompiler text.
- `0x1401ea6b0` reads hidden tables at:
  - `0x14021fa88`: int32 indices for one object field loaded from `object + 0x60 + 8*idx`
  - `0x14021fa98`: int32 indices for another object field loaded from `object + 0x60 + 8*idx`
  - `0x14021faa8`: int32 branch/control values
  - `0x14021fab8`: qword xor/expected table for one loaded qword
  - `0x14021fad8`: qword xor/expected table for the other loaded qword
- If the selected branch/control dword is nonzero, the code xors the two loaded qwords with table qwords and emits one of the complaint strings unless both become zero.
- If the selected branch/control dword is zero, it builds a 16-byte printable string from the two loaded qwords into the caller's output buffer. This is likely the success/flag-chunk path.

Current hypothesis:
- The modified decompiler leaks flag chunks only when decompiling a binary whose function metadata matches hidden constraints (name, size, block count, "nice" function name). Need map `0x140093040`/object layout to upstream source classes, then construct or identify binary/function attributes that satisfy the tables.

Next tests:
- Dump all hidden tables at `0x21fa88`, `0x21fa98`, `0x21faa8`, `0x21fab8`, `0x21fad8`, and nearby data.
- Identify the upstream source function corresponding to `0x140093040` from nearby strings/xrefs.

## Solved

Flag:
- `grey{a80u7_7im3_w3_add3d_SROP_in70_0ur_d3c0mpi13r5...cute...:3c}`

Verification:
- `python3 solve.py` prints:
  - function name: `angel_fulla_love`
  - function size: `0x400`
  - block count: `49`
  - full flag above
- Rechecked on 2026-06-06: `artifacts/decompile.exe` is byte-for-byte
  identical to the executable in the original distribution. Both have SHA-256
  `217e6ff2bf316db3ed0cdf38078512fac3708a6d543b925e0350e5d8f861e65c`.
- `solve.py` has PEP 723 dependency metadata and can be run reproducibly with
  `uv run solve.py`.
- Fresh verification on 2026-06-06 completed successfully: `uv run solve.py`
  installed the three declared packages, solved all metadata constraints, and
  printed the flag. Tooling caveat: `uv run python -` does not inherit another
  file's PEP 723 metadata; ad hoc checks need explicit `--with` packages.

Final method:
- `0x140093040` captures decompiler function metadata into global state:
  - first 16 bytes of function name at `state+0xe0/+0xe8`
  - function size at `state+0xf0`
  - basic-block count at `state+0xf8`
- `0x14006fe80` installs a vectored exception handler, allocates a no-access page, and uses `RtlCaptureContext`/`NtContinue` to execute a 468-row encrypted CONTEXT table.
- The decoded rows dispatch six small gadgets:
  - load metadata qword to register
  - register move
  - register op with immediate
  - register op with register
  - store register to `state+0x60+8*i`
  - load register from `state+0x60+8*i`
- Z3 solves the independent VM constraints:
  - `state+0x68/+0x70 == (0x26d8fb3b9869f7a9, 0xa58e0ce1c33bb4fd)` -> first 8 name bytes `angel_fu`
  - `state+0x78/+0x80 == (0x2b4e394612390be8, 0xbf263a4c6f201789)` -> second 8 name bytes `lla_love`
  - `state+0x88/+0x90 == (0xae886256c8c1afe5, 0xa394e1312f182d1c)` -> function size `0x400`
- The AES table at `0x14021fb00` contains four 16-byte ciphertext chunks.
  - chunk 0 key: `SHA256(b"angel_fu")`
  - chunk 1 key: `SHA256(b"lla_love")`
  - chunk 2 key: `SHA256(b"angel_fulla_love" + p64(0x400) + b"\x02")`
  - chunk 3 key: `SHA256(p64(state+0x98) + p64(state+0xa0))`; brute force block count finds printable output at block count `49`.
