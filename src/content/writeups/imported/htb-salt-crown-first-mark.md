---
title: "First Mark — Field Notes"
description: "Confirmed facts Artifact: extracted/first-mark.elf, stripped 32-bit little-endian RV32IM/Zmmul bare-metal ELF. It uses the custom RISC-V opcode spaces custom-0 (0x0b) and custom-1 (0x2b), so stock objdump an…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "HTB", "Field notes"]
readingTime: 5
wordCount: 944
featured: false
sourcePath: "~/ctf/HTB/salt_crown/first_mark/notes.md"
---

## First Mark

### Confirmed facts
- Artifact: `extracted/first-mark.elf`, stripped 32-bit little-endian RV32IM/Zmmul bare-metal ELF.
- It uses the custom RISC-V opcode spaces `custom-0` (`0x0b`) and `custom-1` (`0x2b`), so stock objdump and QEMU cannot decode/execute four instructions.
- The validation loop runs exactly 16 iterations. Each iteration applies three custom transforms to one byte, then a fourth custom instruction compares the result with a 16-byte target table and rejects on mismatch.
- Tables: rotation-like values at `0x200001f4`, small operands at `0x20000204`, targets at `0x20000214`.
- `0x00b5050b` has the same encoding as the VexRiscv AES encrypt-round operation with byte select 0, but this is not proof that the target uses that implementation: RISC-V reserves this opcode space for implementation-defined instructions.
- The other three custom encodings have no matching public implementation. The ELF supplies no instruction semantics, input mechanism, custom ISA tag, trap handler, or runner.
- QEMU reaches the memory-mapped UART polling loop at `0x10000000`; it cannot execute the custom instructions.
- ELF load segment ends at `0x20000234`; the program copies 16 bytes beginning there to `0x80000000` before validation. Its load-memory data source is unusual and needs confirmation in the intended runner.

### Commands tried / ruled out
- Stock `riscv64-linux-gnu-objdump`, radare2, and Capstone report the four custom instructions as unknown.
- `qemu-riscv32` is not a usable verifier because the bare-metal UART model is absent and the custom opcodes raise illegal-instruction faults.
- Public exact-string and opcode searches did not find a challenge writeup or an ISA definition.

### Current state / required artifact
- The nearby 16-byte phrase ` keep your steel` is not a verified preimage and must be treated as a decoy or an incomplete clue.
- Bounded searches across common byte and 32-bit AES/rotation/arithmetic/S-box models did not map an `HTB{` prefix or a readable 16-byte preimage to the target table.
- Required next artifact: the challenge description/hint that defines the four marks, or the intended emulator/remote endpoint. Without custom instruction semantics, infinitely many functions satisfy the observed table and no unique flag can be derived from the ELF alone.

### Rejected hypothesis
- The trailing phrase ` keep your steel` is not sufficient evidence for a flag. The normalized candidate `HTB{keep_your_steel}` was rejected and must not be used.
2026-07-24 continuation:
- Ran `scratch/dsl_flag_search.py`: no candidate under the operand-consistent common byte-transform set with `HTB{...}` framing. This rules out that defined model only; it does not establish custom instruction semantics.
- Exact prompt/title/trailing-string web searches returned no challenge source or writeup. `grep.app` rate-limited; GitHub code search requires authentication. No local duplicate artifact/source was found below `/home/thinh/ctf`.
- Corrected loader-layout interpretation: ` keep your steel` occupies `.rodata` at `0x20000224..0x20000233`; the startup copy begins at `0x20000234`, immediately after that string. It is not the copied input image or a known plaintext test vector. All phrase-to-target model tests are therefore non-evidentiary and must not be used to infer instruction semantics.
- Corrected a critical dataflow reading: `a2` is initialized to `0xa5` before the loop, then `mv a2,a0` after the third custom opcode. Thus custom instruction 3 receives `0xa5` on byte 0 and the previous transformed byte thereafter; it is feedback state, not a fixed per-byte mask.
- Chained direct tests against the 16-byte post-image found no exact model among rotate/ARX, bitwise, modular multiply, AES S-box, CRC-8 feedback, or generalized reverse/OR-combine (`grev`/`gorc`) semantics. These are rejected models, not evidence that the trailing phrase is or is not the expected input.
- The `CUSTOM-0` opcode pair with funct3 0/1 resembles historical RISC-V bitmanip grouping, but no documented encoding ties these exact custom opcodes to `grev`/`gorc`; do not assume that semantics.
- Retrieved the historical RISC-V Bitmanip 0.37 draft and its opcode table. It uses ordinary `OP` encodings, not `CUSTOM-0`/`CUSTOM-1`, so it cannot be the direct decoder for this ELF. The table shape still makes `grev`/`gorc` a plausible first-stage family, but that remains a hypothesis.
- Retrieved the RISC-V Crypto v0.5 source. Its old scalar-crypto form gives a tempting exact decode for custom0 funct3 0/1 (`saes32.encs`, byte selects 0/1) and custom1 funct7 0 (`ssm4.ed`). It is not the challenge semantics: with the supplied registers, `ssm4.ed` produces nonzero high bytes for every chained state while the target entries are zero-extended bytes; its low-byte behavior also fails the fixed `HTB{` prefix. The custom1 funct7 1 collision is `ssm4.ks rd=x0`, which cannot validate anything. This is a deliberate encoding collision/false lead, not a solver.
- Ran a prefix-constrained byte-local search: 67 transforms for each of the first two stages and 646 feedback transforms, covering bit permutations, bit deposit/extract, carry-less and GF multiply, AES/SM4 S-box forms, fixed/state rotations, and all direct/reflected CRC-8 polynomials. No model maps `HTB{` to the first four target bytes.
- Verified the ELF loader layout. The source address `0x20000234` is the load-memory address (`p_paddr`) of the 16-byte, zero-file-size BSS segment; it is not a hidden flag region. In the raw ELF it is followed by `.riscv.attributes` (`A)\0\0\0riscv...`), but that section is non-loadable. The program needs an externally supplied/preimage value at that physical address under its intended runner.
- VexRiscv/Betrusted source makes the AES collision narrower: its AES plugin only decodes custom0 funct3=0, so it cannot execute the second custom0 or either custom1 word. It is not a compatible runner. Public 2026 event-mirror search found no matching artifact/source.
- Tested RV32-wide variants of the standard arithmetic/bitmanip family and CRC32/CRC32C byte-update recurrences (direct and reflected, every output-byte lane): no `HTB{` prefix model. The early XBitmanip temporary-custom encoding is another collision (`custom0/funct7=0/funct3=0` is `clz`) but leaves the other three words undefined.
- Conclusive artifact limitation: `CUSTOM-0` and `CUSTOM-1` are architecturally implementation-defined. The ELF's RISC-V attributes advertise only `rv32i_m_zmmul`, and it embeds no trap handler, opcode decoder, or compatible runner. Known public decode maps are mutually incompatible and fail the target relation. A non-guessed flag now requires the intended runner/Docker image or the custom-op definition; arbitrary functions can otherwise map any chosen 16-byte candidate to the target table.
