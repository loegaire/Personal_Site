---
title: "Web Electron File Origin Ipc Rce"
description: "Use when solving CTF web or rev challenges involving Electron apps, file:// origins, preload scripts, contextBridge APIs, ipcRenderer/ipcMain bridges, renderer XSS, nodeIntegration settings, app.relaunch, or…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills", "xss"]
readingTime: 3
wordCount: 476
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-electron-file-origin-ipc-rce/SKILL.md"
---

# Web Electron File Origin IPC RCE

## When to use

Use this skill when you see:
- Electron `BrowserWindow`, `webPreferences`, `preload.js`, `contextBridge`, `ipcRenderer`, or `ipcMain`.
- `file://` pages, local app views, AppImage/asar packages, or admin/report bots running Electron.
- Renderer XSS where the page is loaded from a local file origin.
- Exposed preload methods such as `window.api.invoke(action, args)`.
- Actions forwarded to main-process objects such as `app[action](...)`.

Do not use this skill when:
- The challenge is only a normal web browser with no Electron runtime.
- The renderer has no XSS/input control and no exposed preload bridge.
- The only goal is static reverse engineering of packaged assets.

## Core idea

Electron apps often disable `nodeIntegration`, enable `contextIsolation`, and sandbox the renderer, but preload scripts can still expose privileged IPC methods. A renderer XSS under `file://` may read local files directly; for RCE, inspect the preload-to-main IPC surface and find callable main-process methods or argument gadgets.

## Recognition signals

Look for:
- `webPreferences` with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`; these do not eliminate preload bridge risk.
- `contextBridge.exposeInMainWorld`.
- IPC handlers that trust an action string, especially `app[action](...args)`.
- Case-insensitive regex filters over action names.
- Electron `app` methods such as `relaunch` that accept executable path and arguments.
- User content later rendered into local `file://` views.

## Standard workflow

1. Unpack the app if needed: `asar extract`, AppImage mount/extract, or inspect `resources/app`.
2. Identify local/remote boundaries: which pages are `file://`, which are remote, and which views receive attacker content.
3. Confirm XSS in the renderer and note the origin.
4. Test local file reads from XSS with `fetch("file:///path")`.
5. Read `preload.js` and list exposed APIs.
6. Read `ipcMain` handlers and model action filtering exactly.
7. Search main-process callable objects for methods whose arguments influence command execution, relaunch, shell, file write, or network exfiltration.
8. Build the smallest renderer payload that invokes the privileged bridge.

## Commands and tools

```bash
rg -n 'BrowserWindow|webPreferences|preload|contextBridge|ipcRenderer|ipcMain|exposeInMainWorld|relaunch|shell' .
npx asar list app.asar | sed -n '1,80p'
npx asar extract app.asar app_unpacked

# Quick XSS probes inside Electron devtools/renderer.
fetch('file:///flag').then(r => r.text()).then(console.log)
Object.keys(window).filter(k => /api|electron|ipc/i.test(k))
```

## Pitfalls

Common ways agents get this wrong:
- Stopping at `nodeIntegration: false` and missing a dangerous preload bridge.
- Treating all Electron XSS as equivalent to browser XSS; `file://` changes local-read impact.
- Invoking blocked action names without considering regex case-sensitivity or negation mistakes.
- Looking only for `child_process` in renderer code instead of main-process methods reachable by IPC.
- Forgetting that packaged apps may have different paths and environment variables than the source tree.

## Verification

Prove the solve path is real with:
- Renderer JavaScript execution in the Electron context.
- Local file read output or a callback showing file contents were exfiltrated.
- IPC invocation reaching a main-process method.
- Benign command execution first, then challenge verifier/flag retrieval.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| Hack.lu CTF 2022 | BabyElectron v1 | web | XSS in a `file://` page could fetch local files despite normal browser-style assumptions. |
| Hack.lu CTF 2022 | BabyElectron v2 | web | A preload `window.api.invoke` bridge forwarded action names to Electron `app` methods; `app.relaunch` became an RCE gadget. |

## Sources

* https://sudistark.github.io/2022/10/23/Hack.lu-CTF-Writeup.html - BabyElectron file-origin read and preload/IPC-to-`app.relaunch` RCE analysis.
