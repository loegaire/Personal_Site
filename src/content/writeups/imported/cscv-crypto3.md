---
title: "ResidueGate: verified local solution"
description: "The supplied cache exposes everything needed to solve the local challenge. The encrypted evaluator is unnecessary for this dataset."
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Cryptography"
kind: "writeup"
status: "solved"
tags: ["Cryptography", "cscv", "Writeup", "gdb", "docker"]
readingTime: 3
wordCount: 649
featured: false
sourcePath: "~/ctf/cscv/crypto3/WRITEUP.md"
---

# ResidueGate: verified local solution

The supplied cache exposes everything needed to solve the local challenge. The encrypted evaluator is unnecessary for this dataset.

## Verification

The solver submitted to the original, unmodified `residuegate-hard` process on port 15000. That process had no debugger or tracing library attached during verification. The response was:

```json
{"flag":"CTF{local_test_only}","status":"accepted"}
```

For that session the tuple was `[0,7,0,11,13,10]`. Tuples change with the session. This is the configured local test flag, not a recovered remote competition flag.

## 1. Recover the interface

The stripped Rust executable hides strings behind an indexed decoder at ELF virtual offset `0xfc9b0`. Calling it for IDs 0 through 381 under GDB recovered the labels in `analysis/strings.json`. Many strings are explicit decoys. The actual registered routes were first located in the process heap.

| Operation | Route |
|---|---|
| Create session, POST JSON `{}` | `/feature_fa8688cbfa3fc935ae60de224a972126` |
| Public specification, GET | `/feature_a9e63777c9a2409902b702d5238a61b8` |
| Base image, GET with `session_id` and `slot` | `/feature_c426f4d0ed166214ae89992cbd592932` |
| Evaluate encrypted embedding, POST JSON | `/feature_11edaf0d1c4e447615614810348a3030` |
| Submit images, POST multipart | `/feature_c26f994e7f7d755a4602972a35430050` |

Submission fields are `session_id` and PNG files `image_0` through `image_5`.

## 2. Read all sixteen embeddings

`qwen_cache.bin` has 744 bytes:

- Eight-byte magic `RGQWEN1\0`.
- One 736-byte image record: a 32-byte field, then sixteen 44-byte variant records.
- Each variant record has a 32-byte field followed by twelve signed int8 coordinates.

Thus variant `v` has its embedding at byte offset `72+44*v`. The metadata publishes the classifier matrix `W` and bias vector `b`, so compute

\[
\ell_v=Wz_v+b\in\mathbb Z^4.
\]

No model download or GPU inference is needed. The solver validates the cache SHA-256 against the metadata and confirms that each downloaded session image has exactly the same decoded RGB pixels as the supplied base image.

The earlier ADMIN-margin calculation is correct but is not the final acceptance criterion. For example, variant 6 has scores `[76,-75,156,168]`, yet a valid commitment tuple need not contain variant 6 at all.

## 3. Invert the commitment over its small domain

The domain separator is exactly the following bytes, including the trailing NUL:

```python
b'residuegate-six-way-logit-commitment-v1\0'
```

For session seed `s`, the target digest is

\[
H\left(D\parallel s\parallel\bigparallel_{j=0}^{5}
  [\operatorname{u8}(j)\parallel\operatorname{u8}(v_j)
    \parallel\operatorname{LE64}(\ell_{v_j,0})
    \parallel\cdots\parallel\operatorname{LE64}(\ell_{v_j,3})]\right).
\]

The logit encoding is **signed** 64-bit little endian. The seed is the decoded 32 bytes, not its hexadecimal text.

There are only `16^6 = 16,777,216` tuples. `analysis/search_commitment.c` searches them with OpenSSL SHA-256, copying intermediate hash contexts to reuse common prefixes. After it reports a match, `solve.py` independently reconstructs and checks the entire preimage using Python's hashlib.

The local acceptance verifies that the metadata's static classifier scores are the correct scores for this commitment. A different remote dataset would require its own embeddings; the solver deliberately stops if the downloaded pixels differ.

## 4. Generate the six PNGs

Number the quadrants TL, TR, BL, BR as 0,1,2,3. For quadrant `k` and RGB channel `r` in 0,1,2, let `c=3*k+r+1`. Variant `v` changes that channel by

\[
\Delta_{v,c}=8(-1)^{\operatorname{popcount}(v\mathbin{\&}c)}.
\]

Every output channel is exactly the base channel plus this offset. The solver checks the result lies in `[0,255]`; it never clips. This preserves the required maximum absolute change of eight. Submit the six PNGs selected by the matched tuple.

## Running

With the supplied Docker Compose service running on port 5000:

```bash
python solve.py --url http://127.0.0.1:5000
```

Dependencies: Python `requests` and Pillow; a C compiler, OpenSSL headers and libcrypto to build the search helper if missing. The solver defaults to port 15000, used in this investigation.

Evidence is written under `artifacts/`: session JSON, exact search input, six PNGs, server response and solution JSON.

## Additional crypto finding

The evaluator expects `session_id`, `sequence` starting at 1, and twelve objects `{c0:[...],c1:[...]}` with 64 coefficients each. All-zero `c1` is rejected. The public-key pair `(b,neg_a)` is accepted as an encryption of zero.

Over `F_q[x]`, with `q=167772161`, the published `neg_a` satisfies

\[
\deg\gcd(\mathrm{neg\_a},x^{64}+1)=32.
\]

The published `b` and an observed output `c1` reduce to zero modulo that factor. This exposes a projection of output `c0`, but the packed-logit decoding attack was not completed because the cache already gives a verified end-to-end solution. Do not treat this partial observation as a demonstrated secret-key recovery.
