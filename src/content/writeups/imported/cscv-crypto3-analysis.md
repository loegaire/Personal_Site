---
title: "ResidueGate analysis"
description: "Solved and verified locally. The unmodified original server accepted the six generated images and returned [flag omitted from preview]. See ../solve.py, ../artifacts/solution.json, and ../artifacts/submissio…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "cscv", "Field notes"]
readingTime: 3
wordCount: 450
featured: false
sourcePath: "~/ctf/cscv/crypto3/analysis/notes.md"
---

# ResidueGate analysis

**Solved and verified locally.** The unmodified original server accepted the six generated images and returned `CTF{local_test_only}`. See `../solve.py`, `../artifacts/solution.json`, and `../artifacts/submission.json`. The notes below record the initial investigation; the completed derivation is in `../WRITEUP.md`.

The supplied archive contains a stripped Rust HTTP server and one cached 32x32 RGB image. The server was successfully run with the supplied dataset. No remote target was provided.

## Public objective

Find six variant IDs v_0,...,v_5 in {0,...,15} whose SHA-256 commitment matches the session. The public serialization is domain || 32-byte session seed || concatenation over slots of u8(slot) || u8(variant ID) || four signed little-endian i64 logits. There are 16^6 = 2^24 = 16,777,216 candidates. The exact domain bytes and the source of session logits must be confirmed before implementing a solver; the schema name alone does not prove the domain bytes.

## Image mathematics

Split the image into TL, TR, BL, BR quadrants, with RGB channels in each quadrant numbered c=1,...,12. Variant v adds 8*(-1)^popcount(v & c) to each associated channel. Clipping is forbidden. This is a restricted Walsh sign codebook, not an arbitrary pixel optimization problem.

The public vision pipeline projects a pooled 2048-dimensional Qwen feature to 12 dimensions, normalizes, rounds and clips to [-16,16]. The local cache supplies these quantized vectors, so reproducing Qwen is unnecessary for analysis of this supplied image.

The 744-byte cache consists of an 8-byte RGQWEN1 magic, followed by a 736-byte entry. The observed entry layout is a 32-byte field followed by 16 records of a 32-byte field and 12 signed bytes. The 32-byte fields appear to be digests; their precise inputs have not been verified.

Using the metadata's classifier, logits = W*z+b. Variant 6 yields [76,-75,156,168], so its ADMIN margin is 12. All other variants have margin below 12. This reproduces the metadata coverage count of one. It does not establish the six-slot commitment answer or prove these static classifier weights are used for session logits.

## Crypto surface

The session publishes n=64, q=167772161, p1=65537, p2=3, and public-key vectors b and neg_a, together with mixing matrix [[1,1,0,1],[0,1,1,-1],[1,0,1,1],[1,-1,1,0]]. The sample neg_a has coefficients -1 at indices 0 and 33, variable coefficients at 1..32, and zeros at 34..63 modulo q. The encryption equations and polynomial modulus have not yet been recovered; these values alone do not establish an attack.

Limits: 16 evaluation queries and one submission per session.

## Recovered local routes

- GET /healthz: health check.
- GET /feature_a9e63777c9a2409902b702d5238a61b8: public specification.
- POST /feature_fa8688cbfa3fc935ae60de224a972126: create session; accepts {}.
- POST /feature_11edaf0d1c4e447615614810348a3030: responds to {} with invalid encrypted embedding.
- POST /feature_c26f994e7f7d755a4602972a35430050: expects multipart form data.
- GET /feature_c426f4d0ed166214ae89992cbd592932: requires a target slot.

Public specification and one sample session are saved alongside these notes. Run python analysis/cache_scores.py to reproduce classifier results. This is an analysis, not a verified full solve.
