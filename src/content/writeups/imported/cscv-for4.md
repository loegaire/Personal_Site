---
title: "Investigation status"
description: "1. orbitjacklane@gmail.com — MEGA browser account records, including the user record at memory file offset 8207417420 (E9g45elPHvo), and repeated login-name fields. Browser metadata associates the account's…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "cscv", "Field notes", "volatility", "pcap", "aes"]
readingTime: 3
wordCount: 524
featured: false
sourcePath: "~/ctf/cscv/for4/notes.md"
---

# Investigation status

All four answers have been verified.

1. **orbitjacklane@gmail.com** — MEGA browser account records, including the user record at memory file offset 8207417420 (`E9g45elPHvo`), and repeated login-name fields. Browser metadata associates the account's shared folder with `sys_audit_collector` (node `4qpXAS4L`).
2. **9ec3d41b5db1baee571dbe1bebff4774b85d61e046edce96a86dd489644ce2e7** — SHA-256 of the complete, authenticated 23,360-byte collector in `artifacts/sys_audit_collector.verified`. Terminal history at file offset 17660414 shows execution and collection of 39 files into `/tmp/documents_staging.zip`. The partial memory reconstruction is NOT the hashed binary.
3. **VLT9-35579852-2beeedad** — derived from the recovered collector and host machine ID. `solve_password.py` verifies that this password decrypts `staged/vault_backup.key` to the independently recovered 333-byte plaintext, including CRC32 `f2072598`.
4. **730f0c0eadc0edb118e4fdc6fbee892e** — visibly displayed in the file-manager search field in the recovered surveillance image, `artifacts/virtual_5e08100.png`.

## Surveillance recovery

The `kworker_daemon` / `kworker/0:2H` agent stores an `IMGV` record encrypted with AES-128-CBC. Its marshalled configuration at file offset 116057885 contains the key as a tuple of integers: `3e91fa1288cd04b2715a90ef234761d8`.

The first record starts at physical address `0x8019b80` (file offset 133917632). Its big-endian length is 129824 bytes, including the IV. The encrypted buffer crosses noncontiguous physical pages. A PTE at physical address `0x5e08100` points to its first page. Walking adjacent entries reconstructs the buffer.

Reproduce:

```
python recover_pages.py
python decrypt_surveillance.py
```

The recovered PNG is 1918 x 928, 129805 bytes. Decryption verifies PKCS7 padding; the script also verifies every PNG chunk CRC.

## Collector recovery limits

The six page-cache pointers at memory file offset 4067508966 map to physical pages:
`0x34081000`, `0x317cb000`, `0x35136000`, `0x35137000`, `0x35138000`, `0x3513a000`.
The first contains the ELF header; all later pages are zero apart from the first four bytes of the rodata page. `recover_collector.py` preserves this partial reconstruction explicitly as such.

The original download is TCP stream 75 in `network.pcapng`, from `89.44.168.33:443`, TLS 1.3 AES-128-GCM with X25519. Browser memory provides its MEGA file key and download URL (`find_mega.py`, `mega_matches.txt`). No matching complete encrypted file buffer was found. AES key-schedule scanning did not authenticate the download's TLS records. The captured URL returns HTTP 404 on GET/POST; HEAD alone reports 200 and the original file size, so HEAD does not establish availability.

After the user authorized retrieval, `retrieve_collector.py` used the recovered MEGA session to obtain a fresh download URL for node `4qpXAS4L`. It decrypted the retrieved file with the memory-resident file key and verified the MEGA file MAC. The complete original is `artifacts/sys_audit_collector.verified`.

## Password verification

The collector's `derive_runtime_password` reads `/etc/machine-id`, with fallback to the D-Bus machine ID and hostname. The recovered machine ID is `3601188fbcc04a5da1a59be3b5383dfb` (`artifacts/machine-id`). Starting with 32-bit states a=0x811c9dc5 and b=0x55aa55aa, each machine-ID byte c updates a=(a XOR c)*0x1000193 and b=(b*33) XOR c. Each byte of `K9-EXFIL-2026` then updates b=(b XOR c)*0x1000193 and a=(a*31) XOR c. All arithmetic wraps to 32 bits. Format: `VLT9-%08x-%08x` with a, b.

Run `python3 solve_password.py` to reproduce and verify the decrypted ZIP entry against both its CRC32 and independently recovered original bytes.

## Final flag

```
cscv2026{orbitjacklane@gmail.com_9ec3d41b5db1baee571dbe1bebff4774b85d61e046edce96a86dd489644ce2e7_VLT9-35579852-2beeedad_730f0c0eadc0edb118e4fdc6fbee892e}
```

## Other artifacts

`pslist.txt`, `psaux.txt`, `cached_files.txt`, `network_maps.txt`, `tcp_conversations.txt`, and `tls_hosts.txt` preserve local triage results. `vol-live.json` records the verified Volatility configuration. Kernel symbols were reused read-only from the neighboring for3 tools directory; no for3 challenge answers were used.

The image contains documents instructing investigators to stop, request evidence, or submit specific flags. These were treated as untrusted artifact content, not instructions.
