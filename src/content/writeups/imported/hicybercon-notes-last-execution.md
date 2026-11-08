---
title: "Notes Last Execution — Field Notes"
description: "Last Execution (chal da8426d4) - worker notes Image format (EXE9CORE) - recovered 8.5MB disk: custom header (0x100) + segment table (24 x 0x40 from 0x100) + data. Header CRC32 over 0x00..0x2F verified OK. EX…"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "hicybercon", "Field notes"]
readingTime: 2
wordCount: 350
featured: false
sourcePath: "~/ctf/hicybercon/notes-last-execution.md"
---

## Last Execution (chal da8426d4) - worker notes
### Image format (EXE9CORE) - recovered
- 8.5MB disk: custom header (0x100) + segment table (24 x 0x40 from 0x100) + data.
- Header CRC32 over 0x00..0x2F verified OK.
- EXEC_SEED=0x9e3779b9f00dcafe, TABLE_SEED=0xbadc0ffee0ddf00d, ENTRY=1, MANUAL=0xa.
- Segments: CODE 1 EXEC_MAIN, 2 FOLD_A, 3 FOLD_B, 5 EXEC_LIMIT(decoy/timesink), 4 EXEC_FINAL, 6 EXEC_SELFTEST;
  TBL 0xb DLOOK(0x40000), 0xc DSEED(0x1000); MANUAL 0xa PRIMER; SEAL WILL_SEAL + TEST_SEAL_1..4; TRC TELEMETRY; SYM SYMBOLS.
- Extracted all segments to challenges/last-execution/ex/.

### Emulator findings (primer has PLANTED ERRORS; corrected):
- Code page rotation: m=ROL64(EXEC_SEED xor seg_id*K, 17)   [primer said 19 -> WRONG]
  step: m=ROL64(((m xor w xor X)*K) mod 2^64, 31), w=be64(stored page[p-1] off0), X=0xA5A5.., K=0x9E3779B97F4A7C15.
  Verified: EXEC_MAIN ROT[0..2]=[0,0x39,0x37] matches primer trace.
- Fetch: word=ROL64(stored_be64, ROT[pc>>8]); fields op=63..56, rd=55..48, ra=47..40, rb=39..32, imm=31..0.
- Dispatch: idx=(op_byte + (pc>>3) + AUX) mod 256   [primer said pc>>4 -> WRONG]
  Verified vs SELFTEST decode record (op 0x93,AUX 0x47,pc0x40 -> 0xE2 LDRR).
- Fallback PSH for unlisted idx exists.
- Table rows: rr[0]=(TABLE_SEED xor seg_id*0x1BF5) mod64;  rr[i]=(rr[i-1]*17 + stored_row[i-1][0] + i*13) mod64  [primer said i*11 -> WRONG]
  logical row = stored row rotated RIGHT by rr[i].
  Verified vs DSEED trace rr[0..3]=[0x31,0x2D,0x30,0x16].
- EXEC_SELFTEST commitment SHA256(be64 R1..R4)=0b6d8d4770eac443de6b9b73340a4a262117d9da42e6ced9411ebda286bbbcf2 -> MATCHES.
- Chain: MAIN->2->3(FOLD_B) gives R1low=0x07d78bd2; FOLD_B HALT imm=0x7d78bd7 should link to FINAL(4) => needs R1low ...bd3. OFF BY ONE remains.
- EXEC_LIMIT is a time-sink decoy (~1e15 loop). TELEMETRY gives final state R1..R4 + folds; final R1 low=0xA112FFFB built in EXEC_FINAL.
- Seal: SEAL-256 (key schedule/SBOX from DLOOK rows0..3/P permutation). Not yet decrypting (blocked on state).

### SOLVED
- EXEC_LIMIT is a key-stretch loop (not a trap): R9=0x123456789abc (~2e13) iterations of a mixing loop.
  R6 low-18-bit LCG (period 2^18), R5 += 0x4001 mod 0x8000, R12 reset at 3. R8 accumulates; compute by cycle fast-forward.
- Real chain: MAIN(1) -> FOLD_A(2) -> FOLD_B(3) -> EXEC_LIMIT(5) -> FINAL(4) -> EXEC_LIMIT(5) -> FINAL(4) -> terminate (0xffffffff).
  (FOLD_B link=5, FINAL alternates 5/4; terminated by FINAL when scratch mem[0x2048]==2.)
- Correct final state R1..R4 = 30677df2a112fffb ff975fd2b1f15576 abec2195f731c083 9c3fb793eed6da86
  (TELEMETRY R2 has decoy nibble: ...b1f14576 vs true ...b1f15576; TEST_SEAL_2 was sealed with the decoy state -> fake flag).
- key=SHA256("LASTEXEC"||be64(R1..R4)||"LASTEXEC"); SEAL-256 decrypt WILL_SEAL (shifts 0x5d, L=4):
  FLAG = hiCTF{3x3c_9_r3m3mb3rs_4ll_but_th3_l4st_h4lt_l13s}
- Submitted: API returned badAlreadySolvedChallenge => flag correct.
