---
title: "flarecaptcha (Flare-On #1)"
description: "GhostStream (Flare-On #2) 7z pw flare -> GhostStream.wim (WIM) -> GhostStream.exe + PolyjuicePotion.txt with ADS :LordVoldemort = \"AlbusDumbledore \\r\\n\" Parent: string decoder keyed by exe name; reads ADS on…"
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "flareon", "Field notes"]
readingTime: 1
wordCount: 167
featured: false
sourcePath: "~/ctf/flareon/notes.md"
---

# flarecaptcha (Flare-On #1)
- Archive 1-flarecaptcha.7z, pw `flare` -> artifacts/flarecaptcha.html
- Fake reCAPTCHA: left click = fail; right-click (button 2) held 2s = success.
- Flag bytes XOR len(document.characterSet)=5, then alternating key bytes from
  (round(hold_secs)=2 * (resetWidget.toString().length=222 + 1115)) & 0xFFFF = 0x0A72.
- Pitfall: my regex gave 221 (off by one); node eval confirms 222.
- FLAG (verified): triskaidekaphobia@flare-on.com

# GhostStream (Flare-On #2)
- 7z pw `flare` -> GhostStream.wim (WIM) -> GhostStream.exe + PolyjuicePotion.txt with ADS :LordVoldemort = "AlbusDumbledore \r\n"
- Parent: string decoder keyed by exe name; reads ADS only if BSS flag 0x140006668==1 (never set; decoys: TCP 31337 OVERRIDE, Telemetry, SESSION_TOKEN_CACHE env).
  WndProc WM_CREATE: if process uptime (minutes) > 10080 (7 days): buf ^= (1^0x83=0x82), then ^15-byte table -> "HarryPotter". Confirmed by wine run (patched jne@0x1a93, jbe@0x1bae, logger Partner): pipe = "HarryPotter".
- Partner_CTF.exe (RSRC BIN/101): RC4 variant; hot-patches ucrtbase!strlen -> decodes k2 "Piertotum Locomotor".
  Static/emulated (dil=0x13 from hooked strlen) and wine run both FAIL. Correct: stride/add constant = 18 = len("Wingardium Leviosa").
- FLAG (verified by Partner's @flare-on.com check on model): y0u_kn0w_n07h1n6_j0n_5n0w@flare-on.com
- solve.py: ghoststream/solve.py
