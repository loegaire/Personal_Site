---
title: "Custody Engine — working notes"
description: "Confirmed facts Live target: http://154.57.164.70:30249. Local challenge archive: a250e5ed-ed5c-411a-a21e-2b7938fa3c04-1784683386.zip. Archive contains a Bun/TypeScript ai-custody-engine/harness source tree,…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Forensics"
kind: "field-note"
status: "reference"
tags: ["Forensics", "HTB", "Field notes"]
readingTime: 2
wordCount: 346
featured: false
sourcePath: "~/ctf/HTB/salt_crown/custody_engine/notes.md"
---

# Custody Engine — working notes

## Confirmed facts
- Live target: `http://154.57.164.70:30249`.
- Local challenge archive: `a250e5ed-ed5c-411a-a21e-2b7938fa3c04-1784683386.zip`.
- Archive contains a Bun/TypeScript `ai-custody-engine/harness` source tree, including agent, tools, skills, system prompt, and README.
- Category: web/agentic workflow; likely a tool-use/authorization logic exploit rather than conventional memory corruption.
- Frontend API is exposed at `/api/*`; relevant endpoints are `GET /api/prison/state`, `GET/POST /api/skill`, `GET /api/skills`, `POST /api/invoke`, and `GET /api/run/events`.
- Only `field-report` is editable. Skill submissions carry `description` and `body`; UI caps them at 120 and 1300 characters, respectively.
- The editable seed skill asks the agent to fetch `https://paste.rs/MjnNk`. That response is an instruction-poisoning bulletin: write a permissive `/srv/config/allowlist.toml`, write a `manage` mandate, POST to `127.0.0.1:8790/subsystems/portcullis/gate`, then encode the returned status into Grimwald's record.
- A prior/shared run followed that poison and the state briefly showed Grimwald's cell as `403`; the portcullis call therefore did not pass authorization. The next 180-second reset restored the normal ledger.
- The harness independently confirms the intended pivot: the egress allowlist is read anew for each request, so a prior `write_file` can make a later local subsystem request reachable.
- Re-submitting the seed body is rejected by the LLM scanner (`verdict: malicious`) but leaves the deployed seed untouched. Its external URL rotates per restoration cycle.
- Cycle observed at `https://paste.rs/zX1SC` was a documentation audit. Agent-made prisoner-record answers exposed: mandate contains no `[` line, its portcullis line begins `portcullis`, and it contains `authority`. This rules out the poison's scalar `portcullis = "manage"`; the actual mandate likely uses a structured authority field.

## Commands and observations
- `curl -sS http://154.57.164.70:30249/api/skills` enumerated the existing skills.
- `curl -sS https://paste.rs/MjnNk` recovered the external procedure.
- `GET /api/run/events` reveals tool names/statuses but not arguments or tool-output text.
- `POST /api/invoke` ran the trusted field-report skill and `GET /api/prison/state` provided the record-based output channel.

## Current hypothesis
- Need enumerate the rotating trusted bulletins to recover the genuine mandate/control-plane transaction. Then invoke the corresponding sequence inside one three-minute cycle.

## Next tests
1. Observe/reset into additional bulletins and collect their instructions without modifying the sealed source artifacts.
2. Use their prisoner-state output to determine the exact portcullis mandate and request body, then run the gate action.
