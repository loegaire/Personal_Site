---
title: "Second Stamp"
description: "Confirmed facts Target: 154.57.164.74:31701. Workspace has no supplied artifacts; live-service recon is required. / is a static canvas UI loading /app.js. The UI fetches JSON and exposes POST /api/instance/c…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Web Security"
kind: "field-note"
status: "solved"
tags: ["Web Security", "HTB", "Field notes"]
readingTime: 3
wordCount: 527
featured: false
sourcePath: "~/ctf/HTB/salt_crown/second_stamp/notes.md"
---

# Second Stamp

## Confirmed facts
- Target: `154.57.164.74:31701`.
- Workspace has no supplied artifacts; live-service recon is required.
- `/` is a static canvas UI loading `/app.js`.
- The UI fetches JSON and exposes `POST /api/instance/check`; success returns a flag only when its server-side condition is satisfied.
- User also supplied `154.57.164.82:32194`, `154.57.164.82:31218`, and `154.57.164.82:32532`; each emitted a raw non-HTTP response to an HTTP request.
- `32194` banners as `CINDER RIG/1`; `31218` as `CINDER LA/1`; `32532` as `VAULTRUNE FIELD SERVICE ... [CINDER RECOVERY/1]`. These appear unrelated to the Second Stamp Sui service.
- `GET /api/instance` on the Second Stamp frontend returns `status: idle`; the instance has not yet been started.
- Instance started at `2026-07-24T16:53:18Z` and expires at `17:03:18Z`.
- That first instance has now expired; `GET /api/instance` again reports `status: idle`.
- Fresh instance: expires `2026-07-24T17:23:23Z`; player `0x1333c422ec202ec21a0f7ebdbf2bd241586af2f268a29487a339484261e86cd6`; challenge package `0x06cc66a5721f32e1e57a61e34a04e8d78221802c38afedb7b3e28d5dd5e8ae33`; challenge object `0x48f944eb4e88c40f60fc0785e0f4eb48311d27f98ad95a49b1650500a351af94`.
- Restarted instance: expires `2026-07-24T17:29:43Z`; player `0xdd2dfe912051ac444feb6fdf6a9fa68c9844b96299bc2545e300ba528ee73684`; challenge package `0x801e5c0f79685c73aac5999da9ee09627c1b54f17f340f9c17fcc5ba16ff6301`; challenge object `0xc11f29842b94f3f4d106d54fff2b293bba8f0b01a50d5cdca3aefbb3d4f553c2`.
- Player: `0xeee1d7f7779f8683080b776d93e5dd5044974742cf94bff93e370dbb3c10c52c`; challenge package: `0xc98951e36ac7621bd7989c7f98cb8d2a26f66c301136f6b05758fc749e58f264`; challenge object: `0x6e0ea91dcd8b706a6c261763442c74bd0624a8c9f8e279f78ecc5f6ffbe8c8d1`.
- `GET /sources/setup.move` falls back to the frontend HTML; source must be recovered through Sui RPC/bytecode.
- Failed probe: an empty JSON-RPC body sent to `/` returned static HTML. Retry with an explicit request body before judging the RPC route.
- Confirmed: valid `sui_getNormalizedMoveModulesByPackage` JSON-RPC POST to `/` also returns static HTML; the advertised root RPC route is not directly proxied by Caddy.
- New target cluster at `154.57.164.82` identifies as a CINDER recovery workflow: `32194` RIG, `31218` LA, `32532` VAULTRUNE vault. The vault exposes device `a11f0c1de5eafeed0badc0ffee5e0001`, image `d93870aa1c4f3b6455a6b6d23723b66da2e2399856da55f6060c1b86f37fb772`, counter `2`, challenge `7403371733a2c073a2f2b919907e7bab` and requests a ticket.
- RIG recognizes `STATUS` and reports `boot=18 powered=1 captures=16`; bounded dummy-verb discovery found no other accepted generic verb.
- RIG also accepts `HELLO` and returns its banner, indicating a session handshake. Earlier command discovery was performed before that handshake.

## Current hypothesis
- Scope confirmed: solve Second Stamp only at `154.57.164.74:31701`; disregard the unrelated CINDER endpoints.

## Next test
- Reactivate a fresh Second Stamp instance so the user can provide the required endpoints.

## Failed hypotheses
- `HELP` is not a supported CINDER command; every service returned `ERR SCHEMA`.
- Public exact-string searches for the CINDER banner/protocol returned no relevant documentation.
- `CAPTURE` is not a valid RIG verb at tested textual arities; the `captures` status field is static across probes.
- RIG rejected all tested issuance verbs (`ISSUE`, `SIGN`, `MINT`, `STAMP`, `SEAL`, `ATTEST`, `PROVE`, `AUTHORIZE`, `REGISTER`, `REQUEST`, `CLAIM`, `TICKET`) even with the vault's valid-length tuple.
- The vault rejects unsigned JWTs and HS256 JWTs derived from the RIG status fields. RIG rejected serialized base64url-JSON request bodies, state-tuple candidates, URL/proxy forms, and conventional schema/help commands.
- Second Stamp RPC path probes (`/`, `/rpc`, `/sui`, `/json-rpc`, `/api/rpc`, `/api/instance/rpc`, and variants) all return Express 404 HTML for valid JSON-RPC; standard Sui ports on the same host are unreachable. Source and API-document paths all SPA-fallback to `index.html`.
- All standard JSON-RPC media types reach Express and return `Cannot POST /`; `POST /api/instance/check` returns `{"solved":false}`. The Sui node is running only behind the server's internal API but no external transaction/RPC route is deployed.
- User confirms the frontend's `154.57.164.74:31701` is the only displayed endpoint; test host-based routing on that same listener.
- Host-header variants and a WebSocket upgrade on `31701` also route only to Express/static UI. No public Sui RPC or transaction proxy is reachable from the displayed endpoint.
