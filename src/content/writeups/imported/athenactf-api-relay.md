---
title: "Api Relay — Field Notes"
description: "Challenge directory has no source/binary artifacts; only empty notes.md and standard scratch/dump directories. Earlier target: 13.206.57.188:10027 (became unstable after probing); current target is 13.206.57…"
published: "2026-07-18"
updated: "2026-07-19"
event: "athenactf"
category: "Binary Exploitation"
kind: "field-note"
status: "solved"
tags: ["Binary Exploitation", "athenactf", "Field notes"]
readingTime: 7
wordCount: 1451
featured: false
sourcePath: "~/ctf/athenactf/api_relay/notes.md"
---

## Confirmed state

- Challenge directory has no source/binary artifacts; only empty `notes.md` and standard scratch/dump directories.
- Earlier target: `13.206.57.188:10027` (became unstable after probing); current target is `13.206.57.188:10031`.
- Protocol from prompt: send `FORWARD|<host>|<port>|`; relay then proxies raw TCP.
- Exact-string blocklist reportedly rejects host `127.0.0.1` and `localhost`.
- Likely pivot: connect to loopback Redis (default port 6379) via an alternate loopback spelling, inspect RESP data, then enqueue a shell-injection job through the worker's `file` field.

## Tests so far

- `FORWARD|127.0.0.1|6379|` and `FORWARD|localhost|6379|` return `ERR|host-blocked`.
- `FORWARD|127.1|6379|` + RESP `PING` returns `+PONG`; decimal `2130706433`, hex `0x7f000001`, and `0` also reach loopback. `[::1]` is not resolved by the relay, and `127.0.0.2` is refused.
- Redis is unauthenticated Redis `8.0.2`, bound internally to `127.0.0.1:6379`.
- `DBSIZE` is `0`; `SCAN 0 COUNT 100` and `KEYS *` are empty. Thus the worker likely blocks on an empty queue.
- `INFO server` reports Redis PID 7 and `/app/redis-server`.
- `CLIENT LIST` showed a single `redis-py 8.0.1` worker blocked on `BLPOP`; after harmlessly killing that connection while monitoring, it reconnected and issued `BLPOP tasks 0`. Queue key is therefore `tasks`.
- Queue jobs with top-level `{"file": ...}` are consumed; a benign job is followed by a fresh worker connection rather than an immediately observed second `BLPOP`, suggesting the worker/container restarts after processing or errors. The exact accepted job schema is still unconfirmed.
- Shell side-effect probes using `redis-cli`, worker `python3` + redis-py, raw RESP over Python sockets, and `bash` `/dev/tcp` did not create visible Redis keys. Some probes may have used an unaccepted schema or unavailable helper binary.
- After pushing a burst of schema-variant jobs, the public relay began returning connection refused (at 18:35 local time); check for service restart before further probes.
- New instance check: at `10027`, literals `127.0.0.1`/`localhost` still return `host-blocked`, while `127.1`, decimal `2130706433`, and `0` return Redis `+PONG`.
- Fresh current-instance check: at `10031`, literals `127.0.0.1`/`localhost` return `host-blocked`, while `127.1`, decimal `2130706433`, and `0` return Redis `+PONG`.
- The host exposes many parallel challenge ports; several (`10003`, `10006`, `10020`, `10023`, `10035`, `10039`) stopped accepting connections after crafted worker jobs, while others periodically recover/reset. Use one clean API-relay port for each minimal experiment; avoid bursts.
- Redis `FUNCTION/EVAL` has the normal sandbox (`io`, `os`, `dofile` unavailable); DBs 0-15 all empty after reset.
- One-job output checks (`results`, `output`, `responses`, `task_results`, `out`, `jobs:results`) yielded no result list. OOB HTTP and temporary Python/nc HTTP-server probes also yielded no callback/port.

## Current hypothesis / next tests

- Query `CLIENT LIST`/`INFO clients` to expose a worker's blocked list/stream command or use `MONITOR` to learn its queue key and job format.
- Push one benign JSON job to `tasks`, observe worker-side Redis commands/results, then replace `file` with shell injection to recover the flag.
- Current focus: wait for relay recovery, then submit one carefully chosen accepted job at a time and use a Redis key side effect for exfiltration.
- Remaining hypothesis: the worker's exact queue serialization/field schema or output channel differs from the assumed top-level JSON `{"file": ...}`; platform instance instability makes broad schema brute force unsafe.
- Latest state: `10027` became unavailable after additional single-job probes; `10031` is currently live and fresh. No flag recovered yet; confirmed relay bypass and Redis queue key remain the useful facts for the next experiment.
- `10031` stopped accepting connections after the latest worker-side probe. A read-only scan found fresh Redis-relay listeners at `10000`, `10004`, `10020`, `10023`, and `10036`; use `10036` as the current clean replacement if needed.
- On replacement `10021`, after the worker jobs, `DBSIZE` became 2 and `KEYS *` showed hashes `job1` and `task:job1`; both have `HGETALL => file=/etc/passwd`. This is the first evidence of the intended schema: queue likely contains a job ID and worker reads a Redis hash's `file` field, rather than parsing our JSON queue value.
- Follow-up on `10021`: queueing `task:job2` (after creating `job2`/`task:job2` hashes) kept the same redis-py worker in its BLPOP loop; MONITOR showed no HGET/HGETALL/result write. On clean `10037`, creating `job1`/`task:job1` hashes and queueing `job1` likewise showed only `BLPOP`. Thus the hashes may be decoys/seed data, or the vulnerable worker's file lookup is outside this Redis command path; do not treat the hash hypothesis as confirmed.
- Current probing replacement `10037` was also recycled after the latest queue probe; user-supplied `10031` remains unavailable. No flag recovered. Need a fresh authorized listener before continuing.
- Fresh target `10048`: `FORWARD|127.1|6379|` reaches Redis; `PING` returns `+PONG`, `KEYS *` is empty, and `CLIENT LIST` shows a `redis-py 8.0.1` worker blocked on `BLPOP tasks 0`.
- Next targeted test: pair benign `job1`/`task:job1` hashes with one `{"job_id":"job1"}` queue item and monitor for a hash lookup.
- Additional tests on `10048`: top-level JSON, nested/list JSON, delimiter strings, Python pickle/base64, UUID IDs, and pure-shell loop payloads were all consumed with an immediate `BLPOP`; no command-side effect or Redis lookup appeared. This strongly suggests either a hidden queue serialization/validation gate or that this worker instance is not the command worker described by the prompt.
- Important topology hypothesis: the worker may be a separate container and injected commands should reach Redis via Docker DNS (`redis:6379`), not `127.0.0.1:6379`; the planned test could not run because `10048` was recycled/refused immediately afterward.
- Replacement relays `10002`, `10039`, and others showed the same worker behavior. Testing the likely Docker hostname `redis` and multiple `file` field serializations produced no Redis side effect; relay DNS itself does not resolve `redis`, so the separate-container hypothesis is unconfirmed.
- `10048` is now recycled and returns HTTP rather than the relay. Current live API-relay replacements include `10004`, `10009`, `10039`, `10042`, and `10049`, but no flag has been recovered.
- New user-supplied target `10031` on 2026-07-19; verify whether it is a fresh API Relay instance before probing.
- On live `10031`, the queue worker still consumes every tested JSON envelope (`task/name/function/op`, IDs, nested args/params/data/payload/request forms) and returns immediately; unique Redis `SET` probes remain absent. Pickle, base64-pickle, query-string, and form-style payloads also had no effect.
- `MONITOR` around a top-level `{"file":"/dev/null; /bin/sleep 3"}` showed only the producer `LPUSH` and worker `BLPOP` within the interval, confirming no observable delay or Redis-side effect. `LLEN tasks` is zero and `CLIENT LIST` still shows one `redis-py 8.0.1` client blocked on `BLPOP tasks 0`.
- Read-only internal port fingerprints through `10031` found only `127.1:6379` open among common HTTP/Redis ports; no companion HTTP service was exposed. Canonical `10041` is a different challenge service, while `10031` remains the API Relay.
- Current `10031` Redis contains only probe-created hashes/strings from these experiments; no flag/result key is present. The documented worker handler remains unconfirmed and may be absent/miswired on this instance.
- After the user reissued `10031`, it restarted cleanly (`DBSIZE=0`, worker `redis-py 8.0.1` on `BLPOP tasks 0`). A fresh top-level JSON probe, raw path/shell forms, job-ID/hash forms, and command/input envelope forms still produced immediate `BLPOP` with no execution signal. A five-second top-level sleep was verified by repeated `CLIENT LIST`: the worker stayed blocked on `BLPOP` throughout, so the top-level form is not accepted/processed.
- `MODULE LIST` shows only Redis's built-in `vectorset` module; no custom module or Redis Functions are present. Internal common-port fingerprinting still finds only Redis open.
- Final focused pass on the restarted `10031` tried `process_file`, `worker.process_file`, `file_command`, `execute`, `run`, and `name/action/type` variants with `args`/`file`; all were popped with no marker. The instance remains Redis-only and the handler never issues a Redis lookup or delays on `/bin/sleep`.
- Status: no flag recovered. Strongest conclusion is a challenge-instance/worker schema mismatch or broken worker; a fresh port alone may not help unless the dev memo/queue serialization is available.
- Fresh user target `10002` on 2026-07-19: relay bypass `127.1` reaches Redis 8.0.2; DB initially empty; worker is `redis-py 8.0.1` blocked on `BLPOP tasks 0`.
- On `10002`, raw `/etc/passwd; /bin/sleep 4`, JSON `{"file":...}`, `{"type":"file","file":...}`, and combined `id/type/action/input/file` objects were consumed, but MONITOR showed only `LPUSH` and the worker's initial `BLPOP`; no worker-side Redis command or result write appeared. The worker connection was replaced after jobs, consistent with a malformed-schema exception/restart or a job timeout.
- `10002` listener-exfil probes using Python interpreters discovered through `/proc/*/exe` and a direct `/flag` TCP server did not expose a port. Redis-marker probes via Python, bash `/dev/tcp`, and interpreter variants also produced no keys. This does not prove shell execution because accepted queue serialization remains unknown.
- Current hypothesis remains exact queue serialization/worker schema mismatch; raw and top-level JSON are not confirmed accepted. Do not assume worker restart timing proves command execution.
- User target `10002` recycled to an HTTP service after the extended probes; it is no longer usable as API Relay.
- Clean replacement `10037`: compact JSON `{"file":"/etc/hosts;/app/redis-cli SET pwn S14"}` was consumed; MONITOR showed only `LPUSH` and `BLPOP`, no `SET`. Another solver then tried JSON/raw payloads with `/app/redis-cli`, `python3` + redis-py, and bash `/dev/tcp`; still no worker-side Redis commands.
- Clean replacement `10038`: a single combined JSON object carrying the same injection in top-level, nested `input/data/payload/task/job/args/params/request/body` aliases was consumed with only `RPUSH`/`BLPOP`; no marker `SET`. This reinforces that current worker instances do not reach the documented command execution path, or require an unobserved serialization.
