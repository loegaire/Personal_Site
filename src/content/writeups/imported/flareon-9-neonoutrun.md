---
title: "NeonOutRun notes (Claude) — shared workspace with Codex (codex/ dir is Codex's)"
description: "Confirmed facts Binary: artifacts/neonoutrun, Rust Tauri 2 app + embedded V8 (rustyv8 0.32.1), WebKitGTK frontend. Frontend assets (brotli, phf table @ .data.rel.ro 0x13b54b0) extracted -> artifacts/web/{ind…"
published: "2026-11-08"
updated: "2026-11-08"
event: "flareon"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "flareon", "Field notes", "gdb", "frida"]
readingTime: 3
wordCount: 458
featured: false
sourcePath: "~/ctf/flareon/9-neonoutrun/notes.md"
---

# NeonOutRun notes (Claude) — shared workspace with Codex (codex/ dir is Codex's)

## Confirmed facts
- Binary: artifacts/neon_outrun, Rust Tauri 2 app + embedded V8 (rusty_v8 0.32.1), WebKitGTK frontend.
- Frontend assets (brotli, phf table @ .data.rel.ro 0x13b54b0) extracted -> artifacts/web/{index.html,lap.png,obstacle.png}.
  Frontend calls invoke('plugin:neon|e',{input:JSON}) every frame; all game logic runs in embedded V8.
- Game JS recovered -> artifacts/game.js (4229 bytes). Victory string = FAKE:
  `decode_this_system_to_win_it@f1are-on.com` (solve.py computes it; user confirmed fake).
- Client controls input.bounds -> huge bounds = no obstacle crash (patched copy scratch/neon_patched).
- Payload pipeline in worker thread (fn containing 0x68a54d / 0x688c64):
  custom CFF-obfuscated decoder (byte ops rol/ror/add/xor + LZ 12-bit offset/4-bit len) -> 1726B zstd frame
  -> ZSTD_decompressStream (call site 0x68a9f5, inbuf struct at rsp+0x108 {ptr,size,pos})
  -> 1717B raw DEFLATE (flate2 reader 0x68dbfe) -> read_to_end -> JS source -> V8.
- zstd fns statically linked (GOT-like table 0x14240c0.. -> 0x6ce0xx/0x6f6xxx).
- No file/network I/O from app code for the payload.

## Tools/scripts (scratch/)
- trace_*.py frida tracers; hook_zstd.py dumps zstd input; inject.py <js> <out> swaps in own JS via zstd hook.

## Failed / notes
- V8 heap strings (dumps/v8heap_strings.txt): nothing unusual.
- gdb malloc bp too slow.

## Next
- Inject probe JS (scratch/probe.js) to enumerate globalThis in the embedded V8 for non-standard natives.

## Codex breakthrough (native static analysis)
- Startup at 0x688f1e XOR-decodes `String`, then `prototype`, then `replaceAll`.
- At 0x689334 it installs native callback **0x67e81e** over String.prototype.replaceAll (saves original via 0x68ce4c).
- At 0x689392 it decodes `Math`, then `min` at 0x689528. At 0x6896ac it installs native callback **0x67eb83** over Math.min.
- Thus standalone Node execution misses native semantics; that explains decoy. Codex is analyzing native callbacks now. Opus can focus on dynamic forcing 28-lap victory within embedded V8, or prototype introspection.

## Codex recovered timing solution (pending native replay)
- Third override: Array.prototype.sort -> 0x67deb2, installed at 0x689b0a. Seeds random weights from sorted lap positions, saves sum and queue; resets byte buffer/counter.
- Math.min rounds lap seconds into a byte, appends it, and adds weight * sin((offset +/- byte)*pi/180) to aggregate. replaceAll requires aggregate == sum(weights) within 1e-6.
- Native constant key resolves to 90; index fn 0x67f9d8(lap_index,90), low byte feeds offset/sign decoder 0x68003e.
- Emulated original code with Unicorn + ELF RELATIVE relocations. Solving offset +/- byte == 90 (mod 360) yields **R3_ag3nt_4b0ut_t0_f33l_d1zzy**.
- replaceAll copies timing bytes over decoy prefix and adds 0x3b at position 30 ('1' -> 'l'), so expected full candidate is **R3_ag3nt_4b0ut_t0_f33l_d1zzy@flare-on.com**.
- Codex now replaying exact lap times in native embedded V8 to verify real gate, not just standalone JS.

## Codex completion — user confirmed correct
- User confirmed `R3_ag3nt_4b0ut_t0_f33l_d1zzy` is the correct flag.
- Native construction gives full string `R3_ag3nt_4b0ut_t0_f33l_d1zzy@flare-on.com`.
- Reproducible native solver: `python codex/solve_native.py` (unicorn + pyelftools), verified to print the recovered full string.
- Full writeup: `codex/writeup.md`; per-lap decoding values: `codex/timing_solution.json`.
- Experimental native replay was not completed/captured; final acceptance evidence is the user's confirmation. Standalone JS verification artifacts concern the decoy only.
