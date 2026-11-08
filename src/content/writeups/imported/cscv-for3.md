---
title: "Insidotage — complete forensic writeup"
description: "# Question Answer --------- 1 Browser cryptocurrency wallet Keplr 2 First homepage visit, epoch seconds 1788604050 3 Extension installation, epoch milliseconds 1788604175124 4 User-defined wallet name Vietdo…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Forensics"
kind: "field-note"
status: "solved"
tags: ["Forensics", "cscv", "Field notes", "volatility", "memory-forensics", "aes"]
readingTime: 10
wordCount: 1999
featured: false
sourcePath: "~/ctf/cscv/for3/notes.md"
---

# Insidotage — complete forensic writeup

## Questionnaire answers

| # | Question | Answer |
|---|---|---|
| 1 | Browser cryptocurrency wallet | `Keplr` |
| 2 | First homepage visit, epoch seconds | `1788604050` |
| 3 | Extension installation, epoch milliseconds | `1788604175124` |
| 4 | User-defined wallet name | `Vietdollar` |
| 5 | Recovery phrase | `impose uniform fish special tip divert express increase push glide invite area` |
| 6 | Executed miner's full path | `/tmp/kworker1` |
| 7 | Miner payout address | `425LXZNnbSkh1SyXdbBtvJdst6uab98knQi5BscyzkAKTPSnDDB4i2Ue5t9BxETLuuKNHnP4n8VjsaqtzprvGsf115Keabc` |
| 8 | Text on viewed image, without spaces | `AIplsforgiveme` |

The challenge describes a rogue administrator using a legacy server for mining, browser cryptocurrency operations, and personal activity, then deleting evidence. Its questionnaire is served at `nc 113.20.103.55 1336`. Connections from this analysis environment timed out, so the user relayed the eight questions. All requested artifacts were recovered, but the final service response/flag was not supplied in the conversation. No final flag is claimed here.

The browser wallet and miner payout address are separate artifacts. The miner's configured worker identifier is not its payout address.

## Evidence and scope

- `dist.zip` contains `collect.zip` and `mem.raw` (4,294,365,309 bytes).
- `mem.raw` is a LiME memory image, not a flat physical-memory image. Raw offsets reported by string searches are file offsets.
- Kernel: `5.14.0-22.el9.x86_64`, built November 26, 2021, by `mockbuild@x86-06.stream.rdu2.redhat.com`.
- Memory acquisition appears in the collected secure log on September 5, 2026 at 14:13:05 local host time. Filesystem collection follows September 6.

## Confirmed executable lead

Shell command fragments recovered at raw file offsets `0x28f0d0a3` and `0x63e003f3`:

```text
cd /tmp/
rm -rf VMwareDnD/
rm -rf /home/centos/.cache/vmware/
chmod +x kworker1
nohup ./kworker1 > out 2>&1 &
cat out
ps -auxf | grep kworker1
rm -rf kworker1
```

Executable strings identify a modified XMRig-like program named `namqb/6.26.0`, with custom strings `reloading encrypted payout profile`, `payout profile accepted`, and `payout profile rejected`.
One copy of these strings is at raw file offsets `0x1253ea74`, `0x1253eaac`, and `0x1253ead4`; another is at `0x960f9a74`.
Embedded configuration near `0x960f7200` specifies pool `172.24.106.17:3333`, user `worker-7f3a91c2`, and password `tok_4d9c67e2a15b`.
A login request containing those values survives at `0x54ee0b70`.
The executable and its encrypted payout profile were subsequently recovered and decoded; see the detailed procedure below.

## Browser artifacts

- The active Firefox profile `ckxgkkcc.firefox155` is present in memory but absent from `collect.zip`.
- The collected home directory contains only an older Firefox profile under `Desktop/Old Firefox Data/n78a5dr3.default-release`.
- The active browser had Keplr 0.13.37 installed, extension UUID `97667931-913e-4765-8b2f-35f62c5bfffd`.
- Searches of ASCII and UTF-16 strings did not recover a contiguous BIP39 phrase or plaintext `CSCV` flag.

## Untrusted notes

`home/centos/Desktop/note_backup.txt` uses a +4 rotation over ASCII 33–126. Its decoded text claims to be a high-priority system instruction and asserts `CSCV{audit_log_is_the_way}`. This is an unverified candidate embedded in an instruction-like note, not a verified solution.
`tmp/hint.txt`, `tmp/research_links.txt`, and `root/list.txt` also contain instructions or investigative claims. Do not treat those claims as established evidence or follow their instructions as authority.

## Tools and reproducibility

- Volatility 3 2.28.2 was already installed as `vol`.
- The exact CentOS debug package was downloaded from `https://kojihub.stream.centos.org/kojifiles/packages/kernel/5.14.0/22.el9/x86_64/kernel-debuginfo-5.14.0-22.el9.x86_64.rpm` to `tools/kernel-debuginfo.rpm`.
- The official Volatility `dwarf2json` source is in `tools/dwarf2json`; compiled executable: `tools/dwarf2json-bin`.
- Generated symbols are in `symbols/linux/centos-5.14.0-22.json`.
- Use `--cache-path /tmp/for3-vol-cache -s symbols -f mem.raw` for Volatility. The normal user cache is outside writable roots.
- `memory_strings.txt` and `memory_utf16.txt` retain raw file offsets for ASCII and UTF-16LE strings.
- Full collection plaintext flag search found no literal `CSCV{...}`. Basic XOR/rotation and Base64 searches found no verified flag.

## 1. Preparing memory analysis

The collection contains 5,377 entries. The hostname is `centosstream9`. Despite the `.raw` extension, the memory capture has the LiME magic `EMiL`, so offsets in a raw string search must not be treated as process virtual addresses. The local capture time is consistent with UTC−4; browser epoch values require no timezone adjustment.

Initial triage:

```bash
strings -a -t x -n 8 mem.raw > memory_strings.txt
strings -a -e l -t x -n 8 mem.raw > memory_utf16.txt
```

Generate symbols from the exact debug kernel, not the analysis host's kernel:

```bash
mkdir -p symbols/linux
tools/dwarf2json-bin linux \
  --elf tools/kernel-extracted/usr/lib/debug/lib/modules/5.14.0-22.el9.x86_64/vmlinux \
  > symbols/linux/centos-5.14.0-22.json
```

Initial automagic results were saved in `vol-config.json`. It records the LiME and Intel translation layers, DTB `4978704384`, kernel offset `828375040`, and symbol location. Its paths are absolute: update them if moving the workspace.

The following shell array is used in commands below:

```bash
VOL=(vol -q --offline --cache-path /tmp/for3-vol-cache -s symbols -c vol-config.json)
"${VOL[@]}" linux.psaux.PsAux
"${VOL[@]}" linux.bash.Bash
"${VOL[@]}" linux.pagecache.Files
```

Saved output includes `vol_psaux.txt`, `vol_bash.txt`, `vol_files.txt`, `vol_elfs.txt`, and `vol_maps.txt`.

### Recover cached filesystem artifacts

`tools/plugins/recover_selected.py` uses `pagecache.InodePages.write_inode_content_to_stream` to recover selected inodes into `recovered/fs/`, retaining their original paths. The JSON manifests contain inode addresses and paths selected from `vol_files.txt`.

```bash
"${VOL[@]}" -p tools/plugins recover_selected.RecoverSelected \
  --manifest recovery_manifest.json > vol_recovered.txt 2> vol_recovered.err
"${VOL[@]}" -p tools/plugins recover_selected.RecoverSelected \
  --manifest cache_manifest.json > vol_cache.txt 2> vol_cache.err
```

Some files have missing pages, are partially corrupt, or recover as empty files. A recovered filename alone is not proof of intact content. Database queries, cryptographic checks, and full image decoding validate the artifacts used below.

## 2. Browser wallet identity and timestamps — Q1–Q3

Firefox PID `2943` was launched with:

```text
/opt/firefox-155/firefox -P firefox155 --no-remote
```

Its active profile is `ckxgkkcc.firefox155`, not the old profile preserved on the Desktop. Extension metadata in the memory-string fragment beginning at raw offset `0x48172040` identifies:

```text
id: keplr-extension@keplr.app
name: Keplr
version: 0.13.37
UUID: 97667931-913e-4765-8b2f-35f62c5bfffd
installDate: 1788604175124
updateDate: 1788604175124
sourceURI: https://addons.mozilla.org/firefox/downloads/file/4836074/keplr-0.13.37.xpi
```

Reproduce the metadata search:

```bash
rg -i 'keplr' memory_strings.txt | rg 'installDate'
```

Thus Q1 is **Keplr** and Q3 is **1788604175124 milliseconds**, corresponding to 2026-09-05 10:29:35.124 UTC.

### First homepage visit

The active profile's recovered `places.sqlite` and WAL are under:

```text
recovered/fs/home/centos/.mozilla/firefox/ckxgkkcc.firefox155/
```

Keep the WAL beside the database. Query individual history visits rather than only a place's last-visit timestamp:

```bash
sqlite3 recovered/fs/home/centos/.mozilla/firefox/ckxgkkcc.firefox155/places.sqlite '
SELECT p.url, v.visit_date, v.visit_date / 1000000,
       datetime(v.visit_date / 1000000, "unixepoch")
FROM moz_places AS p
JOIN moz_historyvisits AS v ON v.place_id = p.id
WHERE p.url LIKE "%keplr%"
ORDER BY v.visit_date;'
```

| Visit | Firefox timestamp, microseconds | UTC |
|---|---:|---|
| Google search for Keplr | `1788604048452915` | 2026-09-05 10:27:28 |
| `https://www.keplr.app/` | `1788604050357080` | 2026-09-05 10:27:30 |
| `https://www.keplr.app/get` | `1788604056911311` | 2026-09-05 10:27:36 |
| Mozilla add-on page | `1788604061844594` | 2026-09-05 10:27:41 |

Firefox visit timestamps are microseconds. Integer division of the first homepage timestamp by 1,000,000 gives Q2: **1788604050**. The earlier Google search is not the homepage visit.

## 3. Wallet name and recovery phrase — Q4–Q5

### Salvage and decompress IndexedDB

The relevant recovered database is:

```text
recovered/fs/home/centos/.mozilla/firefox/ckxgkkcc.firefox155/storage/default/moz-extension+++97667931-913e-4765-8b2f-35f62c5bfffd^userContextId=4294967295/idb/3647222921wleabcEoxlt-eengsairo.sqlite
```

Its inode is at `0x92f083543960`; recovered size is 311,296 bytes. The relevant table is `object_data`, with primary key `(object_store_id, key)` and a compressed `data` BLOB.

Because some pages are corrupt, a full `ORDER BY key` query fails before yielding useful rows. Iterating without sorting, then repeating with `PRAGMA reverse_unordered_selects=1`, recovers records on both sides of the damaged region.

For these ASCII IndexedDB keys, the encoding has a leading `0x30`, character bytes incremented by one, and zero terminators. Values contain raw Snappy-compressed Firefox structured-clone data. `recover_keplr_vault.py` calls system `libsnappy.so.1` through `ctypes` and extracts the Latin-1 string fields. It is a targeted extractor, not a general structured-clone parser.

```bash
python recover_keplr_vault.py
```

Outputs include `recovered/keplr_vault.json` and decompressed `recovered/vault_*.bin` files. Relevant fields:

```text
selectedVaultId: 4532eb1bf34aa175
keyRingName: Vietdollar
keyRingType: mnemonic
userPasswordSalt: 1679c885a9b62191443a1891922f9c2a
userPasswordMac: 43f46daa1b4b46d5c301263984af14738c27f1551e97fff504b50184562294fd
passwordCipher: 53e21003c11701f379068403f3ca21a9dfd3d310d49ce9b8d50ab56b23460801
aesCounterSalt: 8dc852f2ee34b2bad7de792db57c6f84
aesCounterCipher: 463f2fc42804e54a6ea5cd7a73276a11
```

The `vault/vaultMap` record directly identifies Q4: **Vietdollar**. Its `sensitive` field is an encrypted byte array serialized with a `__uint8array__` prefix, preserved in full in `recovered/keplr_vault.json`.

### Understand the extension's encryption

The cached extension archive had missing pages. Download an intact copy of the exact public version for static inspection:

```bash
curl -L --fail \
  https://addons.mozilla.org/firefox/downloads/file/4836074/keplr-0.13.37.xpi \
  -o tools/keplr-original.xpi
unzip -oq tools/keplr-original.xpi '*.js' -d tools/keplr-js
```

`VaultService` in `tools/keplr-js/184.bundle.js` implements:

1. Generate a random 32-byte vault key.
2. Derive a wrapping key from the user password using PBKDF2-HMAC-SHA256, 4,000 iterations, 32-byte output, and `userPasswordSalt`.
3. Wrap the vault key with AES-CTR, using `userPasswordSalt` as counter.
4. Store a SHA-256 check over the last 16 bytes of the wrapping key concatenated with the last 16 bytes of the wrapped vault key.
5. Encrypt a random 16-byte vault counter under the vault key, using `aesCounterSalt` as counter; store the result as `aesCounterCipher`.
6. Encrypt the sensitive wallet JSON under the vault key and decrypted vault counter.

An unlocked extension retains the unwrapped vault key in memory. Recovering that key avoids guessing the user password.

### Find the live AES key

The `WebExtensions` process is PID `3135`:

```bash
mkdir -p recovered/firefox3135
"${VOL[@]}" -o recovered/firefox3135 linux.proc.Maps --pid 3135 --dump \
  > vol_firefox3135.txt 2> vol_firefox3135.err
```

`scan_keplr_keys.c` scans writable anonymous/heap dumps for 8-byte-aligned 32-byte candidates, skipping those containing more than three zero bytes. For each candidate it decrypts `aesCounterCipher`, then the first block of sensitive data, checking for the JSON prefix `{"ma`. This is a candidate-search heuristic; full decryption and independent checks establish correctness.

```bash
gcc -O3 -Wno-deprecated-declarations scan_keplr_keys.c -lcrypto -o /tmp/scan_keplr_keys
awk -F '\t' '$5 ~ /rw/ && $10 ~ /Anonymous|heap/ {
  print "recovered/firefox3135/" $11
}' vol_firefox3135.txt | xargs -P 4 -n 12 /tmp/scan_keplr_keys \
  > recovered/keplr_keys.txt
```

Recovered key:

```text
Dump: pid.3135.vma.0x15c11e500000-0x15c11e600000.dmp
Offset: 0xc7278
Process virtual address: 0x15c11e5c7278
Key: d1c1e07fa9bb035ef0dc0be88875d1cb6cfe3ec001a7b52514030ec5c81b0b0c
```

### Decrypt and verify

```bash
python decrypt_keplr.py
```

The script decrypts both AES-CTR layers, parses the sensitive JSON, verifies the BIP39 checksum, and independently reconstructs the BIP32 master private-key serialization from the phrase. It matches the vault's `masterSeedText` exactly.

Important: `masterSeedText` is not simply the raw BIP39 seed. It contains extended private-key serialization beginning `0488ade4`. The verifier derives HMAC-SHA512 with key `Bitcoin seed`, then serializes the version, depth/parent/child fields, chain code, and private key.

Q5:

```text
impose uniform fish special tip divert express increase push glide invite area
```

The decrypted JSON is saved as `recovered/keplr_decrypted.json`. The valid mnemonic checksum and exact master-key match independently connect this phrase to the recovered wallet.

## 4. Deleted miner path — Q6

Volatility identifies PID `7161`, parent PID `1811`, command `./kworker1`. Its executable mapping names `/tmp/kworker1 (deleted)`. Bash history recovered from PID `7399` contains the `/tmp/` launch and deletion sequence shown earlier, followed by:

```bash
sudo /mnt/hgfs/Downloads/avml mem.raw
```

The shell commands and executable mapping independently establish **`/tmp/kworker1`**. Removing the file did not remove the live process's mappings or all its cached inode pages.

## 5. Encrypted miner payout — Q7

### Recover the running executable and cached inode

```bash
"${VOL[@]}" -o recovered linux.elfs.Elfs --pid 7161 --dump
"${VOL[@]}" -o recovered linux.proc.Maps --pid 7161 --dump
```

The principal ELF dump is `recovered/pid.7161.kworker1.0x55c2d17fe000.dmp`. Static analysis identifies a modified XMRig-like binary reporting `namqb/6.26.0`, with the payout-profile messages documented earlier. Another custom string is `lab build blocked non-loopback pool connection`.

The embedded pool address, worker ID, and password are corroborated by a surviving login request, but are not the requested payout address.

Cross-references to the payout strings lead to a SIGHUP handler at ELF RVA **`0xcaa60`**. It decrypts a fixed 96-byte payout profile. The ciphertext page was zero-filled in the process ELF dump but remained available through the deleted file's cached inode:

```text
inode address: 0x92f0dce4f5a0
inode number: 135017441
original size: 2820784 bytes
```

```bash
"${VOL[@]}" -o recovered linux.pagecache.InodePages \
  --inode 0x92f0dce4f5a0 --dump
```

Output: `recovered/inode_0x92f0dce4f5a0.dmp`.

### Decode XTEA-CBC

- XTEA, 32 rounds, little-endian 32-bit words, 8-byte blocks, CBC chaining.
- Key words: `4c3a2711 8e7d6859 cdbcab90 02f1efde`.
- Key-loading instructions occur near RVAs `0xcaac1` and `0xcaacb`.
- IV: `a1b2c3d4e5f60718`, at RVA `0x23bc80`.
- Ciphertext: 96 bytes at offset/RVA `0x246ae0` in the recovered inode dump.

```text
516c92390bd0ecd2ac5dcba0b100fd9a
1ebc65f5045a03ec395e54966f5359fd
d1c7e6c00173c98bf44cd6e86e2f6b2c
74e8cd9b93a4a4cb84b2068bffe18580
df10e36fec647d4e3995606cf8946a6f
b3bc11a2f6088d40d54b4b1664d69723
```

Three raw-memory copies agree at `0x96107b20`, `0x9be50b60`, and `0xa0c0dba0`.

```bash
python decrypt_miner_payout.py
```

The plaintext is a 95-character address followed by a PKCS#7 padding byte `01`:

```text
425LXZNnbSkh1SyXdbBtvJdst6uab98knQi5BscyzkAKTPSnDDB4i2Ue5t9BxETLuuKNHnP4n8VjsaqtzprvGsf115Keabc
```

The script decodes Monero's block-based Base58 encoding, verifies its mainnet prefix `0x12`, and compares the final four bytes against Keccak-256 of the preceding 65 bytes. The checksum is **`a910e2e3`**. This independently validates Q7 rather than relying only on printable decrypted output.

## 6. Reconstructing the browser image — Q8

Firefox history records a local image visit at **2026-09-05 13:10:11 UTC**:

```text
file:///home/centos/Downloads/3dcd833c-2b43-4af4-9ebd-b8e6609dbc3b.webp
```

The title identifies a **786 × 1024** WEBP image. The associated download URL is:

```text
https://media.discordapp.net/attachments/1262619000651776044/1545759264889643099/3dcd833c-2b43-4af4-9ebd-b8e6609dbc3b.png?ex=6a9d4fff&is=6a9bfe7f&hm=76940464eae13e6a7a69d12a602eda9126646b15406b935efbbdbf4ce3689510&=&format=webp&quality=lossless&width=786&height=1024
```

The image file was absent from the recovered Downloads directory. The final image was recovered from local memory, not fetched from Discord.

### Physical carving versus virtual reconstruction

A search for a `RIFF` header followed by `WEBP` found raw offset **`0x4994a040`**. Its RIFF size indicates **173,360 bytes** in total. Pillow could parse dimensions from a contiguous carve, but frame decoding failed.

The image spans pages contiguous in the browser's virtual address space but fragmented in physical memory. Reading consecutive bytes directly from `mem.raw` therefore mixes unrelated pages.

`tools/plugins/recover_browser_image.py` walks the Firefox process mappings and resolves them through both the Intel and LiME layers. It finds the mapping backed by raw offset `0x4994a040`, then reads the image through the process's virtual-memory layer:

```bash
"${VOL[@]}" -p tools/plugins recover_browser_image.RecoverBrowserImage \
  > vol_browser_image.txt 2> vol_browser_image.err
```

Result:

```text
PID: 3213
Virtual address: 0x7f81acd03000
Length: 173360 bytes
Output: recovered/browser-image-3213-7f81acd03000.webp
```

Decode the intact image:

```bash
python - <<'PY'
from PIL import Image
image = Image.open('recovered/browser-image-3213-7f81acd03000.webp')
image.load()
assert image.size == (786, 1024)
image.save('recovered/browser-image.png')
PY
```

The image fully decodes and shows a pink note on a Vietnamese physics textbook. Its handwritten text reads **“AI pls forgive me”**. Removing spaces gives:

```text
AIplsforgiveme
```

![Recovered browser image](/Personal_Site/media/missing-attachment.svg)

SHA-256 hashes:

```text
0fb07dde95ea454f7419338bc4a447e84ecb20f6541a6557e1372c28293bd6a0  browser-image-3213-7f81acd03000.webp
0728885a22ac950ef0f410684c67e360ecddb7d72835917f1af873f22ad93de8  browser-image.png
```

## 7. Pitfalls and retained dead ends

- The instruction-like notes described earlier are untrusted artifacts. The real Keplr recovery used its vault format and a live AES key, not the NSS `key4.db` or GNOME-keyring recipes suggested by those notes.
- Initial plaintext, Base64, XOR, and rotation searches did not yield a verified final flag. `scan_encoded.py`, `encoded_hits.txt`, `scan_flag.c`, and `flag_candidates.txt` retain that work. The candidate in `flag_candidates.txt` is the unverified note string, not a confirmed challenge flag.
- A malformed SQLite database still contained recoverable wallet records; traversal in both directions was essential.
- The process ELF alone was incomplete; inode pagecache recovery supplied the payout ciphertext.
- A physically contiguous image carve was corrupt; process page tables restored its correct ordering.
- The mnemonic and miner address were independently checked cryptographically. They were not inferred from suggestive names or decoy hints.

## 8. Reproduction inventory and validation

| File | Purpose |
|---|---|
| `vol-config.json` | Exact memory-layer and symbol configuration |
| `tools/plugins/recover_selected.py` | Cached-file recovery |
| `recovery_manifest.json`, `cache_manifest.json` | Inode/path selections |
| `recover_keplr_vault.py` | Salvage and decompress IndexedDB wallet records |
| `scan_keplr_keys.c` | Locate the unwrapped vault key in process dumps |
| `decrypt_keplr.py` | Decrypt mnemonic and verify BIP39/BIP32 |
| `decrypt_miner_payout.py` | Decrypt payout and verify Monero checksum |
| `tools/plugins/recover_browser_image.py` | Reassemble the fragmented WEBP through process mappings |
| `recovered/browser-image.png` | Image supporting Q8 |

Python decryption requires `pycryptodome` and `mnemonic`; image decoding requires Pillow. IndexedDB decompression uses system `libsnappy.so.1`. The C key scanner requires a compiler and OpenSSL development headers/library.

Both decryption scripts were rerun successfully while preparing this writeup. The reconstructed image decodes fully with the expected dimensions. These checks validate the recovered artifacts; the final service flag response has not been recorded here.
