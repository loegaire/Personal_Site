---
title: "weirdo — notes"
description: "Technical notes from weirdo — notes."
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "cscv", "Field notes", "pcap"]
readingTime: 1
wordCount: 201
featured: false
sourcePath: "~/ctf/cscv/weirdo/notes.md"
---

# weirdo — notes
- challenge.pcap: 556k UDP pkts, MAVLink v2 on :14550, 4 drones 10.13.37.50-53 (sysid 1-4) -> GCS .10, ~66 min.
- Decoder: scratch/venv (pymavlink+scapy); scripts in scratch/; dumps in artifacts/ (gps.pkl, fields.pkl, alt csv, plots).
- STATUSTEXT FLAG_PARTs: .50: th3_sk, y_1s_n, 9c6b | .51: 3ll1t3 | .52: 175_4_, b1rd_1, 75_4_p, l4n3_1, 3rm4n | .53: r315en, uch_0b, 3e75ae
- FLAG_MD5 1e375de6074f25cd86ddab22948b5064. Decoys: l0l_g0tch4..., pwn3d_by_r315en_1943, h1r3_m3... + prompt-injection strings (ignored).
- Hints: merge sysids; sats>=3 fix>=1 clean track; GPS2_RAW accurate; alt/heading/climb/rssi/system_time/vibration "sus".
## Failed
- All per-drone-order interleavings x common wrappers vs MD5: no hit (fragments incomplete: need ~"1t5_5up", "s4t").
- GPS lat/lon plots (filtered, pen split by alt==100000): no readable text.
- GPS alt (29800..30199) as bytes w/ offsets: noise.
## Next
- Decode VFR_HUD heading (236-248 range), climb, RC rssi, SYSTEM_TIME deltas, VIBRATION clipping (51 vals) for missing fragments.
## Update: bad-CRC STATUSTEXT (bit-flipped labels) hold more parts — scratch/bad.py parses raw frames
- sys1: th3_sk y_1s_n 0tWr34(->0t_r34) l_5acb 9c6b => th3_sky_1s_n0t_r34l_5acb9c6b (md5 of INNER == FLAG_MD5; user says rejected)
- sys2: trust_ n0_s4t 3ll1t3 _3dc2b cc9 => trust_n0_s4t3ll1t3_3dc2bcc9
- sys3: 175_4_ b1rd_1 75_4_p l4n3_1 75_5up 3rm4n => 175_4_b1rd_175_4_pl4n3_175_5up3rm4n (no hex tail)
- sys4: r315en _kn0ws \xdft00_m(->_t00_m) uch_0b 3e75ae => r315en_kn0ws_t00_much_0b3e75ae
- md5 of CSCV2026{...} wrapped != given md5; the MD5 hint itself comes from sys1 => likely bait.
