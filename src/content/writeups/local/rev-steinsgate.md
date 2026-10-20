---
title: "STEINS;GATE [Build 4434295]: DRM dissection & Wine bring-up"
description: "This is the story of taking a Steam build of STEINS;GATE, figuring out what DRM was wrapped around the executables, peeling it off by hand, and then getting the game to actually run on Linux/Wine. It is also…"
published: "2026-10-19"
updated: "2026-10-20"
event: "Archive"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "Archive", "Writeup"]
readingTime: 17
wordCount: 3563
featured: true
sourcePath: "content/writeups/rev-steinsgate.md"
---

# STEINS;GATE [Build 4434295]: DRM dissection & Wine bring-up

*El Psy Kongroo.*

This is the story of taking a Steam build of STEINS;GATE, figuring out what DRM
was wrapped around the executables, peeling it off by hand, and then getting the
game to actually *run* on Linux/Wine. It is also, as these things usually go,
a story about a bug hunt that ran the wrong way for a while, and what we found
when we finally turned around.

There were four real obstacles: a black window that took a full forensic
investigation and was **not** DRM-related, a frozen game clock, a crash that
turned out to be **four bytes of leaked stack**, and an audio device that had
been quietly starved by the workaround that fixed the black window. In the end,
the entire Linux fix is one 8-byte patch, but we didn't know that for a long
time, and the road there is worth telling.

Everything below is in **hypothesis → evidence → conclusion** form, with the
real commands, real code and real screenshots we produced along the way.

## Demo

<figure class="demo-video">
  <video controls playsinline preload="metadata" poster="/Personal_Site/media/writeups/rev-steinsgate/steinsgate-demo-poster.jpg">
    <source src="/Personal_Site/media/writeups/rev-steinsgate/steinsgate-demo.mp4" type="video/mp4">
  </video>
  <figcaption>The finished build running under Wine, from the patched launcher to the title screen and the opening movie.</figcaption>
</figure>

---

## 0. TL;DR

| Question | Answer |
|---|---|
| What DRM? | **SteamStub (Steam DRM) Variant 3.1, x86** on both `Game.exe` and `Launcher.exe` |
| How removed? | Reimplemented the unpacking algorithm (`scratch/unstub31.py`): XOR-chained headers, modified-XTEA payload, AES-CBC code section with the RebuildIv and stolen-bytes quirks |
| Why wouldn't the game start? | Two launcher checks (argv + `config.dat`), then the engine **hangs during audio init** under Wine, leaving a black window forever |
| First workaround | Disable audio (`PULSE_SERVER=127.0.0.1:9`, empty audio driver) → boots to the title screen (§5) |
| …then it crashed right after the title? | Yes: the engine **leaks 4 bytes of stack on the first tick** at a Steam-API call site (crash: `EIP=1`), and **disabled audio makes FAudio crash** on its first voice (`EIP=0x74801D34` inside `xaudio2_7.dll`) |
| Final fix | **One 8-byte patch** (`solve.py`): skip the leaky call, set the stats flag. Re-enable Wine audio (undo the old workaround) |
| Result | `run/Game.fixed.exe` (md5 `f5dcc481…`), `run/play.sh`, and a drop-in pack (`S;G.zip`), verified playable with sound on Linux/Wine, no hardcoded addresses, works on Windows too (§10, §13) |

---

## 1. The patient

The archive is a 6 GB scene-style drop that mimics a real Steam library:

```
steamapps/appmanifest_412830.acf
depotcache/*.manifest
steamapps/common/STEINS;GATE/
    Game.exe        (10,485,904 bytes)
    Launcher.exe    ( 4,252,528 bytes)
    steam_api.dll
    bink2w32.dll
    USRDIR/         bg.mpk, bgm.mpk, chara.mpk, script.mpk, se.mpk,
                    shader.mpk, system.mpk, voice.mpk, mask.mpk,
                    mgsshader.mpk, manual.mpk, movie/<res>/*.bk2
```

AppID **412830**, buildid **4434295**. Both executables are PE32 (i386).

**Hypothesis:** this is stock Steam DRM (SteamStub).  
**Evidence:** `Game.exe` has **7 sections**, one more than its sibling
`Launcher.exe` (6). The extra one is named `.bind`, and the PE entry point
points *into it* instead of `.text`. That combination is the classic SteamStub
signature. Entropy analysis confirmed `.bind` is high-entropy (packed) while
the rest looked like normal compiled code.

---

## 2. Identifying the variant

**Hypothesis:** it's SteamStub *Variant 3*, which fits for a 2016-era build.  
**Evidence:** we compared against the signature database of
[Steamless](https://github.com/atom0s/Steamless). The stub entry point matched
the **3.1 x86** pattern, including the tell-tale prologue:

```
E8 00 00 00 00 50 53 51 52 56 57 55 8B 44 24 1C 2D 05 00 00 00 ...
```

Debugging confirmed it: right before the real (original) entry point
(`EP = 0x74548`) there is a **0xF0-byte header**. In SteamStub v3.1 that header
is XOR-chained; the first DWORD is the key, and every following DWORD is XORed
with the *previous ciphertext* DWORD (a chaining decode, not a repeating XOR).

Our unpacker's decode step (`scratch/unstub31.py`):

```python
def steam_xor(data, size, key=0, off=0):
    """SteamStub's XOR-chaining: decode[i] = enc[i] ^ key; key = enc[i]."""
    pos = 0
    if key == 0:                      # no key given -> first dword is the key
        pos = 4
        key = struct.unpack_from("<I", data, 0)[0]
    for x in range(pos, size, 4):
        val = struct.unpack_from("<I", data, x)[0]
        struct.pack_into("<I", data, x, val ^ key)
        key = val
    return key
```

**Conclusion:** SteamStub **Variant 3.1, x86**, on both `Game.exe` and
`Launcher.exe`. Decoding the header gave us everything else:

```
Game.exe:     appid=412830  flags=0x0  OEP=0x74548
              bind_section_offset=0x310  payload_size=538
              drmp_offset=11120  drmp_size=130336
Launcher.exe: OEP=0x1292f6
```

---

## 3. Ripping out SteamStub by hand

SteamStub 3.x hides five things in the stub; we had to undo all five, in order:

1. **The stub header**: XOR-chain decoded above.
2. **The `.bind` payload**, the small loader that decrypts everything; also
   XOR-chain decoded with the key recovered from the header.
3. **`SteamDRMP.dll`**: a second-stage encrypted PE. It's encrypted with a
   *modified XTEA*: 32 rounds, and the IV state `0x55555555` is chained through
   the blocks with a pre-XOR of the previous ciphertext:

```python
def SteamDrmpDecryptPass1(data, size, keys):
    v1 = v2 = 0x55555555
    for x in range(0, size, 8):
        d1, d2 = struct.unpack_from("<II", data, x)
        r1, r2 = xtea_decrypt_block(d1, d2, keys)
        struct.pack_into("<II", data, x, r1 ^ v1, r2 ^ v2)
        v1, v2 = d1, d2        # chain: next IV is this block's ciphertext
```

4. **The code section (AES-256-CBC)** with the two classic SteamStub twists:

```python
new_iv = AES.new(h.AES_Key, AES.MODE_ECB).decrypt(h.AES_IV)   # "RebuildIv" quirk
dec = AES.new(h.AES_Key, AES.MODE_CBC, new_iv).decrypt(bytes(enc))
```

   *Twist A, "RebuildIv":* the IV stored in the header is not used directly;
   the *actual* CBC IV is `AES-ECB-decrypt(key, stored_iv)`.
   *Twist B, stolen bytes:* the first 16 bytes of the plaintext section were
   "stolen" into the header; on disk the section holds `ciphertext[16:]`. To
   decrypt you prepend the stolen 16 bytes back.

5. **The PE surgery**: drop `.bind`, restore `AddressOfEntryPoint` to the OEP,
   fix `NumberOfSections`, zero the checksum.

### Hurdle 1: the crash at the OEP (off-by-one block)

**Hypothesis:** after our first successful unpack, `Game.unpacked.exe` should run.  
**Evidence:** it crashed instantly at the original entry point:

```
Unhandled page fault on write access to 00474548
```

The fault address was *inside the freshly decrypted code section*, so the code
itself was corrupt, not the loader.

**Root cause:** an **off-by-one-block bug in our first decrypt write-back**. We
wrote `dec[16 : 16+size]` into the file (assuming the stolen bytes are *extra*),
but since the on-disk section is `ciphertext[16:]`, decrypting
`stolen || disk` yields the full original section starting at `dec[0]`.

```python
# write decrypted section back into the file image
f.data[src:src + size] = dec[0:size]     # NOT dec[16:16+size] !
```

The first 16 bytes of `.text` were shifted by one AES block; every branch and
`push` near the start of the section used garbage, which is why execution died
exactly on entry.

The crash dialog screenshot, *our first hurdle, worth keeping forever*:

![First hurdle: Wine crash dialog after the off-by-one-block unpack bug](/Personal_Site/media/writeups/rev-steinsgate/fig_hurdle1_dialog.png)

**Conclusion:** fix applied; `Game.unpacked.exe` (10,344,448 bytes) and
`Launcher.unpacked.exe` (4,129,792 bytes) executed their real prologues,
imported the real DLL set (`d3d9`, `d3dx9_43`, `DINPUT8`, `SHELL32`, `ole32`, …)
and looked completely normal under a PE viewer.

---

## 4. Making it run under Wine, and the black window

Runtime: Fedora 44, wine-11.0 (staging), 64-bit-only wow64 build (`wine-wow64`),
dedicated prefix `scratch/wineprefix`. Steam DRM would normally require the
Steam client, so we used **Goldberg Emulator** (gbe_fork `release-2026_09_27`)
as `steam_api.dll` next to the game, plus `steam_appid.txt` = `412830`.

### Hurdle 2: “Please launch from launcher.”

![Please launch from launcher](/Personal_Site/media/writeups/rev-steinsgate/screen2.png)

**Hypothesis:** the game refuses to start unless invoked by `Launcher.exe`.  
**Evidence:** decompiling `Game.exe` function `fcn.0046f780` showed a string
comparison against its argument list, showing a MessageBoxW and returning if
the expected argument is missing. The launcher's embedded command line string
was right there in `Launcher.exe` at RVA `0x586058`:

```
Game.exe mages_sgate
```

**Conclusion:** launcher gate = the `mages_sgate` command-line argument.
Running `wine Game.exe mages_sgate` passes it.

### Hurdle 3: “There is an error importing setup files.”

![Setup files error](/Personal_Site/media/writeups/rev-steinsgate/screen3.png)

**Hypothesis:** first-run settings must exist before the engine boots.  
**Evidence:** `fcn.0046fdd0` resolves, via `SHGetSpecialFolderLocation`, this
path:

```
Documents\My Games\mages_steam\STEINS;GATE\eng\config.dat
```

which didn't exist in the fresh Wine prefix.

**Conclusion:** create the directory and file. A drop-in `config.dat` ships in
the pack, and the dialog disappears.

### Hurdle 4: the black window

With the gates passed, the game opened a 1024×576 window titled **“Steins;Gate”**,
and it was pure black. Forever. Input did nothing.

This took a full forensic investigation:

**Evidence gathered:**

1. **It is not stalled in file I/O.** `/proc/<pid>/fd` showed the engine had
   loaded *everything*: `bg.mpk`, `chara.mpk`, `voice.mpk`, `bgm.mpk`,
   `system.mpk`, `script.mpk`, `mask.mpk`, `se.mpk`, `shader.mpk`,
   `manual.mpk`. A `WINEDEBUG=+file` trace confirmed no `.bk2` movie is ever
   opened, ruling out a failed intro movie, and no error is logged.
2. **It is not spinning.** Thread states showed mostly futex/poll waits; CPU
   ~3%.
3. **It rendered exactly one frame.** `WINEDEBUG=+d3d9` gave us:
   `d3d9_CreateDeviceEx ... focus_window 00020064` → one `DrawPrimitiveUP` +
   **`Present` × 1** → silence. Shaders compiled fine (GLSL programs linked),
   so it wasn't a shader failure either.
4. **`perf` sampling of the stalled process**: ~27% of all samples landed in
   **`libpulse`/`libpulsecommon`/`winepulse`**. Plus 40+ `fixme:pulse`
   messages about **unhandled channels aux2/aux3/aux4/aux5, i.e. a 6-channel
   5.1 stream that Wine's Pulse driver mishandles**.

**Hypothesis:** the engine's startup sequence ends with initializing its audio
output (5.1, via XAudio2 → FAudio → winepulse) and it *blocks forever waiting
for the audio device to come up*, long before it ever plays the title sequence.
Black window + one rendered frame + idle threads is exactly what a blocked
audio init looks like from the outside.

**Experiment:** take PulseAudio away from the process so audio init fails fast
instead of blocking:

```bash
# empty audio driver + point Pulse at a dead port
wine reg add "HKCU\\Software\\Wine\\Drivers" /v Audio /t REG_SZ /d "" /f
PULSE_SERVER=127.0.0.1:9 wine Game.exe mages_sgate
```

**Result:** *the game renders its title background.* The blurred green
washing-machine scene of STEINS;GATE appeared (mean pixel value of the window
region went from 1.5/255 → 43/255):

![The engine finally renders the title background](/Personal_Site/media/writeups/rev-steinsgate/fig_center_region.png)

**Conclusion:** the “black screen of death” was **not DRM-related at all**: it
was a Wine audio-init deadlock with the engine's 5.1 startup stream. With audio
unavailable, the engine falls back gracefully and boots.

> **Foreshadowing, and this bites back in §11:** “make the audio device fail fast”
> is a fine *diagnosis*, but a terrible *fix*: it leaves Wine with zero audio
> devices. We would learn exactly what that costs.

---

## 5. The frozen clock we believed at the time

The build that got us past the black window still wasn't alive. The tick
function (`0x432e10`) never completed: the engine's tick timers (`0x164210c`
set once, `0x1642130 = 0`) froze, and any button press raised the engine's
`mgs::GL::Common::VertBuffAlloc() Failed` dialog (`artifacts/error_verbuffalloc_dialog.png`).

**Evidence:** the tick loads `timeGetTime` into a register
(`0x432e2a: mov esi, [0x4b71e8]`) and calls it indirectly at
`0x432f5f: call esi`; the main loop does the same with `Sleep`
(`0x432fb5: mov esi, [0x4b7084]` … `0x433015: push 1; call esi`). A live gdb
capture (`dumps/gdb69.log`) caught the tick returning to the main loop at
`0x43300e` with **`esi = 0x00432f5a`**, the address of a call instruction, not
of any function, and the process then spun forever exactly there.

**Hypothesis:** register-indirected calls to IAT-loaded imports (like
`call esi` right after `mov esi, [IAT_slot]`) misbehave under this wine-11.0
wow64 build.

*Tooling note:* gdb on this wine-wow64 target is unreliable for breakpoints:
software `int3` breakpoints die with spurious SIGSEGVs whose EIP has garbage
high bits. The reliable primitives turned out to be `WINEDEBUG=+seh` register
dumps at the fault, `/proc/<pid>/mem` reads against a live game, and
**single-change rebuilt executables** used as experiments.

**The shim era (fix1–fix6).** Following that hypothesis we built a stack of
localized patches: a 53-byte “Sleep shim” that intercepts any engine sleep of
≥ 64 s and returns control to the main loop instead of freezing on a broken
clock, plus direct-import calls and code caves for the hot paths:

```
0x432f5f: call esi                    ->  call dword [0x4b71e8]   ; timeGetTime()
                                          jmp  0x432f72            ; to the cave
cave @ 0x432f72:                          sub eax, [0x164210c]   ; frame delta
                                          jmp 0x432f67            ; tick epilogue

0x433015: push 1; call esi            ->  jmp 0x433033
cave @ 0x433033:                          push 1
                                          call dword [0x4b7084]  ; Sleep(1)
                                          jmp 0x432fc0            ; loop
```

…and the tick finally completed. `0x164210c` advanced at ~1000 units/s and
`0x1642130` received small per-frame deltas.

And the *next* bug immediately showed itself: the game now **crashed** within a
second of the title background appearing.

---

## 6. The crash: `EIP=1` and the +4 stack leak (fix8)

`WINEDEBUG=+seh` register dump at the fault (`dumps/run69b.log`):

```
wine: Unhandled page fault on execute access to 00000001 at address 00000001
00e8:trace:seh:dispatch_exception eip=00000001 esp=02e2fedc ebp=0043300e eflags=00010246
```

`eip = 1`, `ebp = 0x43300e`, the *return address* of the tick, and `esp`
exactly 4 bytes off from where the epilogue would expect it. That decodes
cleanly through the tick's epilogue:

```
0x432f67: pop esi
0x432f68: mov [0x1642130], eax
0x432f6d: xor al, al
0x432f6f: pop ebp
0x432f70: ret
```

If the frame pointer is **shifted +4**, then `pop esi` eats the main loop's
saved `ebp`, `pop ebp` eats the return address `0x43300e`, and `ret` pops the
call argument `1`. Hence `EIP=1`. Something was leaking exactly four bytes of
stack, once.

**Isolating the leak.** Starting from the patched binary we rebuilt one-shot
variants, each neutralizing a single call in the tick's call chain
(`0x432f55 → 0x470840 → 0x44c620` → Steam callbacks):

| build | single change | result |
|---|---|---|
| `fix7a` | NOP `call 0x470840` (the whole chain) | no `EIP=1` (died later in the audio bug) |
| `fix7b` | NOP `call 0x46fd30` | `EIP=1` |
| `fix7c` | Steam `RunCallbacks` tail-jump `jmp [0x4b725c]` → `ret` | `EIP=1` |
| **`fix7d`** | NOP `call eax` @ `0x44c643` | **no `EIP=1`** |
| `fix7e` | neutralize `call [eax+0x1c]` (drop its arg push) | `EIP=1` |
| `fix7f` | NOP `call [eax+0x28]` | `EIP=1` |
| `fix7g` | `push 0` before `call eax` @ `0x44c643` | no `EIP=1` (balanced) |

The leak is the single `call eax` at `0x44c643`:

```
44c63f: mov eax, [ecx]          ; vtable
44c641: mov eax, [eax]          ; vt[0]
44c643: call eax                ; <-- called with ZERO args
44c645: mov [esi+0x1327c], al   ; "stats ready" flag; guarded, runs once per boot
```

**What is the object?** `ecx` comes from `[esi+0x1328c]`, which earlier code
(`0x44c212`) fills from the import `SteamUserStats()`, i.e. a Goldberg
emulator `ISteamUserStats` interface. Its vtable entries are MSVC *adjustor
thunks*, disassembled from the live process:

```
vt[0] @ 0x799c20e8  ->  0x7946371e:  sub ecx, 0x28 ; jmp 0x10121070
```

…so vt[0] is a **one-argument method** (the thunk adjusts `this` and jumps to a
real method that ends with `ret 4`). Under 32-bit MSVC `thiscall` the *callee*
pops the stack arguments (`ret N`); this callee pops 4 bytes the engine never
pushed. **+4, once** (the `[0x1327c]` guard stops it re-running), and the very
first tick's epilogue then `ret`s to address 1. That is the entire crash.

**Fix:** skip the ABI-mismatched call and set the flag deterministically:

```
0x44c643:  ff d0 88 86 7c 32 01 00      call eax ; mov [esi+0x1327c], al
     -->   c6 86 7c 32 01 00 01 90      mov byte [esi+0x1327c], 1 ; nop
```

`fix7g`'s `push 0; call eax` is equally leak-free but consumes the emulator's
return value; if that were ever false, the block would re-run and leak +4
*every tick*. Forcing `1` makes the engine take the normal path,
deterministically.

---

## 7. The audio betrayal: FAudio with no device

With the stack leak fixed, the game survived the title and died 10–30 s later,
always at the same place:

```
wine: Unhandled page fault on read access to 00000084 at address 74801D34
eip=74801d34   (xaudio2_7.dll+0x11d34, inside FAudio_INTERNAL_VoiceOutputFrequency)
eax=00000000
```

The faulting instruction (`objdump` of Wine's FAudio-backed `xaudio2_7.dll`):

```
10011d31:  mov eax, [esi+0x10]     ; voice -> FAudio internal
10011d34:  mov eax, [eax+0x84]     ; <-- read 0x84; eax == 0
```

The engine's XAudio2 **voice object existed with a null internal device**.
Why? Because the prefix had **no audio drivers at all**: §4's workaround
(`HKCU\Software\Wine\Drivers\Audio = ""`) is global, so even with a healthy
PipeWire on the machine, `FAudioCreate` produced a device-less engine. The game
only touches a voice when its sound system does, seconds after boot. Hence the
user-visible “it boots… then crashes a few seconds later”.

**Fix:** undo the workaround and give Wine real audio:

```bash
wine reg delete "HKCU\\Software\\Wine\\Drivers" /v Audio /f
```

And here's the kicker for §4's deadlock: with the machine's analog **stereo**
sink as default (`pactl get-default-sink` → `…HiFi__Speaker__sink`), winepulse
negotiated a plain **2-channel** stream instead of 5.1, and audio init
completed instantly:

```
$ pactl list short sink-inputs
467  65  466  PipeWire  float32le  2ch  48000Hz     # the game, live
```

The black window was never a deadlock in the game; it was that six-channel
negotiation; and the “silence” workaround had merely moved the failure to a
delayed null-pointer crash. With stereo audio, everything was happy.

---

## 8. The twist: throwing the whole patch set away

At this point the shipped binary had **13 patch sites**: the Sleep shim, four
redirected `Sleep` loads, the sleep clamp, a `timeBeginPeriod` stub, a
bounds-check clamp, the timing caves, and the one Steam-ABI fix. We had a
hunch worth testing: *which of these actually matter?*

We rebuilt two minimals on top of the clean unpacked binary:

- **fix9** = the timing caves (the fix6 set) + the Steam-ABI fix.
- **fix10** = **only** the Steam-ABI fix.

Both ran. fix9 lived minutes and then exited *cleanly*. Its log ends with the
engine's own `**** Start apprication **** … Finish application`; the engine's
stdout is buffered and flushes at exit, so that's a normal shutdown, not a
crash. And fix10, **eight bytes changed in the entire 10 MB
executable**, booted, ticked, drew, and kept running. A user played it: title
menu → prologue, and the engine exited cleanly later, having rewritten
`config.dat` on the way out. Zero page faults in the whole session
(`dumps/runy10.log`).

**So what were the other twelve patches?** Symptoms, every one of them.
Once the leak was fixed, the *original, unmodified* engine code simply works.
The frozen tick, the weird `esi = 0x432f5a` capture, the `VertBuffAlloc` dialog,
the “broken clock” that motivated the Sleep shim: all of it was the +4 leak
corrupting the engine's stack from the very first tick, cascading into
everything downstream. We spent a long time treating the symptoms because
they *looked* like timing bugs and *looked* like wine-wow64 call weirdness,
but a stack that's off by one dword makes almost anything look like almost
anything.

The lesson, written down properly in
`knowledge-base/thiscall-ret4-stack-leak.md`: when a stack corruption is in
play, **isolate until you can subtract**, not just until it starts working.
Our own isolation builds (`fix7a`–`fix7g`) are what finally cornered the leak,
we just applied them *on top of* the shim tower instead of *under* it. The
minimal rebuild is what made the real story obvious.

### The final build and the full patch set

`run/Game.fixed.exe` (md5 `f5dcc4810324c8d285db25635a012a2f`) =
`artifacts/Game.unpacked.exe` + **one 8-byte patch**:

| # | VA | change |
|---|---|---|
| 1 | `0x44c643` | skip the leaky `call eax`; `mov byte [esi+0x1327c], 1` |

`python3 solve.py` reproduces it bit-exactly from the unpacked binary
(md5-checked in and out). Nothing else is touched: no code caves, no shims, no
hardcoded stack addresses, no timing edits: the original sleeps, timers and
audio paths run unmodified. That's what makes the build portable: it is as
Windows-safe as the retail engine plus a stats-flag change.

The historical 13-site build (md5 `bcb34727…`) is preserved in `run/Game.fix8.exe`
as a curiosity: the shim code works and was a heroic amount of fun, it just
turned out to be unnecessary.

---

## 9. The VertBuffAlloc dialog, in hindsight

The dialog that caused a lot of head-scratching deserves its own small chapter:

```
«garbled CJK line: codepage mojibake in the capture»
mgs::GL::Common::VertBuffAlloc() Failed.            [ OK ]
```

![The engine's VertBuffAlloc error dialog](/Personal_Site/media/writeups/rev-steinsgate/error_verbuffalloc_dialog.png)

- Captured live with `grim` via niri: a separate top-level window titled
  **“Error”** (`app_id game.exe`, 288×104), with the game's main window staying
  white behind it.
- The mages engine's graphics layer is internally named **“GL”**: see
  `mgsGLSurface.cpp` / `mgsGLSurface_Win.cpp` strings in the binary; it is a
  D3D9 wrapper, **not** OpenGL. The message lives at VA `0x508130`
  (file `0x107530`), routed through the engine's logging macro.
- Trigger in the shim-era build: title/menu renders, then **any button press**
  raises it, deterministically.

**In hindsight:** this was the leaked-stack corruption surfacing through the
engine's surface allocator. On the final build the same scene plays normally.
The live capture in §11 is several button-presses later. Same root cause,
different symptom, filed under “cascades”.

---

## 10. Runbook: how to play it

**In this repo:**

```bash
cd /home/thinh/proj/game-cracks/steinsgate

# one-time setup, already done in this prefix:
#  - first-run settings file
DD="scratch/wineprefix/drive_c/users/$USER/Documents/My Games/mages_steam/STEINS;GATE/eng"
mkdir -p "$DD" && cp pack/config.dat "$DD/config.dat"
#  - make sure audio is NOT disabled; the old §4 workaround must be undone:
WINEPREFIX=$PWD/scratch/wineprefix wine reg delete "HKCU\Software\Wine\Drivers" /v Audio /f

# play; sets WINEPREFIX / DISPLAY / DXVK overrides itself:
run/play.sh
```

**For everyone else, the standalone pack (`S;G.zip`).** It contains the whole
game, DRM-stripped and patched with Goldberg included, plus everything above. Unzip
anywhere, then:

- **Linux:** `cd STEINS;GATE && ./linux-setup.sh` once (creates a Wine prefix,
  installs DXVK x32, installs `config.dat`, ensures audio is on), then
  `./play.sh`.
- **Windows:** `cd STEINS;GATE && play.bat` (first run installs `config.dat`
  into your Documents). No Wine, no DXVK: the patched exe runs natively.

Audio note for Linux: this needs PipeWire (or PulseAudio) running for your
user; `pactl info` should answer. The game plays **with sound**; the old
silent-boot workaround is documented in §4/§7 and must not be used.

The `run/` directory in this repo contains: the final patched
`Game.fixed.exe` (md5 `f5dcc481…`, reproduced by `solve.py`), `play.sh`, the
unpacked `Launcher.exe`, never needed in the end because the engine writes
`config.dat` itself, Goldberg `steam_api.dll`, `steam_appid.txt`,
`bink2w32.dll`, and a symlink `USRDIR -> ../steamapps/common/STEINS;GATE/USRDIR`
which saves 6 GB of duplication. The `pack/` directory is the exact content of
`S;G.zip`.

### The signature

The shipped pack carries a cosmetic signature: the title screen shows a green
*cracked by hajjilla* line under the 2009 copyright notice. It is a pure
texture patch: `tools/signature.py` draws the text into `TITLE_CHIP.DDS`
inside `USRDIR/system.mpk` (DXT5, same size, patched in place; no code and no
archive layout change). `--check` reports the state, `--apply` signs a copy
(keeping `system.mpk.orig`), `--restore` undoes it (needs Pillow +
ImageMagick).

---

## 11. Verified playable

Final verification of the shipped build (`run/Game.fixed.exe`, audio enabled):

- **No crash:** zero `Unhandled page fault` lines across the multi-minute test
  runs (`dumps/runy10.log`), and a real play session from the title menu into
  the prologue, ending in a clean engine shutdown (`Finish application`).
- **Tick alive:** sampling `[0x164210c]` twice shows it advancing with the wall
  clock (`10871539 → 10873027` in a short sample window, milliseconds of
  `timeGetTime`), with small per-frame deltas in `[0x1642130]`.
- **Audio on:** `pactl list short sink-inputs` shows the game's live
  `float32le 2ch 48000Hz` stream.
- **Actually playable:** a live X11 capture of the running 1280×720 window shows
  the prologue dialogue with sprites, background, text and the AUTO/SKIP HUD:

![In-game: prologue running on the final build](/Personal_Site/media/writeups/rev-steinsgate/fig_final_running.png)

> “I used to hope that Mayuri might become the key to Steins Gate, but now
> I've reconsidered.” The engine, finally, running on Linux.

Reproduce everything with `python3 solve.py` (patches `Game.unpacked.exe` →
`Game.fixed.exe`, md5-verified) and play with `run/play.sh`.

---

## 12. Portability checks

Two final checks, because “it runs on my machine” is where the story usually
ends, not where it should:

- **Fresh prefix, from scratch.** A clean Wine prefix was created by running
  the shipped `pack/linux-setup.sh` verbatim (24.7 s): prefix init → DXVK x32
  install → `config.dat` drop-in → audio check. The game then booted inside
  that pristine prefix. No hidden machine state, no leftover workarounds.
- **Wine virtual desktop.** The historical open question, whether the virtual
  desktop was black at 40 s, was retested on the final build inside the fresh
  prefix: `wine explorer /desktop=sg,1280x720 Game.fixed.exe mages_sgate`. The
  `sg - Wine Desktop` window came up, the game's 1280×720 window rendered
  inside it (mean brightness 62.8/255, clearly the title art, not black), and
  the process was alive and fault-free past the 2-minute mark
  (`dumps/vdtest.log`, `artifacts/fig_vdesktop.png`). The old black screen was
  the audio-init block; with real audio it never happens.
- **Windows.** The final patch touches only the Steam-stats flag; the rest of
  the executable is byte-identical to retail. On Windows it runs natively next
  to Goldberg's `steam_api.dll`; none of our Linux-specific tricks (DXVK,
  overrides, shims) exist in this build at all.

---

## 13. Artifacts produced

| File | What it is |
|---|---|
| `artifacts/Game.unpacked.exe` | SteamStub-free `Game.exe` (10,344,448 B) |
| `artifacts/Launcher.unpacked.exe` | SteamStub-free `Launcher.exe` (4,129,792 B) |
| `artifacts/Game.unpacked.exe.SteamDRMP.dll` | decrypted second-stage DRM module |
| `scratch/unstub31.py` | our clean-room SteamStub 3.1 x86 unpacker |
| `artifacts/fig_hurdle1_dialog.png` | Hurdle 1: crash dialog from the unpack bug |
| `artifacts/screen2.png` | Hurdle 2: “Please launch from launcher.” |
| `artifacts/screen3.png` | Hurdle 3: “error importing setup files” |
| `artifacts/screen_notepad.png` | input-injection control test (`abc123` typed) |
| `artifacts/fig_center_region.png` | Hurdle 4 solved: title background renders |
| `scratch/run12.log` | 159k-line `+file,+process` boot trace |
| `scratch/run13.log` | `+d3d9,+d3d_shader` trace (Present count = 1 evidence) |
| `scratch/perf2.data` | perf samples of the stalled process (pulse 27%) |
| `run/Game.fixed.exe` | **final** patched binary, md5 `f5dcc4810324c8d285db25635a012a2f` |
| `run/Game.fix8.exe`, `fix9.exe`, `fix10.exe` | lineage builds: 13-site, fix6+ABI, ABI-only |
| `run/play.sh` | one-command launcher (env + `mages_sgate` argv correct) |
| `solve.py` | re-derives `Game.fixed.exe` from `Game.unpacked.exe` (single-patch, md5-checked) |
| `pack/` | drop-in pack source: final exe, Goldberg, DXVK x32, scripts, docs |
| `run/Game.fix7a.exe` … `fix7g.exe` | one-shot isolation builds that localized the +4 stack leak (§6) |
| `dumps/run69b.log` | `+seh` crash log of the `EIP=1` stack-leak crash |
| `dumps/runy10.log` | final clean run: zero page faults, clean exit, audio enabled (§11) |
| `dumps/vdtest.log` | virtual-desktop test log (§12) |
| `dumps/gdb69.log` | live capture of the tick returning with `esi=0x432f5a` (§5) |
| `artifacts/fig_final_running.png` | in-game prologue on the final build (§11) |
| `artifacts/fig_vdesktop.png` | the final build inside Wine's virtual desktop (§12) |

Credits: unpacking algorithm cross-checked against **Steamless** (atom0s,
CC BY-NC-ND), used as reference only; Steam replacement courtesy of **Goldberg
Emulator (gbe_fork)**; DXVK x32 for making d3d9 behave under Wine.
