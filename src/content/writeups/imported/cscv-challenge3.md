---
title: "sinkhole — notes"
description: "Target Challenge: \"sinkhole\". Patched Chromium 153.0.8010.0 / V8 15.3.71.0 (Maglev JIT). Goal: URL to bot -> headless chrome visits -> pop renderer -> read /flag. Remote launch flags: --headless=new --no-san…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Forensics"
kind: "field-note"
status: "solved"
tags: ["Forensics", "cscv", "Field notes", "shellcode", "wasm"]
readingTime: 7
wordCount: 1504
featured: false
sourcePath: "~/ctf/cscv/challenge3/notes.md"
---

# sinkhole — notes

## Target
- Challenge: "sinkhole". Patched Chromium 153.0.8010.0 / V8 15.3.71.0 (Maglev JIT).
- Goal: URL to bot -> headless chrome visits -> pop renderer -> read `/flag`.
- Remote launch flags: `--headless=new --no-sandbox --disable-gpu --js-flags="--no-memory-protection-keys --expose-cage-base"`.
  - `--no-memory-protection-keys`: disables PKEY protection on JIT/code cage (RWX-ish helper).
  - `--expose-cage-base`: adds `cageBase()` in every page -> returns pointer-compression cage base. No R/W by itself; saves an infoleak.
- Bot: `deploy/bot.py`, accepts http/https only, visits 45s. Flag `/flag` mode 600 owner ctf.
- policy.json blocks file://, chrome://, etc. on remote (not locally).

## Local test binary
- `artifacts/candidate/chrome/chrome` (chmod +x done). No d8 shipped.
- Local testing has NO managed policy, so file:// works locally.
- For forcing tiers locally can add `--allow-natives-syntax` (%OptimizeMaglevOnNextCall). Real exploit must warm up naturally.

## The bug(s): three added Maglev passes (src/maglev/)
All THREE gated by `if (graph_->num_blocks() <= 1024) return;`
=> only fire on FUNCTIONS THAT COMPILE TO >1024 BASIC BLOCKS.
This is why the 9000-case test suite is all green: those graphs are never built.
Default flags ON: maglev_smi_check_elimination=true, maglev_store_sink=true, maglev_range_analysis=true.

### 1. maglev-smi-check-elimination.{h,cc}  (PRIME SUSPECT — cleanest type confusion)
- CollectGuardedIndices(): for every `CheckInt32Condition` with
  deopt_reason==kOutOfBounds AND condition==kUnsignedLessThan,
  record `check->input(0).node()->UnwrapIdentities()` into `guarded_`.
- NarrowGuardedUntags(): for each guarded index, if it Is<CheckedObjectToIndex>
  or Is<CheckedSmiUntag>, `OverwriteWith<UnsafeSmiUntag>()`.
- Flaw hypothesis: being an operand of a `<u length` bounds check does NOT prove
  the *input* to the untag is a Smi. CheckedObjectToIndex accepts HeapNumber
  (double) too. Replacing with UnsafeSmiUntag drops the type check. Need to work
  out the precise OOB primitive (bounds check re-validates the untag output, so
  the confusion must be exploited differently — WIP).

### 2. maglev-store-sink.{h,cc}
- Sinks a run of nodes from `TransitionElementsKind[OrCheckMap] .. StoreFixedArrayElement*`
  from loop preheader INTO the loop header. Copies eager-deopt info from the
  preheader's CheckpointedJump. Suspect: reorders a map transition/check relative
  to the store, or moves a store past a check -> map/elements-kind confusion.

### 3. maglev-range-analysis.h + maglev-graph-optimizer.cc (range use) + maglev-range-verification
- Integer range analysis used to eliminate `CheckInt32Condition` bounds checks.
- Suspect: a range is computed too wide -> a real bounds check dropped -> OOB.
- maglev_range_verification flag exists but default OFF (only with maglev_assert).

## Next steps
- [ ] Build a >1024-block Maglev function harness; confirm passes fire (trace flags).
- [ ] Pin down which pass gives the strongest primitive; write minimal PoC crash.
- [ ] Turn into OOB R/W -> addrof/fakeobj -> arbitrary R/W -> shellcode via
      --no-memory-protection-keys / WASM RWX -> read /flag.

## Empirical progress (session 1)
- Env confirmed: chrome runs headless; console.log -> stderr with --enable-logging=stderr --v=1.
  Extract with: grep CONSOLE | sed 's/.*CONSOLE:[0-9]*] //'.
- cageBase() works, returned 0xad900000000 (cage base). Value varies per run (ASLR of cage).
- --js-flags DOES propagate to renderer (%GetOptimizationStatus etc. work with --allow-natives-syntax).
- ALL maglev trace/print flags are DEFINE_DEVELOPER_FLAG / print_maglev_graphs is BOOL_READONLY false
  => compiled OUT in this release binary. No graph dumps. Must detect passes BEHAVIORALLY.
- smi-check probe (N=700 ifs, arr[idx]): feeding idx=2.5 caused a DEOPT (optstatus 0x19->0x1),
  i.e. the checked conversion was still present. Either blocks<1024 or idx path wasn't
  Checked{SmiUntag,ObjectToIndex}. Note 1.0 canonicalizes to Smi -> no double-index feedback.
- Analysis conclusion for smi-check: a single bounds-checked access re-validates the (now unsafe)
  untag output, so simple confusion does NOT OOB. Needs a case where the guarded conversion is
  reused where NOT actually smi/bounds-guarded. Parked; revisit.
- Pivot: "sinkhole" name => focus on maglev-store-sink (elements-kind transition + store moved
  into loop header; copies preheader CheckpointedJump eager-deopt onto moved nodes). Classic
  float/pointer elements-kind confusion primitive. Building test now.
- OptimizationStatus bits (V8), confirmed from src/runtime/runtime.h (authoritative, corrects earlier rough guess):
  kIsFunction=1<<0, kNeverOptimize=1<<1, kMaybeDeopted=1<<2, kOptimized=1<<3,
  kMaglevved=1<<4, kTurboFanned=1<<5, kInterpreted=1<<6, kMarkedForOptimization=1<<7,
  kMarkedForConcurrentOptimization=1<<8, kOptimizingConcurrently=1<<9, kIsExecuting=1<<10,
  kTopmostFrameIsTurboFanned=1<<11, kLiteMode=1<<12, kMarkedForDeoptimization=1<<13,
  kBaseline=1<<14, kTopmostFrameIsInterpreted=1<<15, kTopmostFrameIsBaseline=1<<16,
  kIsLazy=1<<17, kTopmostFrameIsMaglev=1<<18, kOptimizeOnNextCallOptimizesToMaglev=1<<19,
  kOptimizeMaglevOptimizesToTurbofan=1<<20, kMarkedForMaglevOptimization=1<<21,
  kMarkedForConcurrentMaglevOptimization=1<<22.
  => 0x19 = kIsFunction|kOptimized|kMaglevved. All prior "status=0x19" results mean
  successfully Maglev-compiled and NOT deopted (no kMaybeDeopted/kMarkedForDeoptimization
  bits). Re-read as: >1024-block gate satisfied, passes had opportunity to fire.

## Session 2 — pipeline placement (IMPORTANT correction)
- Read maglev-compiler.cc + turbolev-frontend-pipeline.cc to see WHERE each pass runs.
- **smi-check-elimination**: runs in plain **Maglev** compiler (maglev-compiler.cc ~L196),
  default ON, gated `num_blocks() <= 1024`. Reachable on remote (Maglev tier). CANDIDATE.
- **store-sink**: runs in plain **Maglev** compiler (~L206), default ON, gated <=1024.
  Reachable on remote. CANDIDATE (name "sinkhole" points here).
- **range-analysis + range-verification + bounds-check elimination (VisitCheckInt32Condition)**:
  run ONLY in the **Turbolev** frontend pipeline (RangeAnalysisPhase / PostOptimizerPhase).
  `turbolev` default = FALSE ("4th tier instead of Turbofan"). Remote js-flags do NOT set
  --turbolev. => **RANGE PASS IS UNREACHABLE ON REMOTE. Not the intended bug.**
  (Also: range analysis has NO >1024 gate — earlier note "all three gated" was WRONG.
   Only smi-check & store-sink have the gate.)
  - The MaglevGraphOptimizer that the Maglev inliner runs is constructed with ranges=nullptr
    (default arg), so GetRange()->{} => NO range-based check elimination in Maglev. Confirms above.
- Oracle note: --maglev-range-verification (default off, runtime-toggleable) inserts
  AssertRangeInt32/Float64 that abort if a value escapes its computed range. USEFUL ONLY for
  the turbolev range bug (local study), irrelevant to remote exploit. Parked.

### Consequence / plan
- Focus remote exploit on **store-sink** (primary, per name) and **smi-check** (secondary).
- Both require a Maglev function compiling to >1024 basic blocks (N~1400 if/else chain works;
  gen_sink3 confirmed status shows Maglev-optimized at N=1400, no crash yet).
- store-sink SSA-break attempt (gen_sink3: a[0]=o;a[1]=o) did NOT crash — the two store sites
  use SEPARATE elements loads, so moving slice [transition..firstStore] into loop header does
  not orphan a def used by the 2nd store. Need a construction where a node OUTSIDE the moved
  slice genuinely uses a value DEFINED inside it (true use-before-def), OR exploit the
  eager-deopt-frame replacement (moved TransitionElementsKind/CheckMaps gets preheader
  CheckpointedJump loop-entry frame -> deopt mid-loop resumes with wrong frame state).
- Still no confirmed crash/OOB primitive. NOT solved. Do not submit any flag.

## Session 3
- Re-ran gen_sink4.py N=1400 (a[0]=o transition/store slice; k=a[2] separate load reusing
  elements pointer e). Result: status=0x19 both before and after 4000-iter hammer =>
  confirmed Maglev-compiled, confirmed NEVER deopted. No crash, no observable corruption
  via k===o / a[i]===o checks. Confirms prior conclusion: this construction's two element
  accesses (index 0 store, index 2 load) go through separate LoadElements, so sinking the
  transition+store slice into the loop header does not orphan a real use of a value defined
  inside the slice. Need a construction with a genuine cross-slice dependency, OR target the
  eager-deopt-frame-reuse angle directly (moved TransitionElementsKind/CheckMap nodes get
  `entry` (preheader's CheckpointedJump) eager-deopt info via CopyEagerDeoptInfoOf — if that
  node deopts on iteration 2+, does the restored frame reflect the CURRENT loop iteration's
  register/stack state, or preheader's? That's the sharper hypothesis to test next: force a
  deopt specifically on the CheckMap/Transition after it has been sunk into the header
  (e.g. call with mismatching elements kind on a later loop iteration, not the first), and
  check whether resumed interpreter state is consistent (correct locals) or corrupted.
- Corrected OptimizationStatus bit table above — was wrong in session 1, invalidates nothing
  factual but re-labels prior "0x19" results correctly as Maglev+not-deopted.
- gen_sink5.py: tried to force the sunk transition/checkmap slice to deopt on a later
  iteration (deoptIter=50) via `a.length=a.length` mid-loop after growing the array
  (length 10->20) before the call. RESULT: clean deopt (status 0x19->0x1 on 2nd call,
  i.e. fell back to interpreter), side-effect counter and trace exactly correct
  (sideEffects=55=expected, trace=[1..55] sequential, no dupes/skips). No stale-frame
  corruption observed. Inconclusive either way: (a) my mid-loop mutation may not have
  actually forced the SUNK CheckMap/Transition node specifically to deopt (could be an
  unrelated deopt reason entirely), or (b) V8's frame materialization is fine here.
  Need per-node confirmation, but print_maglev_graphs is compiled out (BOOL_READONLY),
  so can't directly see which node deopted. Consider: --trace-deopt flag (should still
  work, it's deopt tracing not maglev graph tracing) to identify deopt reason/bailout id
  and correlate with source position of the CheckMap/Transition specifically.
- CONFIRMED DEAD END: --trace-deopt is DEFINE_DEVELOPER_FLAG (flag-definitions.h:3182),
  same category as print_maglev_graphs -> compiled out / no-op in this release binary.
  No stdout output either. This build gives ZERO internal visibility (no graph dumps, no
  deopt reasons, no bailout ids). All diagnosis must be purely behavioral: side-effect
  counters, correctness checks, crash/no-crash, timing. Do not spend more time trying
  flag-based introspection.
- Since CheckMap keys off Map pointer (not .length), gen_sink5's `a.length=a.length`
  mutation likely never invalidated the map at all -> the observed clean deopt on 2nd
  call was almost certainly UNRELATED to the store-sink slice (e.g. ordinary type-
  feedback deopt from calling with a differently-shaped `a`). Construction did not
  actually test the hypothesis. NEXT: rebuild with a real map-changing mutation between
  preheader store and a later loop iteration (e.g. delete a property / add a new
  in-object property to `o` or change `a`'s elements kind from PACKED_SMI to PACKED_DOUBLE
  mid-loop via `a[somewhere] = 1.1`), keeping side-effect-counter/trace-array oracle from
  gen_sink5 to detect wrong-frame resume (dupe/skip in trace, or counter mismatch) without
  needing crash as the only signal.
- gen_sink6.py: did the real thing — `a[5]=1.1` mid-loop (genuine PACKED_SMI->PACKED_DOUBLE
  elements-kind transition, not a length no-op). RESULT: still completely clean.
  status 0x19->0x1 (deopt to interpreter) on first post-mutation call, trace=[1..55] exact;
  ran it AGAIN (0x4001 = kIsFunction|kBaseline, deopted to Sparkplug, stayed there) — still
  trace=[1..55] exact, sideEffects=55=expected both times. Two independent "force sunk node
  to deopt mid-loop" experiments (length no-op, real elements-kind change) both produced
  zero observable corruption via the side-effect-counter/trace-array oracle.
- INTERPRETATION: either (a) CopyEagerDeoptInfoOf only copies frame *shape*/liveness
  metadata (bytecode offset, which registers are live) while actual register/stack VALUES
  are still read from real current machine state at the deopt point — meaning the "stale
  frame" theory as construed doesn't produce corruption, only a normal-looking deopt; or
  (b) my constructions still aren't causing the SUNK node itself to be what deopts (some
  other, ordinary map-check elsewhere in the loop body could be firing first/instead).
  Cannot disambiguate without graph visibility (still unavailable, see dead-end note above).
- PIVOT RECOMMENDATION: store-sink's naive "IR move without SSA/phi fixup" theory has now
  failed 2 independent behavioral probes. Before sinking more effort into it, switch primary
  focus to smi-check-elimination (pass #1): the CheckedObjectToIndex/CheckedSmiUntag ->
  UnsafeSmiUntag swap is a cleaner, better-understood type confusion (input can legitimately
  be a HeapNumber, swap drops that check entirely) and doesn't depend on subtle deopt-frame
  semantics we can't introspect. Revisit the smi-check probe from session 1 (idx=2.5 caused
  deopt => concluded the checked conversion was "still present") — re-examine whether that
  test actually exercised NarrowGuardedUntags's specific pattern (CheckInt32Condition with
  kOutOfBounds + kUnsignedLessThan feeding a CheckedObjectToIndex/CheckedSmiUntag), since our
  bit-table and tooling understanding has improved significantly since that session-1 test.
