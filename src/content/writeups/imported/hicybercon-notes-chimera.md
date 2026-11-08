---
title: "Operation Chimera (forensics) — channels ELIMINATED (all decoys)"
description: "Working notes from Operation Chimera (forensics) — channels ELIMINATED (all decoys)."
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Forensics"
kind: "field-note"
status: "partial"
tags: ["Forensics", "hicybercon", "Field notes", "sqli", "pcap"]
readingTime: 1
wordCount: 178
featured: false
sourcePath: "~/ctf/hicybercon/notes-chimera.md"
---

# Operation Chimera (forensics) — channels ELIMINATED (all decoys)
pcap 238MB, 159k pkts, 26s. Decoy fake flag: hiCTF{17s_A_f@K3_FlAG!!!} (sso_idp_matrix.html, staging.env, pcap@0x2e23b7). Also hiCTF{...nahh_m4n...}? no that's Unremarable.
Checked & DECOY/empty:
- git (github.com upload-pack, stream 56): "pack" = concatenated zlib streams. stream0=12MB repeated python decoy; stream1=17MB high-entropy (maybe encrypted, no key found).
- DNS tunnel (SEC-ALERT hint): sync-NNN.telemetry.corp.internal -> 10.142.18.1, 136 queries nums 107-997, no responses, dns.id=0. Numbers decode to nothing (mod/digits/diff/perm).
- HTTP recon (web-prod01): all /etc/passwd, php://filter, .env, config = "Access Denied" security filter.
- SQLi (api-prod01): dumped users (FAKE bcrypt hashes, shared suffix O7pPqL0vZ8M.9kY), tables [departments,users,api_tokens,audit_logs] — api_tokens NOT dumped.
- auth/session POSTs: admin brute (P.., W..) all "Invalid credentials".
- Images: zsteg only fake; spectrograms = tones. Audio WAV: no real DTMF. Videos: real MP4 (youtube decoy, 19MB flows).
- /metrics: repeated node_cpu decoy. FTP: login backup_agent/Backup2026! PWD /shared/backups, no RETR/data chan. SSH banners normal. TLS SNI delta.corp.internal (handshake only). NTP refid=0. redis PONG. No ICMP/ftp-data.
- extracted zips (devops/frontend/infra): only fake in staging.env.
Raw pcap grep hiCTF: only the fake (1x). => REAL flag is ENCODED, not plaintext. UNSOLVED - channel not found.
