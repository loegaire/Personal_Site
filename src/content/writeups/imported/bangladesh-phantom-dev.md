---
title: "phantom_dev challenge notes"
description: "Date: 2026-07-21 Confirmed files: solve.py exists and expects modes local/remote. Command executed: python3 solve.py remote Result: exploit completed and printed flag successfully. Leak bytes: 4f495353455348…"
published: "2026-07-21"
updated: "2026-07-21"
event: "bangladesh"
category: "Miscellaneous"
kind: "field-note"
status: "reference"
tags: ["Miscellaneous", "bangladesh", "Field notes"]
readingTime: 1
wordCount: 61
featured: false
sourcePath: "~/ctf/bangladesh/phantom_dev/notes.md"
---

# phantom_dev challenge notes

- Date: 2026-07-21
- Confirmed files: `solve.py` exists and expects modes `local`/`remote`.
- Command executed: `python3 solve.py remote`
- Result: exploit completed and printed flag successfully.
- Leak bytes: `4f49535345534850e8030000000000000100000000000000cfbc367fa78456d41a9321f2da93605a44c1dda4ea864a59`
- Recovered values: `uid=1000`, `cookie=0xd45684a77f36bccf`, `recovered_secret=0xc54795b6591397ce`
- Current hypothesis: script works end-to-end against remote service, no retries or crashes observed.
- Next tests: none required unless user requests local validation (`python3 solve.py local`) or reproducibility checks.
