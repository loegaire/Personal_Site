---
title: "Dead Cells: fly hack and god mode"
description: "The finished result is the unifiedhack.sh launcher, built from the analysis below."
published: "2026-10-20"
updated: "2026-10-20"
event: "Archive"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "Archive", "Writeup"]
readingTime: 6
wordCount: 1285
featured: true
sourcePath: "content/writeups/rev-deadcells-fly-god-mode.md"
---

# Dead Cells: fly hack and god mode

The finished result is the `unified_hack.sh` launcher, built from the analysis below.

End state: one launcher that patches `hlboot.dat` so `get_airJumps()` returns 0,
which means unlimited air jumps, and preloads a library that intercepts the player's
HP *store*, refilling it with 9,999,999 instead of the post-damage value.
Flight was confirmed working in-game by the player. The health hook is verified at the
instruction level inside a live process; in-game damage retention still needs a manual
confirm.

## Demo

<figure class="demo-video">
  <video controls playsinline preload="metadata" poster="/Personal_Site/media/writeups/rev-deadcells-fly-god-mode/deadcells-demo-poster.jpg">
    <source src="/Personal_Site/media/writeups/rev-deadcells-fly-god-mode/deadcells-demo.mp4" type="video/mp4">
  </video>
  <figcaption>The finished build in play: unlimited air jumps and a health bar pinned at 9,999,999.</figcaption>
</figure>

---

## 0. The game runtime: the thing that dictated everything

Dead Cells on Linux is a Haxe program running on **HashLink**: game logic ships as
bytecode in `hlboot.dat`, and at runtime `libhl.so` JIT-compiles it into a ~57 MB
anonymous `rwxp` mapping. Every consequence below follows from that:

- There are two distinct patchable surfaces: **the bytecode file**, which lives on
  disk but is consumed at boot, and **the JIT arena**, a memory copy recomputed from
  bytecode every run.
- Natives signatures do not live in the game binary; they live in that anonymous JIT
  arena, which changes layout between runs.
- The engine keeps re-deriving game state from the bytecode, so a memory-only override
  loses fights against that recomputation unless it sits on the exact instruction path.

---

## 1. First approach: native LD_PRELOAD hooks

Attempted flight by hunting physics code in the JIT arena. Findings from memory
analysis:

- Physics pattern `41 89 80 D4 00 00 00`, which is `mov [r8+0xD4], eax`, at 4 sites.
  Adjacent fields: `+0xD4` is an int jump/attack cooldown, and `+0xE0` is a double
  position/timer.
- Health pattern `45 89 91 8C 01 00 00`, which is **`mov dword [r9+0x18C], r10d`**,
  the final HP *store*. Right before it, `sub r10d, dword [rbp-0x4C]` subtracts and
  then stores the new HP. `+0x18C` is HP as an int32.

Two native experiments:

1. **Fly via cooldown**: from a background thread, zero `player+0xD4` continuously.
   Result: the game **froze on repeated jumps** and eventually SIGSEGVed. The engine
   recomputes jump state from `get_airJumps()`, the Haxe field `airJumps`, so a memory write
   was fighting the bytecode. Native weighting was a dead end.
- **God mode via the HP store**: hooking the store site `mov [r9+0x18C], r10d` with a
  relative JMP detour + 2 NOPs. Installed fine, but with no in-process monitor in that
  build there was no early evidence that it actually *executed*; an earlier diagnostic
  build showed `healthHits=0`, and a build with no counter could not distinguish
  "installed" from "running".

Lesson: at this layer everything fights you; the JIT arena is unstable; and the two
mechanisms, code patch and memory write into PlayerBaseAddress computed from elsewhere,
converge only when on the *correct* instruction.

## 2. The pivot that worked: patch the bytecode instead

The concept "air jump" belongs to `get_airJumps` in the Haxe code. The known public
Haxelink trick, `DeadCellsInfiniteJumps`, patches that bytecode call to always
return `0`, making the engine think no jump has been consumed. No in-memory exceptions
to fight: the bytecode is stable on disk. New target layer, new problem set: read
`hlboot.dat`.

## 3. Bytecode parsing: every absurd thing about v5

HashLink v5 uses `hlboot.dat`, about 17.5 MB. The header counts are varints;
confirmed:
`nints=5316, nfloats=1939, nstrings=43883, nbytes=1, ntypes=24567, nglobals=19943,
nnatives=447, nfunctions=36896, nconstants=16203, entrypoint=37330`. The sanity rule:
`nnatives + nfunctions > entrypoint`.

Bumps along the way in the parser, each of which looks "parsed" before it actually is:

- **Strings blob is followed by an undocumented length table**, one varint per string.
  The hlbc wiki omits it; without it, every subsequent offsets is garbage.
- **Debug files**: the *count* is a varint, the size is a u32; filenames are
  null-separated blob. `1928` files; ends `0x12e63d`.
- **Per-function debug** is RLE: `while (i < nops)` with 4 cases on bits of one byte
  (`c&1` function change with `(c>>1)<<8 | next`, `c&2` repeat `count=(c>>2)&15` ops
  with `line += c>>6`, `c&4` single op with `line += c>>3`, else 2-byte line encoding).
- **Opcode arguments are varints in INDEX style everywhere**, including OBool/OChar;
  only the `VAR_ARGS` opcodes (`CallN`, `CallMethod`, `CallThis`, `CallClosure`,
  `MakeEnum`) use a **raw byte** count followed by that many varints; `Switch` has its
  own layout (`p1 var, p2 var(count), count×var, p3 var`). Say that out loud
  three times before writing a parser.
- v5 functions carry `nassigns` = 2 varints per assign.

## 4. Locating the patch point

Key chain to `get_airJumps`:

- Found in the method/proto registry → **findex 34447** → fn #32272 in the func pool.
- 4 ops / 11 bytes at file offset **`0xDE533F`**:
  ```
  28 02 08   GetThis r2, f8
  47 02      NullCheck r2
  26 01 02  02   Field r1,r2,field2      (field idx 2 == airJumps)
  43 01      Ret r1
  ```
  Original bytes: `28 02 08 47 02 26 01 02 02 43 01`. Register `r1` is int32, a sane
  place to return through.

## 5. Seven attempts at writing the patch: two real learnings

| Attempt | Idea | Result | Root cause |
|---|---|---|---|
| 1 | Replace 4-byte `Field` with 3-byte `Int` | `JIT ERROR 11 (jit.c:971)` | leftover byte decoded as garbage opcode |
| 2 | Overwrite all 4 ops, writing int expr into `r2` | `JIT ERROR 8 (jit.c:1250)` | `r2` is object-typed register; the JIT type-checks |
| 3+ | Only touch `r1`, keep op count fixed | **boots, no JIT errors, flight works** | n/a |

**Final patch**: 8 bytes actually change, while file length and all following offsets
stay unchanged:

```
before:  28 02 08 47 02 26 01 02 02 43 01
after:   01 01 01 01 01 01 01 01 01 43 01
         (Int r1,0) x3, then  Ret r1   ==  get_airJumps() -> 0
```

**Byte-size equalization and register-type awareness are the two silent killers** here.
Any future v5 patch in this file needs both.

## 6. Verification: the flight half

Objective verification was degraded by the environment: the game **auto-pauses on focus
loss**; under niri/XWayland with synthetic uinput input the pause never lifts, the run
timer stuck at `0s` behind a `[Pause]` tag, and the player sprite did not move between
screenshots. The bytecode was proven correct at boot; flight was then **confirmed
manually by the player holding JUMP** in a real window. Lesson for future sessions on
this game: headless input automation can look like it's playing while the sim is frozen.

## 7. The health half: the odyssey

After flight was confirmed:

- Combined with the pre-existing `godmode.cpp` / `myhack.so` build: HP=1000 style, an
  HP-store detour whose identity check is `vtable & 0xFFF == 0x848` to gate player-only.
- I incorrectly attributed that build as the player's original and briefly floated a
  register mismatch in the hook; corrected after decoding the ModRM properly: the
  signature really is `mov [r9+0x18C], r10d` and the hook is consistent.
- The player remembered an earlier variant **patching subtract into add** instead of
  replacing the value with 1000. Exhaustive search of `godmode.cpp` and its `.so`s, all
  `nvim` undo state, Trash, all git repos, shell history, and all files under home found
  no sub→add artifact. Decision: accept the store-detour family and raise the HP bloom.

---

## 8. Finished combined build: maxhp.so with 9,999,999 HP

Derived exactly by changing one immediate in `godmode_maxhp.cpp`:

```
mov $9999999, %r10d      ; = mov r10d, 0x0098967F
```

That encodes to `41 BA 7F 96 98 00`. Verified by disassembling the *live* hook inside
the running **process**:

```
cmp rax, 0x848                 ; player vtable check
mov r10d, 0x98967f             ; 9999999
mov dword [r9+0x18C], r10d     ; refill
```

The store site itself is patched at runtime with a 5-byte relative JMP + 2 NOPs; its
surrounding context is:

```
mov dword [rbp-0x60], r10d
sub r10d, dword [rbp-0x4C]     ; damage
mov dword [rbp-0x60], r10d     ; then lexical store would write HP
mov dword [r9+0x18C], r10d     ; <- ours is the patched store
```

Enemies pass the vtable check and fall through to normal damage.

## 9. The glue: `unified_hack.sh`

Runtime does three things in order:

1. **Restore pristine bytecode**, then apply the 8-byte flight patch to `hlboot.dat`
   at offset `0xDE533F`. This is idempotent: it boots if the bytes are already patched
   and refuses if the pristine backup is missing.
2. Ensure the health library exists; **default to `maxhp.so` at HP 9,999,999**, fall
   back to `myhack.so` at HP=1000 if missing; echo which one actually loaded so there's
   no ambiguity.
3. `LD_LIBRARY_PATH=. LD_PRELOAD="$HACK_SO" ./deadcells` and launch normally.

Verification checklist run at the end:
- launcher echoes `[+] FLIGHT: bytecode patch applied (8 bytes @ 0xDE533F).` or says the patch is already in place
- `[MATCH] Hooking: 0x…` + `[*] GOD MODE INSTALLED.`
- no `JIT ERROR` lines
- `Game version : 35, date : 2023-10-01, git hash : 62334b035788ed32c7c43cbd3ae6d2f3c79f52d3` reached
- `/proc/<pid>/maps` lists `maxhp.so`
- live hook disassembly shows `mov r10d, 0x98967f`
- flight bytes present in live `hlboot.dat`
