---
title: "Mobile Android Apk Reversing"
description: "Use when solving CTF mobile or reverse challenges with Android APKs, DEX/Smali, JADX, apktool, native JNI libraries, Frida, emulator instrumentation, obfuscated Java/Kotlin, or APK signing/repacking. Do not…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Mobile"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Mobile", "Agentic Skills", "ghidra", "frida", "android", "aes"]
readingTime: 2
wordCount: 319
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/mobile-android-apk-reversing/SKILL.md"
---

# Mobile Android APK Reversing

## When to use

Use this skill when you see:
- APK/AAB files, DEX, Smali, AndroidManifest
- JADX shows flag checks, crypto, or network endpoints
- native `.so` libraries loaded through JNI
- need Frida/emulator hooks or patched APK

Do not use this skill when:
- artifact is iOS IPA/Mach-O only
- binary is a normal Linux ELF without Android runtime

## Core idea

Split the APK into manifest, Java/Kotlin bytecode, resources, and native libraries. Recover the validation path statically first; use Frida or Smali patching only when runtime state, anti-debugging, or native code blocks static recovery.

## Recognition signals

Look for:
- `classes.dex`, `AndroidManifest.xml`, `lib/*/*.so`
- `System.loadLibrary`, `native` methods, JNI names
- Base64/AES/XOR constants in resources or code
- root/debug/emulator checks

## Standard workflow

1. Inspect manifest activities, permissions, and entry points.
2. Open with JADX for high-level flow and strings.
3. Use apktool for resources and Smali patches.
4. Trace native methods to `.so` exports with `nm`/Ghidra.
5. Hook Java and JNI methods with Frida when inputs/outputs are easier at runtime.
6. Repack/sign only after proving the patch locally.
7. Search assets/resources for hidden files before reversing deep code.

## Commands and tools

```bash
file app.apk
jadx -d jadx-out app.apk
apktool d app.apk -o apk-out
rg -n 'flag|ctf|loadLibrary|native|Base64|AES|XOR|check' jadx-out apk-out
frida-ps -Uai
```

## Pitfalls

Common ways agents get this wrong:
- Ignoring resources/assets while focusing only on code.
- Missing native JNI checks behind harmless Java wrappers.
- Patching Smali without reinstalling a signed APK.
- Forgetting Android string encodings and resource indirection.

## Verification

Prove the solve path is real with:
- recovered input passes app check
- hook logs prove transformed values
- patched APK or local solver reproduces flag check

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| Hack.lu CTF 2020 | flagdroid | mobile | Android static reversing of app logic and resources. |
| Google CTF 2020 | Android | mobile | APK reversing combined Java and native analysis. |
| NahamCon CTF 2022 | Click Me! | mobile | Android app workflow around UI/reverse instrumentation. |

## Sources

* https://github.com/klassiker/ctf-writeups/blob/master/2020/hacklu/flagdroid.md - source used for reusable technique extraction.
* https://github.com/NicolaiSoeborg/ctf-writeups/tree/master/2020/Google%20CTF%202020/Android - source used for reusable technique extraction.
* https://nburns.tech/docs/CTFs/NahamCon_2022/Mobile/Click_me - source used for reusable technique extraction.
