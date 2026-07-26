---
title: "Forked Tongue — working notes"
description: "Confirmed facts Supplied artifact: a24bbf16-1604-4ac0-8b1b-ba2ffaac52ef-1784462121.zip (3,348,519 bytes). No AGENTS.md is present. The starting notes.md was empty. The workspace sits inside an already-dirty…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "HTB", "Field notes"]
readingTime: 1
wordCount: 159
featured: false
sourcePath: "~/ctf/HTB/salt_crown/forked_tongue/notes.md"
---

# Forked Tongue — working notes

## Confirmed facts
- Supplied artifact: `a24bbf16-1604-4ac0-8b1b-ba2ffaac52ef-1784462121.zip` (3,348,519 bytes).
- No `AGENTS.md` is present. The starting `notes.md` was empty.
- The workspace sits inside an already-dirty parent repository; unrelated changes outside this challenge are being preserved.
- ZIP extraction in `artifacts/ml_forked_tongue/` contains a 4-layer, 4-head, 128-dimensional decoder-only TinyGPT checkpoint and five captured token-ID prompts.
- `manifest.json` specifies the final transform: `flag = cipher XOR shake_256(pad).digest(len(cipher))`.
- `model.py` uses deterministic greedy decoding, a 128-token context window, and `<|end|>` token ID 738.
- PyTorch is not installed in the default Python environment (`ModuleNotFoundError: torch`).

## Current hypothesis
- Responses from the five captured prompts will recover one or more ciphertext/pad values. Need load/emulate the released TinyGPT checkpoint, correctly reverse the byte-level BPE encoding, then apply the XOR transform.

## Commands tried
- `rg --files ...`, `find . -maxdepth 2 -type f ...`, `git status --short`
- `unzip -l ...`, `unzip -Z -v ...`, then extracted only into `artifacts/`.
- Read `manifest.json`, `model.py`, and `prompts.json`.
- `python3 -c 'import torch'` (failed: module absent).
