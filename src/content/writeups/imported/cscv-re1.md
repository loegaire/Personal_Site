---
title: "CSCV RE1 — chall.exe writeup"
description: "Category: Reverse engineering (packed Windows x64 crackme) Password: y0u4r3ju5tt00g00dt0b3tru3"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "cscv", "Writeup", "shellcode"]
readingTime: 3
wordCount: 537
featured: false
sourcePath: "~/ctf/cscv/RE1/writeup.md"
---

# CSCV RE1 — chall.exe writeup

**Category:** Reverse engineering (packed Windows x64 crackme)
**Password:** `y0u_4r3_ju5t_t00_g00d_t0_b3_tru3`

Running `chall.exe` on Windows with the password (stdin) next to the handout's `flag.png.enc` prints `[+] Correct` and decrypts it to `flag.png` (1024x1024 PNG of a cat), which carries the flag:

**`CSCV2026{n0_IAT_HuH???}`**

(Handout: `BabyCrackme.7z`, password `infected`, containing `chall.exe` (identical to the earlier copy) and `flag.png.enc`.)

## 1. Stage 0: self-decrypting loader

`.text` is only 0x638 bytes and `.data` is 0x6a00. The entry code is a chain of tiny stubs:

```
mov ecx, N
lea r15, [rip+X]
xor byte [r15+rcx-1], K   ; decrypt the next N bytes
dec rcx / jne
```

Each stub decrypts the following code with a one-byte XOR key, and the code re-encrypts itself afterwards. The decrypted code:

- builds an API name on the stack (e.g. `VirtualAlloc`) and calls `0x1400015bc`, a shellcode-style resolver that walks the PEB → `InLoadOrderModuleList` → kernel32 export table and returns the function address;
- resolves `VirtualAlloc`, `LoadLibraryA` and `GetProcAddress`;
- allocates 0xc000 bytes and manually maps a PE from `.data`. It copies sections, walks the section headers, resolves imports and relocates.

Wine crashes on this (PEB walk), so I unpacked it by emulating with unicorn. `VirtualAlloc` was hooked to return a mapped buffer and the API resolver was faked. The mapped image (headers zeroed) was dumped from that buffer.

## 2. Stage 1: the payload

Strings: `[!] Enter the password:`, `[+] Correct`, `[-] Incorrect`, `flag.png.enc`, `flag.png`, and imports from `bcrypt.dll`.

The main function reads a line with `getline`. It calls `fcn.3380(input, len, table, table_len)`, which:

1. zero-pads the input to a multiple of 8 bytes;
2. for each 8-byte block, builds output byte `r` (0..7) as
   `out[r] = OR over k in 0..7 of ( in[(r+k) & 7] & (0x80 >> k) )`;
3. compares the result with `repe cmpsb` against the table.

The function is littered with junk-byte anti-disassembly: `push rax; lea rax,[rip-7]; add rax,0xe; push rax; ret; <junk byte>`, followed by the real instruction. NOP-ing those 16-byte patterns gives clean disassembly.

## 3. The table is not the static constants

`fcn.1103` builds a 64-byte constant blob on the stack, but that isn't the compare table. The table is the vector at `.data+0x8200`, filled at runtime by `fcn.1a00` (hex-decode a 32-char string, then BCrypt work). Its contents are 32 bytes, so the password is 32 characters long. Reading the static constants instead gives garbage for most of the string.

I got the real table by launching `chall.exe` on a Windows box, scanning the process memory for the payload region (found via the `[!] Enter the password` string), and reading the vector's begin/end pointers at `+0x8200`:

```
335374397916747f7c3053717c253674742d33567c700176711772777b72047f
```

## 4. Solve

For each block and each output byte `r`, bit `p = 7-k` of `out[r]` came from `in[(r+k)&7]` at the same bit position, so inversion is a direct bit copy back:

```python
t = bytes.fromhex('335374397916747f7c3053717c253674742d33567c700176711772777b72047f')
pw = bytearray(len(t))
for b in range(0, len(t), 8):
    for r in range(8):
        for k in range(8):
            p = 7 - k
            if t[b+r] >> p & 1:
                pw[b + (r+k) % 8] |= 1 << p
print(pw.decode())   # y0u_4r3_ju5t_t00_g00d_t0_b3_tru3
```

Verified by running `chall.exe` on Windows with that password on stdin: `[+] Correct`, and `flag.png` was produced.

## Notes / lessons

- Emulate self-modifying XOR-stub loaders (unicorn) rather than hand-decrypting each layer.
- Strip repeated junk-byte patterns with a byte-level find/replace before disassembling.
- When a static constant blob gives partly-readable results, check for a runtime-built vector. Here the first 24 bytes decoded to noise, and only the last 3 blocks of the constants happened to look valid.

Files: `solve.py` (inversion, with the dumped table hard-coded), `scratch/emu.py` (unpacker), `scratch/dump.py` (runtime table dump, run on Windows), `artifacts/payload.bin` and `artifacts/payload_clean.bin` (unpacked payload).
