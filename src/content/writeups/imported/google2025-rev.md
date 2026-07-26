---
title: "Rev — Field Notes"
description: "Facts Challenge: cgb, Game Boy Color ROM reversing. ROM: /home/thinh/ctf/google2025/rev/rev-cgb/roms/gctf/gctf.gb (32KB). Header checksum 0x00, global checksum 0x00. Boot ROMs: gbcboot.1 (256 bytes), gbcboot…"
published: "2026-06-01"
updated: "2026-06-01"
event: "google2025"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "google2025", "Field notes"]
readingTime: 2
wordCount: 273
featured: false
sourcePath: "~/ctf/google2025/rev/notes.md"
---

# Notes

## Facts
- Challenge: `cgb`, Game Boy Color ROM reversing.
- ROM: `/home/thinh/ctf/google2025/rev/rev-cgb/roms/gctf/gctf.gb` (32KB). Header checksum 0x00, global checksum 0x00.
- Boot ROMs: `gbc_boot.1` (256 bytes), `gbc_boot.2` (2590 bytes).
- Game description: Unfinished game about character jumping rocks.
- MAME not installed. `r2` supports `gb`. PyBoy installed and working.
- Fixed checksum ROM at `/tmp/gctf_fixed.gb`.

## Game Logic
- Phase 1: Wait loop at 0x01c0 checks [0xc000] == 0x08. Enter 10-button sequence to match ROM 0x4d40:
  `01 02 10 20 10 20 80 80 40 40` (Right, Left, A, B, A, B, Start, Start, Select, Select)
  Actually, since 0xc001 is LATEST, chronological order: Select, Select, Start, Start, B, A, B, A, Left, Right.
- Phase 2: After match, calls 0x02a5 (setup), then loops at 0x0220 calling input+VBlank handler.
- V-Blank handler at 0x035d increments [c07a]; on overflow runs inner logic that increments [c07c]; when c07c overflows increments [c07b]. Reset [c07b] to 0 when it reaches 0x80.
- Button release triggers 0x0457: reads [c07b] into c, sla c, reads [c000], dec a, reads [c07b] into b, and b, or c, stores at [c051].
- Shift routine 0x0284 shifts 0xc051..0xc078 into 0xc052..0xc079.
- Comparison 0x02fc compares [c029..c050] with ROM [0x52b7..0x52de].
- Target bytes at 0x52b7: `1c 17 c7 11 c0 c6 c5 85 a3 57 9d f1 b2 ae 01 51 e0 f5 18 b1 af 7f 13 32 39 eb e6 26 96 26 8b aa 1f 23 00 37 86 7a 8d bc`
- Formula `((B-1) & S) | (S<<1)` has 11 impossible targets.

## Key Insight
- The formula `((B-1) & S) | (S<<1)` assumes B is a single-bit value. But the game reads the FULL joypad byte into [c000], which can have MULTIPLE bits set if the user holds multiple buttons.
- PyBoy empirical test confirmed: holding A+Down gives [c000]=129 (0x81 = A | Down).
- When B can be ANY non-zero byte (1-255), ALL 40 targets have solutions!

## Formula
- `out = ((B - 1) & S) | ((S << 1) & 0xff)` where S = [c07b], B = [c000] (button combination byte).
- S is non-decreasing, wraps at 0x80 -> 0.
- Need to find sequence of 40 button releases (each B is a combination) with monotonically increasing S.

## Todo
- Solve the 40 targets with B in [1..255] and monotonic S.
- Use PyBoy to automate input sequence and capture flag.
