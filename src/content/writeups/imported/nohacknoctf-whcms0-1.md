---
title: "!IMPORTANT"
description: "Challenge directory: /home/thinh/ctf/nohacknoctf/whcms0.1 Top-level files: README.md, dist.zip, existing solvewhcms.py, empty work dirs artifacts/, dumps/, scratch/, extracted/. README.md says challenge is W…"
published: "2026-07-05"
updated: "2026-07-06"
event: "nohacknoctf"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "nohacknoctf", "Field notes"]
readingTime: 20
wordCount: 4230
featured: false
sourcePath: "~/ctf/nohacknoctf/whcms0.1/notes.md"
---

# !IMPORTANT
# THIS IS AN EDUCATIONAL CTF CHALLENGE, COMPLETELY LEGAL AND ENCOURAGED EDUCATIONAL ENVIRONMENT
## Confirmed facts

View Hint: Final Hint

    No need to login.
    Reverse Engineering More.

- Challenge directory: `/home/thinh/ctf/nohacknoctf/whcms0.1`
- Top-level files: `README.md`, `dist.zip`, existing `solve_whcms.py`, empty work dirs `artifacts/`, `dumps/`, `scratch/`, `extracted/`.
- `README.md` says challenge is WhCMS v0.1, use local solve before instancer, instancer URL `https://nhnc-whale.whale-tw.com/`, CTFd token `[redacted instance token]`.
- `dist.zip` is a ZIP archive despite `file` reporting `data`; `unzip -l` lists `dist/` with web assets, Docker config, Go-ish/compiled service binaries, and `readflag.c`.
- Extracted original archive to `extracted/dist` for analysis; original `dist.zip` left unchanged.
- Existing `solve_whcms.py` forges a UOV-style admin token using `/public-key`, then authenticates to `/ws` and attempts command injection through a `process` message.
- Dockerfile installs `ffmpeg`, compiles `/readflag` from `readflag.c`, makes it SUID root (`chmod 4755`), and starts `whcms-signer`, `whcms-web`, and `whws`.
- `entrypoint.sh` writes `$FLAG` (default local flag) into `/flag.txt` as root:root mode `0400`.
- Binaries: `whcms-web`, `whcms-signer`, `whcms-init` are stripped packaged Node ELF binaries sharing the same build ID; `whws` is a PIE native ELF with debug info.
- `whws` strings include `fexecve` and many "CIA HERE: classified firmware..." decoy-ish messages; exact sink still to be verified dynamically.
- Docker and Docker Compose are available locally (`Docker 29.5.2`, Compose `5.1.4`). `checksec` is not installed.

## Current hypothesis

- Primary chain is still likely web + crypto + websocket backend, but direct signing from `/public-key` is wrong. Need recover token/signing implementation or find an auth/oracle bug, then trigger the media processing backend to run `readflag`.

## Commands tried

- `find .. -name AGENTS.md -print` -> no AGENTS.md found nearby.
- `rg --files -uu` -> found `notes.md`, `README.md`, `solve_whcms.py`, `dist.zip`.
- `unzip -l dist.zip` -> confirmed challenge files and binary sizes.
- `unzip -q dist.zip -d extracted` -> extracted `dist/` into workspace for analysis.
- `sed` on `Dockerfile`, `entrypoint.sh`, `docker-compose.yml`, `readflag.c` -> confirmed local flag setup and SUID reader.
- `file extracted/dist/bin/*` -> classified binaries.
- `strings ... | rg ...` on `whcms-web`/`whws` -> confirmed packaged Node content and native helper strings, but broad scans are noisy due embedded runtimes/assets.
- `PORT=3010 FLAG='NHNC{LOCAL_VERIFY_WHCM0_1}' docker compose ... up --build -d` -> built and started local container on host port 3010.
- Initial curl to `/public-key` reset because `whcms-init` was still running. After init completed, logs showed `initialized WhCMS at /app`, `signer listening on 127.0.0.1:9100`, `web listening on 0.0.0.0:3000`, and `websocket listening on /run/whcms/whws.sock`.
- `curl http://127.0.0.1:3010/public-key | wc -c` -> 13816 bytes.
- `python3 solve_whcms.py http://127.0.0.1:3010` -> forged token, got WebSocket `ready`, then `{"type":"auth","ok":false}`. Existing exploit's UOV/token forge is not yet accepted.
- Compared local generated `/run/whcms/uov_private.json` with `/app/config/uov_public.bin`: private `central` has 0 oil-oil quadratic coefficients, but private `publicKey` and the public blob have 2163 nonzero oil-oil coefficients and match each other exactly.
- Recovered pkg VFS metadata and extracted `/snapshot/chal/src/*.js` bytecode blobs into `artifacts/pkg-src/` with `scratch/extract_pkg.py`; files are V8 cached bytecode, not source text.
- Patched copied binaries in `scratch/` to inject `scratch/hook_express.js` through the pkg prelude. Original binaries untouched.
- Hooked web routes: `GET /`, `GET /post/:id`, `GET /login`, `GET /logout`, `GET /dashboard` (requires login), `POST /upload` (requires login, multer), `POST /dashboard/posts` (requires login), `GET /public-key`.
- Hooked signer route: `POST /sign-token`.
- Dashboard signs realtime tokens by POSTing to signer with header `x-whcms-internal: <signer_secret>` and JSON body `{"username":"reader","role":"member"}`.
- Realtime token payload format observed: `base64url("v1|username=reader|role=member|exp=<unix>").<40-byte signature hex>`.
- Member realtime token authenticates to `/ws` successfully, but `process` messages return `{"type":"error","message":"not allowed"}`.
- Temporary rerun of `whcms-init` produced different `reader` and `whale` password hashes from the live container, so account passwords are randomized per initialization.

## Failed hypotheses

- Existing `solve_whcms.py` is not verified as-is: local service rejects its forged admin token.
- The public key does not directly expose the central UOV map. The old solver's assumption is false for this build.
- Admin password reuse/static cracking is unlikely: fresh init changed the admin/member hashes.
- Member realtime token alone cannot trigger the `process` backend.

## Next tests

- Test `/upload` as member for path traversal, file overwrite, symlink, and command/ffmpeg interactions.
- Investigate whether valid member tokens plus public key/signatures enable UOV key recovery or role forgery.
- Look for ways to leak `/run/whcms/signer_secret` or `uov_private.json` through upload/static/post routes.
- Once auth succeeds locally, test the WebSocket command injection against the known local flag before using the remote instancer.

## 2026-07-04 continuation findings

- `whws` is a loader stub. It reconstructs an embedded 0x5f32-byte compressed blob from 16 encrypted chunks, decompresses to a 0x13f00-byte ELF, then executes it with `memfd_create`/`fexecve`.
- Wrote `scratch/unpack_whws.py`; it extracts `artifacts/whws_stage2` and verifies the loader's FNV checks.
- `artifacts/whws_stage2` confirms the websocket protocol and auth:
  - JSON `type` values: `auth`, `message`, `process`.
  - Role values: `admin`, `member`; username value `whale`.
  - Token format is `base64url(payload).hexsig`; payload must canonicalize exactly as `v1|username=%s|role=%s|exp=%s`.
  - Signature hex decodes to 40 field elements, each <= 250, and is verified by evaluating the full UOV public quadratic map against `hash_to_field("whcms-uov-target-v1", instance, payload, 16)`.
  - `process` requires authenticated state and username `whale`; the direct process gate checks username.
- `whws_stage2` process path:
  - Extracts JSON field `name`.
  - Builds path format `%s/%s/%s-%s/%u` using upload base `/app/uploads`, authenticated username, supplied name, random 16-byte hex, and a random number.
  - Creates needed directories, rejects leading `/` and overlong names, snapshots image entries, chdirs to the created path, and runs `system("ffmpeg -y -loglevel error -i %s -vf scale=320:-1 %s.small.jpg >/dev/null 2>&1")` with unquoted paths.
  - The stale solver's command-injection stage is plausible once a valid `whale` token exists.
- Local Python environment has `galois`, `sympy`, `z3`, and `numpy`; Sage is not installed.
- Updated current hypothesis: solve a public UOV/MQ preimage for a future `v1|username=whale|role=admin|exp=<future>` payload, then trigger confirmed `ffmpeg` shell injection to run `/readflag`.

## 2026-07-04 crypto continuation

- Random linear combinations of both central and public polar matrices are almost always full rank (`central {40:198,39:2}`, `publicKey {40:199,39:1}` over 200 trials). A simple low-rank-combination attack is not available.
- Central coordinate order is oil first, vinegar last. The central map has zero oil-oil coefficients on coordinates `0..15`; signer-chosen deterministic vinegar values match `(A*signature+b)[16..39]`.
- Wrote `scratch/uov_tools.py` with GF(251) linear algebra, public-key parsing, UOV evaluation, and helper routines.
- Wrote `scratch/recover_from_tokens.py`. With 48 valid local signer tokens it linearly recovers the last 24 rows of the affine transform (`A_vinegar`, `b_vinegar`), takes the nullspace to recover the 16-dimensional hidden oil subspace, and signs an arbitrary `whale/admin` payload by solving a 16x16 linear system on an affine coset.
- Local verification: the recovered oil subspace equals the hidden subspace from `uov_private.json`, and the generated `whale/admin` token was accepted by `/ws` with `{"type":"auth","ok":true}`.
- This token-sample attack would solve the remote instance if enough ordinary valid tokens are obtainable. Current blocker for that route: remote credentials/token access are still unknown; local reader access used a modified DB password for testing.

## 2026-07-04 websocket process exploit verification

- Wrote `scratch/test_process_injection.py` to exercise `process` with a valid locally recovered `whale/admin` token and inspect `/app/uploads/whale`.
- Important local-test footgun: `whws` runs as user `whcms`; if `/app/uploads/whale` is recreated as root-owned, all process mkdir attempts fail. Cleanup must `chown whcms:whcms /app/uploads/whale`.
- Benign long slash names work once the upload dir is writable. `process` snapshots top-level `.jpg`/`.png` entries under `/app/uploads/whale`, then creates/chdirs to the generated folder and processes the earlier snapshot.
- Verified old exploit staging behavior:
  - Stage 1 name `a;for i in 3 4 5 6 7 8 9;do readflag>&$i;done;#.png/x.png/` + 520 `A`s returns `{"type":"process","ok":false}` because a final path component is too long, but it has already created the useful top-level malicious `.png` directory and child `x.png`.
  - Stage 2 name `go` returns `{"type":"process","ok":true,...,"count":1}` and the unquoted ffmpeg shell command executes the top-level directory name.
  - Local flag capture succeeded: `NHNC{LOCAL_VERIFY_WHCM0_1}` was written raw to the inherited websocket fd.
- Endgame is now reliable locally once a valid `whale/admin` token is available. Remaining remote blocker is obtaining enough valid UOV signatures or the private signing material for the remote instance.

## 2026-07-04 auth trace continuation

- Added `scratch/hook_deep.js` and ran it only against a copied `whcms-web` on internal local port 3001; original challenge binaries remain unchanged.
- A too-broad first hook wrapped Node core modules and broke HTTP; narrowed it to local challenge modules plus Express/sqlite/crypto.
- Clean trace confirms:
  - `findUser(username,password)` uses parameterized SQL: `SELECT id, username, role, password_hash FROM users WHERE username = ?`.
  - Password check is `sha256(password).hex() == password_hash`.
  - Session ID is `crypto.randomBytes(24).toString("hex")`, cookie name `sid`, `HttpOnly`, `SameSite=Lax`.
  - Successful local login after temporary DB edit produced `sid=1132b9aae1f38feb7dde9ddaf36bc16753c6b82dfbb5acad`.
  - Dashboard emits a member realtime token for fixed `reader/member`.
- Failed/low-value routes now ruled out harder: login SQLi and predictable session ID.

## Current blocker update

- Need either remote authentication, a file-read/write bug that leaks `/app/logs/uov-selftest.log` or `/run/whcms/uov_private.json`, or another way to get valid signatures for the reused remote public key.
- Next tests: dynamically trace `/upload` and `/dashboard/posts` under an authenticated local reader session for path traversal, arbitrary write, stored XSS/LFI, or post rendering bugs.

## 2026-07-04 resume

- Resuming from existing notes. No `AGENTS.md` found in or above the challenge directory.
- Current confirmed endgame remains: valid `whale/admin` UOV token + two-stage websocket `process` command injection leaks the flag locally.
- Immediate focus: either find a remote web/signature leak or improve the public-key-only UOV oil-subspace recovery.

## 2026-07-04 resumed remote/algebra checks

- Created fresh remote instance `db8a050de43d` at `2026-07-04T16:44:23Z`, URL `http://nhnc2.whale-tw.com:10001/`, expires `2026-07-04T16:49:23Z`.
- Saved its public key as `dumps/remote_pub_10001.bin`; SHA256 again equals `394f8cf09400b91c5515d9b15e5a09f19d5ded22309e13c593e9ba701e52f887`, matching prior remote keys.
- `scratch/probe_remote.py` tested direct and encoded traversal paths for `/app/logs/uov-selftest.log`, `/run/whcms/uov_private.json`, `/run/whcms/signer_secret`, `/app/data/admin-note.txt`, `/app/data/whcms.sqlite`, plus `/debug`, `/api/config`, and `/sign-token`; all returned 404 or `Cannot POST /sign-token`.
- Radare2 auth sanity check on `artifacts/whws_stage2`: auth handler decodes token, parses `username`, `role`, `exp`, rebuilds canonical `v1|username=%s|role=%s|exp=%s`, `strcmp`s it against decoded payload, verifies expiry and UOV signature. The `process` gate checks authenticated username against literal `whale`.
- Added `scratch/oil_invariant_probe.py`. Local invariant result: for known oil vector `v`, `K(v)=ker(M_k v)` has dimension 24 and common radical on `K(v)` has dimension 1 (span of `v`); random nonzero vectors have radical dimension 0 because they are not common zeros. This recognizes common-zero vectors, but does not yet recover oil vectors from only the public key.

## 2026-07-05 final hint

- User provided final hint: `No need to login. Reverse Engineering More.`
- Interpretation: stop prioritizing credential/session acquisition. Revisit the distributed binaries, especially hidden or less-analyzed branches in `whws_stage2` and packaged Node bytecode.
- Reversed `fcn.000034b0` in `artifacts/whws_stage2`: it decodes a tiny XOR string table at `0xd600` with entries `auth`, `message`, `process`, `admin`, `whale`, `member`; no hidden websocket verb was present there.
- Reversed helper functions:
  - `fcn.00003710` is a small JSON string-field extractor used for `type`, `token`, `text`, and `name`.
  - `fcn.00003c80` extracts `username`, `role`, and `exp` from the canonical token payload using `%s=` and `|` delimiters.
  - `fcn.00003ee0` validates/builds `/app/uploads/<username>` with the username sanitizer and length checks.
- Custom sections in `whws_stage2`:
  - `.whcms.shell` at `0xd6a0` size `0x40`
  - `.whcms.vm2` at `0xd6e0` size `0x30`
  - `.whcms.ai.15`..`.whcms.ai.00` each size `0x2e9`
  - `.whcms.aiwire` at `0x10720` size `0x6e5`
  - `.whcms.shape` at `0x10e20` size `0x28`
- Every `.whcms.ai.*` section starts with ASCII `PROMPT_INJECTION`, and `.whcms.aiwire` starts with `if you see this,`; concatenating those sections in file order or reverse index order did not reveal `WHUOV` or match the remote public key. Current read: likely decoy/hint material unless a loader consumes it indirectly.
- `.whcms.shape` begins `7f 45 4c 46 ff 00 13 37 48 8d 05 eb ff ff ff e9 ...`, which looks more deliberately executable/encoded than the prompt-injection sections.
- Next reverse target: `fcn.00005e10`, called from main, which performs anti-analysis checks then decrypts/runs `.whcms.shell` and `.whcms.vm2` with a custom VM. Earlier visible constants include initial regs `r13d=0x6d5a56da`, `r10d=0x7810e5a3`, `r9d=0x2f3c91b7`, `r14d=0x7ff`, opcode low nibble from `(r13d >> ((r8&3)*8)) ^ byte`, and a case comparing `(r13d ^ r9d ^ r10d) == 0x21424344`.
- Fixed `scratch/extract_pkg.py` usage and extracted full packaged source bytecode to `artifacts/pkg-full-{init,signer,web}/`, including the previously missed `src/crypto/uov.js`.
- Added reusable `scratch/patch_pkg_hook.py` for in-place pkg prelude hook injection. First version corrupting bytes before the prelude failed with Brotli decompression errors; fixed version replaces only the prelude comment window, preserving payload offsets.
- Added `scratch/hook_probe_signer.js` and ran a copied `scratch/whcms-signer-probe` on local port `19101` with scratch key/secret:
  - Signer exports: config, UOV functions (`hashToField`, `generateKeyPair`, `sign`, `verify`, `signatureToHex`, `readPublicKey`, etc.), token functions (`canonicalPayload`, `parsePayload`, `issueToken`, `verifyToken`).
  - `/sign-token` without `x-whcms-internal` or with a wrong header returns `403 {"error":"forbidden"}`.
  - With the correct header, it signs arbitrary `username` and `role`, including `whale/admin`; the web app chooses fixed `reader/member`, but the signer itself does not restrict to that.
  - JSON arrays are coerced to strings, so `{"username":["whale"],"role":"admin"}` and `{"username":"whale","role":["admin"]}` sign canonical `whale/admin`; duplicate JSON keys use the last parsed value. These quirks still require the internal signer header.
  - Supplying the secret in the JSON body without the header does not work. Prototype-pollution-style body fields did not affect the selected username/role.
- Current conclusion from signer probing: no local no-secret signing bypass found. Still need remote reachability to signer, signer secret/private-key leakage, or public-key-only UOV recovery.
- Direct MQ fallback:
  - Generated `scratch/mq_seed1.sing` for remote public key and target `v1|username=whale|role=admin|exp=1783260000`.
  - Singular initially missed optimized modules; linked `scratch/singular-root/usr/lib64/singular/MOD/*.so` into the expected `usr/lib64/` location.
  - With optimized modules loading cleanly, seed 1 still timed out after 90 seconds with no solution. Treat random 16-variable Groebner slicing as too slow unless a better solver/specialization is found.
- Quick local web auth-bypass pass against `/dashboard`, encoded dashboard paths, method overrides, `TRACE`, `OPTIONS`, and `/assets/../dashboard` did not expose dashboard or signer access without a session.
- Further `whws_stage2` dispatch reverse:
  - `message` and `process` dispatch both check the authenticated flag at stack slot `[rsp+0x60]`; unauthenticated `message` returns `auth required`, unauthenticated `process` returns `not allowed`.
  - `process` then checks stored role/user strings against decoded ids including `admin` and `whale`; no malformed-token bypass found in the visible dispatch.
  - Signature path enforces exactly 80 hex chars, each byte <= 250, expiry digits, canonical payload rebuild/strcmp, and public-key verification.
- Tested a simple Kipnis-Shamir-style invariant locally (`M0^-1 * Mi` or `Mi * M0^-1` preserving the hidden oil subspace). It does not preserve the known local oil subspace, so that simple matrix-product attack is dead.
- Public route fuzzing with a scratch-patched `whcms-web` trace found no useful query-parameter file/template path on `/login`, `/`, or `/post/1`; `/login` always reads fixed `views/login.html` through `resolveInsideApp`.
- `Function.prototype.toString()` hooks on pkg bytecode handlers return only `[native code]`; inspector/bytecode-print flags on the packaged binary did not dump usable source.
- Signer probing confirmed `/sign-token` requires the `x-whcms-internal` header; with the secret it signs arbitrary `username`/`role`, but no no-secret bypass was found.
- `whws_stage2` websocket frame parsing supports masked text frames up to 0x1000 bytes and appears in-bounds; no obvious unauthenticated frame overflow.
- `whws_stage2` token verification uses the exact decoded payload length in the SHA256 target. A `canonical\0extra` payload would pass the visible `strcmp`, but its signature target includes the NUL suffix, so the normal signer cannot be abused to sign a shorter canonical string.

## 2026-07-05 current reverse focus

- User hint says no login is needed, so the web session path is likely not required.
- Remaining high-value reverse targets:
  - `whws_stage2` `main`/server setup and any hidden local socket, env, or static-file side paths.
  - `whws_stage2` anti-analysis/VM section to confirm whether it gates a real branch or only decoys.
  - Packaged Node bytecode for signer/web constants, hidden headers, or internal-only routing conditions that were not visible from Express route enumeration.

## 2026-07-05 hidden-section sweep continuation

- Dumped original `extracted/dist/bin/whws` custom/debug sections with `scratch/analyze_orig_sections.py` into `artifacts/orig_whws_sections`.
- Original loader `.whcms.pk.15`..`.whcms.pk.00` chunks sum to `0x5f32`, matching the encrypted/compressed stage2 payload reconstructed by `scratch/unpack_whws.py`.
- Extra original sections are not in LOAD segments and loader disassembly/relocations do not show self-file reads of them:
  - `.whcms.vm0` size `0x1008`, magic-like prefix `WHVM`.
  - `.whcms.vm1` size `0x1008`, starts with an ELF prefix followed by high-entropy bytes.
  - `.whcms.mem.shell` size `0x100b`, starts `0x7fSHL` plus shellcode-looking bytes.
  - `.whcms.aiwire.pad`, `.whcms.vm2.pad`, and `.whcms.ai.spread.*` are prompt-injection/decoy-looking high-entropy fillers.
- Extracted regular `.whcms.ai.spread.*` record payloads and tails with `scratch/extract_hidden_streams.py` into `artifacts/orig_whws_streams`; the streams are high-entropy and contain no direct `WHUOV`, selftest, signer secret, token, flag, or public-key magic.
- Tried loader-style stream-cipher seed recovery for `.whcms.vm1` assuming an encoded ELF body; no seed found for ET_EXEC/ET_DYN and index bases 0/8.
- Swept raw hidden blobs and extracted streams through cheap transforms (single-byte XOR, index masks/add/sub, pairwise XOR with spread streams). Hits were accidental compression magic or the known fake headers; no useful decoded payload appeared.
- Current pivot after this reverse pass: public-key UOV/direct MQ, an implementation-specific UOV weakness in bytecode, or an exposure of valid signatures/private material that has not been found yet.

## 2026-07-05 no-login route and direct-MQ checks

- Started fresh remote instance `829a53cdb248` at `http://nhnc2.whale-tw.com:10010/`, expires `2026-07-05T18:48:03Z`.
- Neighboring host-port sweep around `9990..10040` found only the advertised web ports; no direct signer or websocket TCP port was exposed. Ports `10010` and `10011` served WhCMS with the same public key; other open ports were different challenges.
- Traced local `whcms-web` with `scratch/hook_public_trace.js` on `HTTP_PORT=3002` inside Docker:
  - `/public-key` always calls `res.sendFile("/app/config/uov_public.bin")`.
  - Query parameters such as `path`, `file`, `p`, `debug`, and `download` are ignored by the handler.
  - The only side effect is the general request logger appending JSON lines to `/app/logs/requests.log`.
- Corrected `msolve` invocation by setting `LD_LIBRARY_PATH=scratch/msolve-root/usr/lib64`; previous zero-byte outputs were caused by missing shared libraries or timeouts.
- Even with the corrected invocation:
  - Local 16-variable direct signing slice timed out after 180s and ~1.2GB RSS.
  - Local 15-variable overdetermined slice timed out after 60s and ~610MB RSS.
  - `-l 42`/`-l 44` probabilistic linear-algebra modes are refused for characteristic 251 and fall back to exact mode, timing out as well.
- Current dead ends: blind direct MQ with `msolve`, no-login `/public-key` parameter leak, adjacent remote port exposure.

## 2026-07-05 resumed after final hint

- Continuing after context compaction. The hint remains the active pivot: solve should not depend on logging into the web UI.
- Next concrete test: reverse `whws_stage2` hidden custom sections and the VM/anti-analysis function around `0x5e10`, looking for unauthenticated websocket behavior, token bypass, or embedded signing material.

## 2026-07-04 init/upload/post/algebra continuation

- Hooked `whcms-init` through copied binary `scratch/whcms-init-hooked`; original binary untouched.
- Init account passwords are generated as 16 random bytes converted to hex text, then stored as `sha256(ascii_hex_password)`.
  - Example inittrace whale password material: random bytes `4b3f932464b143ff9bf6cf145e70bbee`, stored hash `ef5b1deab500b690cde29f74223de0206126d8f624dae465c98215d90a8de923`.
  - Example inittrace reader password material: random bytes `6aac81fd203b82991edbeec509adb218`, stored hash `92c0b5bddf4135540fdf7af91372c93b278e294a19de2ae36dda5c87a92659e3`.
- Init writes randomized `uov_meta.json`, `uov_public.bin`, `/run/uov_private.json`, `signer_secret`, and `uov-selftest.log`; scratch inittrace public key hash differs from previous local keys.
- Web route tracing under an authenticated local reader session:
  - `/post/:id` uses parameterized SQL: `SELECT id, title, body, author, created_at FROM posts WHERE id = ? AND public = 1`; direct SQLi attempts like `1 OR 1=1` fail.
  - `POST /dashboard/posts` creates member posts as private (`public=0`); no known admin/bot viewer.
  - `POST /upload` keeps files under `/app/uploads/<logged-in-user>/...`; `../../logs`, `..`, `/tmp`, and `profile/../../logs` are rejected, while `%2f` remains a literal directory component.
  - Folder `a/b` creates nested directories under the user only; folder `whale` from reader creates `/app/uploads/reader/whale`, not `/app/uploads/whale`.
- Public-key-only UOV structure test:
  - Known hidden oil basis `O` satisfies `B_k(o_i,o_j)=0` for every public bilinear form.
  - For `K(v)=kernel(rows M_k*v)`, one known oil vector gives a 24-dim space containing `O`; intersecting two independent known-oil kernels gives exactly the 16-dim hidden oil subspace.
  - Random vectors do not contain `O` after the same test. If two independent public-coordinate oil vectors can be found, the remaining signing attack is solved.

## 2026-07-04 current work summary and next plan

### Working local chain

- Local Docker challenge is running as `dist-whcms-1` on host port `3010`; local `/readflag` proof flag is `NHNC{LOCAL_VERIFY_WHCM0_1}`.
- Reverse-engineered `whws` and unpacked its stage-2 ELF into `artifacts/whws_stage2`.
- Confirmed websocket auth requires a valid UOV signature for canonical payload `v1|username=<name>|role=<role>|exp=<unix>`.
- Confirmed `process` requires authenticated `username=whale` and `role=admin`.
- Confirmed the final flag-read exploit locally:
  - Forge/obtain `whale/admin` token.
  - Stage malicious top-level `.png` directory via overlong `process.name`.
  - Trigger a second `process` call so unquoted `ffmpeg -i %s` executes shell metacharacters in that name.
  - Payload `a;for i in 3 4 5 6 7 8 9;do readflag>&$i;done;#.png/x.png/` + long padding leaks the flag over the inherited websocket fd.

### Solved local crypto route

- `scratch/uov_tools.py` implements GF(251) helpers, public-key parsing, UOV evaluation, polar matrices, and linear algebra.
- `scratch/recover_from_tokens.py` proves that 48 valid signatures recover the hidden oil subspace:
  - Signer fixes vinegar deterministically as `hash_to_field("whcms-uov-vinegar-v1", instance, payload, 24)`.
  - For valid signatures `sig`, `(A*sig+b)[16:40]` equals those deterministic vinegar values.
  - Linear equations over 48 signatures recover the 24 vinegar affine rows; their nullspace is the 16-dimensional oil subspace.
  - With the oil subspace, arbitrary payloads can be signed by solving a 16x16 linear system on an affine coset.
- This route is complete if remote valid signatures, `/app/logs/uov-selftest.log`, or `/run/whcms/uov_private.json` can be obtained.

### Web/auth findings

- `GET /login` performs login with query parameters; no `POST /login`.
- Passwords are `sha256(password).hex()` against randomized per-init passwords; `whale` and `reader` are random 16-byte values hex-encoded as password text.
- Login SQL is parameterized; login SQLi is dead.
- Sessions are random `crypto.randomBytes(24).toString("hex")`, in-memory, cookie `sid`, `HttpOnly`, `SameSite=Lax`.
- Dashboard signs only a fixed reader/member realtime token for logged-in readers.
- `/post/:id` is parameterized and only returns `public=1` posts.
- Member-created posts are private; no admin bot/viewer is known.
- Authenticated upload stays under `/app/uploads/<logged-in-user>/...`; traversal attempts (`..`, `../../logs`, `/tmp`, `profile/../../logs`) fail, `%2f` remains literal, and folder `whale` from reader creates `uploads/reader/whale`.

### Remote state

- Remote instances on ports `10012`, `10002`, and fresh `10006` all served the same public key:
  - SHA256 `394f8cf09400b91c5515d9b15e5a09f19d5ded22309e13c593e9ba701e52f887`
  - Instance id bytes `5adedd364c6cf14ba92a536af9577a95`
  - Latest saved as `dumps/remote_pub_10006.bin`; previous copies in `dumps/remote_pub_10002.bin` and `dumps/remote_pub_10012.bin`.
- Fresh instance created at `2026-07-04T16:17:02Z`, id `ee4cee0c7b8d`, URL `http://nhnc2.whale-tw.com:10006/`, expires `2026-07-04T16:22:02Z`.
- Targeted remote file exposure checks for selftest logs, private key, signer secret, app data/config paths, `assets` traversal, `.env`, `debug`, `server-status`, `robots.txt`, and `/proc/self/environ` all returned 404.
- Public-key reuse is likely deployment state or a preinitialized volume, not a key embedded in the distributed archive; local/inittrace keygens produce different keys.

### Failed or low-value paths

- Existing `solve_whcms.py` public-key forge is wrong; public key is an affine-transformed UOV public map, not central map.
- Random linear combinations of public polar matrices are full rank, so simple low-rank-combination recovery is not enough.
- Direct Sympy Groebner attempt on a random 16-variable specialization of the MQ signing equations timed out after 30 seconds.
- Generic Kipnis-Shamir-style public UOV attack looks too large for these parameters without a sharper implementation-specific shortcut.
- Direct unauthenticated web routes have not exposed logs/private material.

### Best next plans

1. Focus on obtaining signatures or signing material remotely:
   - Re-test any path that could expose `/app/logs/uov-selftest.log`, `/run/whcms/uov_private.json`, `/run/whcms/signer_secret`, or authenticated dashboard output.
   - If a reader login/session is found, collect the reader/member token, then look for ways to request more signer tokens or leak selftest signatures.

## 2026-07-05 continuation after final hint

- Refreshed challenge state: no applicable `AGENTS.md` under the challenge tree; continuing from existing notes.
- Reconfirmed local init selftest logs are highly valuable: `uov-selftest.log` contains 72 deterministic message/signature pairs, enough for the existing oil-subspace recovery attack. The remote solve would be immediate if the remote selftest log were reachable.
- Searched local artifacts for the reused remote instance id `5adedd364c6cf14ba92a536af9577a95`; only saved remote public-key dumps contain it. The distributed binaries/local init traces do not embed the remote key/private seed.
- Rechecked Docker/entrypoint wiring: init is skipped only when DB, public key, private key, signer secret, log dir selftest file all exist. Remote public-key reuse is likely persistent server-side state, not shipped in `dist.zip`.
- Used radare2 MCP and targeted objdump on `whws_stage2` auth:
  - Token still requires one dot, base64 payload length <= 255, sig hex length exactly 80, decoded sig bytes <= 250.
  - Base64 decoder writes a NUL terminator but the UOV hash path uses the decoded byte length, not `strlen`; NUL-suffix canonicalization does not create a reusable signer bypass.
  - Username/role/exp are canonicalized and `strcmp`ed before UOV verification; expiry is digit-only and `strtol` future checked.
  - Auth flag is set only after all 16 public equations match. No parser skip branch found.
- Added scratch-only `scratch/uov_invariant_search.py` to test generic public-UOV matrix-product ideas against the local key with known oil space.
  - For random invertible combinations `S`, `S^-1 M_i` maps the hidden oil space into a 24-dimensional extension, but that extension is not invariant and obvious commutator/kernel tests do not expose the oil space.
  - Commutators were full rank in trials; simple KS-style matrix-product invariants remain dead for these parameters.

### Current hypothesis update

- The intended no-login solve is still most likely a reverse-engineered UOV weakness or an exposure of the signer selftest material, not ordinary web authentication.
- Next tests: inspect packaged Node cached bytecode behavior with safer probes, especially UOV/keygen object layout and any hidden public route/constants that can expose `uov-selftest.log`.

2. Continue public-key-only UOV work:
   - Need two independent public-coordinate oil vectors.
   - Confirmed invariant: for `K(v)=kernel(rows M_k*v)`, two real oil vectors recover the oil subspace by intersection.
   - Search for an efficient way to find oil vectors from the common totally isotropic subspace condition `B_k(v,w)=0`.

3. Keep direct-MQ fallback bounded:
   - Try better tools/algorithms than Sympy if available (`msolve`, Sage/Singular, custom XL/linearization).
   - Avoid spending long time on generic MQ unless a specialization or rank defect is found.

4. Once token forgery is possible:
   - Write final `solve.py` that starts/reuses a remote instance, forges `whale/admin`, runs the two-stage websocket process exploit, and prints the flag.
   - Verify locally and remotely.
   - Create `skill.md` for this challenge category after solve.

## 2026-07-05 VM reverse continuation

- Added `scratch/emulate_whws_vm.py` for `fcn.00005e10`.
- Confirmed decryption:
  - First 0x30 VM bytes come from `.whcms.vm2[i] ^ mix(.whcms.shell[i] + i + (pid ^ 0x13579bdf))`.
  - Extra 0x40 bytes from `.whcms.shell` are decrypted after that but the visible dispatcher only indexes the first 0x30 code bytes.
- VM dispatch depends on `(r13d >> ((ip&3)*8) ^ code[ip]) & 0xf`; opcodes mutate `r13d`, `r9d`, `r10d`, and final global `0x12020 = old ^ ((r13<<32) ^ (r9^r10))`.
- Scanning PID 1..5000 found many final states where `(global & 0x3e0) == 0x220`, but those states only route future calls through `LOCAL_XREF_CANARY` prompt-injection strings. No token/signing bypass, file path, or network behavior is hidden in this VM path so far.
- Current read: VM is anti-analysis/decoy state churn. Continue reversing packaged Node modules and signer/keygen behavior.

## 2026-07-05 web path/custom-section continuation

- Added `scratch/hook_web_paths.js` and patched copied binary `scratch/whcms-web-pathtrace`; original web binary remains untouched.
- Traced web startup confirmed the only Express routes are still `/`, `/post/:id`, `/login`, `/logout`, `/dashboard`, `/upload`, `/dashboard/posts`, and `/public-key`.
- Static asset root is exactly `/app/public/assets` (local trace path under `extracted/dist/public/assets`), mounted at `/assets` with `etag:false` and `maxAge:"5m"`.
- No-login route probes:
  - `/public-key` ignores query strings such as `?file=../logs/uov-selftest.log`.
  - `/assets/../logs/uov-selftest.log`, encoded `..`, double-encoded `..`, and slash-encoded traversal variants did not serve app logs, private keys, or signer secrets.
  - Some 500s in the traced copy were instrumentation artifacts from wrapping one-argument `app.get('env')`; they are not challenge behavior.
- Rechecked custom sections in `artifacts/whws_stage2`:
  - `.whcms.ai.00`..`.whcms.ai.15` and `.whcms.aiwire` are printable prompt-injection canary text with no plain `WHUOV`, `uov_private`, `signer_secret`, `selftest`, `v1|username`, `NHNC{`, remote public-key hash, or long hex/base64 payload.
  - `.whcms.shape` bytes look deliberate (`7f454c46ff001337...`) but `readelf` marks the section non-executable and radare2 found no direct xrefs to its virtual address.
- Current reverse priority: statically verify all calls into the string decoder, filesystem open/read functions, signer/keygen bytecode behavior, and any stage-2 branches not reached by normal websocket auth/process traffic.

## 2026-07-05 native websocket/auth audit

- Static `whws_stage2` audit of the main connection loop:
  - WebSocket frames are read as masked client text frames; payload length is capped below `0x1000`, copied into a stack buffer, and NUL-terminated before JSON parsing.
  - The auth state starts at stack slot `[rsp+0x60]` and is zeroed before the ready message.
  - `type == message` requires the auth flag; unauthenticated calls return `{"type":"message","ok":false,"error":"auth required"}`.
  - `type == process` requires auth, then compares stored role to decoded `admin` and stored username to decoded `whale`; unauthenticated/wrong-user attempts return the visible not-allowed path.
- Token parsing details:
  - Token must contain exactly one dot.
  - The base64url payload part is bounded (`<=255` chars) and decoded into a NUL-terminated C string.
  - The signature hex part must decode to exactly 40 bytes, each value `<=250`.
  - Payload must start with `v1|`.
  - Parser extracts `username`, `role`, and `exp`, rebuilds exactly `v1|username=%s|role=%s|exp=%s`, and `strcmp`s this canonical string to the decoded payload before expiry and UOV verification.
  - Username is limited to 1..24 bytes of `[A-Za-z0-9_]`; role must be `member` or `admin`; expiry must be decimal digits and not expired.
- No classic native bypass found so far:
  - JSON/token field extractors are bounded and reject backslash escapes/non-string JSON values.
  - NUL tricks look ineffective because the same C-string payload is canonicalized and hashed for UOV verification.
  - No state update occurs before the UOV verifier accepts the signature.
- Updated current hypothesis: the "No need to login / Reverse Engineering More" hint likely points to a non-web-login route to a valid admin token, leaked signing material/signatures, or a UOV implementation weakness; the visible websocket gate itself still requires a valid `whale/admin` UOV token.

## 2026-07-05 remote/probe continuation

- Fresh remote instance:
  - id `c94e39e37822`
  - URL `http://nhnc2.whale-tw.com:10008/`
  - created `2026-07-05T17:09:36Z`, expires `2026-07-05T17:14:36Z`
- `/public-key` on `10008` still has SHA256 prefix `394f8cf09400b91c` and full hash matches earlier reused remote keys.
- Port `10009` also served the same WhCMS pages and same public key, likely another/stale duplicate instance with the shared remote key; no signer endpoint there either.
- Re-ran path probes on remote `10008`: `/logs/uov-selftest.log`, `/run/whcms/uov_private.json`, `/run/whcms/signer_secret`, `/data/whcms.sqlite`, traversal through `/assets`, `/debug`, `/api/config`, and `/sign-token` all failed.
- Host header variants against public port (`127.0.0.1:9100`, `localhost:9100`, `signer`, `whcms-signer`) still returned public web 404 for `POST /sign-token`; no proxy-to-signer behavior found.
- Nearby open ports mostly belonged to other challenges/instances. No exposed internal signer was identified.
- Public-key algebra continuation:
  - Sampled 5,000 random linear combinations of the 16 public polar matrices over GF(251).
  - Best rank observed was 39; most samples were full rank 40.
  - Conclusion: naive low-rank/minrank sampling does not reveal the hidden UOV oil subspace.
- Public asset reverse check:
  - Added `scratch/probe_realtime_js.js` to execute the obfuscated `public/assets/realtime.js` with DOM/WebSocket stubs and log decoded strings/messages.
  - The asset reads `data-token` from `[data-realtime]`, opens `/ws`, and sends `{"type":"auth","token":...}`.
  - No hardcoded token, signer secret, admin/whale string, hidden websocket verb, or flag path appeared in the decoded behavior.

## 2026-07-05 continued reverse/probe after compaction

- Added `scratch/hook_uov_proxy.js` and patched only disposable `scratch/whcms-web-uovproxy`.
  - Runtime property probing of `crypto/uov.js` confirms `sign()` uses `instanceId`, `central`, `b`, and `invA`; no public-key-only signing branch appeared.
  - Forcing `sign()` on a shallow public object touches `central` then triggers a V8 fatal stack trace, not a catchable public signing mode.
  - The private affine transform `a`/`invA` is dense across all blocks; no triangular/block-sparse shortcut is visible in local generated keys.
- Fresh remote instance from instancer:
  - id `e59a61fcdd08`
  - URL `http://nhnc2.whale-tw.com:10016/`
  - created `2026-07-05T18:05:35Z`, expires `2026-07-05T18:10:35Z`
- Bounded remote sweep over ports `10000..10030` found WhCMS on `10016` and sibling `10021`, both serving the same public key SHA256 prefix `394f8cf09400b91c`.
  - Probed `/logs/uov-selftest.log`, `/app/logs/uov-selftest.log`, `/uov-selftest.log`, `/run/whcms/uov_private.json`, `/run/uov_private.json`, `/run/whcms/signer_secret`, and several `/assets` traversal encodings.
  - No selftest/private-key/signer-secret exposure found in that sweep.

## 2026-07-05 resumed MQ/reverse state

- The prior `msolve` direct MQ attempt for `scratch/mq_seed42.msolve` is no longer running and produced an empty `scratch/mq_seed42.out` before timeout/termination. Treat this as another negative result for generic random slicing.
- Active direction remains the final hint: no web login dependency, continue reversing for an implementation shortcut, hidden exposure, or verifier/signature weakness.

## 2026-07-05 UOV reverse continuation

- Confirmed init generates `signer_secret` as fresh `crypto.randomBytes(32)` after keygen; there is no static or public-derived signer header.
- Added scratch-only `scratch/hook_v8_uov_calls.js` to force execution of UOV/token cached-bytecode exports with V8 bytecode printing enabled. Original pkg binaries remain unchanged; the probe will be run through a disposable patched copy.

## 2026-07-05 original whws loader custom-section lead

- Revisited the original distributed loader `extracted/dist/bin/whws`, not only the unpacked stage-two ELF.
- Original loader has many custom sections absent from `artifacts/whws_stage2`:
  - `.whcms.pk.15`..`.whcms.pk.00`, `.whcms.vm0`, `.whcms.vm1`, `.whcms.mem.shell`, `.whcms.ai.spread.23`..`.whcms.ai.spread.00`, `.whcms.aiwire.pad`, `.whcms.vm2.pad`, and intentionally corrupt-looking `.debug_*`.
  - `.whcms.pk.*` chunk sizes sum to `0x5f32`, matching the compressed/encrypted stage-two blob reconstructed by `scratch/unpack_whws.py`; these are probably not UOV key material.
  - `.whcms.vm0` starts with `WHVM 00 ff 13 37` and size `0x1008`.
  - `.whcms.vm1` starts with an ELF magic/header prefix and size `0x1008`, but the rest is high entropy or encoded.
- Original loader disassembly and relocations show direct use of allocated `.whcms.pk.*`, `.whcms.aiwire`, and `.whcms.shape`; the non-allocated `.vm0/.vm1/.mem.shell/.ai.spread.*/.debug_*` sections are not mapped in normal execution.
- Current reverse hypothesis: the final hint may point to these non-loaded sections as embedded reverse-engineering material, decoys, or a hidden decoder/payload. Next tests are to dump them cleanly, inspect entropy/magic, and try section-combination/XOR/decompression transforms for signing material, selftest signatures, or a token bypass.

## 2026-07-06 continuation

- Refreshed state after compaction. No applicable `AGENTS.md` in the challenge tree; the only found file is in unrelated `../cucumber-farm/...`.
- Re-read active CTF skills (`solve-challenge`, `ctf-reverse`, `ctf-web`, `ctf-crypto`) and continued from the final hint: no web login dependency, reverse more.
- Rechecked packaged UOV behavior with the pkg runtime (`scratch/whcms-web-v8uovcalls`) instead of system Node:
  - cached bytecode loads with `cachedDataRejected=false` under the bundled Node/V8.
  - `uov.sign(private,payload)` returns an `Array(40)`.
  - `signatureToHex` and `signatureFromHex` both operate on 40-byte signatures.
  - `verify(public,payload,sig)` accepts the private signer output; no shorter-signature or public-object signing shortcut was observed.
- Classified original `whws` hidden sections with `file`, entropy/magic scans, strings, binwalk, and offset decompression:
  - `.whcms.ai.spread.*` and `.whcms.aiwire*` are prompt-injection decoys plus high-entropy filler.
  - `.whcms.vm1`, `.whcms.vm0`, `.whcms.mem.shell`, and fake `.debug_*` remain high-entropy/non-loaded blobs with no detected compressed payload, `WHUOV`, selftest, signer secret, token, flag, or useful ELF after cheap decoders.
  - Binwalk found no embedded formats in the likely hidden-section candidates.
- Current priority remains public-key-only UOV recovery or a more precise bytecode/native implementation mistake; hidden-section decoy path is lower value unless a concrete decoder is found.
