---
title: "Split Timeline — Field Notes"
description: "Confirmed facts: Artifacts: mft.bin (37888 bytes, 37 x 1024-byte NTFS FILE records), usnjrnl.bin (5408 bytes), setupapi.dev.log (7232 bytes). setupapi.dev.log records SanDisk Cruzer Blade serial 4C5300011805…"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Miscellaneous"
kind: "field-note"
status: "reference"
tags: ["Miscellaneous", "athenactf", "Field notes"]
readingTime: 1
wordCount: 161
featured: false
sourcePath: "~/ctf/athenactf/split_timeline/notes.md"
---

Confirmed facts:
- Artifacts: mft.bin (37888 bytes, 37 x 1024-byte NTFS FILE records), usnjrnl.bin (5408 bytes), setupapi.dev.log (7232 bytes).
- setupapi.dev.log records SanDisk Cruzer Blade serial 4C530001180529117094 at 06:41 and SanDisk Ultra Fit serial AA010129180916122757 at 07:13.
- MFT records 21-28 contain eight 5-byte resident `:sync` ADS fragments timestamped 06:41; in timestamp order, RC4 with the Cruzer serial gives decoy text `staging selftest ok; no payload attached`.
- MFT records 29-34 contain six 5-byte resident `:sync` ADS fragments timestamped 07:13:12.402 through 07:13:39.833. In timestamp order, RC4 with the Ultra Fit serial gives `athena{mft_records_tell_tales}`.
- MFT record 20 contains `stage.ps1`, explicitly stating whole-file RC4 keyed by the first USB disk serial, then split into 5-byte `:sync` ADS blocks and timestamped.
- solve.py reproducibly parses the resident ADS records, correlates the later batch with the Ultra Fit serial from SetupAPI, sorts fragments, decrypts, and prints the flag.

Failed/ruled out:
- The earlier fragment batch is a deliberate decoy; it decrypts to a non-flag sentence with its matching earlier USB serial.
