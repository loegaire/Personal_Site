---
title: "4 - ToxicMiner"
description: "Technical notes from 4 - ToxicMiner."
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "flareon", "Field notes"]
readingTime: 1
wordCount: 213
featured: false
sourcePath: "~/ctf/flareon/flareon13doc/4-toxicminer/notes.md"
---

# 4 - ToxicMiner
## Facts
- 4-ToxicMiner.7z (7zAES, pw `flare`) -> artifacts/ToxicMiner.exe, PE32+ console. Stock cpuminer-multi 1.3.7 + static OpenSSL.
- DECOY (rejected by user): `bTFuM195MHVyXzB3bl9idXMxbjNzcw==@flare.com` -> m1n3_y0ur_0wn_bus1n3ss. Default string strdup()'d in main (ref 0x1401002ce).
- Real change: scanhash-style fn 0x140134f70 (called from 0x1401016dd)
  - GetVolumeInformationA -> volser (global 0x140492b48)
  - gate: parses 64-hex global 0x140495cf8 and memcmp's it against a hash of (volser, nonce)
  - on success: key = H(H(BE32 volser || BE32 0x0b501e7e)) (fn 0x140134ca0), first 16 bytes of state (LE words)
  - RC4 (fn 0x140134d70) decrypts 0x33 bytes @0x1401bd3b0, applog "Accepted: %s"
- H = MODIFIED sha256_transform 0x140135240 (standard IV/K/rotations, but):
  - Ch variant e.g. ((f+g)&e)^g; Maj also altered
  - tail: state[0] ^= sbox[state[0]&0xff] (sbox @0x1401bd270) ^ *(u32*)((u8*)state + state[1]%28)
  - emu test: block(0x11223344,0x0b501e7e,pad) -> 6438725e... (std sha256 -> a217241f...)
## Failed
- brute 2^32 volser with standard SHA256 + printable-plaintext filter: 0 hits.
## Result
- HIT: volser 0x01cec01d -> cpu_m3lt3d_4nd_all_i_g0t_w4s_th1s_fl4g@flare-on.com (51 printable bytes; false-positive odds ~1e-22)
## In progress (done)
- scratch/bf2.c: maps scratch/image.bin at 0x140000000, calls original transform via ms_abi (cookie check patched to ret); verified == unicorn emu. Full 2^32 run, 16 threads.
## Next
- If hits: validate plaintext is flag-shaped (…@flare-on.com), then write solve.py.
- If 0 hits: re-check key byte order (LE vs BE of state words) / key length, and double-sha padding lengths (0x40 vs 0x100 bits).
