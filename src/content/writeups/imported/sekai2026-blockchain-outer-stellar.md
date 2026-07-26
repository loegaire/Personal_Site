---
title: "Outer Stellar notes"
description: "Confirmed facts Challenge: SEKAI 2026 / Blockchain / Outer Stellar, author snwo. Description: \"honest player is bridging their funds ...\" Current target domain from user: https://outer-stellar-c7175533c8ab.i…"
published: "2026-06-27"
updated: "2026-06-27"
event: "sekai2026"
category: "Blockchain"
kind: "field-note"
status: "partial"
tags: ["Blockchain", "sekai2026", "Field notes"]
readingTime: 3
wordCount: 639
featured: false
sourcePath: "~/ctf/sekai2026/blockchain-outer-stellar/notes.md"
---

# Outer Stellar notes

## Confirmed facts
- Challenge: SEKAI 2026 / Blockchain / Outer Stellar, author snwo.
- Description: "honest player is bridging their funds ..."
- Current target domain from user: `https://outer-stellar-c7175533c8ab.instancer.sekai.team`.
- Previous target domain no longer used: `https://outer-stellar-8f0b9fee1814.instancer.sekai.team`.
- Old target domain should not be used: `https://outer-stellar-c4f8af79a9a2.instancer.sekai.team`.
- Local files at start: `README.md`, `blockchain_outer-stellar.tar.gz`, empty `artifacts/`, `dumps/`, `extracted/`, `scratch/`.
- No `AGENTS.md` found under parent tree.
- Live instance (new target) spawned successfully:
  - Integrated node id: `607c07a6-d637-4d6e-851e-ac3c395ab2f9`
  - Stellar uuid: `15addfd4-f986-4487-9fdb-1af33504ef13`
  - Sui uuid: `d3c764a4-cf48-4d0f-a862-212090ef2499`
  - Stellar bridge contract: `CAVDHEJHNZIKIOEGGW2CHPUH2TYTVOM3KGCKGZWFOPX346IQPH62MQKO`
  - Stellar SAC id: `CACQ2ZFNK3R6EOYS4X53OT3BWJ3IB44PIW4AUPRWQS7V7ELDHKM6XHTD`
  - Sui package: `0x636bde380c96645681d6cc1ee0a3caff972c2d565311aa2582402c09ee8e9d2c`
  - Sui bridge object: `0x750ad159d6244bee87c9aa2a0ffcca0dc6f8b75cfb8d835a123f2b7b8c273f3b`
  - Stellar player: `GDECCFJGN77RLNGT7WUOSJMZMN7NX5KIO4KPMZZIDNV3ZC5ABJXXVOBF`
  - Sui player: `0x22e7e8390db236f5e13b5e9e1ff07a51c48a2a492d6805b7a98ae16bd99a34cf`

## Commands tried / useful outputs
- `find .. -name AGENTS.md -print` -> no output.
- `find . -maxdepth 3 -type f -print | sort` -> README, tarball, notes.
- `README.md` repeats challenge prompt only; no extra instructions.
- `tar -tzf blockchain_outer-stellar.tar.gz` -> 28 files: Rust `stellar-bridge` contract, Sui Move package `sui_bridge`, and Python instancer/sandbox under `instancer/outerstellar_sandbox`.
- Extracted original tarball into `artifacts/blockchain_outer-stellar/`.
- `curl /info` initially no instance; `curl /new` started spawn; later `/info` returned running instance above. Saved to `dumps/live-info.json`.
- Local `stellar` and `sui` CLIs were absent. Started download of pinned Stellar CLI; canceled pinned Sui CLI download because archive was ~997 MB and too slow. Started `pip install --user stellar-sdk pysui`.
- Source finding: relayer signatures cover `recipient || amount || message_id`, but `fee_recipient` is an unsigned function argument for both `complete_from_sui` and `complete_from_stellar`.
- Source finding: relayer publishes pending Stellar completions (recipient, amount, message id, attestation) during `OUTERSTELLAR_STELLAR_MEMPOOL_DELAY`, before submitting its own transaction.
- Source finding: Sui Move exposes `router_deposit_to_stellar` / `BatchDepositEvent`, but relayer only queries `DepositEvent`.
- Built `solve.py` using pinned `stellar` CLI from `scratch/bin/stellar`, direct Sui Ed25519 signing over `unsafe_moveCall` tx bytes, and pollers for pending Stellar completions / failed Sui attestations.
- Prior run failure mode: Stellar CLI cached or encountered transient `Contract not found` / DNS failures during bridge-readiness checks. Patched `solve.py` to use `--no-cache`, retry HTTP/Sui RPC, extend readiness, and not drop pending attestation IDs after transient failure.
- Found solver bug: `stellar_cmd()` appended `--rpc-url`/`--network-passphrase` after contract function separator `--`, so contract calls could use stale/default RPC config. Patched wrapper to insert RPC options before `--`.
- Runtime observation on `c7175533c8ab`: after first public Sui bridge execute, stale child endpoints returned `not_running` and `/info` showed a new spawn. Patched `solve.py` to use longer Sui execute timeout and start watcher threads only after Sui claim/split checkpoint windows finish.
- Runtime observation: Sui claim can succeed, but immediate optional `unsafe_splitCoin` may race object availability (`unable to fetch object`). Patched split as best-effort; solver continues with the unsplit 100 SEKAI coin.
- Runtime observation: split-created 1-SEKAI deposits create too many Sui checkpoints and can cause instance recycling. Patched solver to disable splitting by default and only deposit the initial Sui claim coin plus stolen Sui fee coins, with stability waits after each deposit.
- Runtime observation: local worker and main loop could still overlap Sui move-call build/execute windows. Patched solver to hold an RLock across the full Sui build+execute path and add a 45s cooldown between Sui bridge transactions; extended main exploit window to 900s.

## Failed hypotheses
- None fully failed. Pure player claim + bridge yields ~200 Stellar SEKAI, short of 250, so exploit needs honest-player fee theft or another value source.

## Current hypothesis
- Primary exploit: claim/bridge player funds, then front-run pending Stellar `complete_from_sui` transactions with `fee_recipient` set to the player Stellar account to keep player bridge fees and steal honest-player Stellar-side fees. Need at least 250 Stellar SEKAI for `/flag`.
- Secondary candidates if value is short: Stellar `complete_from_sui` buffers untrusted recipients without marking `message_id` processed; Sui batch deposit mismatch can exhaust `bridge_close`.

## Next tests
- Finish installing usable Stellar/Sui transaction tooling.
- Create Stellar SEKAI trustline for player.
- Claim on Stellar and Sui, bridge Sui claim to Stellar with player as `fee_recipient`.
- Poll pending Stellar tx endpoint and submit front-run completions with player as `fee_recipient`.
- Check `/flag`.
