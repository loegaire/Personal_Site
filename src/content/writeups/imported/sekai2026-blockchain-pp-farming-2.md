---
title: "Blockchain Pp Farming 2 — Field Notes"
description: "Use the pp-farming flag to decrypt the attachment. First solver gets a $100 bounty :)"
published: "2026-06-28"
updated: "2026-06-28"
event: "sekai2026"
category: "Blockchain"
kind: "field-note"
status: "solved"
tags: ["Blockchain", "sekai2026", "Field notes"]
readingTime: 2
wordCount: 355
featured: false
sourcePath: "~/ctf/sekai2026/blockchain-pp-farming-2/notes.md"
---

PP Farming 2

Blockchain

Author: brokenappendix
Ethereum
50

NORMAL
Description

I fixed the issue. I think...
Note

Use the pp-farming flag to decrypt the attachment. First solver gets a $100 bounty :)

## 2026-06-28 solve notes

### Confirmed facts
- Zip password from prior challenge: `SEKAI{3Z_re3ntr4ncy_atTack5}`.
- RPC main HTTP: `https://eth.chals.sekai.team/PNabyNCJDEdXxYGbHpELkaAs/main`.
- RPC main WS: `wss://eth.chals.sekai.team/PNabyNCJDEdXxYGbHpELkaAs/main/ws`.
- Player private key: `9a9f2415c170d9ce7a5e7d79a519bea59028b1ef4213bdda8618798a6f9e3091`.
- Target contract: `PerformancePointATM` at `0x4A68cDa2f9C2EFCb12DE501883d434BE53f3a918`.
- `cast`, `forge`, and `anvil` are installed at `/home/thinh/hypr-config/.foundry/bin`.
- No `AGENTS.md` found in the challenge directory; original artifact is `blockchain_pp-farming-2.zip`.

### Workflow
- Preserve the original zip unchanged.
- Extract challenge material to `artifacts/`.
- Put scratch experiments in `scratch/`, chain dumps in `dumps/`, and final exploit in `solve.py` if code is needed.

### Current hypothesis
- Blockchain/Web3 challenge. Need inspect source/ABI to identify the PP Farming 2 "fixed reentrancy" issue and exploit the remote chain state.

### Source inspection
- Extracted with `7z` to `artifacts/blockchain_pp-farming-2/`.
- `Deploy.s.sol` deploys `PerformancePointHelper`, then `PerformancePointATM` funded with `10 ether`.
- `PerformancePointATM.withdrawPP()` is protected by `locked`, reads `scores[msg.sender]`, delegatecalls `performancePointHelper.processWithdrawal(msg.sender, score)`, then zeroes the score.
- Fallback delegates all other selectors to `performancePointHelper`, blocking only `processWithdrawal(address,uint256)`.
- Helper layout:
  - slot 0: `id_number`
  - slot 1: `atm`
  - slot 2: `helping`
- ATM layout:
  - slot 0: `scores` mapping
  - slot 1: `performancePointHelper`
  - slot 2: `locked`
- Therefore calling helper `setATM(address)` through ATM fallback writes slot 1 in ATM context and overwrites `performancePointHelper`.

### Exploit hypothesis
1. Deploy malicious helper with `processWithdrawal(address,uint256)` that sends `address(this).balance` to `recipient` and returns true.
2. Call ATM fallback as `setATM(malicious)` to overwrite slot 1.
3. Donate 1 wei to self so `withdrawPP()` passes `score > 0`.
4. Call `withdrawPP()`; delegatecall executes malicious helper in ATM context and drains all ETH.

### Remote execution
- Player address from provided key: `0x446E7704A8D17293863DB1c6f542d88200d217f9`.
- Chain id: `31337`.
- Initial ATM balance: `10.000000000000000000 ETH`; `isSolved() == false`.
- Initial ATM slot 1/helper: `0x1d55fe2c2d0de4fbd1ae1c0435f0f1cc2e1328ae`.
- Deployed malicious helper `DrainHelper` at `0x67F82F989DcadC077990529530A23A6f5F81fdaf`.
  - Tx: `0xc7bcdf965760914c7add46dfdc4ff316e6e4c65f0cd412eaefcb46f16977daaa`.
- Called `setATM(address)` on ATM with malicious helper.
  - Tx: `0x1d0069acad9b30dbbba68e72806364662c8ae47a8c7feb1096a205787689bbc8`.
  - Verified slot 1 became `0x67f82f989dcadc077990529530a23a6f5f81fdaf`.
- Called `donatePP(player)` with `1 wei`.
  - Tx: `0x8af3c63677073c56e93b24e7cfda57705df808029a8df22c7a506dd20eb7c039`.
- Called `withdrawPP()`.
  - Tx: `0x05d036ca3fd64ebdcf87bd0df24f59785e824ca78261c089e6690c8b176c207b`.
- Final ATM balance: `0`; `isSolved() == true`; player PP score is `0`.

### Solver
- Added `scratch/DrainHelper.sol`.
- Added `solve.py`; current remote run reports already solved and balance `0`.
