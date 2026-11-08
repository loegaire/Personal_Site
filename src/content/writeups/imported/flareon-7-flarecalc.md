---
title: "FlareCalc (Flare-On 7th chall) notes"
description: "Technical notes from FlareCalc (Flare-On 7th chall) notes."
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "flareon", "Field notes", "shellcode"]
readingTime: 1
wordCount: 192
featured: false
sourcePath: "~/ctf/flareon/7-FlareCalc/notes.md"
---

# FlareCalc (Flare-On 7th chall) notes
- artifacts/FlareCalc.exe: x64 native GUI, junk-xor-loop obfuscation. Real WndProc 0x140003b20 (decomp artifacts/wndproc.c).
- WM_COPYDATA(0x4a, dwData check) -> text shown as scrolling marquee in edit box (timer 3).
- '=' (id 0xd6) compares 7-char expr: 742*186->ACCESS DENIED, 931-482->KEY_EXPIRED, 525+193->FLAG{NICE_TRY} (decoys, XOR w/ expr mod 7)
- 843*952 -> hash-resolved API called w/ callback 0x1400026b0 -> sends Rickroll via WM_COPYDATA. Decoy.
- NEXT: find real flag logic (other buttons 300-303, 0x12f, global obj 0x1400e9268, fcn.140002a90, TLS).
- REAL PATH: VEH for 0xC000008E (fdiv by zero) fcn.140002a90. Result history deque @0x1400e9238.
  Needs last 3 results: f3 w/ (long)(f3*1e7)==31428571 (22/7), f2==88224646, f1==8675309, then x/0.
  -> loads shellcode from Authenticode cert blob (file off 0xeec00, size 0x8149d, entry +0x6d3a) and calls
     sc(arg4=8675309<<32|88224646, arg3=31428571). artifacts/cert_blob.bin, artifacts/sc_main.c
- Shellcode = ICMP-triggered backdoor (raw socket; "FLAR\0"+port+key -> TCP connect-back, host info).
  Encrypted code chunks under OID 1.3.6.1.4.1.1337.1 in PKCS7: MD5(key||id)->byte seed LCG xor, then junk-byte strip (LCG 0x41c64e6d/0x3039 seeded from key hash).
  Handlers 0xeee-0xef5. Cmd '3' = byte FSM: state=chunk[state](byte, buf32); start 0xcb7a, end 0x1185.
  Chunks contain 1M-iter sum loop (anti-emu) -> hook fast-forward; map each chunk at own addr (unicorn TB cache!).
  FSM input: FLAREON_ASN1_Labyrinth_Key_2026!  -> chunk 0x1185 = XTEA decrypt of chunk 0x2706, key=buf[0:16]^buf[16:32].
## FLAG (verified by decryption): t3mplat3s_asn_and_j1t_0h_my@flare-on.com
solve.py reproduces it.
