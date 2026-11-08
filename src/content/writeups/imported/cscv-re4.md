---
title: "re4 analysis"
description: "The supplied archive contains only crackme.exe and debai.txt. The latter says: find the secret satisfying crackme.exe = hash, then submit [flag omitted from preview]. No target hash value is supplied."
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "cscv", "Field notes"]
readingTime: 2
wordCount: 285
featured: false
sourcePath: "~/ctf/cscv/re4/notes.md"
---

# re4 analysis

The supplied archive contains only `crackme.exe` and `debai.txt`.
The latter says: find the secret satisfying `crackme.exe <secret> = hash`,
then submit `CSCV2026{secret}`. No target hash value is supplied.

## Confirmed behavior

- PE64 Windows console executable; main at VA `0x140002310`.
- Input length must be 1 through 31 bytes (`0x140001d10`).
- The program produces a hexadecimal hash, without comparing it to a target.
- Original executable under Wine: `crackme.exe test` prints `43dcaadb`
  and exits with status 0. This is not evidence that `test` is the intended secret.

## Reverse engineering pointers

- `0x140001dc0` dispatches stages at `0x140001b30`, `0x140001b90`,
  and `0x140001cb0` via the table at `0x14001c0c0`.
- An RC4-encrypted 0x3ef-byte block at `0x14001a360` is decrypted using
  the 13-byte key at `0x14001a350` into context+0x58.
- `0x140002830` derives a static key starting with MD5 of the 16 bytes
  at `0x14001b068`, applies XOR mixing, and optionally calls `ExtMix`
  from `vcx_ext_helper.dll` (not supplied).
- `0x140002140` selects one of seven transforms using 32-bit DJB2(input)
  modulo 7, via the function table at `0x14001b000`.
- Transforms process three-byte chunks and use substitution tables;
  the first variant starts at `0x140001000`.
- `0x1400021d0` applies 48 rounds of byte rotation, addition, keyed XOR,
  and cyclic shifting before hex output at `0x140001c30`.

## Solved

User supplied target: `1cadaa43c24a8fa54b4bd6470e1affe50267babfe691275c`.

Secret: `2WeirdToPlayCtfChallenge`

Flag: `CSCV2026{2WeirdToPlayCtfChallenge}`

`solve.py` derives the static key, reverses the 48 mixing rounds, and
tries the seven substitution-table variants. It reverses each three-byte
FNV block using the modular inverse of the FNV multiplier and enumerates
printable first and second bytes. Variant 1 yields one printable candidate
per block. The complete candidate also satisfies the DJB2 selector.

Reproduce with `python solve.py` (requires `pefile`). The script first
checks its forward model against the two observed sample outputs.

Independent verification with the untouched executable:

```text
wine ./crackme.exe 2WeirdToPlayCtfChallenge
1cadaa43c24a8fa54b4bd6470e1affe50267babfe691275c
```

Exit status: 0. Output exactly matches the supplied target.
