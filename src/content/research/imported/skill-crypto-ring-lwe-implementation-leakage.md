---
title: "Crypto Ring Lwe Implementation Leakage"
description: "Use when solving CTF crypto or rev challenges involving Ring-LWE/LWE/KEM schemes, NTT or inverse NTT code, vectorized modular arithmetic, decapsulation oracles, implementation mistakes, lattice dimension red…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Cryptography"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Cryptography", "Agentic Skills", "rsa", "ecc", "lattice"]
readingTime: 3
wordCount: 493
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/crypto-ring-lwe-implementation-leakage/SKILL.md"
---

# Crypto Ring-LWE Implementation Leakage

## When to use

Use this skill when you see:
- Ring-LWE, LWE, module-LWE, NTRU-like KEMs, FO transform, encaps/decaps, or public key plus encrypted flag.
- Native libraries implementing NTT/inverse NTT, AVX2 vector math, Montgomery multiplication, or polynomial multiplication.
- A service that repeatedly decapsulates or responds differently to valid/invalid ciphertexts.
- Bugs where arithmetic is "almost always" correct but fails for special values such as zero products.
- Lattice attacks that look too expensive until leakage reduces dimension.

Do not use this skill when:
- The cryptosystem is classical RSA/ECC/symmetric crypto.
- There is no oracle, implementation bug, or observable correctness signal.
- The challenge only asks to reverse a custom cipher with no lattice structure.

## Core idea

Post-quantum schemes can be mathematically hard but implementation-fragile. A tiny arithmetic bug in NTT/Montgomery code may leak predicates about secret-dependent intermediate values. Accumulating many predicates can recover linear relations or eliminate candidates, reducing the LWE/Ring-LWE instance enough for a lattice attack.

## Recognition signals

Look for:
- Symbols named `ntt`, `inv_ntt`, `mul`, `sample`, `encaps`, `decaps`, `mkaes`.
- Constants equal to modulus `q`, `2-q`, `q-2`, Montgomery factors, or roots of unity.
- Packed 16-bit vector operations such as `vpmulhuw`, `vpmullw`, `vpminuw`, `vpsubw`.
- Server protocol: prints public key/ciphertext, then accepts many ciphertexts and returns encrypted acknowledgement.
- Correctness check or FO transform that should suppress invalid-ciphertext leakage but still leaks through an implementation fault.
- Need for hundreds/thousands of oracle queries plus Sage/fplll/BKZ.

## Standard workflow

1. Reproduce the reference math in Python/Sage and compare native library outputs.
2. Differential-test native arithmetic with random and edge-case inputs to locate rare failures.
3. Disassemble vectorized math and identify modulus constants and Montgomery variants.
4. Convert failure/success behavior into a predicate over secret-dependent intermediates.
5. Batch oracle queries and pipeline network I/O; these attacks often need many samples.
6. Accumulate constraints until they become equalities, ratios, or a lower-dimensional subspace.
7. Build the reduced lattice instance and estimate cost before running BKZ/LLL.
8. Verify recovered secret by decrypting the challenge ciphertext locally.

## Commands and tools

```bash
nm -D compute.so
objdump -d -Mintel compute.so | rg -n 'ntt|inv_ntt|mul|vpmul|vpsub|vpadd|vpmin'

python3 - <<'PY'
# Harness idea: compare native mul() against a clean Python/Sage implementation
# and log inputs where results diverge.
PY

sage - <<'SAGE'
# Use Sage for NTT matrices, finite-field linear algebra, and lattice construction.
SAGE
```

## Pitfalls

Common ways agents get this wrong:
- Attacking the formal KEM before checking implementation correctness.
- Ignoring rare mismatches as noise instead of modeling their predicate.
- Treating FO transform as absolute protection; implementation leakage can bypass the intended proof model.
- Running BKZ on the original dimension after the writeup/source hints imply relation recovery.
- Forgetting to validate the recovered secret against the public key and encrypted flag.

## Verification

Prove the solve path is real with:
- A local differential test showing the arithmetic bug.
- A clear mapping from oracle observation to secret relation/candidate elimination.
- Constraint counts sufficient to reduce dimension.
- Successful decryption of the provided flag ciphertext or matching shared-secret transcript.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| hxp CTF 2022 | the_swirl | crypto/rev | A wrong AVX2 Montgomery multiplication in inverse NTT leaked disequalities that were accumulated into linear relations and then solved with a reduced lattice attack. |

## Sources

* https://hxp.io/blog/97/hxp-CTF-2022-the_swirl-writeup/ - author writeup on Ring-LWE KEM leakage, AVX2/NTT reverse engineering, query accumulation, and lattice reduction.
