---
title: "Lights Out — Field Notes"
description: "We are solving a Minecraft Java CTF challenge named “lights-out” from GreyCTF. The provided world has:"
published: "2026-05-30"
updated: "2026-05-30"
event: "GreyCTF Qualifiers 2026"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "GreyCTF Qualifiers 2026", "Field notes"]
readingTime: 8
wordCount: 1721
featured: false
sourcePath: "~/ctf/GreyCTF Qualifiers 2026/Rev/lights-out/notes.md"
---

We are solving a Minecraft Java CTF challenge named “lights-out” from GreyCTF. The provided world has:

dist-lights-out/
├── data/chunks.dat
├── level.dat
└── region/r.0.0.mca

Description:
“I wanted to demonstrate my implementation of Lights Out fully in Minecraft, but I accidentally dropped my cube and now the wires are all messed up :(”
Tip: /tick rate or /tick sprint can speed it up.

Environment:
- Minecraft Java 1.21.11
- Datapack pack_format 48 works.
- In 1.21+, functions are under data/<namespace>/function/, but we also wrote data/<namespace>/functions/ for compatibility.
- gamerule commands inside functions caused parse errors, so avoid gamerule lines.
- Use /tick sprint, not /tick rate 1.

World facts discovered:
- Real lights are only minecraft:waxed_copper_bulb, not redstone_lamps.
- Bulbs:
  x=71, y=268, z=67..322
  count=256
  initial lit count=129
- Controls:
  x=69, y=267, z=67..322
  count=256
- The intermediate/pulseable blocks are at:
  x=70, y=267, z=67..322
  mostly minecraft:white_concrete.
- Normal grid Lights Out assumptions failed:
  --width 32 target off produced an 8x32 solution but applying it did not solve.
  --width 16 target off had no solution.
- Therefore this is not normal neighbor-grid Lights Out. The wiring is arbitrary/broken.

Scripts already built locally:
- extract.py
  Parses .mca, extracts copper bulb states, can solve assumed grid Lights Out.
- make_lightsout_apply.py
  Generates apply_solution.mcfunction from line indices.
- lightsout_wire_solver.py / lightsout_redblock_solver.py
  Earlier probing attempts; direct lever powered and direct redstone block on lever position both produced 0 toggles.
- attached_pulse_solver.py
  Working probe. Pulses the attached block at offset 1,0,0 from each control, i.e. (70,267,z), using minecraft:redstone_block and restores the original white_concrete.
- analyze_rank224.py
  Analyzes rank/invariants.

Working probe command:
cd "/home/thinh/ctf/GreyCTF Qualifiers 2026/Rev/lights-out/extracted"
SRC="$PWD/dist-lights-out"
SAVE="$HOME/.minecraft/saves/LightsOutCTF"
LOG="$HOME/.minecraft/logs/latest.log"

rm -rf "$SAVE"
mkdir -p "$SAVE"
rsync -a --delete --exclude='datapacks/' "$SRC/" "$SAVE/"

python3 attached_pulse_solver.py probe "$SAVE" --offset 1,0,0 --delay 20

Then in Minecraft:
  /reload
  /function losolve:probe_start
  /tick sprint 50000

Probe succeeded:
- grep -c "Server thread.*LOS_TOGGLE" "$LOG" => 11748
- grep -c "Server thread.*LOS_PROBE_END" "$LOG" => many, because old runs exist; use last LOS_PROBE_START in parser.

Real wiring solve:
python3 attached_pulse_solver.py solve "$SAVE" \
  --offset 1,0,0 \
  --target off \
  --log "$LOG" \
  --delay 20 \
  --install-datapack

Result:
- parsed columns: 256
- nonempty controls: 224 / 256
- toggle count min/avg/max: 0 / 45.89 / 95
- no solution, rank=224

Same for --target on:
- no solution, rank=224

Rank/invariant analysis:
python3 analyze_rank224.py

Output:
zero/no-effect controls: 32
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 34]

zero/no-effect map 16x16:
XXXXXXXXXXXXXXXX
XXXXXXXXXXXXX.XX
..X.............
................
................
................
................
................
................
................
................
................
................
................
................
................

left-nullity: 32
invariant syndrome bits:
00111110001100110100010110100001

syndrome encodings:
lsb: 7ccca285
msb: 3e3345a1
rev lsb: a145333e
rev msb: 85a2cc7c

Initial bulbs 16x16:
##.##.##.#.#....
##..#..#.##..#.#
##...###...#..##
##...#.##..##.#.
#.##.#.#.#.##.#.
#..#..#...#...##
###....#..#..#..
##..##....###.##
#..#.#..#....###
#####....###.##.
.##...##....##.#
###...##.##.####
##.##...##.#....
##..#.###...##.#
#..#.#.##.##..#.
..#..#..##.####.

Main finding:
The circuit is rank-deficient. All-off and all-on are unreachable. The actual solution likely involves:
1. solving for a reachable target that satisfies hidden win logic,
2. interpreting the 32 invariant bits / unreachable subspace,
3. inspecting Minecraft NBT for command blocks, signs, block entities, scoreboard data, or hidden flag command logic,
4. possibly extracting the intended target state from the world rather than assuming all-off/all-on.

Next tasks:
- Parse region/r.0.0.mca for block entities, command blocks, signs, lecterns, structure blocks, item frames, chests, books, scoreboard/data files, functions, or any NBT string containing flag/grey/ctf/command/execute/say/tellraw.
- Search all decompressed NBT strings for suspicious text.
- Analyze the actual redstone/checker at the end of the line; find what block/entity is supposed to trigger the flag.
- Use the probed 256x256 matrix M over GF(2). Since rank=224, compute reachable states. Find if there is a sparse reachable target preserving the invariant syndrome. Apply that target and inspect the remaining lit pattern.
- Do not waste time trying normal 16x16 or 8x32 Lights Out; both all-off/all-on are proven unreachable under the real wiring.
- If generating datapacks, use physical pulses at offset 1,0,0, sequentially, not simultaneous lever powered states.

2026-05-30 follow-up:
- Used CTF forensics/misc workflows and archive differential checks.
- The original zip is clean: 3 central-directory entries, no comments, no trailing data, no duplicate/local-vs-central mismatch found by `zipinfo`, `7z`, or `binwalk`.
- Full NBT/string scan found no command blocks, signs, books, scoreboards, entities, functions, or hidden text. Block entities are only 32,896 empty `minecraft:dropper`s.
- Exact block counts in the world:
  - 5,470,777 `minecraft:observer`
  - 34,048 `minecraft:white_concrete`
  - 32,896 `minecraft:dropper`
  - 256 `minecraft:lever`
  - 256 `minecraft:redstone_lamp`
  - 256 `minecraft:waxed_copper_bulb`
- The redstone volume is observer-heavy, x=72..331, y=12..268, z=67..322. Sample x-slices look random/noisy by observer orientation; no obvious text in simple slice views.
- Coset analysis with the probed rank-224 matrix:
  - left-null syndrome as integer: `0x85a2cc7c` (same bits as previous encodings).
  - minimum reachable lit target weight is 5, with two coset leaders:
    - `[18, 87, 142, 181, 249]`
    - `[90, 107, 189, 224, 248]`
  - Solving to either coset leader gives random-looking 256-bit press vectors. One solution byte stream includes `cc dead`, but no clear flag text/QR decoded.
- Rendered initial state, coset leaders, press vectors, and selected observer slices under `extracted/*.png`; `zbarimg` and OpenCV QR detection did not decode them.
- Important caveat: the successful attached-block probe used `--delay 20`, but the observer wiring spans roughly x=72..331, so a pulse may take far more than 20 ticks to reach and settle. The rank-224/no-solution result may be a truncated transient matrix rather than the real final wiring. Re-probe with a much larger delay (hundreds of ticks) if Minecraft automation is available, or statically model observer pulse propagation.
- Headless dedicated-server probing works using the official 1.21.11 server jar URL from the local Minecraft version manifest. Disposable server dirs are under `scratch/server_run*`; do not trust the post-probe world baseline, use `extracted/lightsout_probe_meta.json` for the original 129-lit baseline.
- Delay sweeps confirm the old matrix was transient:
  - delay 80: rank 247, zero controls `[0,1,2,3,4,5,6,7,9]`, all-off/all-on still inconsistent.
  - delay 160: rank 252, zero controls `[0,1,2,3]`, all-off/all-on still inconsistent.
  - delay 320: rank 254, zero controls `[0,1]`, all-off/all-on still inconsistent.
  - delay 640: rank 254, zero controls `[0]`, all-off/all-on still inconsistent. The matrix is still changing substantially between 320 and 640, so this is not settled yet.
  - delay 1280: rank 255, zero controls `[0]`, all-off inconsistent by one invariant, all-on consistent.
- Delay-1280 all-on solution:
  - matrix saved as `scratch/matrix_delay1280_cols.txt`.
  - selected controls saved as `scratch/solution_delay1280_on.txt`.
  - solution weight: 134.
  - the right nullspace free column is only control 0, and control 0 has no effect at this delay; the only alternate all-on solution is toggling control 0 in addition.
  - left-null vector is `0x6be0b60b3885bc6cb2e9eeff85523a43dac81d8db99709dfbcca5e1542819426` (weight 129). Its syndrome with the original baseline/all-off target is 1, explaining why all-off is inconsistent.
- Encoding checks tried on the delay-1280 solution/alternate/null/left-null vectors:
  - 16x16, 8x32, 32x8, 4x64, 64x4 renders with rotations/transposes/reversals.
  - zbar/OpenCV QR checks: no decode.
  - byte packing with offsets and lsb/msb order: no `grey`, `flag`, or long lowercase plaintext.
- Next useful test:
  - all-on solution was applied once with the old sequential pulse/release datapack. The log reached `LOS_APPLY_DONE`, but the saved bulb state was exactly the original baseline:
    - lit count 129
    - state LSB hex `0x7b244da9b1d30b1bf6c7b0c66e1fe129dc332487c4495aad59a3c8e3a6930adb`
  - Conclusion: the probed matrix describes the steady state while a selected input is held powered, not a latched press-and-release effect.
  - Next test: hold the 134 selected attached input blocks as redstone blocks simultaneously, wait at least 1280 ticks, then parse the settled bulb state and log.

2026-05-30 later headless apply tests:
- `scratch/generate_hold_datapack.py` holds the 134 selected x=70 input blocks as redstone blocks simultaneously and reads after 1280 ticks.
  - Confirmed all 134 redstone blocks were present in the saved world.
  - Read state was still exactly the original 129-lit baseline. Holding all selected inputs in the same tick does not compose the single-input matrix.
- `scratch/generate_accumulate_datapack.py` energizes selected x=70 input blocks one at a time, leaving previous inputs on, with 1280 ticks between edges.
  - Final read: 133 lit, not all-on.
  - LSB hex: `0x3aadff380dde1af52d52f0d0cd30b83676fc4e0d4debcdbbb1802d6b2c6de201`.
- Directly setting one real lever (`setblock 69 267 69 minecraft:lever[face=wall,facing=west,powered=true]`) and sprinting 3000 ticks caused no persistent bulb changes.
- Bitstream searches over delay matrices (rows/columns, reversals, bit-order and byte offsets) and derived 256-bit vectors found no `grey`, `flag`, or related plaintext.
- Delay-1280 matrix visualization is sparse and near-diagonal, unlike early transient matrices; the all-on solution is close to the complement of the initial lamp state but does not directly decode.
- Delay-2560 probe:
  - completed in `scratch/server_run2560`; matrix saved as `scratch/matrix_delay2560_cols.txt`.
  - toggles 146 total; nonempty controls 113/256; min/avg/max 0/0.57/3.
  - rank 99.
  - all-off and all-on are both inconsistent.
  - many columns are zero again, so delay 2560 is after most transient effects have decayed, not a better settled solve point.
- Exact real-lever timing check:
  - Fresh headless world in `scratch/server_lever1280`, no datapack, forced puzzle chunks loaded.
  - Commanded `setblock 69 267 69 minecraft:lever[face=wall,facing=west,powered=true] replace`, then `tick sprint 1280`, `save-all flush`, `stop`.
  - Direct MCA parse of the bulb line after shutdown:
    - lit count 129.
    - state hex `0x7b244da9b1d30b1bf6c7b0c66e1fe129dc332487c4495aad59a3c8e3a6930adb`.
    - diff from original baseline: 0.
  - This differs from the delay-1280 attached x=70 redstone-block probe column for control index 2, which had weight 22. Direct levers are not equivalent to the attached-block probe, and simply holding a lever on does not alter the persistent bulb line.
- Direct watched-lamp blockstate test:
  - Fresh headless world in `scratch/server_lamp1280`.
  - Commanded `setblock 71 267 69 minecraft:redstone_lamp[lit=true] replace`, waited for `tick sprint 1280` to complete, then saved.
  - The redstone lamp saved as `lit=true`, but the copper bulb line was again exactly the original baseline with diff 0.
  - So command-editing the watched blockstate does not stimulate the observer network like placing a redstone power source at x=70 does.
- Short redstone-block pulse check:
  - Fresh headless world in `scratch/server_pulse_h1`.
  - Set `(70,267,69)` to `redstone_block`, waited 1 tick, restored `white_concrete`, then waited a verified 1280 ticks and saved.
  - Final copper bulb line again matched the original baseline exactly. A short on/off pulse is not a persistent one-control effect at this timing.
- Static/encoding follow-up:
  - Added `scratch/mca_target.py` for fast targeted MCA block reads.
  - Direct projection renders of the full non-air volume along XY/XZ/YZ look like dense random wiring/noise, no visible text.
  - Tested normal n-dimensional Lights Out models whose dimensions multiply to 256, including `4x4x4x4` and the 8-dimensional hypercube `2^8`, with and without wrapping where applicable. Resulting all-off/all-on solution vectors did not produce `grey`, `flag`, or long lowercase text under direct byte packing.
  - Also tested Gray-code/bit-reversed orderings on baseline, delay-1280 solution, left-null vector, and related XOR/complement vectors; no flag-like plaintext.
