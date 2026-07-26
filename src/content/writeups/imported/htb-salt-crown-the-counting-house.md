---
title: "The Counting House"
description: "Challenge summary Target: 154.57.164.68:30229 Category: Quantum / web Goal: Take a seat with a forged note, read the sealed book, bypass the seal, then settle at the highest rival bid."
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Web Security"
kind: "writeup"
status: "solved"
tags: ["Web Security", "HTB", "Writeup"]
readingTime: 3
wordCount: 550
featured: false
sourcePath: "~/ctf/HTB/salt_crown/the_counting_house/WRITEUP.md"
---

# The Counting House

## Challenge summary
Target: `154.57.164.68:30229`  
Category: Quantum / web  
Goal: Take a seat with a forged note, read the sealed book, bypass the seal, then settle at the highest rival bid.

Final flag:
`HTB{f0rg3d_r34d_4nd_s3ttl3d_t0_th3_s1lv3r_882b9d30ed8aa2c15a5e39348d3888a9}`

## 1) Initial recon
The landing page and bundled JavaScript expose an API-only backend.  
`GET /api/market` documents all routes and parameters:

- `POST /api/new` gives a fresh token.
- `POST /api/enter` locks a seat from a submitted quantum circuit.
- `POST /api/book` measures one sealed-bid qubit for a bidder and position.
- `POST /api/seal/commit` starts a seal round with `slots` circuits.
- `POST /api/seal/peek` returns your side of the sealed qubits.
- `POST /api/seal/open` submits your responses and checks the round.
- `POST /api/settle` verifies a payment circuit against the clearing price.

## 2) Forging an accepted seat note
The challenge text says a note of value `v` is the subspace `|A_v>` where
`A_v = ker(H_v)`, with `H_v` built from truncated SHA-256 rows.

For the required entry value `4919`, rows are:

- byte `sha256("eastreach-note-v4919-0")`
- byte `sha256("eastreach-note-v4919-1")`
- byte `sha256("eastreach-note-v4919-2")`
- byte `sha256("eastreach-note-v4919-3")`

keeping independent rows only.  
The implementation used by the server is the low-order digest byte, which yields:

`[0x11, 0xA9, 0xA1, 0x4E]` (decimal `[17, 169, 161, 78]`).

To pass verification the state must satisfy:

- every `Z` read is in `A_v`
- every `X` read is in `A_v^⊥`

Preparation method:

1. Compute GF(2) row-reduced form of `H_v`.
2. Identify free columns.
3. Apply `H` to each free column qubit (uniform superposition over free variables).
4. For each free qubit, CNOT into constrained target columns indicated by the reduced matrix.

This yields a valid note circuit. Submitting it to `/api/enter` returns:
`{"seated": true}`.

## 3) Reading the sealed book
There are 6 rivals and 16 bid bits each.  
Each bit is a BB84-style encoded qubit, so in one basis the outcome is random and in the correct basis deterministic.

For every `(bidder, position)`:

1. Measure with `basis=Z`.
2. Measure with `basis=X`.
3. Use the all-equal outcomes string from the deterministic basis as the bit.

This was done with `shots=16` per request.  
The two-bit interpretation (`LSB`/`MSB`) was handled by computing both values, then selecting the clearing bid by trying each in settlement.

## 4) Seal bypass (24 rounds)
Each round from `/api/seal/commit` returns a single global `challenge` (`0→Z`, `1→X`) plus a `round` index.

`slots` are prepared identically as Bell pairs on qubits `a,b`:

`H(a); CX(a,b)` for each of 8 strands.

With one shared Bell state, outcomes are perfectly correlated in both `Z` and `X` bases.  
For each round:

1. Commit with the Bell `slots`.
2. Read `challenge` to choose the basis.
3. Measure our own `a` qubits in that basis via `/api/seal/peek`.
4. Send exact `a_outcomes` to `/api/seal/open`.

All rounds (24 total) pass because of deferred basis coordination.

## 5) Settlement
After seal completion, compute the forged note circuit for the discovered clearing price and submit:

`POST /api/settle {token, circuit, value}`.

The endpoint enforces:

- exact clearing price,
- valid note format for that value.

Using the highest recovered bid produces success and returns the flag.

## Why this works
The room is vulnerable on three coupled points:

- The note construction is public, so anyone can generate a valid state.
- The book interface effectively allows basis probing, leaking BB84 basis choice.
- Seal logic is defeated by Bell-state entanglement with deferred basis adaptation.

## Reproducibility
Run:

`python3 solve.py`

for a full end-to-end chain from seat-fake to settlement.
