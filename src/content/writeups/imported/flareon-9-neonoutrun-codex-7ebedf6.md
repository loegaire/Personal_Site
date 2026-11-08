---
title: "FLARE-ON 9 — NeonOutRun"
description: "Written by Codex, building on Claude/Opus's existing extraction work in this shared workspace."
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Forensics"
kind: "writeup"
status: "solved"
tags: ["Forensics", "flareon", "Writeup", "frida"]
readingTime: 4
wordCount: 772
featured: true
sourcePath: "~/ctf/flareon/9-neonoutrun/codex/writeup.md"
---

# FLARE-ON 9 — NeonOutRun

Written by Codex, building on Claude/Opus's existing extraction work in this shared workspace.

**Recovered flag:** `R3_ag3nt_4b0ut_t0_f33l_d1zzy@flare-on.com`

The user confirmed that `R3_ag3nt_4b0ut_t0_f33l_d1zzy` was correct. The suffix follows from the native output construction described below.

## Reproduce the solution

From the challenge directory:

```sh
python codex/solve_native.py
```

Requires Python packages `unicorn` and `pyelftools`. The solver reads `artifacts/neon_outrun`, maps its ELF load segments into Unicorn, applies `R_X86_64_RELATIVE` relocations, and executes the original decoding routines. It does not need a GUI or Frida.

The original ELF's SHA-256 was independently compared with the archive member extracted using password `flare`:

```text
73edf4e289d199f5e5df622855c1787ba12a4a0c7205813103d7a53f300220e0
```

## The visible game is a distraction

The target is a stripped x86-64 ELF containing a Rust/Tauri frontend and an embedded V8 engine. Claude recovered frontend assets and the 4,229-byte game script in `artifacts/game.js`. His notes describe its decoding pipeline as custom byte transformations/LZ, then Zstandard, then raw DEFLATE, then JavaScript.

The frontend calls `plugin:neon|e` with JSON player input each frame. JavaScript implements the road, obstacles, and 28 laps. Every completed lap contributes one character:

```js
neon += messages[Math.floor((state.currentLap - 1) / 2)]
                [map[state.currentLap - 1]];
```

On lap 28 it appends character codes for `@f1are-on.com` and calls:

```js
state.neon = neon.replaceAll(' ', '_');
```

Reading these expressions, or executing the script under ordinary Node.js, yields the decoy:

```text
decode_this_system_to_win_it@f1are-on.com
```

Codex independently captured the same script from the original executable's live memory and initially mistook reproduction of this string for a solution. That was insufficient: the native program changes the JavaScript environment before loading the script. The user corrected the decoy conclusion.

## Three native replacements

Static analysis of initialization at `0x688c64` reveals XOR-decoded property names and installation of native callbacks. Addresses below are ELF virtual addresses before the PIE load base is added.

| JavaScript function | Native callback | Installation reference |
|---|---:|---:|
| `String.prototype.replaceAll` | `0x67e81e` | `0x689334` |
| `Math.min` | `0x67eb83` | `0x6896ac` |
| `Array.prototype.sort` | `0x67deb2` | `0x689b0a` |

The callbacks preserve ordinary functionality while maintaining a second, hidden computation.

`Array.prototype.sort` runs when lap positions are generated. It constructs a queue of weights from sorted positions multiplied by a random positive scale, records their sum, and resets the hidden byte buffer and lap counter.

`Math.min` runs at each finish line in this apparently ordinary statement:

```js
state.bestLapSeconds = Math.min(state.bestLapSeconds, lapSecs);
```

The callback reads the second argument, rounds it, checks that the rounded result fits a byte, and appends that byte to a hidden buffer. It also consumes a queued weight and updates a trigonometric aggregate derived from the byte and lap index.

`String.prototype.replaceAll` checks the hidden aggregates. A normal race produces the decoy unless the lap times satisfy this extra condition.

## Recovering the timing equations

The native code uses control-flow flattening and long sequences of rotations, XORs, additions, byte swaps, and bit reversals. Rather than manually simplify every constant, execute the relevant machine-code slices with Unicorn.

1. Execute `0x67ed5b` through `0x67eec7`: the hidden key is **90**.
2. Execute `0x67ef9f` through `0x67f8b8`: the constructed angular divisor is **180**, and the series has **16** terms.
3. For each zero-based lap index `i`, execute `0x67f9d8(i, 90)`. Its low return byte selects the next decoder input.
4. Execute `0x68003e(index)`. Interpret `RAX` as a **signed 64-bit offset** and `RDX & 1` as the sign selector.

The aggregate contribution has the form:

```text
weight[i] * S16(((offset[i] +/- timing_byte[i]) * pi / 180) mod 2*pi)
```

Here `S16` is the 16-term sine Taylor series. The recursive routines are `0x687cff` and `0x687d80`; the base term is the angle, and each subsequent term multiplies by `-angle² / ((2n)(2n+1))`.

The replacement callback requires the aggregate to match the original weight sum to within `1e-6`, with both sums nonzero. Making every sine contribution equal to one satisfies that check:

```text
offset[i] +/- timing_byte[i] == 90 (mod 360)
```

Thus:

```python
if negative:
    timing_byte = (offset - 90) % 360
else:
    timing_byte = (90 - offset) % 360
```

All 28 results fit in one byte and spell:

```text
R3_ag3nt_4b0ut_t0_f33l_d1zzy
```

The lap times in seconds are:

```text
82, 51, 95, 97, 103, 51, 110, 116, 95, 52, 98, 48, 117, 116,
95, 116, 48, 95, 102, 51, 51, 108, 95, 100, 49, 122, 122, 121
```

For example, the first offset is `168236812` with subtraction selected. The equation gives `(168236812 - 90) % 360 = 82`, or ASCII `R`. Negative offsets must be sign-extended before applying Python's modulo; treating them as unsigned corrupts several letters.

## Final string construction

On success, the native `replaceAll` callback copies the hidden timing-byte buffer over the beginning of the ordinary replacement result. It then adds `0x3b` to byte 30:

```text
'1' + 0x3b = 'l'
```

This changes the decoy domain `@f1are-on.com` to `@flare-on.com`, producing:

```text
R3_ag3nt_4b0ut_t0_f33l_d1zzy@flare-on.com
```

## Evidence and verification scope

- `solve_native.py`: reproducible recovery directly from the original ELF routines.
- `emulate.py`: ELF loading, relocations, and bounded Unicorn execution.
- `timing_solution.json`: all 28 indices, signed offsets, sign bits, and recovered bytes.
- `decoder.asm`, `callbacks.asm`, `sort.asm`: native disassembly used during analysis.
- `capture.py` and `captured_game.js`: independent original-process script capture.
- `verify.js` and `verified_finish.json`: reproduction of the **decoy only**, retained as evidence of the misleading standalone path.
- `replay.py`: experimental injected native replay. This did not yield a captured success result before the user confirmed the correct flag; it is not claimed as completed verification.

The final confirmation is the user's report that the recovered flag was correct, supported by the native decoder extraction and output-construction analysis. No automated challenge-server submission was performed.
