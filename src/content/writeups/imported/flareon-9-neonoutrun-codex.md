---
title: "Codex verified findings"
description: "2026-09-26: Existing Claude artifacts and scratch scripts left untouched. Codex work lives in codex/. Existing solve.py outputs decodethissystemtowinit@f1are-on.com. artifacts/game.js constructs the suffix u…"
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "flareon", "Field notes", "frida"]
readingTime: 2
wordCount: 287
featured: false
sourcePath: "~/ctf/flareon/9-neonoutrun/codex/notes.md"
---

# Codex verified findings

2026-09-26: Existing Claude artifacts and scratch scripts left untouched. Codex work lives in codex/.
- Existing solve.py outputs `decode_this_system_to_win_it@f1are-on.com`.
- artifacts/game.js constructs the suffix using character code 49 (digit 1), not 108 (letter l). Do not silently normalize this domain.
- Script generates one character per lap from messages[floor((lap-1)/2)][map[lap-1]], then replaces spaces with underscores on lap 28.
- Independent runtime verification and original-binary provenance checks underway; candidate is not yet externally accepted.

## Independent verification completed
- Original executable SHA-256 matches `7z x -pflare -so 9-NeonOutRun.7z neon_outrun`: `73edf4e289d199f5e5df622855c1787ba12a4a0c7205813103d7a53f300220e0`.
- `python codex/capture.py` reads the unchanged executable's live memory using Frida. Sandbox ptrace was denied; rerunning with approved sandbox escalation succeeded. Captured 4229 bytes in codex/captured_game.js, byte-for-byte equal to artifacts/game.js.
- `node codex/verify.js codex/captured_game.js` executes the captured source unchanged, reaches all 28 laps, and asserts no crash/block. Full final state is in codex/verified_finish.json.
- Exploit: initialize x=0 using bounds [-100,100], then supply bounds [-100,1e9] and hold up. Obstacles are mapped to 15%-85% of the road width, safely away from x=0. Neither source code nor internal game state is patched.
- Final output: `decode_this_system_to_win_it@f1are-on.com` (literal digit ONE in domain).
- Verification scope: original runtime source capture plus independent execution of its full finish path; no challenge-server submission performed.

## Correction from user
The displayed f1are-on.com string is a known decoy, already identified by Opus. Runtime reproduction verifies only the decoy path and does NOT solve the challenge. Continuing with native decoder analysis; Opus is probing embedded V8 globals. Codex will focus on static native decoder and embedded payload provenance to avoid duplicating that work.

## Final status
User confirmed the recovered real prefix `R3_ag3nt_4b0ut_t0_f33l_d1zzy` is correct. Full native output construction gives `R3_ag3nt_4b0ut_t0_f33l_d1zzy@flare-on.com`. See writeup.md and solve_native.py in this directory. Replay experiment remains unverified; no claim of captured native gate success.
