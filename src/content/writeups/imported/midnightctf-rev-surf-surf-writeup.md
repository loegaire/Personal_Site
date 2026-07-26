---
title: "SURF (Midnight CTF) — Writeup"
description: "The binary is a modified surf browser. Relevant hints were around:"
published: "2026-03-21"
updated: "2026-03-21"
event: "midnightctf"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "midnightctf", "Writeup"]
readingTime: 2
wordCount: 286
featured: false
sourcePath: "~/ctf/midnightctf/rev/surf/surf_writeup.md"
---

# SURF (Midnight CTF) — Writeup

## TL;DR

Final flag:

`MCTF{aimes_tu_les_gros_paffs_mon_bibouchou?}`

---

## Challenge context

The binary is a modified `surf` browser. Relevant hints were around:

- cookie manager
- `100`
- `onii`
- “what is that browser doing??”

The key observation: user input path is noisy/misleading; the real secret is generated in cookie-related code.

---

## Initial reconnaissance

```bash
file surf
strings surf | grep -Ei "secret|cookie|hidden|flag"
```

Interesting strings:

- `What's your hidden secret ?`
- `Your ciphered input is : %s`
- `[.midnightflag.fr] SECRET = %s`
- `secret_b64`

The `computeFlag` prompt exists, but output looked unstable across runs (due to runtime/browser context), so that path is not the reliable extraction target.

---

## Static analysis in IDA Pro

Important functions:

- `computeFlag` @ `0xbc8f`
- `little_encryption` @ `0xba55`
- `b64encode` @ `0xba7d`
- `print_cookies_callback` @ `0x990d`

### What `print_cookies_callback` reveals

It prints:

```c
printf("[.midnightflag.fr] SECRET = %s\n", secret_b64);
```

So the target is the value of global `secret_b64`.

### Why `b64encode` matters

`b64encode` does **not** use user input. It builds a fixed 44-byte buffer from immediate constants, then:

```c
secret_b64 = g_base64_encode(buf, 44);
```

Therefore, `secret_b64` is deterministic and recoverable directly.

---

## Dynamic extraction with pwndbg

Set breakpoint and inspect after `b64encode` returns:

```shell
break b64encode
start
continue
# provide any input when prompted
finish
```

Read global pointer (`secret_b64` is at fixed PIE-relative symbol; runtime address shown by gdb):

```shell
x/gx 0x555555566be8
# -> 0x... <secret_b64>: 0x555555580390
x/s 0x555555580390
```

Recovered:

`IpFwamRDX/q/UN5TGN4Ev1DeZcSGUN66Q2FhUN76hkHeUl9Shhhx4IYYnCA=`

---

## Reversing the encoded bytes

Decode base64 to 44 bytes:

```python
import base64
b = base64.b64decode("IpFwamRDX/q/UN5TGN4Ev1DeZcSGUN66Q2FhUN76hkHeUl9Shhhx4IYYnCA=")
```

`little_encryption` is:

```c
sbox[((1337 * (a1 << 7)) >> 5) & 0xFC]
```

with AES S-box table.  
Invert this mapping byte-by-byte:

- each ciphertext byte has 4 possible preimages (`x, x+64, x+128, x+192`)
- choose the printable branch that matches CTF flag format.

Recovered plaintext:

`MCTF{aimes_tu_les_gros_paffs_mon_bibouchou?}`

---

## Verification

Forward-check by reapplying `little_encryption` to every char of the recovered flag and base64-encoding the result. It reproduces exactly:

`IpFwamRDX/q/UN5TGN4Ev1DeZcSGUN66Q2FhUN76hkHeUl9Shhhx4IYYnCA=`

So the solution is consistent both ways.

---

## Notes

- The prompt path (`What's your hidden secret ?`) is a distraction.
- Cookie manager path is the intended pivot (`secret_b64` print).
- Hint `100` corresponds to `fgets(..., 100, stdin)` in `computeFlag`, reinforcing the decoy path.
