---
title: "whc2 notes"
description: "Confirmed facts Challenge directory: /home/thinh/ctf/nohacknoctf/whc2 Files: README.md, c2, notes.md; helper dirs already present: scratch/, dumps/, artifacts/, extracted/. README.md text: - WhC2 v0.1 - 500…"
published: "2026-07-04"
updated: "2026-07-04"
event: "nohacknoctf"
category: "Cryptography"
kind: "field-note"
status: "solved"
tags: ["Cryptography", "nohacknoctf", "Field notes"]
readingTime: 5
wordCount: 1018
featured: false
sourcePath: "~/ctf/nohacknoctf/whc2/notes.md"
---

# whc2 notes

## Confirmed facts
- Challenge directory: `/home/thinh/ctf/nohacknoctf/whc2`
- Files: `README.md`, `c2`, `notes.md`; helper dirs already present: `scratch/`, `dumps/`, `artifacts/`, `extracted/`.
- `README.md` text:
  - `WhC2 v0.1`
  - `500`
  - `1 (100% liked) 0`
  - `How to hack a hacker, this is a good question!`
  - `Btw, the remote C2 Server will restart every 15 minutes.`
- `c2`: stripped 64-bit x86_64 PIE ELF, dynamically linked to libc, BuildID `0e7b041fb643a145ceb24c373a4909e78fdca733`.
- `c2` currently lacks execute permission.
- Imports are sparse: `fchmod`, `calloc`, `memcpy`, `write`, `syscall`, `__environ`, libc startup/fini symbols.
- `checksec` is not installed in PATH.

## Commands tried / useful outputs
- `file ./c2`: ELF 64-bit LSB pie executable, stripped.
- `ldd ./c2`: libc only, warning about no execute permission.
- `strings -a -n 4 ./c2`: no obvious flag or prompts; `.note.package` says Ubuntu glibc 2.41 package metadata.
- `readelf -h -l -S -s -r ./c2`:
  - Entry point `0x1090`; likely `main` at `0x1180`.
  - `.text` is tiny (`0xd49` bytes), `.rodata` is huge (`0xb7ac15` bytes).
  - Imports: `write`, `calloc`, `syscall`, `memcpy`, `fchmod`.
  - RELRO segment present; PIE executable; original mode not executable.
- `objdump` around `0x1180`: first significant action is `syscall(0x13f, &.data+0x10, 0)`, where syscall `0x13f` is likely x86_64 `memfd_create`. `.data+0x10` bytes are `dc de dc d7 da bf`.
- Accidentally dumped full `.rodata`; output confirms large high-byte blob dominated by `0x80..0x9f`.
- `strace` on executable copy (`scratch/c2.run`) confirms loader behavior:
  - `memfd_create("cache", 0) = 3`
  - `fchmod(3, 0700)`
  - many `write(3, ..., 4096)`
  - `execveat(3, "", ["./scratch/c2.run"], envp, AT_EMPTY_PATH) = 0`
  - second stage exits with code `1` when no args.
- Added `scratch/dump_memfd.c`/`.so` LD_PRELOAD shim to mirror writes to `/memfd:cache`.
- Dumped payload to `artifacts/stage2_from_memfd`:
  - Size `6018568`
  - ELF 64-bit x86_64 executable, dynamically linked, stripped
  - BuildID `29ccfc4ba6ddaff0d9f742c06a2c519c54735e47`
  - SHA256 `77a700d94a9c1363d4fe61d2e6d37b5e6459b9729fcdc9bbee0220d71f6ce6d4`
- `go version -m artifacts/stage2_from_memfd`:
  - `go1.24.2`
  - module path `ops/client`
  - `-trimpath=true`, `CGO_ENABLED=1`, `GOOS=linux`, `GOARCH=amd64`
- Parsed Go `.gopclntab` manually:
  - `.gopclntab` file offset `0x3c1140`, VA `0x7c1140`
  - `nfunc=6177`, `textStart=0x402460`
  - Main/package functions:
    - `main.init` `0x64dc40`
    - `main._Cfunc_open_box` `0x64de60`
    - `main._Cfunc_run_digest` `0x64dfa0`
    - `main.add` `0x64e0c0`
    - `main.mul` `0x64edc0`
    - `main.same` `0x64f3e0`
    - `main.openConfig` `0x64f4a0`
    - `main.endpoint` `0x64fb00`
    - `main.postJSON` `0x64fce0`
    - `main.pullFile` `0x64ff20`
    - `main.pushFile` `0x650300`
    - `main.runLine` `0x6506c0`
    - `main.cycle` `0x650980`
    - `main.main` `0x650ca0`
- Stage 2 direct execution:
  - no args: exits `1`, no stdout/stderr, no network observed
  - `--help`/`-h`: exits `2`, no stdout/stderr
- `main.main` requires exactly one CLI argument (`len(os.Args)==2`); a bad argument exits `2`.
- `main.openConfig` behavior from disassembly:
  - Converts CLI arg to bytes.
  - Calls C helper `run_digest(0, arg, out16)`.
  - Interprets the 16-byte digest as a big-endian `math/big.Int`.
  - Checks `main.mul(k, G) == Q`.
  - Calls `run_digest(1, arg, out32)` and uses that as an AES-256-GCM key.
  - Decodes nonce hex `738b72d2bb9db8a8f0b3e244` (12 bytes).
  - Decodes ciphertext+tag hex length 224 (112 bytes).
  - Decrypts JSON config with OpenSSL EVP AES-256-GCM.
- C helper dlsym names:
  - `run_digest` uses OpenSSL EVP.
  - Mode `0` calls `EVP_md5`; mode `1` calls `EVP_sha256`.
  - `open_box` uses `EVP_aes_256_gcm`.
- Embedded curve gate:
  - modulus/composite field value `N = ce0de6931f1e524e54e835d3a585101e386a0cfe45abf7465cda6dfa7faa2e71`
  - curve is `y^2 = x^3 + x (mod N)` (`b = 0` from `G`)
  - base point:
    - `Gx = 5904a0196003d1399b29f47ed22df00e28133d0258210d73eaa6b6b77ed6ffba`
    - `Gy = ad835aee168407deb89b1dcb9293722fd87601b2f361b0b8df667d27cd046c43`
  - target point:
    - `Qx = 45576394d390edbd9c39bc65eb92bd77012177463ce2eb8d5ff87efa4a6710ad`
    - `Qy = 86af0c2333334a06496584439164c9864ff5bbd3b8b653cccf31d950817ca32`
  - `gmpy2.is_prime(N)` is false; FactorDB reports composite but has no factors.
- Tooling after user install:
  - `gp`/PARI available.
  - `hashcat` and `john` available.
  - `ecm`, `msieve`, `yafu`, `sage` not currently in PATH.
- Stale `primefac` job from interrupted turn was killed.
- Built local msieve at `scratch/tools/msieve/msieve`.
- Factored the composite modulus:
  - `N = p1 * p2`
  - `p1 = 289986320360674833854992671203042798443`
  - `p2 = 321397944124136343363425170402692546707`
  - both factors test prime with `sympy.isprime`.
- PARI/GP curve facts:
  - Over `p1`, `#E(F_p1) = 289986320360674833854992671203042798444`; `G` has the same order, fully smooth.
  - `elllog(E, Q, G, order(G))` over `p1` gives `k = 265678568133316508900370314696636800176`.
  - Hex scalar: `c7dfd4bc16680c5822c0fc40b1349cb0`.
  - Because `MD5(arg)` is 128-bit and the `p1` group order is about `2.899e38`, this is the only candidate below `2^128`.
  - Python scalar multiplication verifies `k * G == Q` modulo `N`, `p1`, and `p2`.
- Therefore the required CLI argument satisfies:
  - `MD5(arg) = c7dfd4bc16680c5822c0fc40b1349cb0`
- Password cracking so far:
  - Small challenge-themed guesses missed.
  - `/usr/share/dict/words` and `/usr/share/doc/hashcat-doc/example.dict` missed.
  - Hashcat with `/usr/share/dict/words` plus `rockyou-30000.rule` missed.
  - Hashcat lowercase masks `?l` length 1-8 missed.
  - Plain `rockyou.txt` missed.
  - Hashcat `rockyou.txt` + `best66.rule` cracked the MD5: `whalewhale`.
- `MD5("whalewhale") = c7dfd4bc16680c5822c0fc40b1349cb0`.
- `SHA256("whalewhale") = ab4ab57762010f6b156390d0954ad7f9cf4af328d81bdbbe54003b86c0328dcc`.
- Decrypted embedded AES-256-GCM config:
  - `{"base":"https://c2-www-web-where.whale-tw.com/","cmd":"/cmd","down":"/download","up":"/upload"}`
- Local protocol probe with `BASE_URL=http://127.0.0.1:<port>/ RUN_ONCE=1`:
  - Client performs `GET /cmd`.
  - `getfile remote local` triggers `POST /download` with JSON `{"filename":"remote"}` and writes response body to `local`.
  - `putfile local remote` triggers `POST /upload` with JSON `{"b64data":"...","filename":"remote"}`.
  - Commands with the wrong number of arguments are ignored.
- Remote C2 facts:
  - `GET /cmd` returns `open https://admin.tryhackme.com`.
  - `GET /download` lists `[{"name":"status.txt","kind":"file"}]`.
  - `POST /download {"filename":"status.txt"}` returns `ready\n`.
  - Source saved at `dumps/remote_app.js`.
  - C2 is Node/Express 4.21.1, running as user `node` in `/app`.
  - `targetOf(name)` returns absolute paths unchanged; relative paths are under `/app/files`.
  - The raw filter only blocks literal `..`; JSON unicode escapes would bypass that, but absolute paths are already allowed.
  - Absolute file read works: `/etc/passwd`, `/app/app.js`, `/proc/self/environ`, etc.
  - Root overlay is mounted read-only, so writes to `/app`, `/app/files`, `/tmp`, `/home/node` fail with `{"ok":false}`.
  - `/dev/shm` is writable via `/upload`, verified with `/dev/shm/whc2_probe.txt`.
  - `/flag.txt` is not readable directly through the Node process; endpoint maps the error to `404`.
  - `/readflag` is readable and saved at `artifacts/remote_readflag`; it is a small PIE ELF that opens `/flag.txt` and writes it to stdout, likely setuid-root.
- Final RCE:
  - The target is exactly Node `22.9.0`, matching the public libuv pipe arbitrary-file-write RCE technique for read-only filesystems.
  - Source/reference cloned to `scratch/nodejs-file-write-rce/`.
  - Uploaded a small replacement Node HTTP server to `/dev/shm/s.js`; it executes `/readflag` and returns stdout for every request.
  - Sent the ROP payload to `/proc/self/fd/15` through `/upload`.
  - The process was replaced with `node /dev/shm/s.js`; polling `GET /` returned the flag.
  - Final flag saved in `dumps/flag.txt`: `NHNC{hey_boss_what_is_our_next_target?}`.
- Reproducible solver:
  - `solve.py` first checks whether the replacement flag server is already up, otherwise uploads `/dev/shm/s.js`, triggers the fd15 ROP chain, and polls for the flag.

## Current hypothesis
- Solved.

## Next tests
- None; final verification is `python3 solve.py`.
