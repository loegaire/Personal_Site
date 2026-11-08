---
title: "Web Url Parser Differential"
description: "Use when solving CTF web challenges with URL allowlists, SSRF, XSS, redirects, postMessage host setters, or parser mismatches where browsers, fetch, backend libraries, proxies, or validators may disagree on…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills", "xss", "ssrf"]
readingTime: 3
wordCount: 547
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-url-parser-differential/SKILL.md"
---

# Web URL Parser Differential

## When to use

Use this skill when you see:
- Host, origin, domain, redirect, callback, `next`, `url`, `returnTo`, `target`, or `host` parameters.
- Client code that validates with one parser but later calls `fetch`, `open`, `iframe`, `postMessage`, or `location`.
- Allowlist checks like `getDomain() == expected`, `endsWith()`, regex host checks, or scheme-blind parsing.
- Unicode domains, backslashes, punycode, integer IPs, IPv6 forms, `data:`, `file:`, `blob:`, or protocol-relative URLs.

Do not use this skill when:
- The input is not interpreted as a URL by any security decision or sink.
- The challenge is a plain open redirect with no parser discrepancy or trusted sink.

## Core idea

Many CTF web bugs come from validating a URL with parser A, then consuming it with parser B. The exploit is not "find a weird URL" in the abstract; it is to build a candidate that passes the validator's model while the sink resolves to attacker-controlled content, internal services, or executable markup.

## Recognition signals

Look for:
- JavaScript libraries such as Closure `goog.Uri`, `new URL`, Node `url.parse`, Python `urllib.parse`, Go `net/url`, PHP `parse_url`.
- `postMessage` APIs that set a base URL or host before rendering trusted data.
- `innerHTML` fed from JSON retrieved from a user-controlled URL.
- Domain-only validation without scheme validation.
- Filters that reject `?` but not fragments, semicolons, or data-URL metadata.
- Browser normalization hazards: fullwidth dots, backslashes, mixed slashes, decimal/octal/hex IPs, IDNA/punycode.

## Standard workflow

1. Identify the exact validator and exact sink.
2. Build a table of candidate URLs and record how each component parses them.
3. Test schemes separately: `https`, `http`, `data`, `file`, `blob`, protocol-relative, backslash-prefixed.
4. Test host encodings: Unicode dots, punycode, decimal IPs, IPv6 brackets, username/password confusion.
5. Test whether appended paths become fragments or metadata in the sink.
6. If a browser bot is involved, verify with a real browser or Playwright; `curl` and browser URL resolution differ.
7. Convert parser discrepancy into the final primitive: SSRF, XSS, cookie theft, internal file fetch, or callback control.

## Commands and tools

```bash
# Compare common parsers quickly.
node - <<'JS'
const candidates = process.argv.slice(1);
for (const u of candidates) {
  try { console.log("WHATWG", u, new URL(u)); } catch (e) { console.log("WHATWG fail", u, e.message); }
}
JS 'data://example.com/;base64,eyJodG1sIjoiPHgiIH0=#/sap/x'

python3 - <<'PY'
from urllib.parse import urlparse
for u in ["\\\\127.0.0.1\\://allowed.example/x", "data://allowed.example/,{}#/x"]:
    print(u, urlparse(u))
PY

# Resolve browser behavior instead of guessing.
node -e 'console.log(new URL(process.argv[1], "https://victim/").href)' '///example.com/path'
```

## Pitfalls

Common ways agents get this wrong:
- Assuming the validator's parser and the browser agree.
- Testing only `http://` and `https://` when the validator never restricts schemes.
- Forgetting that fragments can hide sink-appended path segments from the network request.
- Treating `postMessage("*")` as the whole bug; the exploitable part is usually the trusted action reachable after message delivery.
- Reporting an open redirect when the challenge needs a stronger primitive such as same-origin XSS or SSRF.

## Verification

Prove the solve path is real with:
- A parser comparison table for the final payload.
- A browser or service request log showing the sink reached the attacker/internal URL.
- The exact response body, script execution, SSRF callback, or cookie/flag-format proof.
- A minimal reproduction in the challenge source when source is available.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| Google CTF 2024 | sappy | web | Closure `goog.Uri` host validation could be separated from browser/fetch URL behavior; scheme and Unicode host normalization were key search axes. |
| Google CTF 2024 | sappy | web | A `postMessage` host setter plus JSON-to-`innerHTML` rendering turned URL parser confusion into XSS. |

## Sources

* https://adragos.ro/google-ctf-2024/ - sappy writeup showing Closure URL validation, Unicode dot normalization, `postMessage`, and attacker JSON rendering.
* https://blog.chummydns.com/blogs/google-ctf-2024/ - sappy writeup showing `data://allowed-host` parsing and fragment use to neutralize appended paths.
* https://github.com/google/google-ctf - official Google CTF challenge archive used to confirm event/source context.
