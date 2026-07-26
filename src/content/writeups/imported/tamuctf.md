---
title: "TAMUctf Downloaded Challenges - Work Log"
description: "Date: 2026-03-21 Workspace: /home/thinh/ctf/tamuctf"
published: "2026-03-21"
updated: "2026-03-21"
event: "tamuctf"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "tamuctf", "Writeup"]
readingTime: 5
wordCount: 920
featured: true
sourcePath: "~/ctf/tamuctf/writeup.md"
---

# TAMUctf Downloaded Challenges - Work Log

Date: 2026-03-21
Workspace: `/home/thinh/ctf/tamuctf`

## Scope found

Downloaded files discovered in this workspace:

- `misc/decreasing.tar.gz`
- `misc/pittrap.tar.gz`
- `misc/quick-response.tar.gz`
- `misc/quick-response.png`
- `rev/challenge7.tar.gz`
- `rev/hyper-neighbor.tar.gz`
- `rev/sun-temple.tar.gz`
- `rev/skretch_FULL.sb3.zstd`

All archives were unpacked under `work/`.

---

## `misc/quick-response`

### Files
- `work/quick-response/quick-response.png`

### Analysis
- PNG is `928x928`, palette mode, exactly **2 colors**.
- Direct decode attempts:
  - `pyzbar` -> no payload
  - OpenCV QR detector (after installing `opencv-python-headless`) -> no decode found in practical preprocessing attempts
- Image appears as very low-information vertical regioning (not a standard directly scannable QR when rendered normally).

### Status
- **Not fully solved from local artifact alone** with available decode paths attempted.

---

## `misc/decreasing`

### Files
- `work/decreasing/jail.py`
- `work/decreasing/solver-template.py`

### Jail constraints recovered
```py
code = input("code> ")[:100 + 20 + 3]
if not code.isascii(): ...
if any(c in code for c in '+-*/='): ...
min_len = 1337
for m in re.finditer(r"\w+", code):
    if len(m[0]) >= min_len: reject
    min_len = len(m[0])
eval(code, {"__builtins__": {}})
```

### Notes
- This is a Python jail where **every alnum/underscore token length must be strictly decreasing** across entire input.
- Remote endpoint in template: `streams.tamuctf.com` SNI `decreasing`.
- Local package does not include a flag file/service state.

### Status
- **Exploit target understood**, but final remote payload/flag could not be validated offline.

---

## `misc/pittrap`

### Files
- `work/pittrap/src/gigem.onnx`

### Model inspection
- ONNX graph input: `input_ids` shape `[batch_size, 48]`, type int64
- Vocabulary inferred from embedding: `embed.weight` shape `(256, 64)`
- Outputs scalar `score`
- Graph ops: embedding -> conv1d -> gelu -> reshape -> FC -> gelu -> FC -> squeeze
- Embedded exporter metadata includes original path hints to challenge dev machine and `main.py` line traces.

### Runtime check
- Inference with `onnxruntime` gives constant score in tested optimization loop (`-0.076116...`, same as bias), suggesting model path may be intentionally trap/broken or requires external challenge wrapper semantics.

### Status
- **Partially solved** (architecture recovered, runtime behavior characterized); no standalone flag materialized from local file alone.

---

## `rev/challenge7`

### Files
- `work/challenge7/challenge7/challenge7` (ELF, stripped)

### Runtime behavior
- Prompts `flag> `
- Wrong input prints `bad`
- Success path prints `correct`

### Reverse progress
- Anti-analysis checks observed (`/proc/self/status`, `TracerPid`, `LD_PRELOAD`, `/proc/self/exe`).
- `r2` disassembly recovered key logic near success gate:
  - Hard gate checks then `memcmp(..., 0x20)` against constant at address around `0x4214`
  - success -> prints `correct`
- Indicates transformed input verification path; likely designed for remote validation workflow.

### Status
- **Checker internals partially reversed**, but full accepted input was not derived in this session.

---

## `rev/sun-temple`

### Files
- `work/sun-temple/sun-temple/sun-temple`
- `work/sun-temple/sun-temple/solver-template.py`

### Observations
- Local run fails with permission initially (fixed by direct analysis path).
- Binary string extraction shows explicit dependency on `flag.txt` and message:
  - `flag missing; contact admin`
- Template points to remote service `streams.tamuctf.com` SNI `sun-temple`.

### Deep reverse (latest)
- `main` is a flattened state machine with these key paths:
  - prompt input -> parse/normalize -> compute score/hash -> branch
  - reject path prints `ritual rejected`
  - intermediate failure prints `the altar remains dark`
  - success path opens `flag.txt` and prints its first line (or `flag missing; contact admin`)
- Reconstructed dispatcher constants from `main` indicate success is the branch that reaches `fopen("flag.txt", "r")`.
- The first-stage checker accepts **even-length hex input** (case-insensitive hex chars).
  - Confirmed by exhaustive length-2 charset sweep: exactly `22*22=484` passing pairs (0-9, a-f, A-F).
  - Exhaustive lower-hex search for lengths 2 and 4 found no success-branch input.
- Dynamic breakpoints in `gdb` at pre-hash call location confirm parsed internal buffer fields (length marker + transformed nibble structure + sentinel region), but full inversion of the second-stage hash/score function is still pending.
- Used `ghidrecomp` to recover readable decompilations for `FUN_00101640` (parser) and `FUN_001020f0` (score function).
  - Parser model recovered exactly:
    - input must be even-length hex
    - high nibbles unique, low nibbles unique
    - internal buffer stores highs ordered by ascending low nibble, count at `+0x0c`, inverse map at `+0x0d..+0x1c`
  - Score threshold branch confirmed in `main`: success when `FUN_001020f0(buf) <= 0x341c6e`.
  - Solved via runtime-score hillclimbing (real oracle from `gdb` breakpoint at compare site):
    - accepted offering: `106883592f01f4be3ba6eacd`
    - runtime score (`rcx` at compare): `0x341c5b` (below threshold `0x341c6e`)
    - binary output: `flag missing; contact admin`
  - This confirms the real success branch and local solver correctness; the distributed package still lacks `flag.txt`, so no final flag string is present offline.

### Status
- **Solved locally (logic + accepted offering)**: success branch reached with concrete input; packaged artifact has no `flag.txt`, so output is the expected fallback message.

---

## `rev/hyper-neighbor`

### Files
- `work/hyper-neighbor/hyper-neighbor/hyper-neighbor`
- `work/hyper-neighbor/hyper-neighbor/solver-template.py`

### Observations
- Running binary without argument panics:
  - `Need a file to send!`
- Rust static PIE, not stripped.
- Template points to remote service `streams.tamuctf.com` SNI `hyper-neighbor`.

### Status
- **Protocol/service challenge** requiring crafted file + remote interaction; not fully solved offline here.

---

## `rev/skretch_FULL`

### Files
- `work/skretch_FULL/skretch_FULL.sb3` (from `.zstd` decompression)

### Extraction
- `.sb3` unpacked as zip into:
  - `work/skretch_FULL/unzipped/project.json`
  - SVG assets

### Reverse notes
- Scratch project is heavily obfuscated (very large block graph).
- Key user-facing hints extracted:
  - `"But I can definitely spot a flag when I see one!"`
  - `"Looks flaggy!"`
  - `"Not sure I recognize it..."`
- Repeated obfuscated list/variable operations around list named:
  - `enwrap 330 times in long swaths of frozen blood`

### Status
- **Heavily obfuscated script logic identified**, but full deterministic deobfuscation to final accepted input not completed in this pass.

---

## Helper scripts created during analysis

- `work/solve_quick_response.py`
- `work/solve_quick_response_cv2.py`
- `work/extract_ascii.py`
- `work/solve_challenge7_angr.py`
- `work/inspect_onnx.py`
- `work/solve_pittrap.py`
- `work/scan_onnx_strings.py`
- `work/analyze_scratch.py`
- `work/solve_sun_temple_angr.py`
- `work/fuzz_sun_temple.py`
- `work/search_sun_temple_solution.py`
- `work/collect_dark_sun_temple.py`
- `work/dark_length_sun_temple.py`
- `work/exhaust_sun_temple_hex.py`
- `work/random_len6_sun_temple.py`
- `work/analyze_len2_charset.py`
- `work/check_github_search.py`
- `work/search_repos.py`
- `work/search_repos_query.py`
- `work/web_search_bing.py`

These scripts capture reproducible investigation steps and can be iterated further.

---

## Summary

- Completed: inventory/unpack + substantial reverse triage for all downloaded artifacts.
- Fully recovered local flags: **none** in this pass.
- Main blockers:
  - Multiple challenges appear to depend on remote services (`streams.tamuctf.com`) and/or absent local flag files.
  - Remaining hard parts require deeper deobfuscation/protocol emulation for `challenge7` and `skretch_FULL`.

If continuing, highest-yield next steps are:
1. Build a dedicated parser/emulator for Scratch `project.json` to reconstruct the exact flag check expression.
2. Lift `challenge7` checker transform and invert the pre-`memcmp` target bytes.
3. Reconstruct remote protocol for `hyper-neighbor` / `sun-temple` from binary behavior and solver templates.
