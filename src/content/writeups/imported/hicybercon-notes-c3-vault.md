---
title: "C3 Vault (Hardware, 37ad0ee5) — WORKER (hicybercon-5b)"
description: "Done: recovered enrollment credentials efuseread.bin BLOCK4/KEY0 = XTS flash key (bytes 0x70-0x8f): a60e11f7e712272a9cdf3d656ad89282e861dc0ffd2fc127f7f74da513654d7f KEY MUST BE REVERSED for flash decrypt. Fl…"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "hicybercon", "Field notes"]
readingTime: 2
wordCount: 263
featured: false
sourcePath: "~/ctf/hicybercon/notes-c3-vault.md"
---

# C3 Vault (Hardware, 37ad0ee5) — WORKER (hicybercon-5b)
ESP32-C3 flash + efuse recovery. Flag only on LIVE service (need host:port from challenge page).

## Done: recovered enrollment credentials
- efuse_read.bin BLOCK4/KEY0 = XTS flash key (bytes 0x70-0x8f): a60e11f7e712272a9cdf3d656ad89282e861dc0ffd2fc127f7f74da513654d7f
  KEY MUST BE REVERSED for flash decrypt.
- Flash decrypt: `python3 -m espsecure decrypt-flash-data -x -k <rev_key> -a 0 -o flash_dec.bin flash_image.bin`
  (verified: PT table @0x8000 AA50, app @0x10000 E9). scratch/flash_dec_r.bin
- Partitions: nvs @0x9000/0x6000, nvs_keys @0xf000/0x1000 (FLASH-ENCRYPTED), factory @0x10000.
- nvs_keys (from DECRYPTED flash @0xf000): eky=7b915b80a7d169eb49edbe733e5a97540720264227dd39b872244ed1de0c1d86
  tky=7b160cece5a3c8ef9a4e4b47636c5abbccde5838828603f845cc6640a838de76  crc OK (zlib.crc32(keys,0xffffffff)).
- NVS data @0x9000 is NVS-layer XTS (NOT flash-encrypted → use ORIGINAL flash_image.bin).
  Page hdr+bitmap (first 64B/page) plaintext; entries (off 64+, each 32B) XTS key=eky||tky tweak=partition-rel offset LE16.
  scratch/nvs_final.bin, parser recovers:

## CREDENTIALS
- gateway/hostname = "c3-vault-gw"
- gateway/device_id = ee0315f3953aad298d7f3f43973ad618 (16B)
- gateway/generation = 7
- vault_v1/seed = d857200f87a1728b5220a4d77c31d7d9ee9bf8992ad16dbb398d05844676aa4f  (STALE ns, per recovery.txt hint)
- vault_v2/seed = 826e4e9e65c0ce89f413b7c291bb7e84185c64d4ec8769805227253b985083c5

## TODO
- App id string "C3VAULT-AUTH-V2". Reverse auth protocol (HELP transport syntax) in factory app @0x10000.
- Need live HOST:PORT (not in challenge desc text pulled). Then authenticate as gateway to get flag.

## PROTOCOL FULLY REVERSED (factory app seg3 @0x42000020)
fcn.42004a00 (derive) + fcn.42004888 (respond); HMAC-SHA256 helper @0x4200c0c4.
- device_key = HMAC-SHA256(key=seed_v2, msg = b"c3-vault/device-key/v2\x00" + device_id(16) + u32le(generation=7))   [info len 43]
- response   = HMAC-SHA256(key=device_key, msg = b"C3VAULT-AUTH-V2\x00" + challenge(32) + device_id(16))              [msg len 64]
- send: "AUTH <response 64hex>"  (banner: "C3 Vault enrollment v2; console AUTH <64 hex>; SHA-256")
- device_key(v2,gen7)=3783807e8cd41e83a331f5cfe6050e8b5b21d70cd6ddcd26c405816fb094f444
- vault_v1 seed is the STALE decoy (don't use).

## STATUS: solve ready, BLOCKED on live endpoint.
challenges/c3-vault/solve.py HOST PORT  -> reads challenge, sends AUTH, grabs hiCTF{}.
Endpoint host:port NOT in rCTF API (files empty, desc has none). Need it from challenge page UI / instancer.
