---
title: "Web Xss Bot Csp Exfiltration"
description: "Use when solving CTF web challenges with XSS, CSP, browser/admin bots, cookie exfiltration, postMessage, DOMPurify/filter bypasses, service workers, or scriptless data leaks. Do not use for server-side injec…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills", "xss", "ssrf"]
readingTime: 2
wordCount: 330
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-xss-bot-csp-exfiltration/SKILL.md"
---

# Web XSS Bot CSP Exfiltration

## When to use

Use this skill when you see:
- admin/report bot visits a URL
- CSP blocks normal `<script>` execution
- HTML sanitizer or markdown renderer accepts user content
- goal is cookie, localStorage, DOM secret, or internal page exfiltration

Do not use this skill when:
- no browser context or bot exists
- the bug is pure SSRF or server-side template execution

## Core idea

Model the browser as the victim runtime. Find an execution or scriptless leak gadget that works under the exact CSP/sanitizer, then exfiltrate through an allowed channel such as image, form, DNS, window name, postMessage, or same-origin endpoint.

## Recognition signals

Look for:
- `/report`, admin bot, Puppeteer/Playwright
- CSP headers with nonce/hash/connect-src/img-src restrictions
- DOMPurify, marked, sanitize-html, custom regex filters
- iframes, `srcdoc`, `postMessage`, service worker scope

## Standard workflow

1. Reproduce bot origin, cookies, and CSP locally.
2. Identify sink: innerHTML, markdown, template, URL navigation, postMessage.
3. Test minimal payloads in a real browser, not only curl.
4. Enumerate allowed exfil channels from CSP.
5. If scripts are blocked, test SVG/event, meta refresh, CSS import, form post, window.name, and dangling markup.
6. Log callbacks and include a nonce/timestamp to prove bot execution.

## Commands and tools

```bash
curl -i http://target/ | rg -i 'content-security-policy|set-cookie'
node - <<'JS'
console.log(new URL('/report','http://target').href)
JS
```

## Pitfalls

Common ways agents get this wrong:
- Testing in a browser without the challenge CSP.
- Assuming HttpOnly cookies can be read by JS.
- Missing same-site restrictions and bot navigation path.
- Using an exfil domain not allowed by CSP.

## Verification

Prove the solve path is real with:
- callback from bot IP/session
- exfiltrated value matches expected secret format
- payload works in automated browser with challenge headers

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| Hack.lu CTF 2019 | Do You Even XSS? | web | Complex XSS required browser/CSP-aware payload design. |
| DiceCTF 2023 | recursive-csp | web | CSP behavior was central to exploit construction. |
| CSAW Quals 2019 | babycsp | web | CSP restrictions forced alternate exfiltration paths. |

## Sources

* https://gist.github.com/terjanq/fdb23ae109446b826a4b37df88efae07#file-xss_hard-js - source used for reusable technique extraction.
* https://siunam321.github.io/ctf/DiceCTF-2023/Web/recursive-csp/ - source used for reusable technique extraction.
* https://github.com/ajdumanhug/ctf/blob/master/web/xss/csaw-babycsp-web-50.md - source used for reusable technique extraction.
