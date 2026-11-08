---
title: "Flare-On — 6 Threat Invaders"
description: "Files artifacts/ThreatInvaders/ThreatInvaders.exe — .NET 10 single-file app (116 MB) artifacts/ThreatInvaders/challenge.pcapng — one HTTP session with the score server artifacts/bundle/ — files unpacked from…"
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "flareon", "Field notes", "wireshark", "pcap"]
readingTime: 5
wordCount: 984
featured: false
sourcePath: "~/ctf/flareon/6-ThreatInvaders/notes.md"
---

# Flare-On — 6 Threat Invaders

## Files
- `artifacts/ThreatInvaders/ThreatInvaders.exe` — .NET 10 single-file app (116 MB)
- `artifacts/ThreatInvaders/challenge.pcapng` — one HTTP session with the score server
- `artifacts/bundle/` — files unpacked from the single-file bundle (`scratch/sfx.py`)
- `artifacts/decomp/` — ilspycmd output of `ThreatInvaders.dll`
- `scratch/host.exe` — the native host part of the exe (the bytes before the bundle, first 0x999200 bytes)
- `scratch/ref/` — official runtime packages from NuGet, used for comparison
- `dumps/` — `stream0.txt` (the full TCP stream), `cli.bin`/`srv.bin` (raw bytes per direction), `responses.txt` (responses with duplicates removed), `tele*.bin` (decoded feedback buffers)

## Network traffic (confirmed)
- Server: `threatinvaders.domain`. Every request sends the header `X-Api-Key: ed347a07...55b0`.
- The client repeatedly calls `/api/v1/health`, `/highscores?limit=25` and `/version`. It also sends 5 POSTs to `/telemetry` and 1 POST to `/highscores` (player FLARE, score 910).
- **Server → client:** the server adds its own entries to the high-score list:
  | name | score | score (hex) | wave | comment_b64 |
  |---|---|---|---|---|
  | BOOM | 31337 | 0x7a69 | 1 | `ZnVuIQ==` ("fun!") |
  | BANANA | 2066361377 | 0x7b2a2c21 | 69 | `+bmPsSZwC3eIRD/rvqXFfnzf` (18 bytes) |
  | BENIGN | 1932142625 | 0x732a2821 | 67 | `GenjMZg28ziV/EU2YTRDGmZISVPsEraqrCO03g==` (28 bytes) |
- **Client → server:** the `feedback_b64` field of `/telemetry` always holds a 4096-byte buffer.
  | # | feedback_length | content |
  |---|---|---|
  | 0 | 0 | all zeros |
  | 1 | 0 | plain text "Crashes sometimes. But overall very fun, could play all day!" |
  | 2 | 0x2010 | 16 non-zero bytes (`54ae032e...1fe71631`) |
  | 3 | 0x4212 | about 530 bytes |
  | 4 | 0x402e | 46 bytes |
  - `feedback_length` appears to be a type tag in bits 0x2000/0x4000, OR'd with a byte count in the low bits.
  - The game's C# code never puts values like these in `feedback_length` (it caps the length at 4096), so the runtime must be writing them.
- Timeline: the BOOM entry appears after the FLARE upload. Telemetry 2 is the 16-byte message. BANANA arrives before telemetry 3, and BENIGN before telemetry 4.

## Managed code (confirmed normal)
- `ThreatInvaders.dll` is IL only (no ReadyToRun code). It is a plain Space Invaders clone with score sync, telemetry and an update checker.
- The updater's base64 argument is a decoy: `--install-dir Wouldn't_it_be_nice_if_this_was_the_real_flag@no-flare.com --cwd But_sadly_it_isn't`.
- `TelemetryReporter` reads `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid` into `_machineId`, but the C# code never uses it. It is probably used by the native side (possibly as key material).
- `HighscoreBatch.Create` copies each comment into native memory, and `HighscoreStruct` (80 bytes) stores a pointer to it. Struct layout: Id@0, AchievedAtUnixMs@0x10, Score@0x18, Wave@0x1c, Duration@0x20, SyncState@0x24, UtcOffset@0x28, FormatVersion(=3)@0x2a, Name[20]@0x2c, Comment ptr@0x40, CommentLength@0x48.

## Runtime host (where the custom logic lives)
- Every bundled managed file has the same SHA-256 as the official 10.0.11 packages. Only the game's own files differ.
- The native host is a custom build: version string `10.0.4-dev`, PDB path `E:\runtime\...`. A byte-level diff against the official host is meaningless.
- The imports have no crypto APIs, so any cipher is implemented inline.
- The host contains the string `ReplaceHighscores` at `0x140755dd0`. The only code that references it is at `0x14016c096`, inside the function at `0x14016c050`, which saves that MethodDesc into the global `0x1407fe5a0`.
- The function at `0x1400c6e30` runs when a method's entry point is set. It compares the MethodDesc against several globals and substitutes native handlers:
  | MethodDesc global | handler | original entry saved at |
  |---|---|---|
  | 0x1407fe5a0 (ReplaceHighscores) | 0x1400c66f0 | 0x1407fe5d8 |
  | 0x1407fe598 | 0x1400c6a70 | 0x1407fe5d0 |
  | 0x1407fe5c8 | 0x1400c6b70 | 0x1407fe5e0 |
  | 0x1407fe5c0 | 0x1400c6ba0 | 0x1407fe5b0 |
  | 0x1407fe5b8 | 0x1400c6df0 | 0x1407fe5a8 |
- The other MethodDesc globals are written at `0x1400f55f1`, `0x1400f6fa3`, `0x1400f6ff9`, `0x1400f7041` and `0x1400f7093`. Those sites should show which game methods each handler replaces (probably ones in TelemetryReporter or HighscoreBatch).
- Globals used by the handlers:
  - `0x1407fe5e8` — the length/type value (the `feedback_length` seen in the traffic)
  - `0x1407fe5f0` — a 0x1000-byte buffer
  - `0x1407ff800` — 16 bytes copied at `0x1400c6e0e`
  - `0x1407ff600`, `0x1407ff820` — 0x200-byte buffers
  - `0x1407fd5fe`, `0x1407fd61c`–`0x1407fd61f` — state flags
- The hash routine at `0x1400c8090` is called with constants `0x8f3a2c91d7b4e6a5` and `0x5ca6e801706eaaac`, and its result is compared with fixed values. This check decides whether an incoming high-score entry is acted on.

## Tools
- ilspycmd: `~/.dotnet/tools/ilspycmd`
- r2ghidra is installed, but r2mcp's decompiler setting doesn't accept it. Use `r2 -q -c 'af @ X; pdg @ X' scratch/host.exe` instead.
- The IDA MCP server failed to connect this session.

## Next steps (manual)
1. Read the handlers at 0x1400c66f0, 0x1400c6a70, 0x1400c6b70, 0x1400c6ba0 and 0x1400c6df0, plus the helpers they call (0x1400c65e0, 0x1400c6560, 0x1400c8090, 0x1400c65c0).
2. Work out what the 16 bytes in telemetry 2 are and how they relate to the buffer at 0x1407ff800 and the key material.
3. Decode the BANANA and BENIGN entries (score, wave, comment), then decode telemetry buffers 3 and 4 in `dumps/tele3.bin` and `dumps/tele4.bin`.
4. Write `solve.py` and `skill.md` once the flag is confirmed.

## Solved — 2026-09-26

Flag: `wh4t_4_l0ng_str4ng3_tr1p_1ts_b33n@flare-on.com`

### Key recovery and cipher
- Hook `0x1400c6df0` copies the 16-byte session GUID to `0x1407ff800`.
- The handshake branch in `0x1400c6ba0` sends `reverse(session_guid_bytes) XOR key`, where key is the 16-byte buffer at `0x1407ffa30`.
- Session GUID in the capture: `478b635d-c335-4c12-b1de-16e0565be335`. Use Windows GUID layout (`uuid.UUID(...).bytes_le`).
- Handshake bytes: `54ae032ea875b0f8cc578a511fe71631`.
- Recovered key: `614d587848636e4980454964586c756c`.
- Cipher `0x1400c65e0` initializes a 64-bit state from two little-endian key words, then advances it for each byte using `state = state * 0x5851f42d4c957f2d + 0x14057b7ef767814f` modulo 2^64. XOR the high byte with the data.
- One shared cipher state spans both directions. Do not restart it for each message.

### Capture order and plaintext
1. BANANA comment, 18 bytes: `cmd:cmd.exe;/c dir`.
2. Telemetry with length `0x4212`, 530 bytes: directory listing, including `flag.txt` of size 46.
3. BENIGN comment, 28 bytes: `cmd:cmd.exe;/c type flag.txt`.
4. Telemetry with length `0x402e`, 46 bytes: the flag above.

Correction to the earlier shorthand: dump filenames count **all POST requests**, including the score upload. Thus `tele2.bin` is ordinary user feedback, `tele3.bin` is the handshake, `tele4.bin` is the listing, and `tele5.bin` is the flag response.

### Reproduction and independent verification
Run `python solve.py` (requires tshark). It extracts JSON directly from the original pcap, recovers the key, and decodes all four messages.

Run `python solve.py --verify-native` (also requires pefile and unicorn). This loads the original `ThreatInvaders.exe` and executes its unchanged cipher instructions at `0x1400c65e0`, substituting only memcpy. All four native outputs matched the Python implementation byte for byte. This verifies the cipher using the supplied executable; it does not require executing the full Windows game or contacting its server.
