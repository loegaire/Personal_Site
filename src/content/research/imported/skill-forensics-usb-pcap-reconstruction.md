---
title: "Forensics Usb Pcap Reconstruction"
description: "Use when solving CTF forensics challenges with USB pcap/pcapng captures, HID keyboard data, scanner/printer traffic, USB bulk transfers, missing files reconstructed from bus packets, or Wireshark usbmon fiel…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Forensics"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Forensics", "Agentic Skills", "wireshark", "pcap", "memory-forensics"]
readingTime: 3
wordCount: 453
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/forensics-usb-pcap-reconstruction/SKILL.md"
---

# Forensics USB PCAP Reconstruction

## When to use

Use this skill when you see:
- `.pcap` or `.pcapng` with USB/usbmon traffic.
- Challenge text mentioning keyboard, scanner, printer, token, HID, scan codes, or captured device traffic.
- Wireshark fields such as `usb.capdata`, `usbhid.data`, URB bulk/control transfers, endpoint addresses, or device descriptors.
- Large captures where loading all packets at once is wasteful.

Do not use this skill when:
- The capture is normal Ethernet/IP without USB layers.
- The artifact is a disk image or memory dump rather than bus traffic.
- The USB traffic is only incidental and the payload is in a higher-level network stream.

## Core idea

USB captures preserve device-level transactions, not the final human artifact. Reconstruct the device class first, then decode class-specific payloads: HID scan codes for keyboards, bulk image data for scanners/printers, storage blocks for mass storage, or vendor-specific packets. Use streaming readers for large captures.

## Recognition signals

Look for:
- Device descriptors revealing class/subclass/protocol.
- Interrupt IN endpoints for HID keyboards.
- Bulk IN/OUT endpoints carrying image or print data.
- Repeated fixed-size reports with modifier bytes and key codes.
- Transfer lengths that match scanline/image chunks.
- Capture size large enough that `rdpcap()` causes memory pressure.

## Standard workflow

1. Identify devices and endpoints in Wireshark: descriptors, class, address, endpoint, direction.
2. Filter to the endpoint carrying data.
3. Export relevant fields with `tshark` or stream packets with Scapy `PcapReader`.
4. For HID keyboard, map report bytes to key codes and account for Shift/modifiers/backspace/enter.
5. For scanner/printer, group bulk payloads by transfer order and infer width, color depth, compression, or raster format.
6. Validate reconstructed bytes with `file`, `xxd`, image viewers, or entropy/length checks.
7. Search final reconstruction for flag format.

## Commands and tools

```bash
tshark -r capture.pcapng -Y 'usb' -T fields -e frame.number -e usb.device_address -e usb.endpoint_address -e usb.transfer_type -e usb.capdata | head

# HID keyboard reports.
tshark -r capture.pcapng -Y 'usbhid.data' -T fields -e usbhid.data > hid.txt

# Stream large captures instead of rdpcap().
python3 - <<'PY'
from scapy.all import PcapReader
with PcapReader("capture.pcapng") as packets:
    for pkt in packets:
        pass
PY
```

## Pitfalls

Common ways agents get this wrong:
- Treating USB packet bytes as a file without understanding the device class.
- Forgetting keyboard modifier bytes, key release reports, and layout differences.
- Loading huge captures with `rdpcap()` and exhausting memory.
- Mixing IN and OUT endpoints or multiple devices.
- Assuming Wireshark fully reassembles every segmented USB payload.

## Verification

Prove the solve path is real with:
- Endpoint/device identification.
- A decoded keystroke stream, reconstructed raster/image, or recovered file with valid magic bytes.
- A flag-format search on the reconstructed artifact.
- For large captures, a streaming script that reproduces the extraction.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| hxp CTF 2017 | drucker | forensics | A USB pcapng of scanner traffic required reconstructing the scanned paper content from device-level data. |
| hxp CTF 2017 | inception | forensics/network | Large pcap processing benefited from streaming packet readers instead of loading the whole capture into memory. |

## Sources

* https://hxp.io/ - hxp blog index entries for drucker USB scanner pcap and inception pcap analysis.
* https://blog.raw.pm/en/HXP-2017-write-ups/ - writeup notes on improving large pcap processing with `PcapReader` instead of memory-heavy `rdpcap`.
