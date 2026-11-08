---
title: "baby_circuit — state notes"
description: "Target Remote: nc 113.20.103.55 1337 (real flag). Local oracle: python3.11 hsmmain.py (TEST flag). Goal: recover AES-256 key = SHA256(w r1 r2), each reg 32 bytes big-endian, decrypt encryptedflag (AES-CBC, i…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Cryptography"
kind: "field-note"
status: "reference"
tags: ["Cryptography", "cscv", "Field notes", "aes"]
readingTime: 2
wordCount: 340
featured: false
sourcePath: "~/ctf/cscv/math_problem/notes.md"
---

# baby_circuit — state notes

## Target
- Remote: nc 113.20.103.55 1337 (real flag). Local oracle: python3.11 hsm_main.py (TEST flag).
- Goal: recover AES-256 key = SHA256(w || r1 || r2), each reg 32 bytes big-endian, decrypt encrypted_flag (AES-CBC, iv given).
- Reg widths: w=96 bits, r1=54 bits, r2=54 bits.
- Field p = 0x30644e72...0000001 (BN254 scalar field). x^5 is a permutation (gcd(5,p-1)=1).

## Environment
- .so needs python3.11 (/home/thinh/.local/bin/python3.11). System py=3.14 (won't load .so).
- Crypto only in 3.14 env; need pycryptodome for 3.11 -> use for AES. (TODO check)
- hw_model importable directly; build_columns has NO query budget locally (budget is in hsm_main only) -> unlimited local probing.

## Structure
- s0 = (load(r1,r2), w, x1, x2). Poseidon 32 rounds -> hash = s32[0] (public in proof.public_hash).
- load(r1,r2) = r1^2 + A r1 r2 + B r2^2 + C r1 + D r2 + E  (6 terms; A..E published).
- Circuit is a "baby" 14-gate circuit; witness a/b/c at circuit rows LEAK intermediate values.

## CONFIRMED leaks from witness (nominal v=1200,f=80)
- row 12 pass: a=c = w  (lane-1 of state = w, 96-bit).  -> w LEAKED directly.
- row 26 pass: a=c = x1 (0x1234). row 53 pass: a=c = x2. (public nonces)
- row 3 mul c == 'a' input of all lin gates rows 7/17/31/44 == y[0][0] = sbox(load) = load^5.
  -> recover load = (c_row3)^(5^-1 mod p-1).

## Plan / hypotheses
- Need r1,r2 individually. They only enter via load (single value) => need >=2 independent
  equations in (r1,r2). Single quadratic + 54-bit box: Coppersmith bound ~2^85 < 2^108 => NOT enough alone.
- HYPOTHESIS: 6 timing "stages" a..f map to the 6 load terms (or datapath regs). Choosing (v,f)
  makes some stage latch 0 => drops terms from load => a DIFFERENT load' recoverable from witness.
  2 prove queries (budget=2) => 2 equations => solve for r1,r2.
- Latch rule (published): stage dead if T_delay = 6*(1200/V)^2*coeff > T_clk = 1000/F.
  coeffs a=1.5 b=.5 c=.5 d=.6 e=1.85 f=1.7. Envelope: V>=1000, F<=133.

## NEXT
- Empirically: scan (v,f), recover load'(config) from witness, map which subset of load terms present.
- Solve r1,r2 locally, verify against session_key (SHA256(w||r1||r2)). Then port to remote (<=2 queries).
