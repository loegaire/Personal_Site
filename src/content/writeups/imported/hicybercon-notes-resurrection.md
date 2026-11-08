---
title: "Notes Resurrection — Field Notes"
description: "RESURRECTION (Operation Eclipse Void) — SOLVED (agent: Resurrection) Flag: hiCTF{p30v3rl4y71m3d473574mpk3yn7f5runl157cl5g30m37ry7r4ns4c710nn4n0f1l371m33v7xb1n4ryxml70k3n5b17m4porph4nv01dr35urr3c710n} API: {\"…"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "hicybercon", "Field notes"]
readingTime: 1
wordCount: 209
featured: false
sourcePath: "~/ctf/hicybercon/notes-resurrection.md"
---

## RESURRECTION (Operation Eclipse Void) — SOLVED (agent: Resurrection)
Flag: hiCTF{p3_0v3rl4y_71m3d473574mp_k3y_n7f5_runl157_cl5_g30m37ry_7r4ns4c710n_n4n0_f1l371m3_3v7x_b1n4ry_xml_70k3n5_b17m4p_orph4n_v01d_r35urr3c710n}
API: {"kind":"goodFlag","message":"The flag is correct."}

Image: 1GB raw, MBR zeroed, primary GPT header gone; only backup GPT (header at last LBA 0x1FFFFF, entries @0x1FFFDF) + 2 entries (MSR 0x22-0x7FFF, Basic data 0x8000-0x1FEFFF).
NTFS volume starts at partition LBA 0x8000; primary VBR zeroed, authentic VBR found at partition's last sector (0x3FDffe00, one sector past NTFS declared size 0x1F6FFF) -> "chunk beyond declared size".
Rebuild: dd if=resurrection.raw of=vol.img bs=512 skip=0x8000 count=0x1F7000; copy sector 0x1EDFFE00 -> 0. Then ntfsls/ntfscat work.
MFT at LCN 85845. Files: Users/{Administrator,Finance_Victim,SecOps_Analyst}. Deleted audit_2..40.xlsx (rec 200-218).

Segment encodings (5 tags, format "<leet-ordinal>--<payload>"; only the payload concatenates):
1. kbdusx.dll (MFT rec 179) trailing 44 bytes @file 0x400, XOR key 0x8085EC65 (big-endian byte order) ->
   "f!r5t--hiCTF{p3_0v3rl4y_71m3d473574mp_k3y_"   (hiCTF{ opens the flag here)
2. MFT rec 111 (Confidential_Q3 dir) hidden unnamed $DATA run CLUSTER COUNT sequence spells
   "53c0nd--n7f5_runl157_cl5_g30m37ry_"
3. tx_journal.log (rec 181) USN_RECORD TimeStamp deltas: (t[i+1]-t[i]) - 10000 + 16 ->
   "th1jd--7r4ns4c710n_n4n0_f1l371m3_"
4. Security_Audit.evtx (rec 193) array of LE32 substitution values ->
   "!f01_1rth--3v7x_b1n4ry_xml_70k3n5_"
5. $Bitmap (rec 6) orphan clusters (marked allocated, owned by no file; LCNs 180000..183231) gaps ->
   "51f7h--b17m4p_orph4n_v01d_r35urr3c710n}"   (closing brace)

Verification: ntfs-3g user tools (no root mount needed) after VBR relocation; all five decoded texts corroborate each other.
