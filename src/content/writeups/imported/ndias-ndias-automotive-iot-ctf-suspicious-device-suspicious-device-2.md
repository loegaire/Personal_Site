---
title: "Suspicious device 2 [542 pts]"
description: "Find the flag. Let\\s go further in."
published: "2026-05-15"
updated: "2026-05-15"
event: "ndias"
category: "Hardware / RF"
kind: "writeup"
status: "solved"
tags: ["Hardware / RF", "ndias", "Writeup"]
readingTime: 1
wordCount: 88
featured: false
sourcePath: "~/ctf/ndias/NDIAS Automotive/IoT CTF/Suspicious device/Suspicious device 2/README.md"
---

# Suspicious device 2 [542 pts]

**Category:** Suspicious device
**Solves:** 19

## Description
>##### English
Find the flag. Let\s go further in.

> You need to solve "Suspicious device 1" before attempting this challenge.

##### 日本語
フラグを探してください。更に奥へと進んでみましょう。

> この問題は、先に「Suspicious device 1」を解く必要があります。

**Hint**
* -

## Solution

From the stage 1 `DEBUG_EXEC` shell, read `/app/tools/query_db.py` and `/app/db.py`. The read-only PostgreSQL credentials are `iot_ro:ro-4b6d0f9a-stage2` for database `iot_cloud` on host `iot-db`.

Query the database schema through `/app/tools/query_db.py`; the `public.flag` table contains the stage 2 flag. The same database also exposes the next pivot credentials in `maintenance_users`.

### Flag

`FLAG{SQL_qu3ry_4t_r3m0t3_1s_d1ff1cult:(}`
