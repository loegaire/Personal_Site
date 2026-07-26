---
title: "Open World (SEKAI 2026) - working notes"
description: "Confirmed facts Challenge: Open World, Blockchain, TON, 500, NORMAL. Workspace: /home/thinh/ctf/sekai2026/blockchainopenworld. No AGENTS.md found in workspace root. Original artifact present: blockchainopen-…"
published: "2026-06-27"
updated: "2026-06-27"
event: "sekai2026"
category: "Blockchain"
kind: "field-note"
status: "solved"
tags: ["Blockchain", "sekai2026", "Field notes"]
readingTime: 3
wordCount: 490
featured: false
sourcePath: "~/ctf/sekai2026/blockchain_open_world/notes.md"
---

# Open World (SEKAI 2026) - working notes

## Confirmed facts
- Challenge: Open World, Blockchain, TON, 500, NORMAL.
- Workspace: `/home/thinh/ctf/sekai2026/blockchain_open_world`.
- No `AGENTS.md` found in workspace root.
- Original artifact present: `blockchain_open-world.tar.gz` (gzip compressed data, original size modulo 2^32 = 143360).
- SHA-256 of original artifact: `81dd8024f88e986c5d10f6248f9396adf935b49451becec1a65383535178d90a`.
- Archive contains Tolk contracts (`Challenge`, `JettonMinter`, `JettonWallet`) and TypeScript sandbox/launcher/server files.
- Existing dirs: `scratch/`, `dumps/`, `artifacts/`, `extracted/`.
- Extracted copy: `artifacts/blockchain_open-world/`.
- Remote NC endpoint from user: `open-world-29f1ffd3dfb2.instancer.sekai.team:1337`, reached over TLS (`ncat --ssl`).

## Commands tried
- `rg --files -g 'AGENTS.md' -g 'notes.md' -g 'SKILL.md'`
- `sed -n '1,240p' notes.md`
- `rg --files -uu`
- `find . -maxdepth 3 -type f -print0 | xargs -0 file`
- `tar tzvf blockchain_open-world.tar.gz`
- `sha256sum blockchain_open-world.tar.gz`
- `tar xzf blockchain_open-world.tar.gz -C artifacts`
- Read `sandbox/server.ts`, `sandbox/launcher.ts`, `sandbox/deploy-challenge.ts`, `sandbox/localchain.ts`.
- Read `contracts/Challenge.tolk`, `JettonMinter.tolk`, `JettonWallet.tolk`, `messages.tolk`, `storage.tolk`, `errors.tolk`.
- `NC_TLS=1 python3 solve.py open-world-29f1ffd3dfb2.instancer.sekai.team 1337`

## Failed hypotheses
- Two normal `PlayerBonus` calls from one player are enough: false. Sandbox showed only the first call mints 50 jettons; the second produces no mint, and a third exits with code 5 from uint8 underflow.
- Fake bounced message directly to `JettonWallet.onBouncedMessage`: false via wallet/treasury raw messages. Outbound `bounced=true` was delivered as `bounced=false`, so the jetton wallet treated it as an invalid normal internal message.
- Full Docker-compose local verification: blocked on this host by SELinux volume labeling. `global.config.json` existed in genesis, but sibling containers saw permission denied / `ton-http-api` restarted. Stopped with `docker compose -p openworldtest down -v`.

## Confirmed exploit
- Win condition is `Challenge.getIsSolved() == true`; server returns flag for session UUID only then.
- `Challenge` sets `isSolved = true` when its own jetton wallet notifies it of a transfer of at least `FLAG_PRICE = 100` jettons with `Solve` forward payload, initiated by stored `player`.
- Each challenge instance gives one usable 50-jetton bonus.
- Weakness: sessions share one chain ("open world"). Launch a target session and donor sessions, sell each session's 50 bonus jettons for about 100 TON, move donor TON into the target player wallet, buy 100 target jettons, then transfer 100 target jettons to the target challenge with `Solve` payload (`0x13370005`).

## Next tests
- Against real challenge endpoint: `NC_TLS=1 python3 solve.py open-world-29f1ffd3dfb2.instancer.sekai.team 1337`.

## Solver implementation
- Installed npm dependencies in `artifacts/blockchain_open-world`.
- Installed Acton and selected pinned toolchain `acton 1.0.0`.
- Ran `npm run build` and `npm run wrappers-ts`; generated wrappers under `artifacts/blockchain_open-world/wrappers-ts/`.
- Added `artifacts/blockchain_open-world/solve.ts`:
  - Connects to NC service, solves PoW, parses UUID/challenge/API/seed/wallet ID.
  - Reconstructs player wallet from seed/wallet ID, auto-detects workchain from balance/deployment.
  - Uses shared-chain donor sessions: target claims/sells 50 bonus jettons, donors claim/sell 50 bonus jettons, donors transfer TON to target.
  - Target buys 100 target jettons and sends them to the target challenge with forward payload opcode `0x13370005` (`Solve`).
  - Polls `isSolved()` then requests flag over NC.
- Added `artifacts/blockchain_open-world/solve.py` wrapper that runs `npx ts-node solve.ts`.
- Added root `solve.py` wrapper.
- Added `NC_TLS=1` support for TLS-wrapped NC services.
- `npx tsc --noEmit` passes.
- `python3 -m py_compile solve.py artifacts/blockchain_open-world/solve.py` passes.
- `node scratch/test_openworld_shared_chain.js` passes: target jettons after buy = 100, target `isSolved=true`.
- Remote solve succeeded:
  - Target UUID: `27c151d2-3a0e-457e-87a3-07d7b574a7d8`
  - Donor UUID: `a0d0fc52-ff32-4fd8-a40a-500a94940786`
  - Flag: `SEKAI{3Xp1or1ng-An-0pen-W0rld-15-FUN}`
