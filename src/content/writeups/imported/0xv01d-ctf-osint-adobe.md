---
title: "Adobe OSINT Challenge"
description: "Mission 1. Find the hidden username from the provided evidence. 2. Track the username's digital footprint across the internet. 3. Uncover leaked data related to a malware infection. 4. Find the malicious dir…"
published: "2026-05-18"
updated: "2026-05-18"
event: "0xV01D CTF"
category: "OSINT"
kind: "field-note"
status: "reference"
tags: ["OSINT", "0xV01D CTF", "Field notes"]
readingTime: 1
wordCount: 135
featured: false
sourcePath: "~/ctf/0xV01D CTF/OSINT/adobe/notes.md"
---

# Adobe OSINT Challenge

## Mission
1. Find the hidden username from the provided evidence.
2. Track the username's digital footprint across the internet.
3. Uncover leaked data related to a malware infection.
4. Find the malicious directory identifier (a GUID) within the leaked data.

## Evidence
- `46y7hk.png`
- The victim downloaded a cracked version of Adobe Premiere Pro, which installed an infostealer.

## Findings
- **Username:** Analyzed `46y7hk.png` using ExifTool. Found the author username: `its.fares09`.
- **Digital Footprint:** Found the username across various platforms. Sherlock revealed a match on HudsonRock (a cybercrime intelligence firm tracking infostealer infections).
- **Leaked Data:** Queried the HudsonRock OSINT tool API for the username `its.fares09`. The response confirmed the username is associated with a computer infected by a Vidar infostealer.
- **Directory Identifier (GUID):** The malware was executed from `C:\Users\fares\AppData\Roaming\{2433FA03-903D-4A5B-B193-FB971B0015FF}\tsengine.exe`.
- The malicious directory identifier is `2433FA03-903D-4A5B-B193-FB971B0015FF`.

## Flag
`0xV01D{2433FA03-903D-4A5B-B193-FB971B0015FF}`
