---
title: "Heap Smash — Field Notes"
description: "Confirmed Remote service: 13.206.57.188:10064, banner Heap Smash v1 server. No local binary/source artifacts; only empty notes.md. Protocol: A , W followed by exactly length raw bytes, R , D , E. A 0 16 then…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "athenactf", "Field notes"]
readingTime: 1
wordCount: 132
featured: false
sourcePath: "~/ctf/athenactf/heap_smash/notes.md"
---

## Confirmed
- Remote service: `13.206.57.188:10064`, banner `Heap Smash v1 server`.
- No local binary/source artifacts; only empty notes.md.
- Protocol: `A <index> <size>`, `W <index> <offset> <length>` followed by exactly `length` raw bytes, `R <index>`, `D <index>`, `E`.
- `A 0 16` then `R 0` returns 16 zero bytes; `W 0 0 1` + byte returns `Wrote`.
- `W` bounds-checks (`20` bytes into size 16 gives `Out of bounds`).
- Initial hypothesis: startup frees flag allocation; first allocation in same size class should reclaim stale flag bytes.

## Next test
- Scan allocation sizes and read immediately for printable/flag-like stale data.

## Solved
- `A 0 80` reclaims the startup-freed chunk; `R 0` leaks:
  `99 be 28 5b 05 00 00 00 00 00 00 00 00 00 00 00` followed by
  `athena{vthN6a41n0hUkbUq}` and zero padding.
- Reproducible solver saved as `solve.py`; category notes saved as `skill.md`.
