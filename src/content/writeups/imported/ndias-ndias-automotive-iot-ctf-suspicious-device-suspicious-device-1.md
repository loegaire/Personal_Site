---
title: "Suspicious device 1 [428 pts]"
description: "We dumped an SD card that was inserted into an IoT device. Analyze this image and uncover what the device was communicating, as well as the hidden mystery behind it."
published: "2026-05-15"
updated: "2026-05-15"
event: "ndias"
category: "Hardware / RF"
kind: "writeup"
status: "solved"
tags: ["Hardware / RF", "ndias", "Writeup"]
readingTime: 1
wordCount: 103
featured: false
sourcePath: "~/ctf/ndias/NDIAS Automotive/IoT CTF/Suspicious device/Suspicious device 1/README.md"
---

# Suspicious device 1 [428 pts]

**Category:** Suspicious device
**Solves:** 23

## Description
>##### English
We dumped an SD card that was inserted into an IoT device.
Analyze this image and uncover what the device was communicating, as well as the hidden mystery behind it.

##### 日本語
あるIoTデバイスに刺さっていたSDカードをダンプしました。
このイメージを分析し、デバイスが何を通信しているのか、隠された謎を解き明かしてください。

**Hint**
* -

## Solution

Extract `sdcard.img` from `dist-suspicious_device.zip`, split the MBR partitions, and inspect the ext4 rootfs. The root shell history points to `/usr/bin/iot-agent --debug-proto`; reversing `/usr/bin/iot-agent` recovers the IOT1 packet format, device id `dev-7f3a91c2`, and debug token `dbg-9b7c4a1e-prod-only`.

Use command `0x7f` (`DEBUG_EXEC`) against `iot-cloud.ctf.ndias.jp:13337` with the recovered token, then read `/flag_stage1.txt` from the cloud container.

### Flag

`FLAG{cl0ud_g4t3w4y_c0mpr0m1s3d}`
