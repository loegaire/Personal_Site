---
title: "confused-component-auth notes"
description: "Confirmed facts Live instance: http://chal3.teagod.tech:34699 Original user-supplied instance timed out on 2026-07-04 09:47 UTC for /, /vault, /assets/manual.css, /login. Spawned fresh instance via instancer…"
published: "2026-07-04"
updated: "2026-07-04"
event: "nohacknoctf"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "nohacknoctf", "Field notes"]
readingTime: 5
wordCount: 953
featured: false
sourcePath: "~/ctf/nohacknoctf/rev-confused/notes.md"
---

# confused-component-auth notes

## Confirmed facts
- Live instance: `http://chal3.teagod.tech:34699`
- Original user-supplied instance timed out on `2026-07-04 09:47 UTC` for `/`, `/vault`, `/assets/manual.css`, `/login`.
- Spawned fresh instance via instancer `/create` using provided token:
  - Fresh URL: `http://chal3.teagod.tech:34805`
  - Destroy time shown by instancer: `2026-07-04T09:53:08.166105716Z`
- Spawned second fresh instance after `34805` expired:
  - Fresh URL: `http://chal3.teagod.tech:34826`
  - Destroy time shown by instancer: `2026-07-04T09:59:52.001526749Z`
- Fresh baseline:
  - `GET /` -> `200`, HTML with `Service status: /api/info`, `Asset previewer: /preview?file=/assets/manual.css;handler=static`, `Public asset: /assets/manual.css`
  - `GET /vault` -> `404`, body `not found`
  - `GET /assets/manual.css` -> `200`, `Content-Type: text/css`, `X-Asset-Normalized-Path: /assets/manual.css`, `X-Preview-Handler: static`, body CSS
  - `GET /login` -> `401`, body `login temporarily unavailable`
- Management/spawn URL from user: `http://chal3.teagod.tech:9000/`, token `[redacted instance token]`
- Local files:
  - `confused-component-auth.wasm`: WebAssembly MVP module
  - `cc-auth-34478.headers`: saved HTTP headers from earlier response
  - `notes.md` was empty at start of this continuation
- Saved header/intermediate response:
  - `HTTP/1.0 200 OK`
  - `Server: BaseHTTP/0.6 Python/3.12.13`
  - `Content-Type: application/wasm`
  - `X-Asset-Normalized-Path: /assets/manual.css`
  - `X-Auth-Engine: wit-component/v2`
  - `X-Web-Flag: NHNC{p4th_1s_n0t_4lw4ys_4_p4th_387ac95698a446cd80b6e52281cc13d1}`
  - `Content-Length: 560`
- Known `X-Web-Flag` is a decoy/intermediate, not final.
- Prior reversing says normal WASM `verify` export always returns `0`; real auth logic is hidden in CCVM data metadata and custom VM blob.
- Known valid proof pairs:
  - payload `NHNC{p4th_1s_n0t_4lw4ys_4_p4th_387ac95698a446cd80b6e52281cc13d1}`
  - proof `f1a2b938fc80452678c640cb7c2bee8b`
  - payload `AAAAAAAAAAAAAAAA`
  - proof `6eadb7379eba78538fef2dbbd63522fa`

## Current hypothesis
- The service likely has a GET/path/header-driven auth confusion bug involving asset path normalization and WIT/component metadata.
- POST likely returns `501`, so focus on GET, path normalization, query strings, cookies, and headers.
- Root page on fresh instance advertises `/preview?file=/assets/manual.css;handler=static`.
- `GET /api/info` -> JSON:
  - `auth_engine: wit-component/v2`
  - `component.default_name: auth`
  - `component.loader: enabled`
  - `preview_handlers: ["static"]`
- `GET /preview?file=/assets/manual.css;handler=static` -> JSON with `handler: static`, `normalized: /assets/manual.css`, `requested: /assets/manual.css;handler=static`.
- `GET /preview?file=/assets/manual.css;handler=component` -> JSON error `component name required`.
- Simple attempts to supply component name failed:
  - `;component=auth`
  - `&component=auth`
  - `&name=auth`
  - `&auth=auth`
- Confirmed direct path matrix form:
  - `GET /assets/manual.css;handler=component;name=auth` -> `200`, `Content-Type: application/wasm`, `X-Asset-Normalized-Path: /assets/manual.css`, `X-Auth-Engine: wit-component/v2`, and dynamic `X-Web-Flag` matching `NHNC{p4th_1s_n0t_4lw4ys_4_p4th_<team>}`.
  - Treat every `p4th_1s_n0t_4lw4ys_4_p4th_...` flag as intermediate/decoy; do not stop there.
- `/preview?file=/assets/manual.css;handler=component;name=auth` accepts the `name=auth` matrix key and drops the `component name required` error, but only returns JSON (`handler`, `normalized`, `requested`) and no cookie/flag by itself.

## Next tests
- Capture baseline `curl -i` for `/`, `/vault`, `/assets/manual.css`, `/login`.
- Enumerate common GET routes and component paths.
- Spray path-normalization variants that normalize to `/assets/manual.css` or contain `vault`/`verify` segments.
- Test query and header auth variants with a persistent cookie jar; after any promising response, immediately call `/vault`.
- Find the exact component-name grammar for `/preview` component handler.

## 2026-07-04 continuation
- Re-read `solve-challenge`, `ctf-web`, `ctf-reverse`, and `web-url-parser-differential` skill instructions.
- Fresh instancer session initially reused `34880`; destroyed it and spawned `http://chal3.teagod.tech:34891`, expiring `2026-07-04T10:19:40.518299394Z`.
- Baseline on `34891` at `2026-07-04 10:14:56 UTC`:
  - `/` -> 200 root HTML with `/api/info`, `/preview?file=/assets/manual.css;handler=static`, `/assets/manual.css`.
  - `/vault` -> 404 `not found`.
  - `/assets/manual.css` -> 200 CSS with `X-Asset-Normalized-Path: /assets/manual.css`, `X-Preview-Handler: static`.
  - `/login` -> 401 `login temporarily unavailable`.
  - `/api/info` -> team `a426313e53314806be43dea7701e6c81`.
- Direct component load on `34891`: `/assets/manual.css;handler=component;name=auth` -> 200 wasm, `X-Web-Flag: NHNC{p4th_1s_n0t_4lw4ys_4_p4th_a426313e53314806be43dea7701e6c81}`.
- Extracted CCVM constants from live `34891` wasm (`CCVM1` at 262, constants at +9): first 48 bytes `9225a595e78bae01ba3f32ba0a89cc91426df4c648df5deddcb581876a90a0b42d3f16d0112d185ced2ee40d92a2da76`.
- Live proofs for `34891`:
  - dynamic intermediate proof `97dcfd4fc8b7a4eb6402fce109bbff15`.
  - `AAAAAAAAAAAAAAAA` proof `14d3fb406a8ddb9e732bd99163a53364`.
- Raw direct paths like `/vault;handler=component;name=auth`, `/login;handler=component;name=auth`, `/assets/manual.css;handler=component;name=auth/../vault`, `name=auth%2f..%2fvault`, and `name=auth%252f..%252fvault` still returned 404/no useful headers.
- `/preview?file=/vault;handler=component;name=auth` reports `handler=component`, `normalized=/vault`, `requested=/vault;handler=component;name=auth` but does not set cookies or return the flag.
- `/preview?file=/assets/manual.css;handler=component;name=auth;path=/vault` reports `normalized=/assets/manual.css/vault`; raw slash inside matrix-like value changes Python URL path semantics.
- Source/leak probes for `/app.py`, `/server.py`, `/main.py`, `/challenge.py`, `/handler.py`, `/routes.py`, `/flag`, `/flag.txt`, traversal forms, and preview file variants did not disclose contents. `/preview` only returns JSON metadata for arbitrary file strings.
- Spawned `34908` (team `f2a246a45ad94f7ea0e8cb3b88573bf4`) and `34921` (team `176cf116b90d4593813c243ca8d34f25`) for follow-up probes; both behaved identically.
- Direct component `name` is validated on real asset requests: only `name=auth` (and `name=auth;extra`) loads WASM; `name=vault`, `name=flag`, `name=verify`, `name=confused-component-auth`, empty name, etc. return `handler not found`.
- `/preview` does not validate component names: it reports `handler=component` for arbitrary `name=...`, so it is only a parser oracle, not proof of a real component load.
- Confirmed encoded-semicolon parameter trick: `/assets/manual.css;%2f..%2fvault;handler=component;name=auth` and `%252f..%252f` variants still load the auth WASM with `X-Asset-Normalized-Path: /assets/manual.css`, but adding valid `payload/proof` and then requesting `/vault` leaves `/vault` at 404 with no cookies.
- Inverted paths trying to make apparent route `/vault` and decoded view `/assets/manual.css` (e.g. `/vault;%2f..%2fassets%2fmanual.css;handler=component;name=auth`) return plain `/vault` 404.
- Spawned `34946` (team `cc5f7b1ac9bc445c83e83b654c02964b`), proof `fa2653adcd6992af6432007a9c4a1b1e`, A proof `772951a26f53c5da731bec0af6544e6f`.
- Compact `/vault` auth sweep on `34946` with valid proofs found no hit: query/matrix pairs (`payload/proof`, `web_flag/web_proof`, `arg0/arg1`, `token`, JSON/base64 tokens), headers (`Payload`, `Proof`, `Web-Flag`, `Auth-Payload`, `CCVM-Payload`, `X-Auth`, `X-CCVM`, several Authorization schemes), and cookies all kept `/vault` at hidden 404 and set no state.
- `/preview` with non-path `file=` values (`http://...`, `//host/...`, `data:...`, `file:///...`) only treats them as opaque strings; it does not fetch remote/data/file URLs.
- GET request bodies with JSON, form, and text on `/vault`, `/login`, `/auth`, `/verify`, and component path did not affect behavior.
- Host/request-target confusion tests against `/vault` with valid proof did not change the 404.
- Direct route parsing: `/login?x=...` still reaches login and returns 401, but `/login;...` returns 404; route dispatch splits query but not matrix params for non-asset routes.
- Duplicate matrix keys are last-wins for `handler` in both `/preview` and direct asset serving:
  - `handler=static;handler=component;name=auth` -> component WASM.
  - `handler=component;handler=static;name=auth` -> static CSS.
  - `handler=vault;handler=component;name=auth` -> component WASM; adding valid proof still leaves `/vault` 404.
  - `handler=component;name=auth;handler=vault` -> `handler not found`; valid proof does not change it.
- LFI-style raw path disagreement tests like `/assets/manual.css;%2f..%2f..%2fflag;handler=static` and `/assets/manual.css;%2f..%2f..%2fproc%2fself%2fenviron;handler=static` always returned the known CSS; component variants always returned the auth WASM. No file contents leaked.
- Official CTFd site appears to be `https://nhnc.ic3dt3a.org/`, but the provided `ctfd_...` token was not accepted as an API token with `Authorization: Token` or `Bearer`; API requests redirected to login. The instancer at `:9000` has no `/api/v1/...` routes.
