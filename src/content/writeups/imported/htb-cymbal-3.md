---
title: "OAuth Heist (Cymbal / Google SecOps) — notes"
description: "Technical notes from OAuth Heist (Cymbal / Google SecOps) — notes."
published: "2026-11-08"
updated: "2026-11-08"
event: "htb-cymbal"
category: "AI"
kind: "field-note"
status: "reference"
tags: ["AI", "htb-cymbal", "Field notes", "oauth"]
readingTime: 1
wordCount: 78
featured: false
sourcePath: "~/ctf/htb-cymbal/3/notes.md"
---

# OAuth Heist (Cymbal / Google SecOps) — notes
## Facts
- Attachment zip = only "GTIG AI Threat Tracker" PDF (general AI-misuse report). Text in artifacts/report.txt.
  grep for shiny|oauth|cymbal|.com|http -> no hits. Not evidence for any flag.
- All 6 answers live in the Google SecOps tenant (UDM search / GTI), not in local files.
- chrome-devtools MCP: profile locked ("browser already running"), so no access to a SecOps session.
## Next
- Need SecOps access (logged-in browser on CDP port, or exported logs).
