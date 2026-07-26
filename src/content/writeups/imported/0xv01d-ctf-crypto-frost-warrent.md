---
title: "Frost Warrent notes"
description: "Workspace: /home/thinh/ctf/0xV01D CTF/Crypto/frostwarrent. Files present: - README.md (146 bytes, ASCII) - triage.txt (230 bytes, ASCII) - transcript.json (2416 bytes, JSON) - Forst.zip (1496 bytes, ZIP, con…"
published: "2026-05-19"
updated: "2026-05-19"
event: "0xV01D CTF"
category: "Cryptography"
kind: "field-note"
status: "reference"
tags: ["Cryptography", "0xV01D CTF", "Field notes"]
readingTime: 3
wordCount: 603
featured: false
sourcePath: "~/ctf/0xV01D CTF/Crypto/frost_warrent/notes.md"
---

2026-05-19

# Frost Warrent notes

## Recon

- Workspace: `/home/thinh/ctf/0xV01D CTF/Crypto/frost_warrent`.
- Files present:
  - `README.md` (146 bytes, ASCII)
  - `triage.txt` (230 bytes, ASCII)
  - `transcript.json` (2416 bytes, JSON)
  - `Forst.zip` (1496 bytes, ZIP, contains 2416 bytes uncompressed)
- Before the later clarification, an initial challenge-specific search did not find an obvious public writeup. After clarification, online research was limited to the underlying related-nonce/ECDSA idea.

## Challenge description and archive

- README:
  - Title: `Frost Warrant`
  - Points: `290`
  - Prompt: `A warrant archive was redacted before release. The remaining records still agree too well with each other.`
- `triage.txt` says:
  - no repeated `r`
  - no obvious small nonce
  - an old script wrongly claimed this was a duplicate-signature case
  - rejected placeholder: `0xV01D{reused_r_was_too_easy}`
  - archive was re-exported after that note
- `Forst.zip` contains exactly `transcript.json` and `triage.txt`; the local extracted copies match the listed sizes.

## Transcript

- Modulus/order `q = 39624564908008070534493587674237819694855822882032959037438801231544616740249`.
- Scheme label: `field signature transcript`.
- Six records, each with `message`, `h`, `r`, `s`.
- `sealed_flag` hex length is 94 hex chars = 47 bytes.
- No repeated `r` values, matching `triage.txt`.

## Working constraints

- User clarified not to search online for this specific challenge or writeups; none are expected.
- If stuck, online research should target papers or related challenges covering the same idea only.
- Checked for leftover expensive local jobs after an interrupted turn; no challenge-solving `python3`/Sage/factorization job was still running.

## Basic checks

- `q` is prime (`sympy.isprime(q) == True`).
- `h` values are exactly `SHA256(message) mod q`.
- Small factorization:
  - `q - 1 = 2^3 * 11 * 500471 * large_prime_like_factor`
  - `q + 1` has several small/moderate factors but is not fully smooth.
- Simple constant-key guesses failed for forms such as:
  - Schnorr-like `s = k + h*x` with `k` equal to `r`, `-r`, `r^-1`, `h*r`, or the line number.
  - ECDSA/DSA-like `s = k^-1 * (h + x*r)` with the same simple `k` guesses.

## Main leakage found

- Tested whether hidden nonces become a low-degree polynomial in a transcript variable after solving for the private key `x`.
- Most degree-4 relations with six samples are uninteresting because six points force that easily.
- Strong signal: DSA/ECDSA-style relation
  - `s_i = k_i^-1 * (h_i + x*r_i) mod q`
  - with `k_i` a quadratic polynomial in batch index `i`.
- Candidate private key:
  - `x = 34201434078099384635757852529364903179502771879816962761401877768784013773497`
  - sign-flipped convention candidate: `q - x = 5423130829908685898735735144872916515353051002215996276036923462760602966752`
- Recovered quadratic nonce polynomial coefficients for the `+x` convention:
  - `a = 20353324638615504089635378798303099997549195938817510401631932502624713204517`
  - `b = 31557681005340344748195286948523170196764129852748113200167607405528742419077`
  - `c = 31945871724707854461815086161421435751391776420908027509244711388626646385634`
  - `k(i) = a + b*i + c*i^2 mod q`.
- This satisfies all six records exactly under `s*k == h + x*r mod q`.

## Related background

- Online research avoided challenge-specific writeups and searched for the underlying pattern only.
- Relevant source found: Marco Macchetti, "A Novel Related Nonce Attack for ECDSA" (IACR ePrint 2023/305), which describes recovery from ECDSA nonces satisfying linear/quadratic/cubic and arbitrary-degree recurrence relations.
- Also found the Kudelski Security `ecdsa-polynomial-nonce-recurrence-attack` implementation ("Polynonce"), matching the high-level idea.

## Seal attempts

- `sealed_flag` is 94 hex chars = 47 bytes, not 48.
- 47 bytes is consistent with a 12-byte AEAD nonce + 19-byte ciphertext + 16-byte tag, where a likely flag length is 19.
- A broad decryption sweep became CPU-heavy and was stopped/allowed to finish only once; no authenticated AES-GCM/EAX/ChaCha hit was found with simple keys from `x`, `q-x`, nonce polynomial coefficients, or recovered nonces.
- The successful path was to narrow to a hash-counter XOR seal derived from the recovered private key.

## Final seal format

- `sealed_flag` is not AEAD.
- Working stream:
  - `seed = SHA256(str(x).encode()).digest()`
  - block `j` is `BLAKE2s(seed || j.to_bytes(4, "big")).digest()`
  - XOR stream bytes with `sealed_flag`.
- Decrypted flag:
  - `0xV01D{quadratic_nonce_law_survives_clean_logs}`

## Verification

- Added `solve.py`.
- `python3 solve.py` prints the recovered private key and `0xV01D{quadratic_nonce_law_survives_clean_logs}`.
- `python3 -m py_compile solve.py` passes.
