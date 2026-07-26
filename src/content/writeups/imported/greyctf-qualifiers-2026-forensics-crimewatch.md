---
title: "Crimewatch notes"
description: "Challenge Category: Forensics, GreyCTF Qualifiers 2026. Description: silent mode Archive: crimewatch.tar.gz"
published: "2026-05-30"
updated: "2026-05-30"
event: "GreyCTF Qualifiers 2026"
category: "Forensics"
kind: "field-note"
status: "solved"
tags: ["Forensics", "GreyCTF Qualifiers 2026", "Field notes"]
readingTime: 4
wordCount: 804
featured: false
sourcePath: "~/ctf/GreyCTF Qualifiers 2026/Forensics/Crimewatch/notes.md"
---

# Crimewatch notes

## Challenge
- Category: Forensics, GreyCTF Qualifiers 2026.
- Description: `silent mode`
- Archive: `crimewatch.tar.gz`

## Archive contents
- `crimewatch/a` - 1,394,671,616 bytes
- `crimewatch/b` - 1,114,112 bytes
- `crimewatch/flag.py` - verifier/decryptor script

## Verifier behavior
- `flag.py` asks for four case reconstruction values:
  1. TeleChat supplier account/chat providing vape stock
  2. Car plate number tied to supplier import method, recoverable from deleted image/cache evidence
  3. Most recent TeleChat buyer awaiting delivery
  4. Pickup point coordinates
- Candidate normalized as `supplier.lower()|plate_no_spaces_upper|buyer_lower|coordinates_no_spaces`.
- SHA-256(candidate) is used as an AES-GCM key to decrypt the flag.
- This means the crypto is a verifier; solve path is forensic reconstruction of the four fields.

## Current plan
- `a` is the Android `/data` image and `b` is the Android `/metadata` image.
- Metadata encryption and fscrypt user keys have been recovered offline; next step is offline fscrypt traversal/extraction.
- Avoid broad binary string scans of the full image unless constrained, because encrypted/random-looking data creates noisy output.

## File triage
- `crimewatch/b`: QCOW2 v3, virtual size 18 MiB, sparse on disk (~1.1 MiB).
- Strings from `b` show Android `/metadata`, `password_slots`, `bootstat`, `userspacereboot`, SELinux labels, and `EFI PART`.
- First bytes of `crimewatch/a` also show a QCOW2 v3 header. Its header has virtual size `0x180000000` (likely 6 GiB), so it is probably the main Android disk/userdata image.
- Workspace has ~165 GiB free, so extracting `a` is acceptable.

## Android decryption progress
- Converted `crimewatch/b` to `crimewatch/b.raw` and extracted its ext4 partition. It contains `/vold/metadata_encryption/key/*`.
- The metadata keymaster blob is software-keymaster/integrity-assured. Its embedded raw AES key is:
  - `dbacce2a040330aaaf93149f74f814492bc4f41c8c78ba06ab8006ae5bb6d42c`
- AES-GCM decryption of the metadata `encrypted_key` succeeded, yielding the 64-byte metadata encryption key:
  - `56c4a4884ccca0fa0e3bffeff9769ee73ad6e58812788c8f1dce43ab106e0dcf84f34d84bcaf19e72956394686cf6eb7770fb0092276c2732722c1268f3c6c64`
- Converted `crimewatch/a` to sparse raw `crimewatch/a.raw`. AES-XTS decrypt with that 64-byte key, 4096-byte sectors, and little-endian sector tweaks produced a valid ext4 image at `crimewatch/a.dec.raw`.
- `cryptsetup`/device mapper was unavailable as non-root in this environment, so sparse offline decryption was used instead.
- `crimewatch/a.dec.raw` is an Android `/data` ext4 filesystem. Top-level names are visible, but user/app trees remain protected by fscrypt.

## fscrypt keys
- User key files were extracted from:
  - `/misc/vold/user_keys/de/0/*`
  - `/misc/vold/user_keys/ce/0/current/*`
- DE raw keymaster AES key:
  - `45cadaf97288e8f624ead1684579378251bb306991899405718ff1c64eb685e3`
- DE 64-byte fscrypt master key:
  - `2dc7feb19ed9610befce7c999d229ccdfb5c961eac24ed98577755439a90096e0ca944b76b636e1d4c7dd54e2b8eadeb03a20680694ebe7a3cc7a9cf1f4b6e9d`
- CE raw keymaster AES key:
  - `46e2882977afcc2616e6934b54dc2700220007776a80ac572335e15ccbf56673`
- CE 64-byte fscrypt master key:
  - `851556ba3dd94ab9ceda1e8b203bfb034b43f5c8a45f007dfe6e5782de5a3eba7e31778ad9de8fb68f3bffd82a106dddb4b60a8089362bc47e1f78751f1ef828`
- HKDF-SHA512 key identifiers match the fscrypt contexts:
  - DE identifier: `4122e0df1dcd92f812824223b0076b41`
  - CE identifier: `0e0cec7b7a227b0bc4acc29d13e60bf7`
- `/data` has fscrypt context identifier `0e0cec7b7a227b0bc4acc29d13e60bf7`, so app CE data uses the CE key.

## fscrypt traversal breakthrough
- `/unencrypted/key` was also recovered and matched its filesystem identifier:
  - `/unencrypted/ref`: `e049a7f28606e49863a865cef76f1baf`
  - `/unencrypted/per_boot_ref`: `45c413e051cb43af54af93cf326978f6`
  - mode: `aes-256-xts:aes-256-cts:v2`
  - raw keymaster AES key: `d12b9ffd58217e4140aa0e181cb304437d5da5d2b564c4de8fc8906d57daf700`
  - 64-byte fscrypt master key: `d67a309c818282b53e4ee0cf698726e4d82e4bc91eb35e7f4503269764ddcda41524299eba756fd418cf4fc14e70ba05404e4b04066becdfb6bbad83df325e4a`
- Important extraction detail: ext4 metadata and encrypted directory entries are read from the metadata-decrypted image `crimewatch/a.dec.raw`, but fscrypt-encrypted regular file contents must be read from the original converted image `crimewatch/a.raw`.
- This fixed earlier false decryption failures. Known-good file-content checks:
  - inode `303161` decrypts to a PNG header.
  - inode `303162` decrypts to a JPEG header.
  - inode `123501` decrypts to a SQLite History header.
  - inode `40969` decrypts to a ZIP/APK header.
- Helper script: `tools/fscrypt_ext4.py`. It now defaults file content reads to `crimewatch/a.raw` via `--cipher-image`.

## Extracted evidence
- `/media/0/Pictures/TeleChat/IMG_20260514_164900.png`:
  - inode `303161`, dumped to `/tmp/telechat.png`.
  - PNG, 1448x1086.
  - Shows a white Toyota van with plate `SG67301K`; nearby sign reads `408 Ang Mo Kio Ave 10`.
  - Current answer candidate for car plate: `SG67301K`.
- `/media/0/Pictures/TeleChat/spot.jpg`:
  - inode `303162`, dumped to `/tmp/spot.jpg`.
  - JPEG, 1280x606, no useful EXIF GPS.
  - Shows a waterfront/reservoir-like scene with forested bank and giant water lilies. Needs geolocation for coordinates rounded to 2 decimals.
- `/media/0/Download/menu.txt`:
  - inode `303167`, text: `kopi c kosong`, `chicken rice`.
- `/media/0/Documents/notes`:
  - `groceries.txt`: `eggs`, `bread`, `washing powder`.
  - `hsa_note.txt`: `HSA reminder: enforcement article mentioned the Tobacco and Vaporisers Control Act.`
  - `shift.txt`: `swap friday shift with ben if needed.`
- Chrome history from `/data/com.android.chrome/app_chrome/Default/History`:
  - `https://www.nea.gov.sg/weather`
  - `https://www.transitlink.com.sg/eservice/eguide/service_route.php?service=138`
  - `https://www.hsa.gov.sg/tobacco-regulation`
- Chrome cache contains an HSA snippet about e-vaporisers being prohibited under the Tobacco and Vaporisers Control Act.
- Media provider database confirms the TeleChat image paths and local media entries, but no GPS fields are populated.
- SMS/MMS, Bugle, Gmail, Docs, Gboard dictionary/training, and app usage databases checked so far do not reveal TeleChat messages.
- Google QuickSearch image cache includes a news-like car/police image, but no readable plate or actionable text yet.

## Remaining answers
- Supplier TeleChat account/chat.
- Most recent TeleChat buyer awaiting delivery.
- Pickup coordinates from `spot.jpg`.

## Final reconstruction
- Notification history at `system_ce/0/notification_history/notification_history.xml` preserved TeleChat notifications:
  - `2026-05-14T16:49:00+08:00`, package `com.grey.telechat`, title `@vanta_supply`, text `same SG673... import pic attached`, conversation `Vanta Supply`.
  - `2026-05-14T18:46:00+08:00`, package `com.grey.telechat`, title `jiawei`, text `im here already`, conversation `jiawei`.
  - `2026-05-13T20:11:00+08:00`, package `com.grey.telechat`, title `niko`, text `settled ytd, mint was ok`, conversation `niko`.
- People shortcuts at `system_ce/0/people/people.xml` confirm:
  - `jiawei` as a TeleChat person.
  - `Vanta Supply` with URI `telechat://user/vanta_supply`.
- Final answers:
  - supplier: `@vanta_supply`
  - plate: `SG67301K`
  - buyer: `jiawei`
  - pickup coordinates: `1.40,103.79`
- Verification command:
  - `python3 crimewatch/flag.py '@vanta_supply' SG67301K jiawei '1.40,103.79'`
- Verified flag:
  - `grey{tobacco_and_vaporisers_control_actdf269}`
