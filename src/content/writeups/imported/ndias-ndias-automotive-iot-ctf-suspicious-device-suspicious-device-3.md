---
title: "Suspicious device 3 [603 pts]"
description: "Find the flag. The final flag awaits you at the very back."
published: "2026-05-15"
updated: "2026-05-15"
event: "ndias"
category: "Hardware / RF"
kind: "writeup"
status: "solved"
tags: ["Hardware / RF", "ndias", "Writeup"]
readingTime: 1
wordCount: 124
featured: false
sourcePath: "~/ctf/ndias/NDIAS Automotive/IoT CTF/Suspicious device/Suspicious device 3/README.md"
---

# Suspicious device 3 [603 pts]

**Category:** Suspicious device
**Solves:** 17

## Description
>##### English
Find the flag. The final flag awaits you at the very back.

> You need to solve "Suspicious device 2" before attempting this challenge.

##### 日本語
フラグを探してください。最奥で最後のフラグが待っています。

> この問題は、先に「Suspicious device 2」を解く必要があります。

**Hint**
* -

## Solution

Use the stage 2 database pivot to read `maintenance_users`, then SSH from the cloud container to `iot-db` as `dbmaint` with password `Maint@2026!`.

On `iot-db`, `/usr/local/bin/db_diag_report` is setgid `flagreader`. Reversing it shows it checks that a supplied path starts with `/tmp/dbdiag/`, rejects symlinks, verifies ownership, sleeps for 200 ms, then opens the same path without `O_NOFOLLOW`. Create a regular file under `/tmp/dbdiag`, start `db_diag_report` on it, and swap the file for a symlink to `/home/flagreader/flag_stage3.txt` during the sleep window.

### Flag

`FLAG{c0ngr4tul4t10ns_th1s_1s_th3_f1n4l_fl4g:)}`
