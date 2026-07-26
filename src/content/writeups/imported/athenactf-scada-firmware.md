---
title: "Scada Firmware — Field Notes"
description: "Initial triage (2026-07-18) Artifact: firmware.bin (10,240 bytes); firmwarenotes.txt present. No AGENTS.md found. Category currently: embedded firmware / reverse engineering; SCADA protocol not yet identifie…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Hardware / RF"
kind: "field-note"
status: "solved"
tags: ["Hardware / RF", "athenactf", "Field notes"]
readingTime: 1
wordCount: 117
featured: false
sourcePath: "~/ctf/athenactf/scada_firmware/notes.md"
---

## Initial triage (2026-07-18)
- Artifact: `firmware.bin` (10,240 bytes); `firmware_notes.txt` present.
- No AGENTS.md found.
- Category currently: embedded firmware / reverse engineering; SCADA protocol not yet identified.
- Originals untouched. Working outputs go under `scratch/`, `dumps/`, `artifacts/`.
- Next: read notes, identify image format/architecture, extract strings and embedded structures.

## Confirmed solve
- `firmware.bin` is a stripped PE32+ x86-64 executable linked against MSYS2.
- `.rdata` contains marker `deadbeefOBFUH` followed by 72 encrypted bytes.
- The decoder at VA `0x100401090` applies `ROR8(byte ^ key[i % strlen(key)], 3)`.
- Key is `KEY42`; the decoded NUL-separated records are:
  - `sys_version=3.7.1`
  - `vendor=ACME`
  - `drift_payload=athena{scad4_firmware_root}`
- `solve.py` reproduces this extraction and asserts metadata/flag format.
- Static extraction is verified; direct Wine execution is blocked only by the missing `msys-2.0.dll`, not by the decoder.
