---
title: "cruXipher CTF - tqt37072006@gmail.com"
description: "Login via CTFd /login with CSRF nonce; API needs CSRF-Token header (from /challenges csrfNonce)."
published: "2026-11-08"
updated: "2026-11-08"
event: "crux"
category: "Forensics"
kind: "field-note"
status: "solved"
tags: ["Forensics", "crux", "Field notes", "pcap"]
readingTime: 2
wordCount: 319
featured: false
sourcePath: "~/ctf/crux/notes.md"
---

# cruXipher CTF - tqt37072006@gmail.com

Login via CTFd /login with CSRF nonce; API needs CSRF-Token header (from /challenges csrfNonce).

## Flags / progress
- [x] 3 what-did-you-compress (100): cruXipher{m3ss3d_up_compXsion}
    custom LZW: LSB-first bit packing, width 10 start, LSB-value codes, reset=256 end=257,
    literals 0..255 = Fisher-Yates shuffle of 0..255 seeded xorshift32(13,17,5) seed=0x0745B6
- [x] 7 JYU (50): cruXipher{v1m_netw0rk_c4ptur3}
    pcap of vim session; client keystrokes in Dvorak layout; convert Dvorak->QWERTY.
    Final buffer: jpgQcld.p?k1m{b.y,0pt{j4lygp3+
- [ ] 6 Wait For It (50)
- [ ] 2 PDF Prince (100)
- [ ] 10 Paper CPU (100)
- [ ] 11 t2f-program (50)
- [ ] 1 house-music (100)
- [ ] 14 boxy proxy (500)

## Notes
- Attachments in artifacts/; scripts in scratch/.

## Challenge 6 - Wait For It (SOLVED)
Flag: cruXipher{T1M1NG_1S_3V3RYTH1NG}
- IRC PRIVMSG timing = Morse. #ctf bot: mark runs of continuous ~10ms messages = dots (~70ms/7 msgs) or dashes (~210ms/21 msgs); silences = gaps: ~100ms intra-element, ~300ms inter-character, ~2043ms end-of-message.
- Decoded #ctf: "T1M1NG_1S_3V3RYTH1NG_" repeated (2043ms end gap between repeats).
- #offtopic bot decodes to "NICE TRY" (decoy); fake flags in message text were decoys.
- Decoder: scratch/morse_timing.py.

## Challenge 11 - t2f-program (SOLVED)
Flag: cruXipher{sighunzips}
- ZIP flag.txt deflate: dynamic header lengths over-subscribed (Kraft 1+1/256); canonical decode consumes all 121532 bytes -> 131074 printable bytes (`artifacts/t2f/full_oversub.bin`).
- Text is uniform random filler over 84-symbol alphabet A = printable 32..125 minus {X,c,d,e,h,i,p,q,r,u,{}; the 10 rare symbols occur only in one 20-byte cluster at offset 65525: `cpqXhiedprshgeqnzhis}`.
- 9-bit canonical codes 502..510 = rare symbols; cluster prefix 10 rare chars `cpqXhiedpr` maps to `cruXipher{` (repeat pattern p/p vs r/r consistent).
- Substituting rare labels (c->c,p->r,q->u,X->X,h->i,i->p,e->h,d->e,r->{) across offset 65525.. gives `cruXipher{sighunzips}`; CRC32 of patched 131072-byte text = 0xcce1c38d = ZIP CRC (match confirms plaintext).
- Tail bits `111111111` = EOB code 511 misdecoded as 'u' (over-subscribed table); true text length 131072.
- Decoder: scratch/t2f_inflate.py; patched text reconstructable from full_oversub.bin + substitution.

## Status 2026-10-23
Solvable remaining: 2 PDF Prince (100), 1 house-music (100), 14 boxy proxy (500). (10 Paper CPU shows solved_by_me via API.)
