---
title: "OAuth Heist (Cymbal SecOps)"
description: "Technical notes from OAuth Heist (Cymbal SecOps)."
published: "2026-11-08"
updated: "2026-11-08"
event: "htb-cymbal"
category: "Miscellaneous"
kind: "field-note"
status: "reference"
tags: ["Miscellaneous", "htb-cymbal", "Field notes", "oauth"]
readingTime: 1
wordCount: 43
featured: false
sourcePath: "~/ctf/htb-cymbal/2/notes.md"
---

# OAuth Heist (Cymbal SecOps)
- Zip contains only GTI ShinyHunters/UNC6240 PDF (artifacts/report.txt). No logs/IOCs.
- Report hints: vishing, MFA device registered, "ToggleBox Recall" Workspace add-on purged Okta "Security method enrolled" email.
- All 6 flags require querying the live Google SecOps lab instance (not available locally).
