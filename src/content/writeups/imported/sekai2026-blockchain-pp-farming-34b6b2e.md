---
title: "Blockchain Pp Farming — Field Notes"
description: "Challenge: SEKAI 2026 blockchainpp-farming. Category: blockchain/Web3. Provided RPC HTTP: https://eth.chals.sekai.team/SvaQgXyTJezkFWgRkBOPPxaC/main. Provided RPC WS: wss://eth.chals.sekai.team/SvaQgXyTJezkF…"
published: "2026-06-28"
updated: "2026-06-28"
event: "sekai2026"
category: "Blockchain"
kind: "field-note"
status: "solved"
tags: ["Blockchain", "sekai2026", "Field notes"]
readingTime: 3
wordCount: 526
featured: false
sourcePath: "~/ctf/sekai2026/blockchain_pp-farming/notes.md"
---

## Baseline

- Challenge: SEKAI 2026 `blockchain_pp-farming`.
- Category: blockchain/Web3.
- Provided RPC HTTP: `https://eth.chals.sekai.team/SvaQgXyTJezkFWgRkBOPPxaC/main`.
- Provided RPC WS: `wss://eth.chals.sekai.team/SvaQgXyTJezkFWgRkBOPPxaC/main/ws`.
- Player private key: `70d47705d2481762688b85144297e03a2a54f0086f407910ec91869cffe9a692`.
- Target contract: `PerformancePointATM` at `0xF2E774dAfDdd8Cee3901A06e6F05BebF880E56fE`.
- Local files initially: `blockchain_pp-farming.tar.gz`, empty `notes.md`, dirs `artifacts/`, `dumps/`, `extracted/`, `scratch/`.

## Current Plan

- Inspect archive/source and ABI.
- Query live chain state and deployed bytecode.
- Find solve condition and contract bug.
- Implement reproducible `solve.py`.
- Write quick reproduction writeup.

## Confirmed Facts

- Archive contains:
  - `PerformancePointATM.sol`
  - `Deploy.s.sol`
- `PerformancePointATM` source:
  - `scores[address]` tracks donated wei.
  - `donatePP(address)` adds `msg.value` to chosen address score.
  - `withdrawPP()` reads score, sends ETH to `msg.sender` with `call`, then sets score to zero.
  - `isSolved()` returns `address(this).balance == 0`.
- Deployment script funds the ATM with `10 ether`.
- Live RPC facts:
  - Chain ID: `31337`.
  - Player address from supplied private key: `0x74f03ddC651cd63eA6566875a9FC680e80b668F6`.
  - Player balance: `1000000000000000000000` wei.
  - ATM balance before exploit: `10000000000000000000` wei.
  - `isSolved()` before exploit: `false`.
  - Player score before exploit: `0`.

## Hypothesis

- Vulnerability: reentrancy in `withdrawPP()` because the external ETH transfer happens before `scores[msg.sender] = 0`.
- Exploit path: deploy attacker contract, donate `1 ether` to attacker score, call `withdrawPP()`, and reenter from `receive()` while ATM balance is at least `1 ether`.

## Commands Tried

- `tar -tzf blockchain_pp-farming.tar.gz`:
  - Archive contains `Deploy.s.sol` and `PerformancePointATM.sol`.
- `cast chain-id --rpc-url $RPC`:
  - Returned `31337`.
- `cast wallet address --private-key $KEY`:
  - Returned player `0x74f03ddC651cd63eA6566875a9FC680e80b668F6`.
- `cast balance $ATM --rpc-url $RPC`:
  - Before exploit: `10000000000000000000`.
- `cast call $ATM "isSolved()(bool)" --rpc-url $RPC`:
  - Before exploit: `false`.
- First `forge create scratch/PPFarmAttacker.sol:PPFarmAttacker ...` failed because Foundry resolved the relative path from a parent root (`/home/thinh/ctf/scratch/...`).
- Retried with absolute source path:
  - Dry run succeeded, but did not broadcast without `--broadcast`.
- Broadcast deployment:
  - Attacker: `0xE67811970C977b194f7b55565af7015b010436B8`.
  - Tx: `0xf784cf6e5ecdfc0f96a1e4e2df9a32be04b73898723011dd0838f7eae40311bb`.
- Exploit transaction:
  - `cast send $ATTACKER "attack()" --value 1ether --gas-limit 5000000 ...`
  - Tx: `0x1e0e2c67fecdb740f195bff54929dca5a05fa3bbc03d9b4263055e0d53ffd0aa`.
  - Status: success.

## Result

- ATM balance after exploit: `0`.
- Attacker balance after exploit: `0` because it swept funds back to the player.
- Player balance after exploit: `1009999451929237307008` wei.
- `isSolved()` after exploit: `true`.
- Probed `https://eth.chals.sekai.team/SvaQgXyTJezkFWgRkBOPPxaC/{flag,check}`; both returned JSON-RPC-style `405 Method Not Allowed`, so no separate flag endpoint was exposed there.

## Artifacts Created

- `scratch/PPFarmAttacker.sol`: exploit helper contract.
- `solve.py`: reproducible solver using Foundry `forge`/`cast`.
- `WRITEUP.md`: reproduction writeup.
- `skill.md`: reusable challenge-pattern note.

## New Instance: 2026-06-28

- Provided RPC HTTP: `https://eth.chals.sekai.team/YrQMaAyyHYXQuzUawKBpucBh/main`.
- Provided RPC WS: `wss://eth.chals.sekai.team/YrQMaAyyHYXQuzUawKBpucBh/main/ws`.
- Player private key: `842c56883938fc385dd1ecfb5f33f1a4ee0a1cbc20eabb649396839696ef46ce`.
- Player address: `0x497E1C7937C5f8fe83D602af4aA9e7B6dc0f5534`.
- Target contract: `PerformancePointATM` at `0x6093b52c9421Dd396Ce6E5C4b6579962E99f426C`.
- Chain ID: `31337`.
- Initial ATM balance: `10000000000000000000` wei.
- Initial `isSolved()`: `false`.
- Plan: rerun existing `solve.py` with env overrides for the new RPC/key/target.

## Corrected New Instance: 2026-06-28

- User said previous new URLs were wrong.
- Corrected RPC HTTP: `https://eth.chals.sekai.team/PzErvfFQNOwYhgGvnWzZcIsh/main`.
- Corrected RPC WS: `wss://eth.chals.sekai.team/PzErvfFQNOwYhgGvnWzZcIsh/main/ws`.
- Player private key: `461c82142380e9779d655460b58fd5fac562bad4a8e811642fdd1e9ca88b5a86`.
- Player address: `0x329442Fd363Fb124F12211a34e8e1c355cBe8385`.
- Target contract: `PerformancePointATM` at `0x93aa06A87c0A2fA71864Dd654503F7Ae1168f434`.
- Chain ID: `31337`.
- Initial ATM balance: `10000000000000000000` wei.
- Initial `isSolved()`: `false`.
- Player balance: `1000000000000000000000` wei.
- Ran:
  - `RPC_URL='https://eth.chals.sekai.team/PzErvfFQNOwYhgGvnWzZcIsh/main' PRIVATE_KEY='461c...' TARGET='0x93aa06A87c0A2fA71864Dd654503F7Ae1168f434' python3 solve.py`
- Attacker deployed at `0x7ABb2E5DCa0Ab51eFF50312d4f695BB7DcdBfE93`.
- Deploy tx: `0xa5d4f087176f5e24580bfd6cb88020b02e7394fbc8f87f826a77e183d887e4b5`.
- Exploit tx: `0xd076df4ab838caa31c1dd347d6bea8cfba0ba4b23a8ea832eef40cad3d4ff399`.
- Final ATM balance: `0`.
- Final `isSolved()`: `true`.
- Probed corrected RPC host-local endpoints after solve:
  - `/flag`: JSON-RPC `405 Method Not Allowed`.
  - `/check`: JSON-RPC `405 Method Not Allowed`.
  - `/verify`: JSON-RPC `405 Method Not Allowed`.
  - `/api/challenges/check-solution`: JSON-RPC `404 Not Found`.
- Conclusion: flag retrieval is likely via the SEKAI website session/API, not directly from the RPC host.

SEKAI{3Z_re3ntr4ncy_atTack5}
