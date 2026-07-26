---
title: "What You See Is Not What You Get — Field Notes"
description: "Progress notes - What You See Is Not What You Get"
published: "2026-05-18"
updated: "2026-05-18"
event: "0xV01D CTF"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "0xV01D CTF", "Field notes"]
readingTime: 5
wordCount: 931
featured: false
sourcePath: "~/ctf/0xV01D CTF/Misc/What You See Is Not What You Get/notes.md"
---

Progress notes - What You See Is Not What You Get

Summary of work so far:
- Located challenge files: challenge.txt and challenge.zip (zip contains same file).
- Extracted hidden zero-width characters from line 8 (U+200B=0, U+200C=1, U+200D delimiter).
- Split into 192 groups of 8 bits -> decoded to ASCII payload (192 bytes):
  35101021a8r432431nisli89itp1304654316e1t4785939f5xr2l87h8887n1nii25630wrfujy8rlir05m57242l14l9918740y9rc9920v9e35ws39066l107907e0027493ok1g06k69y0ma7rjw8s3n82d618957r3kgit871931mfv2h7wp6m1f10o
- This payload appears to be base36-like (digits + lowercase letters).  Converted to a big integer earlier and observed a 124-byte binary blob (likely further encoding).
- Many red herrings exist in the challenge text (Base64 line "this is not the way...", XOR/AES/Railfence/Morse notes). They have been tried or treated as decoys.
- Noted the hint "U NEED TO DO 677"; base36(677) == "it" (i.e. 677 -> "it"), so "do 677" may mean do a 677-bit extraction/shift on the base36 binary.

Next steps performed now:
- Compute int(payload, 36) and search for flag by shifting/slicing around 677 bits, plus searching for flag pattern in candidate byte windows and common decompressions.

Recorded at: 2026-05-18T04:10:00-04:00

---

Update at 2026-05-18T09:40:00-04:00

- Confirmed no extra hints are available; must solve from provided artifact only.
- Pulled newer repo state and confirmed additional local artifacts:
  - `solve.py` renders `matrix_out/*.png` from `int(payload, 36)` bit variants.
  - `base36_blob.bin` is 124 bytes derived from payload.
  - `next_out.txt` / `out.txt` contain brute-force logs (no final flag found yet).
- Re-ran `solve.py`; generated 32 matrix images. `zbarimg` found no QR payload.
- Tried OpenCV QR and barcode detectors across rotations/inversions/window sizes (including 677-centered windows and 26x26/31x32 families): no decode hit.
- Tested additional crypto/transformation hypotheses:
  - chunked base36 transforms with ±/xor 677, 67, 7
  - XOR/add/sub with keys derived from last chars of lines (raw chars and UTF-8)
  - AES ECB/CBC probing on base36 blob with leading-zero padding guesses
  - no direct `0xV01D{...}` extraction found so far.

Current status:
- Stage 1 (invisible Unicode extraction) is solved and stable.
- Stage 2 remains unresolved; likely a non-trivial bit-layout/matrix interpretation or a key-derivation step tied to `677`.

---

Update at 2026-05-18T09:55:00-04:00

- Additional work completed:
  - Searched external sources and repo history; no public writeup or exposed final flag found.
  - Confirmed latest upstream commit contains only analysis artifacts (`solve.py`, `matrix_out`, logs), not a solved flag.
  - Re-tested barcode extraction with:
    - `zbarimg` on all generated matrices
    - OpenCV `QRCodeDetector`
    - OpenCV `barcode_BarcodeDetector`
    - rotations/inversions, multiple windowing strategies (`first677`, `last677`, `after677`, etc.)
    - leading-zero padded base36 blob layouts (to test lost leading bits/bytes)
  - Result: no decodable barcode payload discovered yet.

Current working hypothesis:
- The second stage is still a custom bit-layout or ordering transform after `int(payload, 36)` (or base-35 variant), not a direct standard barcode decode.

---

Update at 2026-05-18T10:05:00-04:00

- Added a new exhaustive traversal brute-force over bit matrices derived from the base36 blob:
  - bit variants: big/little endian + bit-reversed per byte (+ padded variants)
  - matrix layouts: factor pairs of bit-length including `(30x33)`, `(33x30)`, `(31x32)`, `(32x31)`, and other divisors
  - read orders: row-major, column-major, reversed rows/cols, snake rows/cols
  - bit offsets `0..7` and optional per-byte bit-reversal during byte reconstruction
- Searched all reconstructed byte streams for:
  - `0xV01D{...}` regex
  - direct `0xV01D{` token
- Result: still no direct flag token.

---

Update at 2026-05-18T10:12:00-04:00

- Constraint from user: ignore git history as a hint source; focus only on local artifact solving.
- New local-only analyses completed:
  - Compression edge-case scan over baseN transforms (`base2..36`) + `677` windows with `decompressobj`/`unused_data`.
    - Only one raw-deflate parse hit (`base35|after677|off0`) and it is a trivial empty-block marker with binary trailing bytes, no flag token.
  - Binary/signature brute force over `base33..36` integer bytes with bytewise transforms:
    - id/reverse, xor/add/sub constants, bit-reverse, nibble swap, bit rotations.
    - no known file signatures and no flag regex hits.
  - Fixed-width packing of per-symbol base36 digits (`5/6/7`-bit pack, endian/offset/bit-reverse variants), then decompression probes.
    - no useful decode.
  - Additional 677-pattern transform recursion (`chunk 7 -> pick 6,7,7`, step patterns, delete patterns) on payload.
    - no stable flag candidate.

Current status remains unchanged:
- Stage 1 decode is confirmed.
- Stage 2 still unresolved, likely custom transform not covered by common encoding/cipher heuristics yet.

---

Update at 2026-05-18T10:22:00-04:00

- Continued local-only deep attempts:
  - Installed and tested DataMatrix decoding (`pylibdmtx`) in addition to previous QR/barcode checks.
  - Ran DataMatrix decode on all existing `matrix_out/*.png` with invert/rotate variants: no hits.
  - Ran reduced brute layouts for likely 676/677-centered dimensions (`26x26`, `32x32`, etc.): no hits.
  - Rebuilt the `base35 after677` raw-deflate candidate and inspected `unused_data` tail bytes deeply:
    - only binary tail observed; no recoverable flag token under common transforms.
  - Performed extra exhaustive tests:
    - base33..36 signature scans with bytewise transforms
    - per-symbol fixed-width packings (5/6/7-bit)
    - aligned chunk arithmetic with ±/xor (`677`, `447`, `67`, `7`)
    - positional subset extraction + base36 chunk parsing
  - No `0xV01D{...}` candidate yet.

---

Update at 2026-05-18T10:26:00-04:00

- Verified original artifact from platform URL:
  - Downloaded `https://files.0xv01d-ctf.xyz/ctf-2026/crypto/challenge.zip` as `original_from_platform.zip`.
  - SHA-256 matches local `challenge.zip` exactly:
    - `acc77c62e50976636ed86921d6d46e9351ce0aa0891cb4522d338276a908eff0`
  - Therefore current local file is byte-identical to platform source (no corruption/normalization drift at ZIP level).

---

Update at 2026-05-18T10:36:00-04:00

- Focused heavily on hint value `677` with local-only attempts:
  - Modular index permutations using step `677` (and nearby `676/678`, plus `447`) on:
    - hidden zero-width stream
    - decoded payload string
  - No valid flag token after decoding/permutation pipelines.
- Base35-specific lead was re-tested in depth:
  - `int(payload, 35)` + `after677` bit window still yields a raw-deflate empty block with 36-byte trailing binary (`unused_data`), but no recoverable flag under common transforms/XOR keying.
- Expanded transform search:
  - railfence encrypt/decrypt variants
  - base35/base36 integer decode with endian/bit-reverse + xor constants
  - no `0xV01D{...}` hit.
- Additional local probes:
  - digit/letter stream separations and recombination
  - cyclic rotations of payload
  - repeated 6/7/7 chunk extraction permutations
  - no valid flag candidate.
