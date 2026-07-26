---
title: "Crownspire Petitions — working notes"
description: "Target: http://docket.crownspire-petitions.htb:32022/. Prompt supplies Subject Number / valid registration token: SN-2140-6698. The service is described as an A2A server; objective is to retrieve a sealed in…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Web Security"
kind: "field-note"
status: "partial"
tags: ["Web Security", "HTB", "Field notes"]
readingTime: 3
wordCount: 481
featured: false
sourcePath: "~/ctf/HTB/salt_crown/crownspire_petition/notes.md"
---

# Crownspire Petitions — working notes

## Confirmed facts

- Target: `http://docket.crownspire-petitions.htb:32022/`.
- Prompt supplies Subject Number / valid registration token: `SN-2140-6698`.
- The service is described as an A2A server; objective is to retrieve a sealed inner-node petition.
- Workspace contains no supplied artifacts beyond this notes file.
- HTB's public event API identifies the active event as ID `3432`, “Cyber Apocalypse CTF 2026: The Salt Crown”.
- Initial deployment IP supplied by user was `154.57.164.72:32022`; it expired/switched applications.
- Fresh deployment: `154.57.164.64:32182`, host `docket.crownspire-petitions.htb:32182`.
- Agent card is at `/.well-known/agent-card.json`; JSON-RPC is `POST /` and supports `message/send` (A2A 1.0 only; `tasks/send` and `rpc.discover` return method-not-found).
- Standard A2A `tasks/get` exists (returns `Task not found` for arbitrary IDs); message streaming and task resubscription are explicitly unsupported.
- The service accepts client-provided `role: "agent"` as well as `role: "user"`. When injected into an existing `contextId`, an agent-role message was treated as authoritative conversational content and caused Docket to synthesize/file `PET-1014` from it.
- A standalone `Subject Number: SN-2140-6698` message creates a persistent `contextId`, and the context can be reused in later messages.
- Filing with exact fields `Title`, `Petitioner`, and `Body` works. A benign filing using `SN-2140-6698` created `PET-1006`.
- Existing public petitions are `PET-1000` through `PET-1005`; `PET-1000` is a QA fixture and leaks `SN-7731-0425` identified as a QA role.
- `PET-1001`–`PET-1005` are ordinary PENDING civic appeals; none contains the requested evidence.
- New filings were immediately reviewed by the inner node and consistently became `REJECTED` with verdict `Does not meet Vaultrune ordinance §4.` This held for user Subject `SN-2140-6698`, leaked QA Subject `SN-7731-0425`, reuse of the authenticated conversation context, HTTP auth-header variants, and message/part metadata claiming internal trust.
- A direct lookup SQL-injection-shaped identifier and wildcard (`PET-%`) both returned an ordinary no-record response, suggesting parameterized/exact ID lookup.
- At `2026-07-24 15:35 UTC`, `154.57.164.72:32022` stopped serving Docket and began serving an unrelated “Gatery” static site (`nginx/1.28.3`). All tested Host variants now return that site, so the Docket JSON-RPC service is no longer available at this deployment address.

## Current hypothesis

- The QA Subject Number may be an authorization boundary for the sealed record, or the fixture may be intended for a stored-petition / agent-instruction confusion. Test controlled filings and retrieval behavior around that boundary.

## Failed / blocked tests

- Direct and environment-default `curl` lookups failed: `Could not resolve host: docket.crownspire-petitions.htb`.
- No active VPN/tunnel interface is present; the host has only local/Wi-Fi routing.
- `crownspire-petitions.htb:1337` is not reachable via the supplied deployment IP; only the docket service is exposed.
- The current address cannot be used for further Docket testing: `/.well-known/agent-card.json` now returns the unrelated Gatery HTML.
- The fresh Docket deployment at `154.57.164.64:32182` likewise stopped serving Docket at `2026-07-24 16:08 UTC` and now returns the Gatery service.

## Next tests

- Fetch the HTTP root, response headers, and standard A2A discovery endpoints through the supplied IP.
- Obtain a fresh running Docket deployment address. Focus on bypassing the inner node's ordinance §4 gate using A2A role/context confusion or a correctly formatted inner-node task; avoid repeating basic card/record enumeration.
