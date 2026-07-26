---
title: "Rev — Field Notes"
description: "artifacts/recoverhttp/packet-summary.txt artifacts/recoverhttp/streams/.map artifacts/recoverhttp/streams/.txt artifacts/recoverhttp/gzip/candidates.txt"
published: "2026-05-24"
updated: "2026-05-24"
event: "defcon"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "defcon", "Field notes"]
readingTime: 6
wordCount: 1127
featured: false
sourcePath: "~/ctf/defcon/rev/notes.md"
---

## rfc1149a reconstruction notes

Current best artifact generator:

```bash
python3 recover_http.py
```

Outputs:

- `artifacts/recover_http/packet-summary.txt`
- `artifacts/recover_http/streams/*.map`
- `artifacts/recover_http/streams/*.txt`
- `artifacts/recover_http/gzip/candidates.txt`

Important stream observations:

- `server_to_a586` contains the first useful HTML response starting on rfca line 1.
- rfca line 39 is the continuation of rfca line 1 at TCP sequence `0x010b961b`, offset `0x14c` from line 1.
- rfca line 2 almost certainly has an OCR-damaged TCP sequence; it visually starts the next HTTP response and should not be allowed to overlap the line 1 gzip body as-is.
- `server_to_a5a8` contains 302 redirect text plus another HTML 200 response, but that HTML body has larger gaps/unknown regions.
- `server_to_a596` and later `a586` responses are CSS/theme resources, not the highest-value flag target.

Confirmed recovered HTML plaintext from the first gzip stream after deflate-guided byte repair:

```html
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Home</title>
  <link rel="icon" ...
```

The recovered `<link rel="icon"...` line strongly appears to be an inline SVG data URL, roughly:

```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>...</text></svg>">
```

Manual/deflate-guided repairs that produced the valid HTML prefix for the first HTML gzip deflate stream:

- Raw deflate byte 43: `00 -> 09`
- Raw deflate byte 46: `94 -> b4`
- Raw deflate byte 95: `07 -> d7`
- Raw deflate byte 101: `d8 -> d6`
- Raw deflate byte 103: `?f -> af`
- Raw deflate byte 104: `dc -> 6c`

These byte indexes are relative to the raw deflate stream, i.e. after the 10-byte gzip header.

Useful visual crop:

- `artifacts/crops/img01_line1_raw90_130.jpg`

That crop confirms several bytes around the repaired area are physically ambiguous or obscured by folds/grass. It also confirms the stream is not just missing `xx` bytes; some visually plausible bytes still make the dynamic Huffman header invalid, so zlib-only replacement of unknown bytes is insufficient.

Current blocker:

- The HTTP/TCP reconstruction is working.
- The remaining hard part is deflate repair through an underconstrained region of consecutive damaged compressed bytes in the inline SVG favicon area.
- No verified `bbb{...}` flag has been recovered yet.

2026-05-24 resumed repair notes:

- No broad repair/search/probe processes were left running at resume time.
- `search_line1_tail.py` and `repair_line1_html.py` now honor partial nibbles when expanding unknown cells, e.g. `.5` is restricted to values ending in `5`.
- Added `FAVICON_TARGET` and `CORRECTED_HEADER_TARGET` modes. The corrected header uses unquoted stylesheet rel attributes:

```html
  <link rel=stylesheet href="/style.css">
  <link rel=stylesheet href="/theme-light.css">
  <link rel=stylesheet href="/theme-dark.css">
</head>
<body>
```

- The favicon target is the strongest reliable HTML recovery point. Saved clean seeds through raw deflate offset 205 in:

```text
artifacts/repair_line1_favicon_seeds_205.json
```

- A corrected-header path can be forced and reaches `<body>`, but it changes almost every visually photographed byte from raw offsets 213-255. Treat it as a useful hypothesis, not as verified plaintext, until it reaches gzip CRC `0x719167ea`.
- The old quoted-link target was wrong: the repaired path that matches observed output uses `rel=stylesheet`, not `rel="stylesheet"`.
- Body guesses remain underconstrained. Tested `<form`, `  <main>`, and `  <main>\n  <h1>`; each can be forced but drifts without CRC verification. None produced a final CRC-valid candidate.
- Minimal live endpoint checks on 2026-05-24:
  - `http://34.16.111.14/` returns an empty reply.
  - `http://rfc1149a.ctfwithbirds.com/` and `http://rfc1149a.chal.ctfwithbirds.com/` return HTTP 404.

2026-05-24 later bounded-resume notes:

- No stale `repair_line1_html.py`, `search_line1_tail.py`, `probe.py`, or long Python search process was active before/after this resume block.
- Lightweight image/stego triage did not find a credible flag:
  - No JPEG post-EOI overlays.
  - `exiftool` metadata was not useful.
  - `binwalk` hits looked like random false positives.
  - Pixel/DQT LSB scans only produced random binary false positives, not a valid `bbb{...}`.
- The first line1 HTML header can be forced further with real newlines in `--target-extra`:

```html
  <link rel=stylesheet href="/style.css">
  <link rel=stylesheet href="/theme-light.css">
  <link rel=stylesheet href="/theme-dark.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/login">Login</a>
```

- Treat that forced header/nav as a hypothesis, not verified plaintext. The exact-forced branches mutate many photographed bytes after raw deflate offset 214; e.g. `artifacts/body_checkpoint_nav_login2/latest.json` changes 65 known bytes at offsets `>=206`.
- `search_line1_tail.py` fixes added in this block:
  - `--target-extra` scoring now uses the base target for HTML grammar, so partial-tag extras are not rejected as body text.
  - `--prefer-min-changes` keeps low-edit candidates before longer exact-prefix candidates.
  - Head-link grammar now rejects bad partials like `<link rel=sty+`, `<link rel=style>`, and `<link rel=stylesheetn...`.
  - Body grammar allows `<a` and `<nav` as first body elements and rejects bare drift text inside an open `<nav>`.
- Minimal-change search from the clean favicon seed now preserves photographed bytes longer but still drifts near the first stylesheet link; no CRC-valid final candidate was found.
- Live host checks with `Host: rfc1149a.ctfwithbirds.com` for `/`, `/style.css`, `/theme-light.css`, and `/theme-dark.css` all returned empty replies from `34.16.111.14`.

Flag format from the official rules:

```text
bbb{...}
```

2026-05-24 resource-bounded resume notes:

- Official challenge metadata is available from `https://bbbctf.com/api/challenges`; the local tar `rfc1149a_rfc1149a-7a400c1-e59762b1e8d4857e.tar` matches the public handout and only contains `img01.jpg` through `img14.jpg`.
- The live challenge host still returns 404 for `/`, `/login`, and `/register` on `104.197.203.45`, including with `Host: challenge.local`.
- No stale search/probe processes were left running during this pass.
- Important correction to the HTML hypothesis: forcing all three stylesheet links (`style.css`, `theme-light.css`, and `theme-dark.css`) is likely overfit. It mutates many line39 bytes after raw offset 256, which are visually much clearer in `img13_57_left_mid_rot90.jpg`.
- A two-stylesheet header survives better:

```html
  <link rel=stylesheet href="/style.css">
  <link rel=stylesheet href="/theme-light.css">
</head>
<body>
```

- The two-stylesheet branch can force the first body anchor through:

```html
<a href="/">Home</a>
```

  but free-running or forcing the next anchor (`/login` or `/register`) fails at raw offset 257 if bytes >=256 are preserved.
- One-stylesheet-only close-head/body and two-stylesheet `<nav>` branches died early. Two-stylesheet `<main><h1>` branches can be forced but degrade immediately afterward, so treat them as overfit unless independently validated.
- Natural output from preserved bytes after the second stylesheet repeatedly leaks recognizable fragments like `regisetr`, `h1>Welc`, and `<p>Please`, suggesting the real body likely contains register/welcome text, but the exact byte path remains unverified.
- Next best constraint to add is packet-level checksum validation for line39/line1 candidates. Current transcription has header OCR damage (`line39` source appears as `34.16.111.110` and TCP checksum as `00? 4e`), so checksum use needs corrected pseudo-header assumptions and should be treated as a filter, not ground truth, until the header bytes are visually confirmed.

2026-05-24 checksum/body-hypothesis follow-up:

- Packet checksums are useful for header repair:
  - line39 IP total length `0x0113` is consistent with the visible packet being short by three bytes, almost certainly the final chunk terminator bytes `0a 0d 0a`.
  - line39 IP checksum should be `0x1822`, which implies server IP byte `0e` (`34.16.111.14`) rather than the OCR-looking `6e`.
  - line1 IP checksum implies IP ID byte `61` (`0x6196`), not the transcribed `01`.
- TCP checksum filtering is not yet a hard validator for partial HTML branches. There are still too many OCR-damaged bytes in the TCP header/payload before the checksum can uniquely reject or prove a branch.
- Wider exact-body probes strengthened the overfit warning:
  - The two-stylesheet `Home` first-anchor branch can be forced, but it requires many mutations in the visually clearer line39 region.
  - Forcing second anchors `/register` or `/login` after `Home` dies at raw offset 257 if bytes `>=256` are preserved.
  - Allowing that diagnostic branch to mutate offset 257 also required changing clear bytes around offsets `254-257`, so it should not be trusted.
  - Forcing first body anchor `/register` also reaches only by mutating clear bytes around offsets `246-254`, then dies at offset 256 if the photographed byte is preserved.
- A larger alternate HTML response exists in `server_to_a5a8` after a 302 redirect. It has gzip chunk `0x1b6` and is likely higher-value than the first unauthenticated home page, but fixed photographed bytes fail in the dynamic-Huffman setup before output. A bounded repair-at-failure probe showed it needs early known-byte repair around raw offset 62; this needs a more principled deflate-header repair or visual re-read before it can produce useful plaintext.
