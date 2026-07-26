---
title: "CTF Notes"
description: "Challenge Name: damnida Category: rev Files / Targets: damnida Flag format: flag\\{.?\\} Started: 2026-05-07T14:37:38.637801+00:00"
published: "2026-05-07"
updated: "2026-05-07"
event: "dreamhack"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "dreamhack", "Field notes"]
readingTime: 2
wordCount: 346
featured: false
sourcePath: "~/ctf/dreamhack/damnida/notes.md"
---

# CTF Notes

## Challenge
- Name: damnida
- Category: rev
- Files / Targets: damnida
- Flag format: flag\{.*?\}
- Started: 2026-05-07T14:37:38.637801+00:00

## Confirmed Facts
- /home/thinh/ctf/dreamhack/damnida/damnida: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=fa50146f4f6518b81f0dde89f911eb5635ed7c5d, for GNU/Linux 3.2.0, not stripped

- ELF Header:
- Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
- Class:                             ELF64
- Data:                              2's complement, little endian
- Version:                           1 (current)
- OS/ABI:                            UNIX - System V
- ABI Version:                       0
- Type:                              DYN (Position-Independent Executable file)
- Machine:                           Advanced Micro Devices X86-64
- Version:                           0x1
- Entry point address:               0x20b0
- Start of program headers:          64 (bytes into file)

- RELRO:      Full RELRO
- Stack:      Canary found
- NX:         NX enabled
- PIE:        PIE enabled

## Failed Hypotheses

## Commands Tried
| Time | Command | Exit | Output File | High-Signal Summary |
|---|---|---:|---|---|

| 2026-05-07T14:37:38.644555+00:00 | `file /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/file.stdout.txt` | /home/thinh/ctf/dreamhack/damnida/damnida: ELF 64-bit LSB pi
...[truncated 70 chars]... |

| 2026-05-07T14:37:38.648479+00:00 | `sha256sum /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/sha256sum.stdout.txt` | b6a78548653d3357cf56e5bc61ae27fae974760201aa003402ba5a036a0fee8c  /home/thinh/ctf/dreamhack/damnida/damnida |

| 2026-05-07T14:37:38.661942+00:00 | `strings -a -n 4 /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/strings_ascii.stdout.txt` | Found 20 interesting strings |

| 2026-05-07T14:37:38.673398+00:00 | `strings -a -el /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/strings_utf16le.stdout.txt` | No signal |

| 2026-05-07T14:37:38.675562+00:00 | `xxd -l 512 /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/xxd.stdout.txt` | 00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............ |

| 2026-05-07T14:37:38.683888+00:00 | `readelf -h -l -S -s /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/readelf.stdout.txt` | ELF Header: |

| 2026-05-07T14:37:38.702196+00:00 | `nm -an /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/nm_symbols.stdout.txt` | Highlighted 1 control-flow or API lines |

| 2026-05-07T14:37:39.339253+00:00 | `pwn checksec --file /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/checksec.stdout.txt` | RELRO:      Full RELRO; Stack:      Canary found; NX:         NX enabled; PIE:        PIE enabled |

| 2026-05-07T14:37:39.350580+00:00 | `objdump -x /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/objdump_headers.stdout.txt` | Captured to preserve raw evidence while extracting a compact signal for the agent. |

| 2026-05-07T14:37:39.359800+00:00 | `objdump -d -M intel /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/objdump_disasm.stdout.txt` | Highlighted 5 control-flow or API lines |

| 2026-05-07T14:37:39.664782+00:00 | `capa /home/thinh/ctf/dreamhack/damnida/damnida` | 10 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/capa.stdout.txt` | Stored a compact first-pass summary while retaining the raw dump. |

| 2026-05-07T14:37:39.766792+00:00 | `rabin2 -I -zz -M /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/rabin2.stdout.txt` | r2 surfaced 5 notable symbols or strings |

| 2026-05-07T14:37:40.053984+00:00 | `r2 -q -A -c iI; izz; afl; q /home/thinh/ctf/dreamhack/damnida/damnida` | 0 | `/home/thinh/ctf/dreamhack/damnida/dumps/rev/r2.stdout.txt` | r2 surfaced 4 notable symbols or strings |

## Useful Outputs
### strings: interesting strings
```text
/lib64/ld-linux-x86-64.so.2
Correct !
Wrong!
=hD$)
==:bj
tt1=@
Z/uEH
Z/uEH
tt1=@
k=F|.
~T/H
:@K/
~T/H
lF=2
C{=MY99H
tt1=@
~T/H
/KoT
C{=MY99H3
=hD$)
```

### readelf: import highlights
```text
OS/ABI:                            UNIX - System V
```

### nm: disassembly highlights
```text
U printf@@GLIBC_2.2.5
```

### objdump: disassembly highlights
```text
2014:	ff d0                	call   rax
0000000000002060 <printf@plt>:
2060:	ff 25 52 2f 00 00    	jmp    QWORD PTR [rip+0x2f52]        # 4fb8 <printf@GLIBC_2.2.5>
20d1:	48 8d 3d 46 05 00 00 	lea    rdi,[rip+0x546]        # 261e <main>
20d8:	ff 15 02 2f 00 00    	call   QWORD PTR [rip+0x2f02]        # 4fe0 <__libc_start_main@GLIBC_2.2.5>
```

### rabin2: radare2 highlights
```text
[Main]
[Strings]
8    0x000014ff 0x000014ff 17  18   .dynstr   ascii   __libc_start_main
50   0x000048b3 0x00000183 30  31   .strtab   ascii   __libc_start_main@@GLIBC_2.2.5
58   0x00004936 0x00000206 4   5    .strtab   ascii   main
```

### r2: radare2 highlights
```text
[Strings]
8    0x000014ff 0x000014ff 17  18   .dynstr   ascii   __libc_start_main
50   0x000048b3 0x00000183 30  31   .strtab   ascii   __libc_start_main@@GLIBC_2.2.5
58   0x00004936 0x00000206 4   5    .strtab   ascii   main
```

## Current Hypothesis
* r2 surfaced 4 notable symbols or strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.

## Artifacts
