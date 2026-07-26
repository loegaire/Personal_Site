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
readingTime: 3
wordCount: 453
featured: false
sourcePath: "~/ctf/sejong/bank/results/notes.md"
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
## Run 2026-04-29T18:14:21.624002+00:00 - file

## Confirmed Facts
- /home/thinh/ctf/sejong/bank/results/bank.exe: cannot open `/home/thinh/ctf/sejong/bank/results/bank.exe' (No such file or directory)

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.624002+00:00 | file /home/thinh/ctf/sejong/bank/results/bank.exe | 0 | /home/thinh/ctf/sejong/bank/results/dumps/rev/file.stdout.txt | /home/thinh/ctf/sejong/bank/results/bank.exe: cannot open `/home/thinh/ctf/sejong/bank/results/bank.exe' (No such file or directory) |

## Useful Outputs
* None

## Current Hypothesis
* /home/thinh/ctf/sejong/bank/results/bank.exe: cannot open `/home/thinh/ctf/sejong/bank/results/bank.exe' (No such file or directory)

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:14:21.627955+00:00 - sha256sum

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.627955+00:00 | sha256sum /home/thinh/ctf/sejong/bank/results/bank.exe | 1 | /home/thinh/ctf/sejong/bank/results/dumps/rev/sha256sum.stdout.txt | Captured to preserve raw evidence while extracting a compact signal for the agent. |

## Useful Outputs
* None

## Current Hypothesis
* Captured to preserve raw evidence while extracting a compact signal for the agent.

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:14:21.631227+00:00 - strings

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.631227+00:00 | strings -a -n 4 /home/thinh/ctf/sejong/bank/results/bank.exe | 1 | /home/thinh/ctf/sejong/bank/results/dumps/rev/strings_ascii.stdout.txt | Found 1 interesting strings |

## Useful Outputs
### interesting strings
```text
strings: '/home/thinh/ctf/sejong/bank/results/bank.exe': No such file
```

## Current Hypothesis
* Found 1 interesting strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:14:21.632389+00:00 - strings

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.632389+00:00 | strings -a -el /home/thinh/ctf/sejong/bank/results/bank.exe | 1 | /home/thinh/ctf/sejong/bank/results/dumps/rev/strings_utf16le.stdout.txt | Found 1 interesting strings |

## Useful Outputs
### interesting strings
```text
strings: '/home/thinh/ctf/sejong/bank/results/bank.exe': No such file
```

## Current Hypothesis
* Found 1 interesting strings

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:14:21.633536+00:00 - xxd

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.633536+00:00 | xxd -l 512 /home/thinh/ctf/sejong/bank/results/bank.exe | 2 | /home/thinh/ctf/sejong/bank/results/dumps/rev/xxd.stdout.txt | Captured to preserve raw evidence while extracting a compact signal for the agent. |

## Useful Outputs
* None

## Current Hypothesis
* Captured to preserve raw evidence while extracting a compact signal for the agent.

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:14:21.652559+00:00 - rabin2

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.652559+00:00 | rabin2 -I -zz -M /home/thinh/ctf/sejong/bank/results/bank.exe | 1 | /home/thinh/ctf/sejong/bank/results/dumps/rev/rabin2.stdout.txt | Captured to preserve raw evidence while extracting a compact signal for the agent. |

## Useful Outputs
* None

## Current Hypothesis
* Captured to preserve raw evidence while extracting a compact signal for the agent.

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None

## Run 2026-04-29T18:14:21.670459+00:00 - r2

## Confirmed Facts
- None yet

## Failed Hypotheses
- None yet

## Commands Tried
| 2026-04-29T18:14:21.670459+00:00 | r2 -q -A -c iI; izz; afl; q /home/thinh/ctf/sejong/bank/results/bank.exe | 1 | /home/thinh/ctf/sejong/bank/results/dumps/rev/r2.stdout.txt | Captured to preserve raw evidence while extracting a compact signal for the agent. |

## Useful Outputs
* None

## Current Hypothesis
* Captured to preserve raw evidence while extracting a compact signal for the agent.

## Next Tests
* Continue with the next highest-signal tool or manual inspection.


## Artifacts
* None
