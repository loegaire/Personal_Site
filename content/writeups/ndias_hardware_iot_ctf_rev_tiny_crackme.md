Tiny crackme reverse notes
==========================

Status: not solved yet.

Binary:
- `work/kernel` is a 32-bit ARM Cortex-M ELF, Thumb entry `0x11fd1`.
- `run.sh` runs it on `qemu-system-arm -machine mps2-an385 -cpu cortex-m3`.
- Main app creates a UART task and a `ctf` task.

Input/checker:
- CTF task is at `0x132a4`.
- It prompts `Input flag: `, reads a line, then calls checker `0x131e8(input, len)`.
- The checker requires:
  - `input[0..4] == "FLAG{"`
  - `input[0x23] == '}'`, so the normal flag length is 36 chars, with 30 chars inside braces.
- Then it hashes the full entered line with ECOH-256 and compares 32 bytes.

Target digest:
```
61d28525a11e985f95083043e6b04d99a891936d7d35304fac08cfb6c079a647
```

Hash:
- Hash wrapper at `0x130c0`.
- It is ECOH-256 over B-283.
- Constants in `.rodata`:
  - `A = 1`
  - `B = 27b680ac8b8596da5a4af8a19a0303fca97fd7645309fa2a581485af6263e313b79a2f5`
  - `Gx = 5f939258db7dd90e1934f8c70b0dfec2eed25b8557eac9c80e2e198f8cdbecd86b12053`
  - `Gy = 3676854fe24141cb98fe6d4b20d02b4516ff702350eddb0826779c813f0df45be8112f4`
- `work/ecoh_model.py` agrees with `work/ecoh_ref/hash_cli` for test vectors.

Candidate checks already run with no match:
- Focused clue/Thumb/LSB/hardware generated sets.
- `work/manual_lsb_phrases.txt` 331,860 candidates.
- `work/candidates_hw2.txt` 6,614 candidates.
- `work/arm_extra.txt` 16,019,869 candidates.
- Additional semantic sets around heavy/hash/ECOH/FreeRTOS/sections/text/privileged code.

Useful verifier:
```
printf '%s\n' 'FLAG{candidate_here_30_inner_chars}' \
  | work/ecoh_ref/batch_hash_cli_fast 61d28525a11e985f95083043e6b04d99a891936d7d35304fac08cfb6c079a647
```
FLAG{L0W_L4Y3R_SK1LLS_M4Y_H3LPS_Y0U}
