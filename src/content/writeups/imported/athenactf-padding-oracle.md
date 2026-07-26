---
title: "Padding Oracle (RSA) — writeup"
description: "The flag was recovered from the instance on port 10023 after 4,550 oracle queries."
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Cryptography"
kind: "field-note"
status: "reference"
tags: ["Cryptography", "athenactf", "Field notes"]
readingTime: 2
wordCount: 423
featured: false
sourcePath: "~/ctf/athenactf/padding_oracle/notes.md"
---

# Padding Oracle (RSA) — writeup

## Result

Flag:

```text
athena{EhHpzc3Ki7Za9W1T}
```

The flag was recovered from the instance on port `10023` after 4,550 oracle queries.

## Service model

On connection, the service prints JSON containing:

```json
{"e": 65537, "N": ..., "c": "..."}
```

It then accepts one hex-encoded RSA ciphertext per line and replies with either
`valid` or `invalid`.

For the private plaintext `m`, the service checks whether the first two bytes
are `00 XX`, where `XX` is fixed for the instance but initially unknown.

For a 1024-bit modulus, ciphertexts and plaintexts are 128 bytes. Define

```text
B = 2^(8 * (128 - 2)) = 2^1008
```

The accepted plaintext interval is therefore

```text
[L, U] = [XX*B, (XX+1)*B - 1]
```

The target plaintext is nonzero, so the implementation uses `L=max(1, XX*B)`.

## Important parser bug

The first solver used:

```python
'valid' in reply
```

This is incorrect because `valid` is a substring of `invalid`. It falsely
reported `XX=0x00` and caused the attack to maintain impossible intervals.
The correct test is:

```python
reply.strip().lower() == 'valid'
```

After fixing this, the instances produced nonzero type bytes, for example:

```text
10005: XX = 0xf4
10013: XX = 0xfc
10023: XX = 0xc3
```

## Discovering `XX`

The public key lets us encrypt chosen plaintexts. For each `t` in `0..255`,
construct the 128-byte integer

```text
m_t = t * B
```

Its byte representation starts with `00 t`, so encrypting it and submitting
the result identifies the type byte:

```python
for t in range(256):
    chosen = pow(t * B, e, N)
    if oracle(chosen) == 'valid':
        XX = t
        break
```

The query must be sent and interpreted on the same oracle session used for the
attack. Pooling connections caused inconsistent interval results on fragile
workers, so the final solver uses one TCP connection and pipelines batches on
that connection only.

## RSA multiplicative attack

RSA is multiplicative:

```text
RSA(m, s) = c * s^e mod N
```

If the oracle accepts `c*s^e`, then for some integer `r`:

```text
L <= m*s - r*N <= U
```

Therefore every valid query gives a set of possible plaintext intervals:

```text
ceil((L + r*N)/s) <= m <= floor((U + r*N)/s)
```

For every current interval `[a,b]`, the possible quotient range is:

```text
r_min = ceil((a*s - U) / N)
r_max = floor((b*s - L) / N)
```

Each resulting interval is intersected with `[a,b]`, and overlapping
intervals are merged. Repeating this process eventually leaves one integer.

## Faster first valid multiplier

A blind search starting at `ceil(N/U)` can require approximately `N/B`, or
about 65,536, queries because the oracle recognizes two fixed bytes.

Instead, enumerate the quotient `r`. A multiplier can only be useful if some
plaintext in the initial interval maps into the accepted interval, so query
only values satisfying:

```text
ceil((L + r*N)/U) <= s <= floor((U + r*N)/L)
```

The final solve found:

```text
XX = 0xc3
s1 = 16548
```

This reduced the expensive first phase to roughly 2,000 queries.

## Final instance

The successful port was `10023`.

```text
N = 164683342835414138575576387528364786511808087654799619267163365147632915032645422695192053565944507948309361164533574082122264739391746943217504494840188287034709760430073205112008965603110544061067918553283061418341323652177948275602138710771337647788125892115022901686472505334234339218996813671636783216811
```

The complete run data is preserved in `scratch/interval_state.json`; the
solver itself prints the complete banner-derived modulus and ciphertext at
startup. The attack converged at iteration 992. The recovered 128-byte
plaintext was:

```text
00 c3 ec a3 e8 a2 f5 67 c2 02 f2 b9 83 04 df 7f
16 f6 e0 b6 19 5a e8 99 c5 20 55 fb 74 47 11 b5
95 43 5d b1 97 64 06 07 ea 44 4a 41 63 83 f4 09
a9 7b 0f 6c 47 c6 9b c7 9d 9d 3d 12 be 32 0d 72
4f 7c 1a 86 34 82 ed a0 29 31 9d 04 2e 38 e6 96
86 b3 3c 80 d3 72 14 a4 c8 c4 e5 da 87 41 ca 01
c2 1a 8d d3 74 25 9e 00
61 74 68 65 6e 61 7b 45 68 48 70 7a 63 33 4b 69
37 5a 61 39 57 31 54 7d
```

The trailing printable bytes give the flag shown at the top.

## Reproduction

Set `HOST, PORT` in [solve.py](/Personal_Site/media/writeups/athenactf-padding-oracle/solve.py)
to a live instance and run:

```bash
python3 -u solve.py
```

The solver performs type-byte discovery, quotient-guided multiplier search,
interval narrowing, and checkpoints its current state after every iteration.
