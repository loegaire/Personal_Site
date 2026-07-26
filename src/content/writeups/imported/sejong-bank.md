---
title: "CTF Notes"
description: "Challenge Name: Category: Files / Targets: Flag format: Started:"
published: "2026-04-29"
updated: "2026-04-29"
event: "sejong"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "sejong", "Field notes"]
readingTime: 4
wordCount: 812
featured: false
sourcePath: "~/ctf/sejong/bank/notes.md"
---

# CTF Notes

## Challenge
- Name: 
- Category: 
- Files / Targets: 
- Flag format: 
- Started: 

## Confirmed Facts

## Failed Hypotheses

## Current Hypothesis

* 

## Next Tests

* 

## Artifacts

## Commands Tried
| Time | Command | Exit | Output File | High-Signal Summary |
|---|---:|---|---|---|
## Run 2026-04-29T18:03:07.233977+00:00 - file

## Confirmed Facts
- /home/thinh/ctf/sejong/bank/bank.exe: PE32+ executable for MS Windows 5.02 (console), x86-64 (stripped to external PDB), 10 sections

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:07.233977+00:00 | file /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/file.stdout.txt | /home/thinh/ctf/sejong/bank/bank.exe: PE32+ executable for MS Windows 5.02 (console), x86-64 (stripped to external PDB), 10 sections |

## Useful Outputs
* None

## Current Hypothesis
* /home/thinh/ctf/sejong/bank/bank.exe: PE32+ executable for MS Windows 5.02 (console), x86-64 (stripped to external PDB), 10 sections

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:03:07.239893+00:00 - sha256sum

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:07.239893+00:00 | sha256sum /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/sha256sum.stdout.txt | f396e43891e8e38825a3981503f7d57ff11101bd6693823cdf6333eb8135f8b0  /home/thinh/ctf/sejong/bank/bank.exe |

## Useful Outputs
* None

## Current Hypothesis
* f396e43891e8e38825a3981503f7d57ff11101bd6693823cdf6333eb8135f8b0  /home/thinh/ctf/sejong/bank/bank.exe

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:03:07.303294+00:00 - strings

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:07.303294+00:00 | strings -a -n 4 /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/strings_ascii.stdout.txt | Found 3 interesting strings |

## Useful Outputs
### interesting strings
```text
=.V"
=I]?
D$/L
```

## Current Hypothesis
* Found 3 interesting strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:03:07.333758+00:00 - strings

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:07.333758+00:00 | strings -a -el /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/strings_utf16le.stdout.txt | Found 20 interesting strings |

## Useful Outputs
### interesting strings
```text
#%+,6=>?@BCFGHKLPSTUWX[\]_`cdehijkrty{|}
/CYku
#'+/
#'+/37;?
#'+/37;?CGKOSW[_cgkosw
!%)-159=
#-5=G
#)/3
#'+/37;?CGKOSW[_c
#'+059=AFKOSW[_dins
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
-=Naw
`=GQ
/>Jm
"/=N[gs
#/;Ga}
O%1=IUamy
*=Jbo
#/;GS_kw
*=Yc|
```

## Current Hypothesis
* Found 20 interesting strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:03:07.334929+00:00 - xxd

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:07.334929+00:00 | xxd -l 512 /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/xxd.stdout.txt | 00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ.............. |

## Useful Outputs
* None

## Current Hypothesis
* 00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ..............

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:03:08.085829+00:00 - rabin2

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:08.085829+00:00 | rabin2 -I -zz -M /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/rabin2.stdout.txt | r2 surfaced 2 notable symbols or strings |

## Useful Outputs
### radare2 highlights
```text
[Main]
[Strings]
```

## Current Hypothesis
* r2 surfaced 2 notable symbols or strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:03:21.581694+00:00 - r2

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:03:21.581694+00:00 | r2 -q -A -c iI; izz; afl; q /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/r2.stdout.txt | r2 surfaced 1 notable symbols or strings |

## Useful Outputs
### radare2 highlights
```text
[Strings]
```

## Current Hypothesis
* r2 surfaced 1 notable symbols or strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:15:59.151186+00:00 - file

## Confirmed Facts
- /home/thinh/ctf/sejong/bank/bank.exe: PE32+ executable for MS Windows 5.02 (console), x86-64 (stripped to external PDB), 10 sections

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:15:59.151186+00:00 | file /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/file.stdout.txt | /home/thinh/ctf/sejong/bank/bank.exe: PE32+ executable for MS Windows 5.02 (console), x86-64 (stripped to external PDB), 10 sections |

## Useful Outputs
* None

## Current Hypothesis
* /home/thinh/ctf/sejong/bank/bank.exe: PE32+ executable for MS Windows 5.02 (console), x86-64 (stripped to external PDB), 10 sections

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:15:59.156897+00:00 - sha256sum

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:15:59.156897+00:00 | sha256sum /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/sha256sum.stdout.txt | f396e43891e8e38825a3981503f7d57ff11101bd6693823cdf6333eb8135f8b0  /home/thinh/ctf/sejong/bank/bank.exe |

## Useful Outputs
* None

## Current Hypothesis
* f396e43891e8e38825a3981503f7d57ff11101bd6693823cdf6333eb8135f8b0  /home/thinh/ctf/sejong/bank/bank.exe

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:15:59.218999+00:00 - strings

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:15:59.218999+00:00 | strings -a -n 4 /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/strings_ascii.stdout.txt | Found 3 interesting strings |

## Useful Outputs
### interesting strings
```text
=.V"
=I]?
D$/L
```

## Current Hypothesis
* Found 3 interesting strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:15:59.249653+00:00 - strings

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:15:59.249653+00:00 | strings -a -el /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/strings_utf16le.stdout.txt | Found 20 interesting strings |

## Useful Outputs
### interesting strings
```text
#%+,6=>?@BCFGHKLPSTUWX[\]_`cdehijkrty{|}
/CYku
#'+/
#'+/37;?
#'+/37;?CGKOSW[_cgkosw
!%)-159=
#-5=G
#)/3
#'+/37;?CGKOSW[_c
#'+059=AFKOSW[_dins
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
-=Naw
`=GQ
/>Jm
"/=N[gs
#/;Ga}
O%1=IUamy
*=Jbo
#/;GS_kw
*=Yc|
```

## Current Hypothesis
* Found 20 interesting strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:15:59.250913+00:00 - xxd

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:15:59.250913+00:00 | xxd -l 512 /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/xxd.stdout.txt | 00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ.............. |

## Useful Outputs
* None

## Current Hypothesis
* 00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ..............

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:15:59.996848+00:00 - rabin2

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:15:59.996848+00:00 | rabin2 -I -zz -M /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/rabin2.stdout.txt | r2 surfaced 2 notable symbols or strings |

## Useful Outputs
### radare2 highlights
```text
[Main]
[Strings]
```

## Current Hypothesis
* r2 surfaced 2 notable symbols or strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:16:14.698666+00:00 - r2

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:16:14.698666+00:00 | r2 -q -A -c iI; izz; afl; q /home/thinh/ctf/sejong/bank/bank.exe | 0 | /home/thinh/ctf/sejong/bank/dumps/rev/r2.stdout.txt | r2 surfaced 1 notable symbols or strings |

## Useful Outputs
### radare2 highlights
```text
[Strings]
```

## Current Hypothesis
* r2 surfaced 1 notable symbols or strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None
