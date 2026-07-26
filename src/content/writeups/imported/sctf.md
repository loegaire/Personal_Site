---
title: "SCTF multi-challenge solve notes"
description: "Started: 2026-06-14 Workspace: /home/thinh/ctf/SCTF"
published: "2026-06-14"
updated: "2026-06-14"
event: "SCTF"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "SCTF", "Field notes"]
readingTime: 4
wordCount: 871
featured: false
sourcePath: "~/ctf/SCTF/notes.md"
---

# SCTF multi-challenge solve notes

Started: 2026-06-14
Workspace: `/home/thinh/ctf/SCTF`

## Flags found

| # | Challenge | Flag | Method |
|---|-----------|------|--------|
| 1 | Crypto-CypherChain | `SCTF{curve25519_bsuiahduie_cif_diqw}` | MITM kernel search + X25519 key exchange |
| 2 | pwn-slang | `flag{fu0f3sSTWfurkC4SmsF8MQsyE1fuE1nr}` | Compiler variable slot type confusion + libc GOT overwrite |

## Challenge Status

| # | Challenge | Status | Notes |
|---|-----------|--------|-------|
| 1 | Crypto-CypherChain | ✅ SOLVED | Flag: SCTF{curve25519_bsuiahduie_cif_diqw} |
| 2 | Crypto-Cuneiform | 🔄 TODO | GF(3^51) quadratic forms, common isotropic subspace |
| 3 | Misc-Chronostatis | 🔄 TODO | DeFi TWAP oracle manipulation |
| 4 | Misc-DeepSea-Finance | 🔄 TODO | DeFi proxy+vault drain |
| 5 | Misc-GateCrash | 🔄 TODO | ERC-4337 account abstraction exploit |
| 6 | Misc-The_Last_Honest_Witness | 🔄 IN PROGRESS | Page A solved (m=25774616630246150697727911729) |
| 7 | Rev-babel-furnace | 🔄 TODO | Windows PE reverse |
| 8 | pwn-ParacelBridgeVault | 🔄 TODO | APK pwn |
| 9 | pwn-slang | ✅ SOLVED | Flag: flag{fu0f3sSTWfurkC4SmsF8MQsyE1fuE1nr} |

## Crypto-CypherChain Solution Details

### Task 1
- h ∈ {-1,0,1}^30, weight 10, in left kernel of G (30×14 over GF(65537))
- Kernel dim = 16. MITM with numpy: split 8+8, enumerate 3^8 × 3^8 combos
- Found: h = [0,1,0,0,-1,1,0,0,0,1,0,0,0,-1,0,0,0,1,0,0,-1,0,-1,0,0,0,1,0,-1,0]
- seed = ciphertext XOR SHA256_stream(material) = `6147466a794858316157646164616465`

### Task 2
- compress(seed) = SHA256(seed), burn_counter = 50000 SHA256 iterations → X25519 scalar
- X25519(scalar, server_pub) → shared_secret
- session_key = SHA256(shared_secret) — first 8 bytes match session_prefix ✓  
- Stream mask = SHA256(session_key) || SHA256(session_key)[:4] (wrapping for 36 bytes)
- Flag: SCTF{curve25519_bsuiahduie_cif_diqw}

## The Last Honest Witness - Page A
- Franklin-Reiter: n=760009694642386684565581461392043895505912502559714131532944907541093903, e=3, delta=1337
- Polynomial GCD in Z/nZ[x] gives m = 25774616630246150697727911729
- Verified: m^3 = c1 and (m+1337)^3 = c2 mod n ✓
- Fermat factoring of n failed within 1M iterations — p,q may not be close enough for this N
- Note: This N is for Page A. The ZK proof needs a DIFFERENT N from on-chain storage.

## pwn-slang Solution Details
- Custom compiler `slang` translates a custom script language into C code, which is then compiled and executed via `server.py`.
- Identified a type confusion vulnerability due to how local variables are tracked. The compiler uses a flat array `slot[]` on the C stack for local variables, where variables with non-overlapping lifetimes reuse the same slot index.
- If a string variable (`str s0`) and a vector variable (`vec v`) are placed in the same slot index due to non-overlapping lifetimes, `v` evaluates using the memory address of the string literal initialized by `s0`.
- The `vec_t` structure requires `data` (8 bytes) and `size` (8 bytes). By crafting a string payload with hex escapes (e.g. `\x18\x40\x40...`), we forged a `vec_t` pointing to the GOT entry of `puts()`.
- Used the built-in function `scribble(v, idx, delta)` which performs an arbitrary write: `v->data[idx] += delta`. Since `v->data[0]` was the `puts` GOT address, `scribble` updated the GOT entry.
- Calculated the delta between `system` and `puts` in the server's libc (`-205200` for `libc-2.31.so` from the ubuntu:focal docker container).
- Added the offset to `puts` GOT, transforming subsequent calls to `say("...")` into `system("...")`. Popped a shell and read the flag.

## Crypto-Cuneiform work log
- Started focused solve pass.
- Reviewed `chall.py` and `output.txt`.
- Key observation: `TallyField._digits` is malformed: it appends `a % p` 51 times, then divides `a` once after the list comprehension. Therefore multiplication is not true GF(3^51) arithmetic; `F.mul(a,b)` depends only on `a % 3` and `b % 3`, returning one fixed 51-trit vector times that residue product.
- This likely collapses the quadratic equations to constraints over the lowest ternary digits; next step is to unpack tablets and test target consistency under the broken arithmetic.
- Confirmed target profile values are also collapsed elements: their 51 ternary digits are all constant, with residues `[1,0,2,1]`.
- Multiplication rule under the bug: `F.mul(a,b) = E(2*(a mod 3)*(b mod 3))`, where `E(r)` is the 51-trit constant element with every digit `r`.
- Consequence: all quadratic scoring constraints depend only on token residues mod 3 and tablet coefficient residues mod 3. Need still recover the exact seal inputs: opening words and normalized Plucker coordinates.
- Correction: the earlier `F._digits()` inspection is itself affected by the bug. Use an independent base-3 decoder for actual coefficients. Multiplication still depends only on the input residues mod 3, but its output is a fixed field element `K` or `2K`, not necessarily a constant-trit element.
- Important consistency check: using the distributed `TallyField.mul`, every score is restricted to `{0,K,2K}`, but public `profile` values are not in that set. Therefore `output.txt` cannot have been generated by the exact buggy source.
- Working assumption now: packed tablets/vault were produced by the intended GF(3^51) arithmetic with modulus `x^51+2x+1`; solve with a corrected independent field implementation.
- Corrected solve model:
  - Decode tablets using the intended field modulus `x^51 + 2x + 1`.
  - Recover hidden 4-plane `V <= F^9` such that `Q P_k Q^T = 0` for all 4 paired forms.
  - This is a Grassmannian/Plucker recovery problem. In row-reduced chart it is 20 variables with 40 quadratic equations; in exterior coordinates the isotropy constraints are linear but Plucker consistency remains.
- Next attack: build field routines independent of `chall.py`, derive linear constraints on Plucker coordinates or solve chart equations directly.
- Added `Crypto-Cuneiform/solve_cuneiform.py` with independent GF(3^51) arithmetic, base36 tablet unpacking, score/rank helpers.
- Verification with corrected arithmetic: paired ranks are `[9,9,9,9]`, common radical dimension is `0`, matching the challenge QA properties (`rank >= N-1`, at least two full-rank, kernel <= 4). Decoder now looks sane.
- Plucker linear-system prototype over corrected GF started but pure Python reduction was too slow (126 columns, expensive inversions). Stopped it and will optimize field arithmetic before continuing.
- Optimized field multiplication and Euclidean inversion in `solve_cuneiform.py`, but full Plucker row reduction remains too slow in pure Python.
- Pivoting to smaller chart-based equations: choose a 4-column identity chart for the hidden subspace and solve the resulting 40 quadratic equations in 20 field variables.
- Installed Python package `galois` locally; use it for fast GF(3^51) arithmetic and matrix work instead of pure Python routines.
- Added `Crypto-Cuneiform/solve_galois.py` using `galois.GF(3**51, x^51+2x+1)`.
- Confirmed integer representation matches challenge coefficient packing.
- Fast sanity checks: paired ranks `[9,9,9,9]`, common radical `(0,9)`.

## Crypto-Cuneiform — fresh solve pass (session 2026-06-14b)
- Switched field arithmetic to **python-flint** `fq_default_ctx(modulus=x^51+2x+1)`. ~1M mul/s, fast inv. galois too slow (q>2^64 → object dtype).
- Confirmed element encoding: challenge int = base-3 packed digits → flint element via `GF([d0,d1,...,d50])`; back via `to_list()`.
- Structure recap: 4 symmetric forms T_k (unpacked, each T[i][j]=T[j][i]); paired P_k=2T_k. ALL share ONE hidden 4-dim totally-isotropic subspace V (`_fire_tablets` uses a single subspace for all tablets).
- paired ranks [9,9,9,9] (all nondegenerate); common radical dim 0.
- DEAD END confirmed: Plücker linear contraction kernel = 0. Symmetric-form isotropy is QUADRATIC in Plücker coords, not linear (contraction trick is only valid for alternating forms). 
- Need: recover common totally-isotropic 4-space of 4 nondegenerate symmetric forms in dim 9 over GF(3^51). Then opening + cipher + unseal are deterministic replays of chall.py.
- Next: empirical diagnostics with flint — do φ_k=T0^{-1}T_k commute? char poly factorization? to choose between (a) simultaneous eigendecomposition vs (b) solving 40 quadratics in 20 unknowns (chart [I|X]).
