---
title: "SekaiCTF 2026 skyblock notes"
description: "Confirmed facts Target: skyblock.chals.sekai.team:25565. Java/Paper server, status ping reports Skyblock SekaiCTF 2026, version Paper 26.1.2, protocol 775. TCP connectivity works. Challenge description point…"
published: "2026-06-28"
updated: "2026-06-28"
event: "sekai2026"
category: "Miscellaneous"
kind: "field-note"
status: "partial"
tags: ["Miscellaneous", "sekai2026", "Field notes"]
readingTime: 7
wordCount: 1376
featured: false
sourcePath: "~/ctf/sekai2026/minecraft/skycheck/notes.md"
---

# SekaiCTF 2026 skyblock notes

## Confirmed facts
- Target: `skyblock.chals.sekai.team:25565`.
- Java/Paper server, status ping reports `Skyblock | SekaiCTF 2026`, version `Paper 26.1.2`, protocol `775`.
- TCP connectivity works.
- Challenge description points to automated liquidity offers in `/tradebook`; current hypothesis is a tradebook arbitrage/mispricing route.
- Workspace package versions from `npm ls`:
  - top-level `minecraft-protocol@1.66.0` from `PrismarineJS/node-minecraft-protocol#pull/1487/head`.
  - `minecraft-protocol` has nested `minecraft-data@3.110.1` from `mneuhaus/node-minecraft-data`.
  - `mineflayer@4.37.1` dedupes to the same top-level `minecraft-protocol@1.66.0`.
  - `mineflayer` also pulls top-level `minecraft-data@3.111.0`.
- `notes.md` was empty at start of this run. Only `AGENTS.md` found is under `node_modules/macaddress`; it is scoped to that dependency and not relevant to challenge code.
- `mineflayer` forced to `version: '26.1.2'` still fails before connecting:
  - `Error: Do not have data for 26.1.2` from `prismarine-registry`.
- Raw `minecraft-protocol` auto-handles `login_acknowledged`, `select_known_packs`, and keepalives.
- Server shows an AuthMe registration dialog in configuration state:
  - action id `authme:prejoin-register/submit`
  - text inputs `password`, `confirm`
- `client.write('custom_click_action', ...)` is broken for this protocol PR: server disconnects with decoder error for `serverbound/minecraft:custom_click_action`.
- Upstream issue confirms `custom_click_action` NBT is length-prefixed, while current protocol data encodes it as boolean optional NBT.
- Manual raw packet works:
  - packet id `0x08` in configuration state
  - VarInt/string action id
  - VarInt length of anonymous NBT payload
  - anonymous NBT compound with `password` and `confirm`
- After manual registration, server sends `clear_dialog`, `finish_configuration`, and the client reaches play state.
- Reusing registered account `ctfbot_7545` with password from scratch account reaches play and AuthMe says `Successful login!`.
- New registration attempt `ctfbot_32505` reached play but AuthMe refused it:
  - `You have exceeded the maximum number of registrations (1/1 ctfbot_7545) for your connection!`
  - command use then failed with `In order to use this command you must be authenticated!`
- `/tradebook` opens a GUI titled `Trading Book` with window id 1, inventory type 5.
- Tradebook page slots 0-44 contain listings; slots 48/49/50/53 are controls: `Create Listing`, `Claim Coins`, `Your Listings`, `Next Page`.
- Listing lore includes `Seller: ...`, `Price: ... coins`, and bot listings include `Bot Listing` plus `Automated liquidity order`.
- Tested exact username `player` with password `S3kai_player_38wgn2fl`:
  - Dialog was `Register` and client reached play.
  - AuthMe then refused it with `You have exceeded the maximum number of registrations (1/1 ctfbot_7545) for your connection!`
  - User withdrew the username preference; continue using registered fallback `ctfbot_7545`.
- Added `scratch/skyclient.js` raw client helper and `scratch/enumerate_tradebook.js` enumerator.
- The 26.1.2 protocol PR can misparse unrelated item-component packets such as `entity_equipment`, `set_player_inventory`, and `set_cursor_item`; helper patches those to raw packet bodies in-process.
- Tradebook enumeration succeeded:
  - 5 pages total.
  - 195 parsed listings.
  - dump: `dumps/tradebook_pages_1782634821769.json`.
  - low bot prices include `cactus_boots` 9, `cactus_helmet` 13, `cactus_chestplate` 18, `enchanted_bone_meal` 64 for 576, `raw_cod` 64 for 1280.
  - high human listings include many near max-int prices, likely decoys unless bots buy from listings.
- Active account is `scratch/account.json`: `ctfbot_7545` / `S3kai_38wgn2fl`. User explicitly asked to continue using `ctfbot` names.
- `/coins` showed `Coins: 0`; `/skills` showed Farming/Mining/Fishing level 0; `/balance`, `/bal`, `/money`, `/sell`, `/shop` are unknown commands.
- Buying a tradebook listing opens `Confirm Purchase`; confirm dye is slot 29 and fails at 0 coins with `You need N coins to buy that.`
- Create Listing opens `Choose Item To List`; with empty inventory it shows slot 22 hopper and says only tradeable Skyblock custom items can be listed.
- Claim Coins says `No Trading Book coins to claim.`
- `/mine` teleports to the public mine at roughly `(0.5, 65, -41.5)` and gave a stone pickaxe once.
- `/is` teleports to a private island at roughly `(104960.5, 65, 0.5)` but no starter resources were observed beyond the existing stone pickaxe.
- Naive `block_dig` probes around `(0,65,-41)` did not change `/coins`; likely targeted air/protected blocks, used too short a delay, or missed required movement/animation/sequence behavior.
- Raw chunk dumps were saved under `dumps/mine*_chunk*.bin`. Empty-ish chunks can parse with `prismarine-chunk` if the 26.1.2 registry is shimmed to 1.21 and chunk height is set to 512, but non-empty chunks still hit `Bits per block is too big`.
- Center mine chunk `(0,-3)` dump length is 432 bytes and starts with repeated `0000000000000102293fff80ff80ff80ff80`, suggesting section/container format still needs decoding.
- Manual-player handoff scan:
  - SKlauncher exists at `~/game/minecraft/SKlauncher-3.2.18.jar`.
  - `.minecraft` has SKlauncher data and versions `1.21.10`, `1.21.11`, and `fabric-loader-0.18.1-1.21.10`.
  - Selected local profile is `1.21.11`; no local `26.1.2` version directory was found.
  - Launcher log confirms previous successful launch of `1.21.11` with bundled Java at `~/.minecraft/runtime/java-runtime-delta/linux/java-runtime-delta/bin/java`.
  - For this server, manual client likely needs SKlauncher latest release / version picker to download `26.1.2`, because protocol bots using `1.21.11` got `Outdated client! Please use 26.1.2`.
- User manually collected funds on `ctfbot_7545`: reported balance is 1723 coins.
- Bought `cactus_boots` from bot listing for 9 coins:
  - chat confirmed `Bought Cactus Boots for 9 coins.`
  - item appeared as player inventory slot 82 in the tradebook window.
  - a later item-component parse bug interrupted the helper before dumping the create window; continue with direct slot click.
- Create Listing flow:
  - click inventory slot 82 after buying boots => chat prompts `Enter listing price for Cactus Boots.` and `Type cancel to abort.`
  - sending chat message `10` created listing: `Listed Cactus Boots for 10 coins.`
  - listing appeared on page 1 as own `Cactus Boots` listing; not bought within ~12 seconds.
- Cactus Boots listing at 10 coins was later cancelled from `Your Listings`; chat confirmed `Cancelled listing and reclaimed Cactus Boots.`
- High-price purchase path does not wrap at 32-bit:
  - attempted bot `Rookie Hoe` at 4,294,967,297 coins.
  - confirm button showed the full price and server replied `You need 4,294,967,297 coins to buy that.`
  - balance stayed at 1714.
- Bought `Rookie Pickaxe` from a bot for 60 coins, then listed it at 61 coins:
  - buy confirmed `Bought Rookie Pickaxe for 60 coins.`
  - balance became 1654.
  - list confirmed `Listed Rookie Pickaxe for 61 coins.`
  - listing was not sold during later probes.
- Self-buy is blocked:
  - buying own `Rookie Pickaxe` listing opened normal confirmation, but confirm replied `You cannot buy your own listing.`
  - balance remained 1654.
- Direct `/trade` to bot/player-looking sellers tested so far (`Qyn`, `mixy1`, `Pindos`, `CodexSky01`) returns player not online.
- Full tradebook scan with `scratch/scan_tradebook_full.js 120` reached 33 pages / 1475 listings and found no Flag listing.
- Public chat repeatedly broadcasts `<player> purchased Flag!` followed by firework death messages, so the flag is bought from an in-world merchant, not from `/tradebook`.
- `/help skyblock` leaks hidden admin-looking commands:
  - `/givecustomitem <player> <item> [<count>]`
  - `/setcoins <player> <coins>`
  - `/setskilllevel <player> (farming|mining|fishing)`
  These are not in the Brigadier command tree and `chat_command` returns unknown; raw slash chat does not execute them usefully.
- Hub entity scan found named villager merchants:
  - `Flag Merchant` entity id usually 1 at `(-111,81,5)`, UUID `cf543500-9a65-42a3-bbfb-95edeb4f6e2f`.
  - `Miner Merchant` at `(-117,81,30)`.
  - `Farm Merchant` at `(-162,82,-31)`.
  - `Fishing Merchant` at `(-135,81,7)`.
- Raw movement fix:
  - `position_look` packets are corrected/rubber-banded.
  - `position`-only packets are accepted enough to walk toward the Flag Merchant without correction.
  - target stand position needs `y=81`, not `y=82`, or the account can get disconnected after the walk.
- Raw entity interaction is still unresolved:
  - Decompiled local `~/.minecraft/versions/26.1.2/26.1.2.jar` confirms `ServerboundInteractPacket(entityId, hand, Vec3.LP_STREAM_CODEC location, usingSecondaryAction)`.
  - Tried PR-schema use_entity with several hit vectors, raw old-style interact/interact_at layouts at packet ids `0x19`/`0x1a`, `attack`, held slot + look + swing + use. None opened the merchant GUI.
  - Likely remaining options are packet-capturing a real client click via local proxy or having the user manually click the merchant.

## Current hypothesis
- Raw `minecraft-protocol` can be used reliably with a one-packet workaround for AuthMe dialog login/registration.
- Tradebook is a sell-listing market with bot liquidity listings. Buy/list/cancel flows work, but own self-buy and obvious 32-bit price wrap are blocked.
- The flag route is the `Flag Merchant` in the hub. The account has 1654 coins; this may be enough if the flag price is 1337/1500-ish, but the bot still cannot open the merchant GUI.
- The original tradebook/economy route may be to buy underpriced liquidity items and sell to the Farm/Miner/Fishing merchants, but merchant GUI interaction has the same raw-click blocker.

## Next tests
- Fastest finish: have the user log into `ctfbot_7545`, run `/hub`, walk to `Flag Merchant` at `(-111,81,5)`, right-click, and buy Flag; capture any private flag text/item lore.
- If automating completely, build a TCP proxy, have a real client click the Flag Merchant through it, decode compressed serverbound play packets, and replay the exact entity interaction sequence.
- Continue investigating economy only after merchant click works, since selling/buying flag both depend on merchant GUIs.
