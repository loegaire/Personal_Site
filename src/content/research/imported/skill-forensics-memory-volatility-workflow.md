---
title: "Forensics Memory Volatility Workflow"
description: "Use when solving CTF forensics challenges with Windows/Linux memory dumps, Volatility 2/3, process trees, command history, injected code, registry hives, browser secrets, filescan/dumpfiles, or credential ex…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Forensics"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Forensics", "Agentic Skills", "volatility", "memory-forensics"]
readingTime: 2
wordCount: 312
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/forensics-memory-volatility-workflow/SKILL.md"
---

# Forensics Memory Volatility Workflow

## When to use

Use this skill when you see:
- `.raw`, `.mem`, `.vmem`, hibernation, LiME, or crash dump artifacts
- need process, network, registry, clipboard, command history, injected memory, or dumped files
- challenge tags include volatility or memory

Do not use this skill when:
- artifact is only a filesystem image
- network capture has no memory dump component

## Core idea

Start with image/profile identification, then build a timeline of processes, commands, network connections, files, and injected regions. Dump only candidate objects after narrowing by process and artifact type.

## Recognition signals

Look for:
- Volatility profile/kernel symbols needed
- suspicious `cmd.exe`, PowerShell, browser, archive, or malware process
- deleted files recoverable through memory
- registry/user hive artifacts

## Standard workflow

1. Identify OS/profile with `imageinfo` or Volatility 3 automagic.
2. List processes, parent/child relationships, and command lines.
3. Check network sockets, handles, filescan, consoles, clipboard, and environment.
4. Search strings/YARA for flag format, paths, keys, and URLs.
5. Dump suspicious process memory or file objects.
6. Use registry/browser plugins only after identifying user context.
7. Record exact plugin output and dumped file hashes.

## Commands and tools

```bash
vol -f dump.raw windows.info
vol -f dump.raw windows.pslist
vol -f dump.raw windows.cmdline
vol -f dump.raw windows.filescan | rg -i 'flag|zip|txt|key'
strings dump.raw | rg -i 'flag\{|ctf\{'
```

## Pitfalls

Common ways agents get this wrong:
- Using Volatility 2 profiles blindly on Volatility 3 dumps.
- Dumping everything before narrowing candidates.
- Ignoring command-line and console history.
- Missing UTF-16 strings in Windows memory.

## Verification

Prove the solve path is real with:
- profile/OS identified
- artifact source process/path recorded
- dumped file or plaintext contains expected verifier/flag format

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| FwordCTF 2020 | Memory series | forensics | Multiple memory tasks followed process/file/Volatility plugin triage. |
| InCTF 2019 | Just Do It | forensics | Memory artifacts required focused plugin use and extraction. |
| InCTF 2019 | Notch It Up | forensics | Memory dump workflow recovered challenge data from process artifacts. |

## Sources

* https://hec-ker.tistory.com/191 - source used for reusable technique extraction.
* https://blog.bi0s.in/2019/09/24/Forensics/InCTFi19-JustDoIt/ - source used for reusable technique extraction.
* https://blog.bi0s.in/2019/09/24/Forensics/InCTFi19-NotchItUp/ - source used for reusable technique extraction.
