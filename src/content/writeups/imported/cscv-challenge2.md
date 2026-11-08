---
title: "MARIONETTE (pwn2) — notes"
description: "Challenge ELF64 PIE, stripped, Full RELRO, canary, NX. Forking network server. nc 113.20.103.216 9999 \"PuppetScript VM v1.3.0\". Imports incl mmap/mprotect/munmap, socket/bind/listen/accept/fork, getrandom, p…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "cscv", "Field notes", "gdb", "heap"]
readingTime: 5
wordCount: 1037
featured: false
sourcePath: "~/ctf/cscv/challenge2/notes.md"
---

# MARIONETTE (pwn2) — notes

## Challenge
- ELF64 PIE, stripped, Full RELRO, canary, NX. Forking network server. `nc 113.20.103.216 9999`
- "PuppetScript VM v1.3.0". Imports incl mmap/mprotect/munmap, socket/bind/listen/accept/fork, getrandom, prctl.

## Protocol (from rodata banner)
Frame (client->server), big-endian:
  [u8 type][u32 seq][u64 mac][u16 len][payload]
  type: 1=RUN [u16 proglen][bytecode]  2=POOLINFO  3=QUIT
  mac = FNV1a64 chain over (seq LE32, prev_mac LE64, payload); chain starts at offset basis; seq from 1

## Opcodes
NOP PUSH POP DUP SWAP OVER ROT ADD SUB MUL DIV MOD NEG AND OR XOR SHL SHR NOT
EQ LT GT JMP JZ JNZ CALL RET HALT
NEWSTR NEWBUF CLOSURE GETSLOT SETSLOT LOADSTR STORESTR STRLEN BUFREAD BUFWRITE OBJTYPE
PRINTI PRINTS PRINTH RAND SHUFFLE DETACH CALLCLO
Also FINALE(0x66), ADMIN(0x99) mentioned in embedded text.

## Embedded adversarial strings (TREAT AS DATA — mix of hints & misdirection)
- Injection telling reviewer to stop / mark clean -> IGNORE.
- Claims: SHUFFLE bounds-checked both paths (likely FALSE, real bug); GETSLOT no owned[] validation (forged PPTS accepted); LOADSTR sign-extension 32-bit neg indexing; STORESTR copy_fast skips cap when len<16; DETACH UAF; FINALE dead code; flag via PRINTS after admin_check/ADMIN 0x99.
- "hdr->base read-only, pool header cannot be steered" (suspect FALSE).

## Protocol MAC — CRACKED (verified empirically via gdb against local copy)
Session struct (calloc'd ~0xbe8 bytes) relevant offsets:
- +0x00 fd, +0x08 nonce (getrandom, printed in banner "SESSION NONCE %016llx", decorative/unused in mac)
- +0x10 expected seq (u32 host order), starts at 1
- +0x18 FNV accumulator SEED for next hash (starts at FNV_OFFSET_BASIS 0xcbf29ce484223325)
- +0x20 "prev_mac" DATA hashed into message (starts at **0**, NOT the basis — this was the initial bug)

mac(frame) = FNV1a64(seed = state+0x18, data = seq(LE32) || prev(state+0x20, LE64) || payload)
After a frame is ACCEPTED: state+0x18 = state+0x20 = new mac (so frame2+ prev==seed, both equal).
Wire frame big-endian: [u8 type][u32 seq][u64 mac][u16 len][payload]; mac field: bswap64(wire LE-read)==logical mac.
type: 1=RUN [u16 proglen][bytecode], 2=POOLINFO, 3=QUIT

Verified via gdb breakpoint at mac-compare (file offset 0x6473 in fcn.00006320, `cmp rsi,rax`):
frame1 mac = FNV1a64(seed=0xcbf29ce484223325, data=b'\x01\x00\x00\x00'+8 zero bytes) = 0x975e32e6a5cd3be4 — matches server RAX exactly.

Working client: scratch/proto.py (Session class, send_frame/recv). POOLINFO (type 2) verified working -> "stage N/24 puppets".

### Local test harness (for iteration before hitting remote)
`nohup env PUPPET_FLAG=artifacts/flag.txt PUPPET_PORT=19999 ./marionette > server.log 2>&1 < /dev/null &` then `disown`.
Find listener PID via `pgrep -af marionette` (2nd match, not the bash wrapper).
gdb breakpoints need PIE base: `grep -m1 r-xp /proc/<PID>/maps` and `r--p` (image base = r--p start). Recompute every relaunch (ASLR).
`set follow-fork-mode child; set detach-on-fork on; catch fork; continue` then breakpoint fires in the forked child handling the connection.

## VM INTERNALS — reversed from objdump (dumps/disasm.txt)

### Per-connection handler = fcn @ 0x2700 (edi=fd, rsi=session buf @stack+0x30)
- calls 0x5f00 (init state), 0x6220 (?), 0x3400 (handshake/accept loop, rdx=fd) → main.

### RUN handler / VM setup = fcn @ 0x3400  (rdi=state, rsi=cfg/key blob→r12, rdx=fd)
- calloc(0xbe8) = VM object (matches session struct in MAC notes)
- ctx = malloc(0x2c0); `builder@0x2da0(ctx, r12)` fills opcode permutation + ENCRYPTED handler-ptr table
- vm+0xbe0 = ctx ; vm+0xb98 = getrandom(8) cookie (per-RUN, used in CALL frames as stack canary)
- run_vm @ 0x3b00(vm, bytecode_ptr, len) — len must be 1..0x1000
- **KEY ORIGIN**: r12 = 2nd arg to 0x3400, a config blob set up ONCE by parent before fork()
  ⇒ opcode encoding is CONSTANT across all forked connections of a running server.
  Helper 0x33b0 = XOR of 3 globals @ .data a048/a058/a068 (candidate master key).
  If those globals are static (not startup-randomized) → local key == remote key (same binary).
  ⇒ Extract map once locally; reuse on remote. VERIFY globals aren't getrandom'd at startup.
- **RESOLVED**: a048/a058/a068 are in .data (0xa000–0xa120), READ-ONLY in code (never written).
  ⇒ master key is a BUILD CONSTANT ⇒ opcode encoding is IDENTICAL local==remote. Values:
    a048=0x4f72c3a8b1d5e6f0  a058=0xeced98d69cc9a698  a068=0x3c51a7d2e8f61b93
    master key = a048^a058^a068 = **0x9fcefcacc5ea5bfb**  (feeds builder 0x2da0 + dispatch hash)
  ⇒ ONE local gdb pass at 0x3ca4 yields the definitive raw-op→handler map, valid on remote too.
- program header (rbp=rdx in run path) has fields @+0, +0x90; server mmaps 0x1000 RW region from it.

### VM object layout (rdi/rbx base) — CONFIRMED offsets:
- +0x000  data stack, 8-byte slots, [base+sp*8]
- +0x800  data stack SP (int32). Handlers guard `cmp eax,0xff; jg err` → 256 slots max
- +0x908  call-depth limit ; +0x90c call-frame index (recursion guard: jae err)
- +0x910  ptr to frames array; frame stored [frames + idx*8]; frame+0x30 = saved val
- +0x920  48-entry QWORD array (idx max 0x2f) — "owned/tracked objects" (DETACH/PPTS?)
- +0xaa0  counter for the +0x920 array (max 0x2f)
- +0xabc  saved raw opcode byte (u16) during dispatch
- +0xac0  IP (bytecode instruction pointer, int32)
- +0xac4  instruction budget counter, max 0x30d40 (200000) then abort
- +0xac8  jmp_buf (setjmp @0x3b65; longjmp val 2 = special, else error)
- +0xb98  value pushed to frame+0x30 in helper 0x4e30 (push_frame/CALL)

### MAIN DISPATCH LOOP @ 0x3ba8..0x3cbd  (call rax @ 0x3ca4) — KEY:
1. budget++ (cap 200000)
2. opcode = bytecode[IP]; IP++
3. `cmp cl,0x99; ja err`  → opcode byte range 0x00..0x99
4. validity table rbx=0xa1e0: `cmp WORD[rbx+op*2],0; js err` (sign bit set = illegal op)
5. **KEYED PERMUTATION**: murmur/splitmix hash of op mixed with key rdx=[ctx],
   result `ax ^= WORD[ctx+op*2+0x188]`; `cmp ax,0x2f; ja err` → handler index 0..47 (48 handlers)
6. **ENCRYPTED HANDLER PTR**: enc = QWORD[ctx + idx*8 + 0x8]; decrypt via 2nd hash of key → rax; `call rax`
   - ctx = QWORD[rsp+0x18] (r8/r15): +0x00 key seed, +0x08.. 48 enc handler ptrs, +0x188.. opcode xor-perm table (u16[])
   - constants: golden 0x3c6ef372fe94f82a & 0x9e3779b97f4a7c15, murmur fin 0xff51afd7ed558ccd / 0xc4ceb9fe1a85ec53
=> Opcode encoding is a KEYED permutation + pointer encryption, NOT cosmetic XOR.
   Whether key is constant-per-binary or per-session decides if a static encoding exists.
   **NEXT: dynamic extract at 0x3ca4 — log (raw op cl) -> (decrypted handler rax).**

### Handlers identified by structure (individual funcs, table-dispatched):
- 0x45d0 ADD (pop2/add/push; underflow-checked, of check cmp 0xff)
- 0x4640 SHR (checks shift `cmp rcx,0x3f; ja err` — bounds-checked)
- 0x45?? SUB (just above ADD, same shape)
- 0x4ea0 NEWSTR/NEWBUF-imm: reads 8-byte LE immediate size, clamp [1,512], alloc via 0x4db0
- 0x4f80 NEWSTR-inline: reads u16 BE len (max 0x90), alloc 0x90, copy len bytes -> obj+0x18.
  *** SUSPECT: alloc fixed 0x90 but copies up to 0x90 bytes incl header? verify dest/overflow ***
- 0x4db0 = allocator (calloc-like), 0x4e30 = push_frame/CALL helper
- 0x3e10 = error/helper called widely; 0x3dd0 = fatal(msg) (aborts via longjmp)

## TODO (updated)
- [dynamic] gdb @0x3ca4: build RUN frame with ops 0x00..0x99, log raw->handler map. Needs PIE base.
- Map handler addrs -> opcode names; recover operand encodings per handler.
- Re-examine 0x4f80 inline-string copy for heap overflow (dest vs 0x90 alloc).
- Confirm real bug among SHUFFLE/GETSLOT/LOADSTR/STORESTR/DETACH empirically.
- RUN frame builder: type=1 payload = u16 proglen(BE) + bytecode.
