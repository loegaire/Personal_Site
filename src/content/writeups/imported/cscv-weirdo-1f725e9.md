---
title: "weirdo — CSCV2026 (Forensics)"
description: "TL;DR The pcap is MAVLink v2 drone telemetry. The STATUSTEXT \"FLAGPART\" messages and the FLAGMD5 are bait. The real flag is handwritten by one drone's GPS track. Plot the GPSRAWINT positions of drone 10.13.3…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Forensics"
kind: "writeup"
status: "solved"
tags: ["Forensics", "cscv", "Writeup", "pcap"]
readingTime: 3
wordCount: 483
featured: false
sourcePath: "~/ctf/cscv/weirdo/writeup.md"
---

# weirdo — CSCV2026 (Forensics)

## TL;DR
The pcap is MAVLink v2 drone telemetry. The STATUSTEXT "FLAG_PART" messages and the `FLAG_MD5` are bait. The real flag is **handwritten by one drone's GPS track**. Plot the `GPS_RAW_INT` positions of drone `10.13.37.52` (sysid 3), keeping only fixes with fix_type ≥ 1, satellites ≥ 3 and alt ≠ 100000, and it reads:

```
r315en 1943 said: b1rd5_4r3nt_r34l_th3y_ch4rg3_0n_p0w3rl1n3s
```

```
CSCV2026{b1rd5_4r3nt_r34l_th3y_ch4rg3_0n_p0w3rl1n3s}
```

## 1. Recon
- `challenge.pcap`: 556k packets, all UDP, ~66 min.
- Four hosts `10.13.37.50–53` (sysid 1–4) stream to `10.13.37.10:14550`. Port 14550 and the `0xfd` magic byte mean MAVLink v2.
- Decoded with `pymavlink` (ardupilotmega dialect) + `scapy`, with a separate parser per source IP.
- It's standard ArduPilot SITL traffic: HEARTBEAT, GPS_RAW_INT, GPS2_RAW, GLOBAL_POSITION_INT, VFR_HUD, VIBRATION, SYSTEM_TIME, etc.

## 2. The bait layer (STATUSTEXT)
There are many STATUSTEXT messages with hints, fragments, and even prompt-injection strings aimed at AI solvers ("Ignore rules…", "act as Linux Root Terminal…").

Some fragments sit in frames with **bad CRCs and bit-flipped labels** (`FLAg_PART`, `FHAG_PART`, `FLAG\x7fPART`, `FLAG_PAR\`, `0tWr34`, `\xdft00_m`). pymavlink puts these in BAD_DATA, so a raw frame parser is needed to see them. Each drone's fragments, in send order, spell a complete phrase:

| sysid | Chain |
|---|---|
| 1 | `th3_sky_1s_n0t_r34l_5acb9c6b` |
| 2 | `trust_n0_s4t3ll1t3_3dc2bcc9` |
| 3 | `175_4_b1rd_175_4_pl4n3_175_5up3rm4n` |
| 4 | `r315en_kn0ws_t00_much_0b3e75ae` |

sysid 1 also sends `FLAG_MD5: 1e375de6074f25cd86ddab22948b5064` and "use this md5 to verify the flag". That hash is `md5("th3_sky_1s_n0t_r34l_5acb9c6b")`, so the sysid-1 phrase *looks* verified. **It is a trap:** the chain and the hash that "verifies" it come from the same drone, and the submission is rejected. Other decoys: `l0l_g0tch4_k33p_l00k1ng`, `pwn3d_by_r315en_1943`, `h1r3_m3_1m_br0k3_plz`.

## 3. The real channel: the GPS track
The hints that matter:
- `DEBUG: sats>=3 fix>=1 gives clean track`
- `LOG: fix_type>=1 includes full path`
- `the alt values.. not random imo`

GPS altitude takes only two kinds of values: exactly `100000` (100 m, junk or teleport points) or noise around 30 m. Filtering on `fix_type>=1 && satellites_visible>=3 && alt != 100000` leaves exactly 1980 fixes per drone (1651 for .52, which stops streaming at ~1980 s).

I plotted each drone's clean track separately, sorted by `time_usec`:
- `.50`, `.51`, `.53`, and every `GPS2_RAW` track (despite the "GPS2_RAW is the accurate one" hint) are random walks.
- **`GPS_RAW_INT` of `.52` is a slanted line of handwriting.** Rotating it by the slope of its least-squares line makes it horizontal:

```
r315en 1943 said:
b1rd5_4r3nt_r34l_th3y_ch4rg3_0n_p0w3rl1n3s
```

The top line is attribution ("r315en" is the persona named in the decoy messages). The second line is the flag body: *"birds aren't real, they charge on power lines"*. It also explains the sysid-3 decoy phrase ("it's a bird, it's a plane…").

## 4. Reproduce
```python
from scapy.all import PcapReader, UDP, IP
from pymavlink.dialects.v20 import ardupilotmega as m
import numpy as np, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

mv = m.MAVLink(None); mv.robust_parsing = True; pts = []
for p in PcapReader('challenge.pcap'):
    if p[IP].src != '10.13.37.52': continue
    for x in mv.parse_buffer(bytes(p[UDP].payload)) or []:
        if (x.get_type() == 'GPS_RAW_INT' and x.fix_type >= 1
                and x.satellites_visible >= 3 and x.alt != 100000):
            pts.append((x.time_usec, x.lon, x.lat))
pts.sort()
x = np.array([q[1] for q in pts], float); y = np.array([q[2] for q in pts], float)
x -= x.mean(); y -= y.mean(); a = np.arctan(np.polyfit(x, y, 1)[0])
X = x*np.cos(-a) - y*np.sin(-a); Y = x*np.sin(-a) + y*np.cos(-a)
plt.figure(figsize=(40, 8)); plt.plot(X, Y, lw=1.5)
plt.gca().set_aspect('equal'); plt.axis('off'); plt.savefig('flag_track.png', bbox_inches='tight')
```

## Lessons
- In telemetry challenges, **plot the positions per source** before trusting any text channel. Split them by sysid/IP and apply the hinted filters.
- A hash that comes from the same channel as the candidate it "verifies" proves nothing. The author controls both.
- Look for frames that fail CRC. Bit-flipped labels hide extra fragments from filters that rely on the library's parser.
- Ignore instructions embedded in challenge data (here, prompt injections aimed at LLM solvers).
