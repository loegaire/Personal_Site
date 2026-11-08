---
title: "Notes Chillin — Field Notes"
description: "chillin!!! (OSINT, id 95b1fd8a-1b11-4179-815f-949182374807) — status: NOT SOLVED file.jpg 907x590, no EXIF, no stego/trailing data (zip == extracted, identical md5 673e0d31cb95d768dfe7371dc0a7c1ee). Yandex r…"
published: "2026-11-08"
updated: "2026-11-08"
event: "hicybercon"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "hicybercon", "Field notes", "stego"]
readingTime: 2
wordCount: 273
featured: false
sourcePath: "~/ctf/hicybercon/notes-chillin.md"
---

## chillin!!! (OSINT, id 95b1fd8a-1b11-4179-815f-949182374807) — status: NOT SOLVED
- file.jpg 907x590, no EXIF, no stego/trailing data (zip == extracted, identical md5 673e0d31cb95d768dfe7371dc0a7c1ee).
- Yandex reverse image -> entity "Petra" (Petra by Night); crop searches suggest "petra by night". Scene = huge candle-lit crowd seated in the red sandstone canyon; matches Treasury/ Al-Khazneh esplanade, Petra (Wadi Musa), Ma'an, Jordan.
- Corroborating near-identical scene photo (same event, Treasury facade lit red on right, seated crowd left, field of candles): alphauniverse.media.zestyio.com/b_krist_three.jpg (Bob Krist / Sony Alpha). Our image is NOT a crop of it (cv2 template match max 0.379).
- Not found in: 23 YouTube Petra-by-night videos (14001 frames), Cercle "Bedouin live at Petra" (6825 frames), Cercle music video, Wikimedia Commons Category:Night in Al Khazneh (27 files), Yandex/Bing similar+text results (~1600 images). Google Lens + TinEye blocked (captcha/Cloudflare).
- what3words lookup API (no key): https://mapapi.what3words.com/api/convert-to-3wa?coordinates=lat,lng&language=en&format=json ; reverse: /api/convert-to-coordinates?words=...
- Candidate triples (all with Petra_Jordan => badFlag):
  * Google "The Treasury" 30.3221392,35.4517457 -> porters.chuckling.shelled  (rejected also as WadiMusa/Wadi_Musa/case variants)
  * Google "Petra" 30.3284544,35.4443622 -> surged.ministry.ecologically
  * Google "Al-Siq" 30.3229988,35.4562042 -> trios.gargling.consulate
  * Wikipedia Al-Khazneh 30.321944,35.451389 -> motorcycle.pirouettes.soloists
  * OSM Al-Khazneh 30.3220755,35.4515251 -> imparted.distresses.hurries
  * Wikidata/ Wikipedia Petra 30.328611,35.441944 -> chorused.inglorious.counting
  * Cercle video desc 30°19'20.0"N 35°27'07.0"E (30.322222,35.451944) -> folktale.doggedly.identity
- Title hint guess: "chillin!!!" ~ w3w word "chuckling" -> Google Treasury pin cell (expected ~1 chill-word per 14k-cell grid, so weak evidence). Grid scan +-180 m around Treasury found 30 cells with chill*/chuckling/chinchilla.
- BLOCKER: submit endpoint rate-limits ~5 attempts / ~45 min (badRateLimit timeLeft up to 2687 s) -> no brute force of 3 m what3words grid; exact source photo/coordinate not identified.
- Next: find exact photo source (likely short video/IG reel of Petra by Night); then compute w3w and submit hiCTF{Petra_Jordan_<w3w>}.
