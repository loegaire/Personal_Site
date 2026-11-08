---
title: "hiCTF (HiddenInvestigations rCTF) — Agentic division"
description: "Access Platform: rCTF at https://ctf.hiddeninvestigations.net Team token in scratch/ (login.json). authToken in scratch/auth.txt (expires -> re-login). API: POST /api/v1/auth/login {teamToken} ; GET /api/v1/…"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "hicybercon", "Field notes", "gdb", "z3", "sqli", "jwt", "ssti"]
readingTime: 11
wordCount: 2281
featured: false
sourcePath: "~/ctf/hicybercon/notes.md"
---

# hiCTF (HiddenInvestigations rCTF) — Agentic division

## Access
- Platform: rCTF at https://ctf.hiddeninvestigations.net
- Team token in scratch/ (login.json). authToken in scratch/auth.txt (expires -> re-login).
- API: POST /api/v1/auth/login {teamToken} ; GET /api/v1/challs (Bearer) ; GET /api/v1/users/me ; POST /api/v1/challs/<id>/submit {flag}
- Flag format: hiCTF{}

## Solved (5) — score 494, place 67
Shadow Identity, Forgotten Secrets, Broken Signals, Cipher Cascade, Ghost in the Wire

## Unsolved queue (by solves desc)
1. Memory Liar — SOLVED hiCTF{dk0m_unl1nk_3pr0c3ss_l1st_cr0ss_ch3ck_7c3a9f} (DKOM unlink, XOR 0x5d @0x35f010)
2. Cold Beacon — SOLVED key C0ldB34c0n::unl0ck::7a3f -> hiCTF{c0ld_b34c0n_cfg_uns34l3d_fr0m_th3_s4mpl3} (z3 on constraint tables, scratch/cold_z3.py)
3. Roof of Africa (steg,124) id a17a88b6 — image, pass = Kilimanjaro height (5895)
4. The Foxglove Trace (misc,45) id 50ab1909 — step-count + wifi RSSI data mining
5. Zanzibar Whisper (steg,34) id 864156fe
6. Epsilon Drift (Reverse,34) id 61fa3c15 — ELF ./epsilon-drift <hexvector>
... +16 more (see scratch/challs.json)

## Log
- Set up workspace, authed, enumerated 28 challs.

## Progress update (score 828, 9 solved)
- Roof of Africa, Zanzibar Whisper, Foxglove Trace solved by teammates.
- Next: Cold Beacon (Reverse). File: challenges/cold-beacon/cold-beacon (ELF x86-64 stripped).
- Epsilon Drift — SOLVED hiCTF{1eee754_s1gn3d_z3r0_1u1p_dr1ft_eps!}. Vector = doubles (1.1, 2.2, fl(1.1+2.2), -0.0) hex LE; bitfield eqs in MAIN__ @0x401f10. scratch/eps_solve.py
- Next: Whispers in the Margin (steg, 34)
- Whispers in the Margin — SOLVED hiCTF{573g4n0gr4phy_!5_fun}: docx trailing space/tab lines = binary -> "haha! u got me, now what?" = steghide pw for chall.jpg

## Session 2026-10-30 10:4x — parallel-agent claims
- Agent A (this session) claims: Night Batch (rev 69), Obfuscated Flow (rev 68), Apex Engine (pwn 65), Last Execution (rev 58).
- Artifacts downloaded+extracted under challenges/<slug>/; originals in downloads/<slug>/.
- Live-instance info: see scratch/instantiated.txt
- JGMTFM (crypto) — STUCK. chall.txt = 52 2-char tokens; 2nd char always 2-7 => reversed hex nibbles, u-z = a-f.
  Swap+map -> '5G:qS=-gB39:aKcK9#F"?-$LEP+[6kb2b3h:3=G-`E&]"GD@T[9-' (looks Ascii85 but a85 decode -> binary).
  Ruled out: all letter->hex perms (+a85/b85/b64/b32), digit rotations, atbash, story XOR keys, 1-byte xor, printable caesar, rot47, base91.
- RESURRECTION part1 (from work/kbdusx.dll @0x400 xor 8085ec65): 'f!r5t--hiCTF{p3_0v3rl4y_71m3d473574mp_k3y_'
- RESURRECTION part3 (tx_journal.log USN ts deltas-10000+16): 'th1?d--7r4ns4c710n_n4n0_f1l371m3_' (idx3 decodes 'j', expected 'r')
  RESURRECTION ruled out: MBR/GPT slack, primary boot (zeroed), unallocated clusters (all zero), allocated-unowned clusters (only backup boot), MFT rec 180 slack, $SI/$FN ts of audit_* files.
  Leads left: Security_Audit.evtx (no plain strings), TxR_Checkpoint.clfs / TxR_Rollback_State.bin (high entropy, maybe keyed), garbage final USN record in tx_journal.log, GPT entries CRC = 0xdeadbeef, missing audit_01..21.
- RESURRECTION part4 (Security_Audit.evtx binxml substitution values): 'f01_1rth--3v7x_b1n4ry_xml_70k3n5_'
  More ruled out: hives/NTUSER/evtx(others)/prefetch/TxR/dlls = PRNG filler (shared first bytes, entropy 8.0, fake MAM hdrs);
  $BadClus sparse; $SDS normal; $Boot std; GPT names clean; vol.img == raw volume (except repaired boot); INDX slack only reused audit names.
  Remaining parts: 2 ("s3c0nd") and 5 ("f1f7h") not found. $LogFile has FILE0 records of deleted Confidential_Q3 dir (rec 0x6f) - next: parse LogFile redo ops for resident $DATA of deleted files.

## JGMTFM (crypto, 106 solves) — still unsolved, keyed-table structure found
52 tokens, token=(c1,c2); c1∈{0-9,u,v,w,x,z}, c2∈{2..7}. NOT a plain nibble/affine decode (i,C,{,} never appear in any linear decode).
Known-plaintext (pos->char): 53->h,74->i,u3->C,17->T,35->F,x3->{,x2->}, (last x2->}).
Structure: target = TABLE[c1] - 2*c2  (confirmed -2 step from x3=123/x2=125).
Derived TABLE[c1]: 1->98,3->80,5->110,7->113,u(10)->73,x(13)->129  (nonlinear => keyed).
Ideas not yet tried: book cipher into the Saad/Harun dialogue in the description; Polybius w/ keyword; maybe c2 indexes word & c1 char.

## Night Batch (rev, 69) — SOLVED by Agent A
Flag: hiCTF{c0b0l_p4ck3d_d3c1mal_n1ghtly_b4tch!} (submit: badAlreadySolvedChallenge — team already had it)
Key: 481702596899... exact key = 481702596318740925 (verify: ./night-batch 481702596318740925 prints flag)
Method: GnuCOBOL-compiled ELF (static libcob). key must be 18 digits; 22 sequential compares of a
PIC 9(4) COMP-3 temp (0x4600e0) against constants 8,3,1,7,7,7,9,2,7,6,2,3,2,2,5,5,1,9,4,4,4,0.
Each value is linear mod 10 in the key digits (verified). Solved with z3 after probing single-digit
perturbations (coefficient matrix + expected vector). Tooling: /tmp/t8.py, /tmp/night-batch-nop (checks nop'd).
Then flag: msg = table@0x44d0c0 ^ SHA256-keystream(SHA256(key18)) (42 bytes), gated on SHA256(msg)==K.
- Paper Trail — SOLVED hiCTF{n3w_ar34_fOr_hid!ng_d4t4_n4m3d_TJ}: 4 extra invisible (3 Tr) TJ streams (obj 179-182, pages 3/6/9/12); long-line kerning values = 64B AES-CBC ct, key=trailer /ID[0], IV=/ID[1] (diffed vs archived wb.pdf).

## Apex Engine (pwn, 65) — SOLVED by Agent A (flag already submitted by team)
Flag: hiCTF{t0ct0u_mult1thr34d_r4c3_c0nd1t10n_w1n_8d3f_72b600a9c4}
Exploit (challenges/apex-engine, /tmp/apex_scan2.py):
1) Double-spend: pipeline "2\n100\n2\n100\n" -> two async settlement orders both pass the main-thread
   balance check (worker sleeps 25ms) -> balance underflows to 0xFFFFFFFFFFFFFF9C. Do NOT withdraw escrow.
2) "4\n" -> VIP (unsigned balance >= 10000).
3) "5\n1\n0\n" create slot 0 (path "/tmp/preview.txt").
4) TOCTOU race in enclave thread (0x1d80: strstr(path,"flag") -> usleep(25ms) -> fopen(path)):
   send "2\n0\n" then after D ms "3\n0\n/flag\n". CRITICAL: set TCP_NODELAY on the client socket,
   otherwise Nagle delays the second write past the 25ms window. D in 0..3ms wins.
Instance API: PUT/GET/PATCH /api/v2/integrations/challs/<id>/instance (Bearer token) -> endpoints[{kind tcp-ssl,host,port}].

## Session 2 (ttttthin) — 2026-10-30 ~13:00-14:10 — contributions
### C3 Vault (hardware 136 solves) — SOLVED by teammate; creds recovered here
- eFuse read (BLOCK0,1=6 words; BLOCK2..10=8 words). Key block = BLOCK4 (bytes 0x70..0x8f).
- Flash key = **BLOCK4 reversed (all 32 bytes)**: 7f4d6513a54df7f727c12ffd0fdc61e88292d86a653ddf9c2a2712e7f7110ea6
- Flash decrypt = AES-XTS (espsecure scheme): tweak = LE32(addr&~0x7f)+12 zeros, 128-byte units, block-reversed.
  -> flash_dec.bin (boot E9 @0, PT AA50 @0x8000: nvs@0x9000/0x6000, nvs_keys@0xf000/0x1000, factory@0x10000).
- nvs_keys partition is flash-encrypted; after flash-decrypt its first 64 B = NVS XTS key (eky||tky).
- **NVS is NOT flash-encrypted (flag 0)** -> ciphertext is the RAW flash bytes at 0x9000.
  NVS decrypt: per-32-byte entry, AES-XTS key=eky||tky, tweak = LE32(entry_offset_in_partition)+12 zeros.
- Credentials (gateway ns1): device_id=ee0315f3953aad298d7f3f43973ad618, generation=7, hostname=c3-vault-gw
  vault_v1 (ns2) seed = d857200f87a1728b5220a4d77c31d7d9ee9bf8992ad16dbb398d05844676aa4f
  vault_v2 (ns3) seed = 826e4e9e65c0ce89f413b7c291bb7e84185c64d4ec8769805227253b985083c5
- Auth hint: "C3 Vault enrollment v2; console AUTH <64 hex>; SHA-256" (TCP+SSL verifier via Instancer).

### Night Batch (rev) — full algorithm handed to hermes (they solved it)
- GnuCOBOL ELF; strings XOR 0x5a; build "account rejected" from 0x44d0a0.
- validator 0x402f40 always rejects (esi=byte[0x4600f0] has no writer). flag = 0x44d0c0[42] ^
  (SHA256(SHA256(key18)||be32(0)) || SHA256(...||be32(1)))[:42]; gated on SHA256(flag)==const.
- Key must be 18 digits (PIC 9(4) COMP-3 compares); solved by hermes.

### JGMTFM (crypto, still open) — extra RULED OUT by ttttthin (don't repeat)
- Tokens: c1 in {0-9,u,v,w,x,z} == hex 0-15 with letters a-f shifted +20 (u=a.. z=f, y unused);
  c2 in {2..7}. Structure char=V[c1]-2*c2 confirmed (x3='{',x2='}' force step -2; not +2).
- RULED OUT: free English substitution solved by simulated annealing on Moby-Dick quadgrams (gibberish);
  Ascii85 decode of nibble-swapped hex string for ALL 16P5 letter->digit maps (never printable, never "hiCTF");
  single-byte XOR/ADD/SUB, bit-reverse, nibble-swap on both nibble orientations;
  grid transpositions 2x26/26x2/4x13/13x4 (row/col/boustrophedon/reverse) with flag anchoring -> not clean.
- Note: forcing plaintext[0..5]="hiCTF{" forces plaintext[6]='}' (x2 at pos 6) => plaintext is NOT a
  simple hiCTF{...} in token order; likely a transposition or a further decode layer (or an English msg).

## JGMTFM (crypto) — hermes analysis (still unsolved)
Token structure confirmed: 52 tokens, c1 ∈ {0,1,2,3,4,5,6,7,8,9,u,v,w,x,z} (ALL 15 values
used), c2 ∈ {2..7} (6 values) => a 15x6=90 symbol space. 35 distinct tokens, max repeat 4.
- c1 read as hex (u,v,w,x,z = a,b,c,d,f) and c2 as a digit: byte = c2*16 + c1 gives
  printable ASCII for every token -> "5G:qS=-gB39:aKcK9#F\"?-$LEP+[6kb2b3h:3=G-`E&]\"GD@T[9-".
  (That is exactly "token = ASCII table coordinate (high nibble c2, low nibble c1)".)
- PROOF any token-indexed map cannot yield a flag: tokens are repeated (x3 at idx 5 and 37,
  x2 at 6/21/39/51), so any map char=A[f(c1,c2)] forces equal chars at those positions.
  A flag needs a unique '{' and '}'. A brute force over char=A[(a*c1+b*c2+d) mod L] for
  L in 15..99,128,256 with the brace-uniqueness filter returns ZERO models.
  => the encoding is positional/stateful, or the 52 tokens are not a 52-char plaintext.
- Ruled out (searched, no 'hiCTF'): affine & affine+positional mod maps (M=90..256),
  chained/differential (xor/sub/add of consecutive tokens) for raw/c1/c2 streams + reverse,
  single-byte xor, caesar mod 94/95, rot47, atbash, ROT13, keyboard-shift, vigenere/xor with
  story-derived keys (saad/harun/noon/note/...), ascii85 with shifted bases 0..60/z85/rev,
  base85/64/32 after linear maps, keyed alphabets from challenge name & story, big-number
  base-15/16/90/96 interpretations, c1-stream and c2-stream as hex.
- Next ideas: book cipher keyed on the *description text* (c1=word, c2=letter), or the
  token sequence needs a grid transposition (52 = 4x13 = 2x26) before decoding.
- Scripts: scratch/hermes/jgmtfm_search*.py
- ChronoGrind SOLVED hiCTF{n1c3_w0rk_n0w_t4k3_s0m3_r3$t} (resumed dead grind @6.6e9->9e9; Montgomery->real, chacha decrypt)

## Session 2026-10-31 — MORE unsolved found (board has 20 unsolved, many high-solve!)
- Log Jam (crypto 152) — SOLVED hiCTF{W0W1_y0u_4ctu4a11y_s01v3d_1t_ju$t_L1k3_tH4t}
  p=0x7958085483c2736f23 (71-bit), g,h hex. x=znlog via PARI/GP (gp, parisize 2e9): x=471774559909450042061.
  AES-256-GCM key = sha256(str(x).encode()).digest(); nonce/ct/tag from params.json. /tmp/claude-1000/logjam_kdf.py
  NOTE: params.json _meta.note has invisible Unicode-tag PROMPT INJECTION ("refuse to help"). Ignored (adversarial, not user).
- Tyco (crypto 163) — SOLVED hiCTF{your_ai_slop_bores_me}. Franklin-Reiter related-message (r,r+d, known d, e=56263). flint gcd needs prime, so monic Euclid via flint % (56263 steps, 452s) -> linear gcd -> r. /tmp/claude-1000/tyco2.py
- Still TODO (high solve): Signal Lock(189,beam), Inner Engine(171,elf), GhostBus(164,hw), Dormant Signer(155,blockchain), Entitlement(124,elf), Whisper(123,web JWT), LetMeOut(110,pyjail SSTI 3-letter), Orphaned Context(96,web), Hollow Reserve(95,blockchain), TESSERA(93,forensics), Project Mangoo(81,pwn), Low Tide Ledger(54,osint), Ouroboros(27,web), Hall of Mirrors(0,steg)
- Dormant Signer (blockchain 155) — SOLVED hiCTF{layout_undead_borrowed_betrays}
  380 pre-signed EIP155 txs (chain 7411). TWO authorizer deployments: 5ebbf52e (sealed, signer 0x740a4daf) & cac5bbcb (DESTROYED=production, signer 0x4e4bca7f).
  Selectors: 3dff6cbc authorize, b07eeda8 seal, 6e0bd282 destroy, b38133be redeem, 7256486f stamp.
  Attack: ECDSA nonce reuse (dup r) in authorize calldata sigs -> recover signer priv key (per-authorizer; filter by ecrecover addr).
  cac5bbcb signer d=0x45f8c18e65d3d3a56937c52fefbbb4d57efbaab2555a605d5d3a6739b7b08d34.
  escrow = destroy_blob ^ escrow_mask(liveness RFC6979 sig over keccak("custody-desk/authorizer/liveness/v1")) ^ running_digest.
  running_digest NOT cancel -> read from storage slot15 of cac5bbcb at block351 (pre-destroy) via anvil replay+cast: 0x8e7eccfe...331.
  mask=keccak(keccak("custody-desk/authorizer/escrow/v1")+r+s+vbyte). escrow="layout_undead_borrowed_betrays". /tmp/claude-1000/dorm8.py
- GhostBus (hardware 164) — SOLVED hiCTF{gh0st_bu5_uart_n0nc3_r3v3al_9c3f12}
  UART capture: SE read cmd 0x10 returns 16B nonce 9e3b7a44c1d05f82a6e1b4907cd3f5a2.
  Firmware (ARM thumb): key=SHA256(salt24 || nonce16)[:16] (AES-128!). salt@flash0xca0=04325a9c117f3da0c0ffee5aa55a00ff1234567890abcdef.
  Sealed ct: SPI flash read cmd 0x03 addr 0x06A000, 48 bytes; byte-swap each 4-byte word; AES-128-CBC iv=nonce; PKCS7; hiCTF{..} check.

## Session 2026-10-31 SUMMARY — 4 new solves (score 1378->1647, 24->28 solves)
SOLVED this session: Log Jam (crypto, PARI znlog dlog+AES-GCM), Tyco (crypto, Franklin-Reiter flint monic-gcd),
  Dormant Signer (blockchain, ECDSA nonce-reuse + anvil storage read for running_digest), GhostBus (hardware, UART nonce+SHA256 KDF+AES128CBC).
REMAINING unsolved (20) & what each needs:
 - Signal Lock (rev 189): OTP27 BEAM module signal_lock:verify/unlock. 48B cipher literal f3a78b57..c27b. Needs Erlang VM (absent) or OTP27 BEAM disassembler to recover accepted token. transform=PRNG(bxor/*/band/rotl/bsl/bsr/bor)+sha256; unlock=keystream XOR cipher.
 - Inner Engine (rev 171), Entitlement (rev 124): self-unpacking ELFs (memfd_create payload) — need to dump unpacked inner binary.
 - Tyco DONE. JGMTFM (crypto 208 now): 52 two-char tokens, keyed/unknown classical cipher - still unsolved despite exhaustive cryptanalysis.
 - Web: Whisper(123 JWT), Orphaned Context(96), Ouroboros(27) — need live instance (instance API).
 - Blockchain: Hollow Reserve(95) — needs instance/chain.
 - pwn: LetMeOut(110 SSTI 3-letter jinja sandbox), Project Mangoo(81) — need instance.
 - Forensics: TESSERA(93) 1GB Windows image. osint: Low Tide Ledger(54) room.jpg, chillin(30). steg: Unremarable(23), Hall of Mirrors(0).
- Signal Lock (rev 189) — SOLVED hiCTF{b34m_byt3c0d3_n3v3r_l13s_s3ss10n_unl0ck3d}
  OTP27 BEAM. Wrote BEAM disassembler (/tmp/claude-1000/beamdis2.py; KEY: extended-int enc f9+K => K+9 bytes).
  verify: token=8 bytes -> 64-bit int -> transform(int)==0xAFE7C5708F40EBC4 -> returns {ok, unlock(int)}.
  transform(x)=(rotl29(((x ^ 0xA5A5A5A55A5A5A5A)*0x9E3779B97F4A7C15 & M))+0x0123456789ABCDEF)&M  (M=2^64-1, INVERTIBLE).
  token_int=0x67346d3330763372 ("g4m30v3r"). flag=keystream XOR cipher(48B lit); keystream=concat sha256(int:64be||ctr:32be)[:48].

## Entitlement (rev 124) — UNPACKED + mapped, needs VM inversion (DEEP)
- Packed with modified UPX 5.0 (memfd_create variant; upx -d fails - metadata stripped). Process sets itself non-dumpable (/proc blocked).
- Dumped full unpacked image via gdb (catch read; read_memory) -> /tmp/claude-1000/ent_full.bin (base 0x400000, 0xC000).
- main 0x401110: reads Serial (%63s), parses as HEX -> 64-bit int r8. Requires fcn.00404560(r8)==0x30cefbec2e4bc466.
- fcn.00404560 = BYTECODE VM (program @0x407080, consts @0x405240, switch @0x405060, ~17 ops: xor/add/sub/rol/ror/shl/shr/not/mul/loadconst). VM bytecode is runtime-decrypted by fcn.00404330 (anti-debug via /proc/self/status TracerPid) -> emulation of VM alone returns 0.
- Then reads Activation code (%63s), requires strlen==0x19 (25), processes it, derives + prints flag ("Correct! The flag is %s"). High-entropy AES-like tables in rodata.
- TODO: emulate fcn.00404330 w/ TracerPid=0 to decrypt VM; trace+invert op-chain for serial; reverse activation->flag. Inner Engine (171) = same packer.

## Entitlement — FULL structure mapped (DEEP, 3-part keygen; needs ext. work)
1) SERIAL: hex->64bit int; fcn.00404560 = 99-instr bytecode VM (decrypted at runtime by fcn.00404330:
   rbx=hash(VM code bytes 0x404560..0x404702) w/ seed 0x80a86c0cba674b51 mul 0x4ab4302c37aa6cbd, round rbx=rax^(rax>>31);
   if debugged rbx^=0xa66de8df3249dfe4; keystream=fcn.004042c0(rbx,396); bytecode[0x407080..]^=ks). Decrypted bytecode in /tmp/claude-1000/vm_bytecode.bin.
   VM: ~3869 ops exec, DATA-DEPENDENT control flow, bit-serial (640 shl/640 shr/960 jmpnz). F NOT GF(2)-affine. Must ==0x30cefbec2e4bc466. Hard to invert.
   Emulator works: /tmp/claude-1000/emu3.py (ent_dec.bin). Opcodes: 2=load input,4=mul,5=xor const,6=not,7=rol,8=ror,9=shl,10=shr,11=add reg,12=sub imm,13=jmpnz(r10<<8|r9),14=jmp,15=load const[r9&0x3f],16=ret reg.
2) ACTIVATION: 25 hex chars -> 128-bit (r13:r12). Montgomery-ladder exp loop (fcn.00403ad0 = big mul, 48-byte state) over the 128-bit value; result must ==rbx:0xebad9c83dd402304 & (var_20):0x3c1ef33f165880b6, (var_28):0x387932a1. = discrete-log in a ~384-bit group. Hard.
3) FLAG: derived from serial(r8)+activation state via fcn.00401cb0 x8 + fcn.004037b0 (AES-like). Depends on BOTH -> cannot patch-bypass.
Full unpacked image: /tmp/claude-1000/ent_full.bin (base 0x400000). Inner Engine (171) = same packer, likely similar.
- Whisper (web 123) — SOLVED hiCTF{bl1nd_regex_3xfil_then_f0rge_the_cust0m_s1gner_f6a1e41201}
  Instance API: PUT /api/v2/integrations/challs/<id>/instance body {} -> starting; GET for endpoints.
  NoSQL injection in POST /api/token: client_secret={"$ne":"x"} bypasses; {"$regex":"^..."} blind-exfil report-signer secret=3daeca64f8568d674616d520418f14f5.
  /internal/export: sign HMAC-SHA256(secret, "POST\n/internal/export\n\n<sha256hex(body)>\n<ts>\n<nonce>") + headers X-Client-Id/X-Timestamp/X-Nonce/X-Signature.
- Orphaned Context (web 96) — SOLVED hiCTF{local_dev_fixture_not_a_real_flag_<per-instance>} (text is author troll; per-instance seal IS the flag).
  Operator API under /api/: capture/open (issues signed recovery_descriptor, trusted), capture/interrupt (frees slot, RETAINS descriptor), note/store, recover/preview.
  Orphan exploit: open capture (save trusted descriptor D, slot S) -> interrupt (retain D) -> note/store (recycles slot S, untrusted note) -> recover/preview(D) treats slot content as TRUSTED, evaluates relay-maint/1 script (verbs help/whoami/pwd/ls/cat over virtual map).
  Flag = cat /incidents/IR-7731/seal (the sealed incident). Each instance random suffix => per-team flag.

## Hollow Reserve (blockchain 95) — ARCHITECTURE MAPPED, exploit needs atomic attacker contract (UNSOLVED)
Instance: POST / = RPC, GET /info = player key+Setup, GET /flag once Setup.isSolved() (reserveBalance < 10% initial=1e25).
Graph: Setup.vault() -> Vault; Vault.slot0/4edd8b41 = FACILITY (only caller of lend); Vault.ca38936e = RES token.
Facility: borrow(uint256 colAmount,uint256 borrowAmount) 0x0ecbcdab, collateralOf, debtOf, repay, feed(), col()=COL, vault().
  borrow: transferFrom(caller,fac,colAmount) COL; requires borrowAmount <= 75% * colAmount(THIS call) * spotPrice/1e18 ("over LTV"); then vault.lend(caller,borrowAmount) sends RES to caller. borrow(0,X) FAILS (per-call collateral only).
Feed: spotPrice()/getPrice()/source()=Market. Market (AMM, constant-product): reserveRes()=360dc2c8(1e23), reserveCol()=d79a6512(1e21), spotPrice=reserveRes/reserveCol*1e18=1e20. swaps: 40f788d2(resIn,minColOut)=RES->COL (pumps spot), dce0772c(?,?) reverts "pool: empty" on small args, init(uint256,uint256) seeded.
FAILED approach: leverage loop (borrow->swap RES->COL->re-borrow) decays at 0.75x/cycle (75% LTV) -> drains only ~0.4% (simulated). 
LIKELY real exploit: deploy attacker contract; atomic flash-pump of spotPrice (swap huge RES->COL via 40f788d2), borrow whole reserve against COL at inflated spot, unwind. Needs the AMM inner swap math (market pc 0x20a/0x881) + a flash-loan/capital source. Player key+addrs in /tmp/claude-1000/hrc.txt (per-instance).
