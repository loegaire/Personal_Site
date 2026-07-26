---
title: "UniqueNFT Challenge - ERC-7702 Reentrancy Exploit"
description: "The UniqueNFT smart contract enforces a \"one NFT per address\" rule but has a critical reentrancy vulnerability that can be exploited."
published: "2026-04-05"
updated: "2026-04-05"
event: "ethernaut"
category: "Blockchain"
kind: "writeup"
status: "solved"
tags: ["Blockchain", "ethernaut", "Writeup"]
readingTime: 3
wordCount: 609
featured: false
sourcePath: "~/ctf/ethernaut/SOLUTION.md"
---

# UniqueNFT Challenge - ERC-7702 Reentrancy Exploit

## Challenge Overview

The UniqueNFT smart contract enforces a "one NFT per address" rule but has a critical reentrancy vulnerability that can be exploited.

### Vulnerability Details

1. **Missing Reentrancy Guard on EOA Path**
   - `mintNFTSmartContract()` has `@nonReentrant`
   - `mintNFTEOA()` does NOT have `@nonReentrant` ❌

2. **Unsafe Callback Order (CEI Violation)**
   - Balance check happens BEFORE external call
   - `_mintNFT()` calls `checkOnERC721Received()` before updating state
   - This allows reentrancy during the callback

3. **EOA-Only Check**
   - `require(tx.origin == msg.sender, "not an EOA")` 
   - Can be bypassed using ERC-7702 delegated execution

### Exploitation Strategy

**ERC-7702 Authorization** allows a contract to act as a smart wallet by:
- Signing an authorization that delegates code execution to a contract
- The contract can call functions while `tx.origin` remains the EOA
- This satisfies the `tx.origin == msg.sender` check in delegated context

**Reentrancy Attack** works because:
1. First `mintNFTEOA()` call starts
2. Balance check passes (balance = 0)
3. Before state updates, `onERC721Received()` callback is invoked
4. During callback, we reenter `mintNFTEOA()`
5. Balance still appears as 0 (second reentrancy)
6. Second mint succeeds
7. State finally updates with both NFTs minted

## Solution Files

### Core Files
- **solve-uniquenft.mjs** - Main exploit script (run this!)
- **ReentrancyAttacker.sol** - Attacker contract source code
- **Out directory** - Pre-compiled bytecode

### How it Works

The exploit:
1. Deploys a `ReentrancyAttacker` contract
   - Implements `onERC721Received()` callback
   - Calls `mintNFTEOA()` during the callback (reentrancy)
   - Uses counter to prevent infinite recursion

2. Signs an ERC-7702 authorization
   - Delegates execution to the attacker contract
   - Allows the contract to appear as an EOA for that transaction

3. Sends exploit transaction
   - Calls `mintNFTEOA()` on UniqueNFT
   - Protected by ERC-7702 authorization
   - Triggers the reentrancy vulnerability
   - Mints 2 NFTs in one transaction

## Prerequisites

Before running the exploit, ensure:

1. ✅ **Fresh Instance**
   - Create a NEW instance from the Ethernaut UI
   - The target address must have `balanceOf(you) == 0`
   - If you already minted once, you need a new instance

2. ✅ **EOA with ETH**
   - Need a private key with ETH balance for gas (~$0.01 worth)
   - Can use a burner account or test key

3. ✅ **Network**
   - Exploit targets Sepolia testnet
   - Requires ERC-7702 support (modern viem versions)

## Usage

### Basic Run (with existing config)
```bash
node solve-uniquenft.mjs
```

### With Custom Instance
```bash
INSTANCE_ADDRESS=0x... PRIVATE_KEY=0x... node solve-uniquenft.mjs
```

### Environment Variables
- `INSTANCE_ADDRESS` - Your UniqueNFT instance from Ethernaut
- `PRIVATE_KEY` - Your EOA private key (hex format)
- `RPC_URL` - (Optional) Override Sepolia RPC URL

## Expected Output

```
======================================================================
  UniqueNFT Challenge - ERC-7702 Reentrancy Exploit
======================================================================

📋 Configuration:
   EOA: 0xBd85...
   Target: 0x5Bb8...
   Network: Sepolia

🔍 Pre-flight checks:
   Current NFT balance: 0
   ✓ Address is fresh

⚙️  Step 1: Deploying ReentrancyAttacker...
   Tx: 0x...
   Contract: 0x...

🔐 Step 2: Creating ERC-7702 Authorization...
   ✓ Authorization signed

🚀 Step 3: Executing Exploit Transaction...
   Tx: https://sepolia.etherscan.io/tx/0x...
   ⏳ Waiting for confirmation...
   ✓ Confirmed!

📊 Step 4: Verifying Results...
   Final balance: 2

╔══════════════════════════════════════════════════════════════════════╗
║           🎉 EXPLOIT SUCCESSFUL! 🎉                                ║
╚══════════════════════════════════════════════════════════════════════╝

   ✅ You own 2 NFTs from the same address!
   ✅ The "one-per-address" invariant has been bypassed!

📝 Results saved to: exploit-results.json

✨ Challenge solved! Time to submit the instance in Ethernaut.
```

## Common Issues & Fixes

### "address already owns an NFT"
**Problem:** You already minted once on this address
**Solution:** Create a NEW instance in the Ethernaut UI UI

### "Transaction reverted"
**Problem:** Balance check failed or EOA check failed
**Solution:**
- Verify fresh instance (balance = 0)
- Check RPC URL is working
- Ensure account has sufficient ETH

### "ERC-7702 not supported"
**Problem:** Viem version doesn't support ERC-7702 or network doesn't support EIP-7702
**Solution:**
- Update viem: `npm install viem@latest`
- Ensure using Sepolia testnet (mainnet support TBD)

## Technical Details

### ReentrancyAttacker Contract

```solidity
contract ReentrancyAttacker is IERC721Receiver {
    IUniqueNFT public immutable target;
    uint256 public entered;

    function onERC721Received(...) external override returns (bytes4) {
        entered += 1;
        if (entered == 1) {
            target.mintNFTEOA(); // Reentering here!
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}
```

### Compiled Bytecode
- **Length:** 1,549 bytes (including constructor params)
- **Constructor:** Takes target address as parameter
- **Functions:**
  - `onERC721Received()` - ERC721 callback hook
  - `target()` - View function for target address
  - `entered()` - View function for entry counter

### ERC-7702 Authorization
- **Type:** EIP-7702 delegated execution
- **Purpose:** Makes contract appear as EOA for tx.origin check
- **Signature:** ECDSA signed by the EOA
- **Scope:** Single transaction

## Learning Resources

- **EIP-7702:** https://eips.ethereum.org/EIPS/eip-7702
- **Reentrancy Vulnerability:** https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy
- **CEI Pattern:** Check-Effects-Interactions
- **Ethernaut:** https://ethernaut.openzeppelin.com/

## Files Generated After Exploit

- `exploit-results.json` - Transaction hashes and verification data

## Final Step

After successful exploit:
1. ✅ Run the solver script (get success output)
2. ✅ Save the transaction hash
3. ✅ Submit to Ethernaut to claim the level

## References

Original Ethernaut Challenge: [Link]
Solution Article: [Link]
