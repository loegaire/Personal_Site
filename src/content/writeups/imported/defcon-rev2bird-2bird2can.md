---
title: "2bird2can — Field Notes"
description: "You are working on a Unity IL2CPP reverse-engineering CTF challenge."
published: "2026-05-23"
updated: "2026-05-23"
event: "defcon"
category: "Reverse Engineering"
kind: "field-note"
status: "reference"
tags: ["Reverse Engineering", "defcon", "Field notes"]
readingTime: 17
wordCount: 3592
featured: false
sourcePath: "~/ctf/defcon/rev2bird/2bird2can/notes.md"
---

You are working on a Unity IL2CPP reverse-engineering CTF challenge.

High-level situation:
- I have a Unity WebGL client + Linux Unity server project.
- I can run it, but interacting with it is unclear: opening the HTTP link only shows a generated map image, and ws://localhost:7777 is a WebSocket endpoint, not a browser page.
- The server binary is an IL2CPP Unity Linux build.
- I opened GameAssembly.so in IDA, but there are no useful managed symbols.
- Il2CppDumper failed because metadata version is 39.
- Cpp2IL recovered C# type/method/field names, but many methods are stubs with `throw null`.
- Your job is to use these recovered C# files plus IDA MCP to rename important native functions in GameAssembly.so, recover the game mechanics, and solve the challenge.

Current decompiled/recovered C# tree contains:

- Assembly-CSharp.csproj
- Config/
- Cam/
- __GEN/
- MapRenderer/
- Network/
- Player/
- ProceduralGen/
- Properties/
- UI/
- World/

Important files to inspect first:

1. Network/ServerManager.cs
   - Main server-side manager.
   - Highest priority.
   - Look for fields, methods, NetworkVariables, prefabs, chunk/seed/flag/chest logic.
   - Important methods likely include:
     - OnNetworkSpawn
     - GenerateSeed
     - GenerateFlagPosition
     - StartMapHttpServer
     - GenerateMapImage
     - PrepareFlagChest
     - SpawnFlagChest
     - RevealFlagChestIfVisible
     - OnClientConnected
     - GetSpawnPositionForJoin
     - OnClientDisconnected
     - Update
     - ServerTick
     - RefreshPlayerList
     - SetWindInput

2. Network/AutoStartNetwork.cs
   - Handles whether the build starts as server/client.
   - Parses DEFAULT_SERVER_URL, MAP_HOST, ports, WebSocket URL.
   - Important methods likely include:
     - Start
     - ParseConnectionArgs
     - ShouldStartAsServer
     - ParseDefaultUrl
     - TryParseUrl
     - ApplyTransport
     - EnablePlayerCap
     - ParseTlsCommonName

3. Network/MapHttpServer.cs
   - HTTP map image server.
   - Server logs showed it listens on http://+:7778/.
   - Understand how map.png is exposed.

4. Player/PlayerController.cs
   - Player movement/input/network RPC logic.
   - Search for:
     - ServerRpc
     - ClientRpc
     - SetWindInput
     - movement
     - velocity
     - position
     - transform
     - ownership
     - clientId

5. World/FlagChest.cs
   - Chest object logic.
   - Search for reveal/open/interact/flag/HUD logic.

6. World/ChunkManager.cs
   - Chunk loading, visibility, coordinate conversion.
   - Important for reaching or spoofing the flag chunk.

7. World/ChunkNetData.cs
   - Networked chunk data.

8. World/WorldPreview.cs
   - May show how map/chunks are represented client-side.

9. ProceduralGen/WorldRand.cs
   - Procedural RNG/hash helper.
   - Important for reproducing seed/chunk calculations.

10. ProceduralGen/StructureGenerator.cs
    - Procedural structure generation.
    - May compute where islands/chests/flag structures appear.

11. ProceduralGen/StructureData.cs
    - Structure metadata.

12. ProceduralGen/DecorationGenerator.cs and DecorationData.cs
    - Lower priority, but may share RNG/chunk logic.

13. MapRenderer/MapRenderer.cs
    - Generates map image.
    - May be stubbed, but signatures/fields still useful.

14. Config/WorldConfig.cs
    - Constants: chunk size, map radius, speeds, visibility radius, world bounds, spawn config.

15. UI/FlagHUD.cs and UI/MainMenu.cs
    - Client-side display of flag or connection info.

16. Cam/WindController.cs, Cam/CameraController.cs, Cam/GroundRenderer.cs
    - Client-side view/control. Lower priority unless movement depends on wind.

Known runtime observations from server logs:
- Server starts map HTTP server on port 7778.
- Game server starts on WebSocket port 7777.
- Server generated map image at:
  /root/.config/unity3d/DefaultCompany/unity-2bird2can/map.png
- Server log leaked:
  seed: 68071189299049
  flag at chunk (-7545, 1302)
  flag chest prepared at (-120712.00, 20840.00, 0.00)

Use these constants as anchors in IDA/native analysis:
- 68071189299049
- -7545
- 1302
- -120712.0
- 20840.0
- 7777
- 7778
- 16, if chunk-to-world conversion uses 16 units per chunk
- strings or metadata terms:
  - flag
  - chest
  - seed
  - chunk
  - map
  - MapHttpServer
  - DEFAULT_SERVER_URL
  - MAP_HOST
  - ServerManager
  - AutoStartNetwork

IDA target:
- Use IDA MCP on GameAssembly.so.
- Do not focus on linux-server-build.x86_64; that is only the Unity launcher.
- Do not rely on “entry points.” GameAssembly.so is a shared library and IDA shows many exported/callable entries.
- Managed methods are not exported as symbols.
- Your goal is to map recovered C# method names to native functions manually, using:
  - constants
  - call graph
  - decompiler output
  - field access patterns
  - Unity/Netcode API calls
  - method order from recovered C#/metadata
  - runtime behavior

Primary goal:
1. Rename high-confidence functions in IDA.
2. Recover the server-side mechanics.
3. Find the actual way to trigger/retrieve the flag.
4. Produce a clear exploit/solution plan.

Rename priority order:

Phase 1: Server initialization chain
Rename these first if you can identify them confidently:

- Network_ServerManager_OnNetworkSpawn
- Network_ServerManager_GenerateSeed
- Network_ServerManager_GenerateFlagPosition
- Network_ServerManager_GenerateMapImage
- Network_ServerManager_StartMapHttpServer
- Network_ServerManager_PrepareFlagChest

Expected rough call order inside ServerManager.OnNetworkSpawn:

GenerateSeed()
GenerateFlagPosition()
GenerateMapImage()
StartMapHttpServer()
PrepareFlagChest()

Use that call order to identify neighbors in IDA. If you find one of these functions, inspect its callers/callees to locate the others.

Phase 2: Flag/chest mechanics

- Network_ServerManager_SpawnFlagChest
- Network_ServerManager_RevealFlagChestIfVisible
- World_FlagChest_OnNetworkSpawn
- World_FlagChest_Reveal
- World_FlagChest_Interact
- World_FlagChest_Update
- UI_FlagHUD_SetFlag / ShowFlag / equivalent

Questions to answer:
- Is the chest always spawned, or only revealed when close?
- Is visibility based on player distance, chunk distance, loaded chunk, or server tick?
- Does interacting with chest require a client RPC?
- Where is the flag stored?
- Is the flag sent to client over RPC?
- Is the flag read from env/file/hardcoded string?
- Can we trigger the reveal without physically moving there?

Phase 3: Player control/movement/network input

- Player_PlayerController_OnNetworkSpawn
- Player_PlayerController_Update
- Player_PlayerController_FixedUpdate
- Player_PlayerController_SubmitWindInputServerRpc
- Player_PlayerController_SetWindInput
- Network_ServerManager_SetWindInput
- Network_ServerManager_ServerTick
- Network_ServerManager_GetSpawnPositionForJoin
- Network_ServerManager_OnClientConnected

Questions to answer:
- How does player movement work?
- Can the client control wind/input?
- Does the server trust client position?
- Is there any teleport/debug/dev command?
- Is movement slow but deterministic?
- Can we send custom WebSocket/Netcode packets to spoof input or position?
- Is there a server-side cap on speed or distance?

Phase 4: Procedural generation/map

- ProceduralGen_WorldRand_Hash
- ProceduralGen_WorldRand_Range / Next / Random helpers
- ProceduralGen_StructureGenerator methods
- MapRenderer_MapRenderer_RenderMap
- World_ChunkManager methods
- Config_WorldConfig constants

Questions to answer:
- How is the flag chunk generated from seed?
- Is the flag chunk fixed by seed?
- Is there another hidden structure/chest generation rule?
- How does chunk coordinate map to world coordinate?
- Does map.png contain an X/flag marker?
- Can the HTTP map server be queried differently to reveal more?

Phase 5: Networking/startup

- Network_AutoStartNetwork_Start
- Network_AutoStartNetwork_ParseConnectionArgs
- Network_AutoStartNetwork_ShouldStartAsServer
- Network_AutoStartNetwork_ParseDefaultUrl
- Network_AutoStartNetwork_TryParseUrl
- Network_AutoStartNetwork_ApplyTransport
- Network_MapHttpServer_Start / handler methods

Questions to answer:
- What WebSocket/transport library is used?
- Is it Unity Netcode over WebSockets?
- Is the protocol standard Unity Netcode?
- Can we use the normal client and change inputs?
- Can we write a custom client?
- Are there HTTP endpoints besides the map image?

How to use the recovered C# files:
- Treat them as metadata: namespaces, class names, method names, fields, attributes, RPC signatures.
- Do not assume method bodies are real if they are `throw null`.
- Even stub files are useful because fields and method signatures tell you what native code should access.
- Use field names and method order to match native decompiler output.

How to use IDA MCP:
- First verify current IDB is GameAssembly.so.
- Use decompiler and function listing.
- Search for constants and string references where possible.
- Search for xrefs to functions related to Unity logging, Unity Netcode, HTTP/server setup, object spawning, Vector2Int/Vector3 construction.
- When a candidate is found, compare it to recovered C# signature and neighboring calls.
- Rename only when confidence is high.
- If confidence is medium, add a comment instead of renaming.
- Keep a rename log.

For every rename, record:
- address
- old IDA name
- new name
- evidence
- source C# file used
- constants/fields/calls that supported the rename

Example evidence style:
- “Renamed sub_xxx to Network_ServerManager_GenerateFlagPosition because it is called immediately after GenerateSeed candidate and before GenerateMapImage candidate, stores two int fields matching flagChunk, and manipulates constants/chunk coordinates.”
- “Renamed sub_xxx to Network_ServerManager_StartMapHttpServer because it constructs/uses MapHttpServer type and constant 7778.”
- “Renamed sub_xxx to Network_ServerManager_PrepareFlagChest because it writes Vector3 fields matching leaked coordinates and calls SpawnFlagChest candidate.”
- “Renamed sub_xxx to Network_AutoStartNetwork_Start because it calls NetworkManager.StartServer and uses port 7777.”

Important constants/relationships to check:
- World position (-120712.0, 20840.0, 0.0)
- Chunk position (-7545, 1302)
- The conversion may be:
  world_x ≈ chunk_x * chunk_size
  world_y ≈ chunk_y * chunk_size
  because -7545 * 16 = -120720, close to -120712.
  1302 * 16 = 20832, close to 20840.
  This suggests chunk size 16 and chest at chunk center offset +8.
- So flag chest position may be:
  x = chunkX * 16 + 8
  y = chunkY * 16 + 8
  z = 0

Likely challenge mechanics:
- Server chooses/generates seed.
- Server derives flag chunk.
- Server renders map image around some center.
- Server hosts map image on HTTP port 7778.
- Server starts Unity Netcode/WebSocket game server on 7777.
- Player joins.
- Server simulates player/chunks.
- If player gets near target chunk/chest, server reveals/spawns flag chest.
- Interacting with flag chest displays or sends flag.

Solve strategy candidates to investigate:
1. Use legitimate client and navigate to flag location/chunk.
2. Patch client to teleport or alter movement.
3. Send custom Unity Netcode input/RPC packets to move faster or spoof position.
4. Modify server locally to print flag/reveal condition, if local flag exists.
5. Query map HTTP server for hidden endpoints or different centers/radii.
6. Use recovered procedural generation to compute flag/chest location and movement route.
7. Find flag source: environment variable, file, hardcoded string, PlayerPrefs, resource, or server-side field.

Deliverables:
1. A list of renamed functions with evidence.
2. A short explanation of the challenge mechanics.
3. The exact win condition.
4. The easiest practical solve path.
5. Any script or client-side patch needed.
6. If the flag is locally retrievable, explain exactly where/how.
7. If server interaction is required, explain the protocol/RPC path and how to trigger it.

Do not waste time trying to make Il2CppDumper work; metadata v39 is unsupported by the installed Il2CppDumper.
Do not waste time trying to get perfect original C#; this is IL2CPP, so real bodies are native.
Do not ask me to run setup commands unless absolutely necessary.
Use the existing recovered C# tree and IDA MCP to proceed.
Start by reading:
- Network/ServerManager.cs
- Player/PlayerController.cs
- World/FlagChest.cs
- Config/WorldConfig.cs
- Network/AutoStartNetwork.cs
- Network/MapHttpServer.cs
- ProceduralGen/WorldRand.cs
- ProceduralGen/StructureGenerator.cs
- World/ChunkManager.cs

Then begin IDA MCP renaming from ServerManager.OnNetworkSpawn and its call chain.

renamed the high-confidence native functions in GameAssembly.so, centered on the server
path:

- Network_ServerManager_OnNetworkSpawn at 0x1E29B70
- GenerateSeed, GenerateFlagPosition, GenerateMapImage, StartMapHttpServer,
  PrepareFlagChest
- SpawnFlagChest, RevealFlagChestIfVisible, ServerTick, connection handlers
- World_FlagChest_SetFlag, Update, ServerCheckProximity, SendFlagClientRpc
- Player_PlayerController_SendMoveInputServerRpc, ApplyGlobalWind, PublishServerPosition
- Network_AutoStartNetwork_*
- Network_MapHttpServer_*
- MapRenderer_MapRenderer_RenderMap

Evidence was strong: ServerManager.OnNetworkSpawn calls the exact init chain in order,
PrepareFlagChest computes chunk * 16 + 8, MapHttpServer uses port 7778, AutoStartNetwork
uses 7777, and the chest/math matches the leaked runtime values exactly.

Recovered Mechanics

The server chooses a random 48-bit world seed, then derives a flag chunk. For your run:

seed: 68071189299049
flag chunk: (-7545, 1302)
flag chest world position: (-120712, 20840, 0)

That comes from:

x = chunkX * 16 + 8
y = chunkY * 16 + 8

The flag text is loaded server-side from environment variable FLAG, with a fallback
string if missing.

The map HTTP server has no useful hidden endpoints. MapHttpServer.HandleRequest ignores
the requested path and always serves the same map.png.

The chest is not spawned immediately. ServerManager.RevealFlagChestIfVisible checks live
player distance to the flag position and spawns the chest once a player is within 32
units. Then FlagChest.ServerCheckProximity sends the flag by targeted ClientRpc once a
player is within 10 units.

Win Condition

Get a server-authoritative player within 10 units of:

(-120712, 20840)

Then the server sends World_FlagChest_SendFlagClientRpc, which contains the flag string.

Important Bug / Practical Solve

Movement is server-authoritative, but the server trusts client wind input through:

Player_PlayerController_SendMoveInputServerRpc

The useful bug is in disconnect wind cleanup:

- Max connected clients: 4
- Each client can submit a normalized wind vector.
- ServerTick adds that input into _globalWindAccum.
- If a client disconnects within 0.2s of its last input, the wind state is later removed
  without subtracting its contribution.

So you can stack permanent wind by client churn.

Use exact direction from spawn/origin to the chest:

dir = normalize((-120712, 20840))
dir = (-0.9854224, 0.1701256)

Practical exploit loop:

1. Connect 4 clients.
2. Each sends SendMoveInputServerRpc((-0.9854224, 0.1701256)).
3. Wait one server tick, about 0.04s.
4. Disconnect them within 0.2s.
5. Wait slightly over 0.2s.
6. Repeat.

After about 16 cycles you have roughly 64 stacked wind. A final client moving in the same
direction travels at about:

7 * 64 = 448 units/sec

Distance is about 122498, so travel time is roughly 4.5 minutes. That should safely hit
both the 32 unit reveal radius and the 10 unit interaction radius if the vector is exact.

A patched client or small Unity Netcode client is the clean path, because keyboard-only
cardinal input approximations can reveal the chest but may miss the 10 unit flag-send
radius.

Progress log

2026-05-23 local runtime

- `docker compose ps` confirms local targets:
  - client `http://127.0.0.1:3000`
  - game `ws://127.0.0.1:7777/`
  - map `http://127.0.0.1:7778/`
- `docker compose logs server` currently leaks:
  - `seed: 43052728415347`
  - `flag at chunk (-6607, -5062)`
  - `flag chest prepared at (-105704.00, -80984.00, 0.00)`
- `MapHttpServer` still serves only one PNG and ignores path.

2026-05-23 movement/RPC refresher

- `PlayerController.HandleInput()` reads keyboard `W/A/S/D` and arrows.
- It normalizes the resulting `Vector2`.
- It only calls `SendMoveInputServerRpc` when the direction changes enough from `_lastInputDir`.
- This means a single synthetic `keydown` and `keyup` should produce one nonzero move RPC and one zero-vector RPC.
- `SendMoveInputServerRpc` RPC id remains `1824255444`.

2026-05-23 local harness work

- Added `client-docker/webgl-build/capture.html`:
  - same-origin Unity page
  - connects to `ws://127.0.0.1:9001/`
  - auto-dispatches `W`, then `A`, then `W+A`
- Added `tools/unity_capture_proxy.py`:
  - WebSocket proxy/logger
  - dumps JSONL with timestamp, direction, opcode, length, raw hex
- Next step:
  - rebuild client image so nginx serves `capture.html`
  - run proxy
  - launch headless Chrome at `/capture.html`
  - diff captured movement frames against idle traffic

2026-05-23 raw UTP/NGO custom client

- Built `tools/utp_client.py` as a direct websocket client for `ws://127.0.0.1:7777/`.
- It performs the outer `SimpleConnectionLayer` handshake directly:
  - connect request: `b"UTP\\x01" + b"\\x01" + token8`
  - connect accept: `b"UTP\\x01" + b"\\x02" + token8`
  - heartbeat: `b"\\x03" + token8`
  - data: `b"\\x01" + token8 + inner_payload`
- The script replays the known-good browser NGO connection payload and logs frames as JSONL.

2026-05-23 NGO batch decoding

- The inner payload is not opaque anymore:
  - byte `0` is the pipeline id
  - an NGO batch begins later in the payload at the first `0x1160` magic
  - batch header is:
    - `ushort Magic = 0x1160`
    - `ushort BatchCount`
    - `uint BatchSize`
    - `ulong BatchHash`
- `BatchHash` is `XXHash64(body, seed=0)`.
- Each message inside the batch is:
  - `bitpacked uint MessageType`
  - `bitpacked uint MessageSize`
  - `MessageSize` bytes of payload
- Bitpacked integers are not varints in the protobuf sense:
  - `uint`: first byte low 3 bits are width, encoded value is `(value << 3) | width`
  - `ulong`: first byte low 4 bits are width, encoded value is `(value << 4) | width`

2026-05-23 live server traffic observations

- The captured browser connection batch decodes cleanly as:
  - `ConnectionRequest` (`type 1`)
  - payload size `174`
  - total batch size `200`
- Replaying that payload from a raw Python websocket client succeeds locally and produces the full server stream.
- Replaying the exact same data frame a second time does not immediately break the session. The server keeps streaming reliable packets. This is useful because it means the transport wrapper can be treated as a reusable template while sequence semantics are still being pinned down.
- Server packets now decode into recognizable NGO batches:
  - the first large `494`-byte server frame starts with `ConnectionApproved`
  - recurring `70`-byte frames decode as `NetworkVariableDelta`
  - recurring `86`-byte frames decode as two-message batches with `NetworkVariableDelta` entries
- `NetworkVariableDeltaMessage.Deserialize()` is simple enough to parse directly:
  - `bitpacked ulong NetworkObjectId`
  - `bitpacked ushort NetworkBehaviourIndex`
  - remaining bytes are the variable delta payload

2026-05-23 next local solve steps

- Use `tools/utp_client.py` output to identify the player-owned `NetworkObjectId` and `NetworkBehaviourIndex`.
- Build an experimental `ServerRpc` batch for RPC id `1824255444` (`SendMoveInputServerRpc`) with raw payload `struct.pack('<ff', x, y)`.
- Test whether the server accepts custom movement RPCs from the raw client.
- If yes:
  - automate 4-client wind stacking
  - drive one survivor client toward the flag chest coordinates

2026-05-23 browser-backed packet capture

- Running headless Chrome against `http://127.0.0.1:3000/capture.html` through
  `tools/unity_capture_proxy.py` finally produced full client-side traffic, including the
  packets sent after `ConnectionApproved`.
- Important captured client packets:
  - `126` bytes: post-approval scene-sync completion batch
  - `27` bytes: reliable pipeline ack-only packet, no NGO batch
  - `70` bytes: actual movement `Rpc` packet emitted by `SendMoveInputServerRpc`
- The browser client sends two `SceneEvent` messages in the `126`-byte frame:
  - first payload starts with `06` (`LoadComplete`)
  - second payload starts with `08` (`SynchronizeComplete`)
- The browser also sends standalone transport ack packets like:
  - `03 01 00 <processing_time> 00 00 <acked_seq> ff..ff 00`
  - this is not an NGO batch and the raw client was not emulating it before.

2026-05-23 observed movement packet layout

- The movement `Rpc` packet body is not what my first raw client builder assumed.
- Captured `70`-byte client movement frames have body shape:
  - `message_type=16 (Rpc)`
  - `message_size=<observed_size>`
  - `bitpacked NetworkObjectId`
  - `bitpacked NetworkBehaviourId`
  - byte `0x01`
  - raw little-endian rpc id `d4 ed bb 6c` (`1824255444`)
  - `Vector2` payload (`float32 x`, `float32 y`)
  - `6` trailing zero bytes
- Example clean movement bodies from real sessions:
  - session `3`: `8181f1310105d4edbb6c000000000000803f000000000000`
  - session `4`: `81890201410105d4edbb6c000000000000803f0000000000`
  - session `8`: `81894201310105d4edbb6c000000000000803f0000000000`
- This means the `NetworkObjectId` / `NetworkBehaviourId` pair is session-dependent.
  Captured examples so far:
  - session `3`: object `15`, behaviour `6`
  - session `4`: object `16`, behaviour `8`
  - session `7`: object `19`, behaviour `12`
  - session `8`: object `20`, behaviour `6`
- So there is still no reliable closed-form mapping from sync data to movement target.

2026-05-23 raw client updates

- Updated `tools/utp_client.py` with:
  - `build_observed_move_rpc_payload`
  - `build_observed_move_rpc_batch`
  - `send_move_server_rpc_observed`
  - `build_transport_ack_only`
  - `send_transport_ack_only`
- These helpers now match the browser-observed `Rpc` payload shape and recompute the NGO
  `XXHash64` correctly when building a batch from scratch.
- New CLI toggles:
  - `--use-observed-move-format`
  - `--send-ack-only-after-move`
  - `--ack-processing-time`

2026-05-23 browser-side packet patch experiment

- I extended `capture.html` so it can detect movement RPCs in `ws.send()` and overwrite
  the outgoing `Vector2` payload with an arbitrary direction.
- For the current local chest:
  - `flag chest prepared at (-105704, -80984, 0)`
  - normalized direction is `(-0.7938084, -0.6081679)`
- The patcher correctly found and rewrote the movement vector bytes at runtime.
- Example captured patched frame:
  - `01e81237e2749d6131030000e80302000500ffffffffffffffff2800000060110100280000006163cfab4b18686881893201610105d4edbb6c07374bbfe4b01bbf0000000000`
  - decoded patched vector: `(-0.7938084, -0.6081679)`

2026-05-23 important failure mode

- Simply mutating an in-flight browser packet is not enough.
- The server validates the NGO batch hash (`XXHash64(body, seed=0)`).
- After patching the vector bytes in the browser without recomputing that hash, the server
  logs:
  - `Received a packet with an invalid Hash Value`
- So the browser-side patch is only useful as a structure oracle right now.
- The actual exploit needs either:
  - a raw client that rebuilds the whole packet and hash correctly, or
  - a browser-side patch that also recomputes the NGO `XXHash64` in JavaScript.

2026-05-23 current status

- Confirmed:
  - exact movement RPC location in outbound packets
  - exact RPC id bytes in live traffic
  - exact local flag direction vector
  - the need for reliable ack-only packets
  - the need to recompute NGO batch hashes after any payload mutation
- Still unresolved:
  - deriving the correct session-specific `NetworkObjectId` / `NetworkBehaviourId` for
    `SendMoveInputServerRpc` without relying on a live browser capture
  - completing the initial NGO scene-sync path cleanly from the raw Python client
  - validating local wind stacking end-to-end with a fully custom client
Challenge Shape

  2bird2can is a Unity WebGL + Linux IL2CPP server game using Unity Transport over WebSocket
  and Netcode for GameObjects. The flag is server-side. The client does not contain bbb{...}
  except local test plumbing; the real flag is sent by a SendFlagClientRpc only when the
  server thinks the player is close enough to the hidden flag chest.

  Local files:

  - Server binary: rev/2bird2can/2bird2can/server-docker/linux-server-build/GameAssembly.so
  - Client/WebGL: rev/2bird2can/2bird2can/client-docker/webgl-build
  - Local tooling: rev/2bird2can/local_tools/

  Protocol Progress

  We decoded enough of NGO/UTP to send forged messages:

  - WebSocket gameplay port: local 127.0.0.1:7777
  - Map HTTP port: local 127.0.0.1:7778
  - UTP handshake: UTP 01 01 <8-byte-token> -> server replies UTP 01 02 <same-token>
  - NGO batches are parsed in local_tools/ngo_decode.py.
  - SendMoveInputServerRpc method id: 0x6cbbedd4
  - SendFlagClientRpc method id: 0x0729bfcf
  - SendFlagClientRpc payload carries the flag as UTF-16LE, not plain ASCII.

  Useful scripts:

  - local_tools/pulse_wind.py: dynamically parses approval/player object and sends valid move
    RPCs.
  - local_tools/parent_teleport.py: current exploit script. It spawns a legit player, forges
    ParentSyncMessage, continuously teleports the owned player, and independently reads for
    the flag RPC.
  - local_tools/ngo_decode.py: parser for NGO messages, SceneEvents, CreateObject, serialized
    transforms.

  Exploit Primitive

  The wind/disconnect leak was real but too slow. It accumulates roughly single-digit
  effective wind per session and leaks player slots, so it is not viable for a 100k+ unit
  trip.

  The winning primitive is ParentSyncMessage:

  - NGO message type 14 = ParentSync
  - The server accepts it from a client.
  - If we send it for our owned player object, it calls server-side transform parenting/
    position code and sets the player position.
  - We keep resending at 60Hz because normal server movement can overwrite the transform
    between ticks.

  Local known-coordinate exploit works:

  python3 rev/2bird2can/local_tools/parent_teleport.py \
    --prefix-count 30 --pre-send-ms 1000 --keep-ms 5000 \
    --continuous --rate-hz 60 \
    --x 29320 --y 118424 --z 0 --verbose

  This locally prints:

  [ngo] object=5 owner=0 player=False hash=1561479915 pos=(29320.0, 118424.0, 0.0)
  [flag] bbb{test_flag}
  bbb{test_flag}

  bbb{test_flag} is only local test data, not the real flag.

  Rejected Paths

  These are dead or not enough:

  - Huge move vectors: server normalizes movement input.
  - NaN/Inf in move input: does not give useful proximity behavior.
  - NaN ParentSync: not final; FlagChest.ServerCheckProximity treats unordered/NaN as far.
  - Wind accumulation: valid bug, too slow and limited by leaked player slots.
  - Teleport anywhere far to force chest spawn: false on the current local run. Chest only
    spawns when the player reaches the actual flag/chest area.
  - Welcome/NetworkVariable seed leak: ruled out. _flagChunk at ServerManager+0xd0 is a plain
    field, not an NGO NetworkVariable.
  - The 9-byte ServerManager sync is not the seed or flag chunk.

  Map/Seed Reversing

  The remaining blocker is automatic coordinate recovery. Once we know (flagWorldX,
  flagWorldY), parent_teleport.py gets the flag.

  The map endpoint returns a 1024x1024 PNG with five colors:

  - water
  - island/beach colors
  - grey decoration pixels
  - red flag/chest marker

  Important map facts from GenerateMapImage:

  - It renders a 16x16 chunk window.
  - Each chunk cell is 64x64 pixels.
  - The map is centered on the hidden flag chunk.
  - The red marker is at the center cell, so it tells relative position only, not absolute
    coordinates.
  - There is no PNG metadata with coords.

  Current fresh local map is:
  rev/2bird2can/local_tools/capture/current_map_fresh.png

  Current local server known from gdb/log:

  worldSeed = 215560087688250
  flagChunk = (1832, 7401)
  flagWorld = (29320, 118424, 0)

  Previous local run:

  worldSeed = 194771749690887
  flagChunk = (-6437, 4794)
  flagWorld = (-102984, 76712, 0)

  World coordinate conversion:

  flagWorldX = flagChunkX * 16 + 8
  flagWorldY = flagChunkY * 16 + 8

  Structure RNG

  This is confirmed from disassembly around 0x1e26420 / 0x1e2a544:

  MASK = (1 << 48) - 1
  A = 0x5deece66d
  B = 0xb
  C1 = 0x4f9939f508
  C2 = 0x1ef1565bd5

  mixed = (worldSeed ^ (regionX * C1) ^ (regionY * C2)) & MASK
  state1 = (mixed * A + B) & MASK
  offX = (state1 >> 16) & 3
  state2 = (state1 * A + B) & MASK
  offY = (state2 >> 16) & 3

  structureChunkX = regionX * 4 + offX
  structureChunkY = regionY * 4 + offY

  Important correction: this is not Java next(2) top bits. It extracts (state >> 16) & 3, so
  the island layout mostly constrains low seed bits.

  Observed Map Fingerprint

  Extracted visible island/chest chunk offsets from the fresh map, relative to the center flag
  chunk:

  obs = [
    (5, 7), (7, 4), (-8, 3), (-4, 3), (1, 3),
    (-5, 1), (-1, 0), (0, 0), (5, 0), (1, -2),
    (5, -4), (-5, -5), (-2, -5), (-3, -6),
    (7, -6), (-7, -7), (3, -7),
  ]

  For flag chunk modulo (0,1), these map to 17 structure regions. The solver checked all chunk
  modulos and found all unsat except (x mod 4, y mod 4) = (0,1), which matches the known local
  flag chunk (1832,7401).

  First-stage candidate enumeration using row/column intersection gives a small family:

  (seed_low18, regionX, regionY, flagChunkX, flagChunkY)
  (54362,  -954, 1850, -3816, 7401)
  (185594, -814, 1850, -3256, 7401)
  (54426,  -674, 1850, -2696, 7401)
  (103546, -318, 1850, -1272, 7401)
  (234522, -178, 1850, -712,  7401)
  (103610, -38,  1850, -152,  7401)
  (21562,   458, 1850, 1832,  7401)   <-- actual local
  (152794,  598, 1850, 2392,  7401)
  (70746,  1094, 1850, 4376,  7401)

  So the island blobs alone are not enough; they alias horizontally under low 18-bit
  constraints. The next discriminator is likely the grey decoration pixels, because
  GenerateMapImage draws per-chunk decorations from chunk data after the island pass.

  Flag Position Generation

  GenerateFlagPosition:

  - seed stored at ServerManager+0xc8, 48-bit
  - flag chunk packed at ServerManager+0xd0
  - picks a region on an annulus around origin, roughly radius 1900..2100
  - uses two seed-derived 16-bit-ish random values to compute angle/radius
  - then runs the same structure RNG for that region to get the final flag chunk within the
    4x4 region.

  Known current:

  flag region = (458, 1850)
  flag chunk = (1832, 7401)

  Where We Are Now

  Solved:

  - Valid connection replay.
  - Dynamic player object discovery.
  - Forged ParentSync.
  - Continuous teleport.
  - Flag ClientRpc receive/decode.
  - Map rendering structure formula.
  - 16x16 island fingerprint extraction.
  - First-stage coordinate candidates.

  Still left before remote:

  - Finish automatic disambiguation of the first-stage candidates, likely by modeling grey
    decoration pixels or fully reimplementing enough of chunk/map rendering.
  - Wire that coordinate recovery into a single solver wrapper:
    fetch map -> extract fingerprint -> recover flag chunk -> compute world coords -> run
    parent_teleport.py.
  - Then the user can launch a remote instance and provide the host/ports; we should not
    launch/connect remote ourselves unless explicitly told.

  Best next task for helper sessions:

  - Reverse the grey decoration generation path inside GenerateMapImage, especially the calls
    after 1e2b4e2 where chunk bytes at [rbp+0x21..0x23] and decoration arrays are used.
  - Alternatively reverse World.GetChunk / chunk generation function at 0x1e261a0 and related
    chunk-data layout, then reproduce the grey pixels for each candidate and reject false
    candidates.
