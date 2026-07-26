---
title: "Mango — Field Notes"
description: "MangoDB! Make sure you already local solved the challenge then go to the instancer Instancer available via: https://nhnc-whale.whale-tw.com/"
published: "2026-07-04"
updated: "2026-07-05"
event: "nohacknoctf"
category: "Web Security"
kind: "field-note"
status: "solved"
tags: ["Web Security", "nohacknoctf", "Field notes"]
readingTime: 16
wordCount: 3371
featured: false
sourcePath: "~/ctf/nohacknoctf/mango/notes.md"
---

Mango
500
0 0

MangoDB!
Make sure you already local solved the challenge then go to the instancer
Instancer available via: https://nhnc-whale.whale-tw.com/

ctfd instance token:[redacted instance token]

## Audit log - 2026-07-04

Scope:
- Artifact under review: `dist.zip`. Extracted working copy: `artifacts/dist/`. Original artifact remains unchanged.
- Service class: Node/Express + MongoDB + Firefox/Selenium bot.
- Instancer: `https://nhnc-whale.whale-tw.com/`.

Material facts:
- `docker-compose.yml` defines `mongo`, `web`, and `bot`.
- Web defaults: `ROUND_TOTAL=4`, `GRAPHQL_LIMIT=320`, `INNER_MIN=100`, `INNER_MAX=520`.
- Local test flag: `FINAL_TEXT=NHNC{TEST_ME}`.
- Remote flag is only returned after four accepted `/api/round/submit` calls.

Attack surface findings:
- `/api/register` creates a `sid` cookie and accepts only name `whale`.
- `/api/round/start` creates one hidden admin record, 100-520 system records, and one public record.
- The public record ID is disclosed. The admin record ID is the same ObjectId prefix with counter difference in `[101,521]`.
- `/api/round/submit` accepts exactly the admin/check record ID; a wrong ID marks the round submitted and closes it.
- Internal `/graphql` listens on `127.0.0.1:3001`, not the public port.
- Internal `/graphql` only accepts loopback, Host `127.0.0.1:3001`, method `POST`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Dest: document`.
- GraphQL `record(id)` signs only matching admin records. Signing is slow and returns a large SLH-DSA signature.
- `queryCount` increments once per HTTP request, not once per GraphQL alias. A single aliased document can test all 421 candidate IDs.

Validated local exploit:
- Local stack started with `docker compose -f docker-compose.yml up --build -d mongo web`.
- `scratch/local_direct_solve.py` used `docker exec dist-web-1 node ...` to reach internal GraphQL.
- Local result: four rounds completed and `NHNC{TEST_ME}` recovered.

Remote evidence:
- Instancer assigned:
  - `http://nhnc2.whale-tw.com:10010/` (expired/used)
  - `http://nhnc2.whale-tw.com:10027/` (expired/used)
  - `http://nhnc2.whale-tw.com:10004/` (round 1 closed by failed bot attempt)
- Fresh instancer API check on `2026-07-04T21:36:12Z` returned only one exposed connection:
  - `{"name":"web","label":"Web","protocol":"http","host":"nhnc2.whale-tw.com","port":10003,"target":3000,"value":"http://nhnc2.whale-tw.com:10003/"}`
  - no second/public GraphQL or auxiliary port was present in `connections`
- `localtunnel` was rejected for browser delivery because Firefox-like UA receives a 511 interstitial.
- `cloudflared` quick tunnel works: `https://washer-compare-diameter-packets.trycloudflare.com/`.
- Bot successfully loaded the Cloudflare page and executed attacker JavaScript.

Failed hypothesis:
- Hidden iframe form POSTs can be timed, but they send `Sec-Fetch-Dest: iframe`. Internal GraphQL rejects them before incrementing `queryCount`.
- Popup form POSTs send `Sec-Fetch-Dest: document`, but opener-side `load` timing is not reliable in Chrome/Firefox test runs.
- The failed iframe timing path guessed an ID and `/api/round/submit` returned `403 closed`; state showed `submitted: true`, confirming wrong submission burns the round.

Current audit conclusion:
- The remaining blocker is a browser-side document-navigation POST oracle that preserves enough control to continue after each probe.
- Strongest next tests: navigation history/back oracle, named-window reload/close behavior, service worker or cache-based timing side effects, or a route-level bypass for `isDocumentPost`.

## Resume 2026-07-04
- Resumed analysis from existing notes; loading web/browser-bot references and rechecking source/header behavior before new oracle tests.

Direct timing update:
- Internal GraphQL direct POST timing shows miss ~= 10-40 ms, one hit signature ~= 200 ms. Repeating same hit alias scales linearly: 4 hits ~= 753 ms, 16 hits ~= 3104 ms, 64 hits ~= 11142 ms.
- Added scratch/pool_graphql_test_server.py to test same-host connection-pool timing via top-level popup POSTs plus image GET timing.

Browser experiment update:
- Connection-pool image probe failed locally in Firefox 133: miss/hit after-probe times were both fast (miss ~=14/61 ms, hit ~=20/28 ms). Firefox did not queue image GETs behind popup document POSTs.
- Service-worker forwarding failed in Chromium test: intercepted navigation had mode=navigate/dest=document, but Request construction/cloning with mode=navigate throws; plain fetch sends mode=cors/dest=empty.

Popup state update:
- Real Firefox + internal GraphQL COOP test: popup WindowProxy flips to closed=true around 20 ms for both miss and hit because opener is severed at response header commit. Accessible state (closed/name/location/history/length/document.readyState) does not reveal body completion.

Named-window update:
- Retargeting a COOP-separated named popup with window.open(url, sameName) always produced a fresh same-origin window immediately for both miss and hit; no completion timing leak.

Resource Timing update:
- performance.getEntriesByType("resource") in the opener records no entries for cross-origin popup form navigations to internal GraphQL, for either miss or hit.

Location reclaim update:
- Assigning oldWindow.location after COOP severing produced no /reclaim requests and did not change accessible state; the opener cannot navigate the real separated popup.

Header spoof update:
- Firefox 133 strips JS-supplied Sec-Fetch-Mode/Sec-Fetch-Dest headers; echo test saw only content-type and origin. Direct fetch header spoofing cannot satisfy isDocumentPost.

Navigate-fetch update:
- Firefox rejects fetch(..., {mode: "navigate"}) with TypeError: Invalid request mode navigate.

Control-plane update:
- Cross-origin `navigator.sendBeacon()` with a `Blob(..., {type: "application/json"})` from Firefox 133 does not give a usable JSON POST primitive to localhost-style services. In a fresh bot visit, the receiver on `:8783` saw only a preflight `OPTIONS /echo` with `Access-Control-Request-Method: POST` and `Access-Control-Request-Headers: content-type`; even after replying with permissive CORS, Firefox never followed with the POST body.
- Shared web/bot namespace live ports during a working visit:
  - geckodriver HTTP on random loopback port, e.g. `127.0.0.1:35809`
  - Firefox remote debugging HTTP on random loopback port, e.g. `127.0.0.1:38297`
  - Marionette/raw control socket on another loopback port, e.g. `127.0.0.1:40305` / `37017`, returning `ECONNRESET` to HTTP probes
- Geckodriver surface:
  - `GET /status` returns `{"value":{"message":"Session already started","ready":false}}`
  - `OPTIONS` is rejected with `405`; no CORS/preflight path for browser JSON requests
  - `GET /session/<bad>/...` returns invalid-session JSON, but there is no useful sessionless GET route to control the active browser
  - `POST /session` with proper JSON while a session is active returns `500 session not created / Session is already started`
- Firefox remote debugging HTTP surface:
  - `GET /json/version`, `GET /json/list`, `GET /json/protocol` work
  - `GET /json/activate/<full-id>` returns `200 Target activated`
  - `GET /json/close/<full-id>` returns `200 Target is closing`
  - `/json/new?...` supports only `PUT`; `GET/POST/HEAD/OPTIONS` all return `405` with "supports only PUT verb"
  - target IDs require the full UUID. Tested prefixes of lengths `1,2,3,4,5,6,7,8,9,10,12,16,20` all returned `404 No such target id`; only the full UUID returned `200`
- DevTools websocket origin probes:
  - bad origins like `http://172.23.0.1:8782`, `http://localhost:37037`, `http://localhost:35809`, `http://localhost:3000`, `http://127.0.0.1:4000` return `400 The handshake request has incorrect Origin header ...`
  - some `127.0.0.1:*` origins (`:37037`, `:35809`, `:3000`, `:3001`) did not emit the same 400 body in the raw probe, but there is still no known way to execute attacker JS on those localhost origins

Javascript-retarget update:
- Added `scratch/js_nav_origin_test_server.py` and tested in the real Firefox 133 bot with popups allowed.
- Cross-origin popup to a non-COOP target (`http://172.23.0.1:8785/target`) opens successfully.
- Retargeting that popup with either:
  - `w.location = "javascript:..."`
  - `window.open("javascript:...", sameName)`
  did **not** execute JavaScript in the target origin. The target server only logged the initial `/target` navigation and never logged `/fired`.

Current blocker refinement:
- The remaining localhost control surfaces are real but still not enough:
  - geckodriver needs strict JSON/CORS-unfriendly requests
  - DevTools has blind GET actions and websocket control, but blind GET actions needing UUIDs require the full page ID, and `/json/new` is PUT-only
  - no confirmed path remains to get attacker JS executing on an accepted localhost origin or to send a useful PUT / JSON POST cross-origin from Firefox 133

2026-07-04 later update:
- Earlier "popup GraphQL POST does not decrement queriesLeft" was caused by oversized form bodies, not by a broken document-navigation primitive.
- Verified with `scratch/form_post_graphql_probe_server.py` against the real bot and against local Firefox 133 in `dist-bot-1`: tiny top-level form POSTs to `http://127.0.0.1:3001/graphql` do reach the internal handler and decrement `queriesLeft` for both named-popup and `_blank` submits.
- Root cause for the failed amplified probe: internal GraphQL reads the raw `application/x-www-form-urlencoded` body through `express.text({ type: '*/*', limit: '1mb' })`. The `query{...}` source length can still be under 1 MiB while the URL-encoded `query=...` body crosses the limit. Example with all 421 candidates:
  - repeats 38: raw length `788796`, encoded length `1044774` (fits under 1 MiB)
  - repeats 48: raw length `999296`, encoded length > 1 MiB (requests never reached `loadGraphqlContext`, so `queriesLeft` stayed unchanged)
- Local high-fidelity reproduction works without Selenium: `docker-compose.yml` uses `bot: network_mode: service:web`, so `docker exec dist-bot-1 firefox --headless -profile <tmp> http://172.23.0.1:<port>/` reproduces the same shared-namespace Firefox 133 behavior as remote. The bot HTTP service inside the local container is unreliable because Selenium Manager cannot discover geckodriver offline, but direct Firefox execution is enough for oracle testing.
- Single-request state oracle with safe full-candidate body (`repeats=38`) still does not separate hit from miss cleanly:
  - miss `after:0` state fetch ~= 2191 ms
  - hit `after:0` state fetch ~= 1848 ms
  - later polls return to ~= 3-6 ms
- Parallel-burst queueing *does* create a boolean hit/miss signal when the popup requests are allowed to keep running:
  - `scratch/parallel_popup_state_oracle_test_server.py` with full-candidate requests, `parallel=4`, `repeats=38`:
    - miss `after:1` ~= 5365 ms
    - hit `after:1` ~= 6449 ms
  - same server with `parallel=6`, `repeats=38`:
    - miss `after:1` ~= 5838 ms
    - hit `after:1` ~= 10734 ms
- Important limitation from `scratch/slot_queue_probe_server.py`: the queueing channel currently behaves like a yes/no "does any request contain a hit" oracle, not a position oracle.
  - One heavy request in slot 0 and one heavy request in slot 5 produced essentially the same trace with `slots=6`, `repeats=38`: `after0` ~= 1.4-1.5 s with `queriesLeft` decremented by 1, then `after1` ~= 9.5-9.8 s with the remaining requests counted.
  - Two heavy requests (`hit_mask=0,1`) also looked the same as one heavy request.
- Closing popups early destroys that boolean signal in the tested configuration. With `repeats=20`, `slots=6`, `close_ms=500`, `gap=800`, both all-miss and one-hit traces collapsed to the same shape: `after0` ~= 4.5-4.7 s and all six requests had already decremented `queriesLeft`.
- Extra timing-budget observation: the real bot calls `driver.get(url)` with `PAGE_TIMEOUT=12` and only starts the fixed `VISIT_SECONDS=18` sleep *after* `get()` returns or times out. A page that intentionally never finishes loading can plausibly stretch the useful execution window from ~18 s to ~30 s, which may be necessary for any multi-step browser oracle.

Control-surface update:
- Inside the local bot namespace, a live Selenium/Firefox session exposes the same three loopback surfaces seen remotely:
  - DevTools HTTP on a random port, e.g. `51327`, with `/json/version` and `/json/list`
  - geckodriver HTTP on a random port, e.g. `54717`, with `/status`
  - Marionette/raw control on another random port, e.g. `46425`
- DevTools websocket origin checks are stricter than hoped:
  - direct attacker origin fails (`code 1006` / error)
  - sandboxed iframe `null` origin also fails (`code 1006` / error)
  - so `null` origin is **not** a bypass for the browser-level websocket.
- geckodriver route behavior:
  - `POST /session` with missing capabilities returns `400 invalid argument / missing field capabilities`
  - `POST /session` with valid capabilities while a session is active returns `500 session not created / Session is already started`
  - `GET/POST /session/<bad>/...` returns `404 invalid session id / Got unexpected session id ...`
  - none of those error bodies leaked the current session id.
- Important new transport primitive:
  - Cross-origin `fetch(..., {method:"POST", mode:"no-cors", body:new Blob(['{\"a\":1}'], {type:'application/json'})})` from Firefox 133 sends the raw JSON body **without** a `Content-Type` header.
  - Verified locally with `scratch/nocors_blob_ct_test_server.py` across two ports (`8795` page -> `8796` echo):
    - string body => `text/plain;charset=UTF-8`
    - `Blob(type='text/plain')` => `text/plain`
    - `Blob(type='application/json')` => raw body with **no** `Content-Type`
  - Manual local geckodriver check showed this matters: geckodriver accepts command POSTs with a raw JSON body and no `Content-Type` header. Example:
    - `POST /session/<real-sid>/url` with no content-type and body `{"url":"http://172.23.0.1:8789/?x=nocontenttype"}` returned `200 {"value":null}`
    - `POST /session/<real-sid>/execute/sync` with no content-type and raw JSON also returned `200`
  - This means the old assumption "geckodriver is unusable because browser JS cannot send `application/json`" was too strong. The **remaining** blocker for geckodriver is not body transport but discovering the random loopback port and, especially, the current session id.
- Page-environment leakage check:
  - `scratch/introspect_page_env.py` inspected first-level string properties of `window` and `navigator` from inside a Selenium-driven Firefox page.
  - No webdriver session id and no geckodriver port/service URL strings were exposed there (`sid: []`, `port: []`).

Oracle search update:
- The 8-group staggered weighted-query idea does produce structured-looking traces, but a local data-driven test on the page-visible features was too weak to trust:
  - config tested: `repeats=10,20,40,80,120,160,200,240`, `start_gap=300`, `gap=120`, `samples=2`
  - features: per-submit elapsed times plus `after0/after1` state timings and `queriesLeft`
  - leave-one-out 1-NN accuracy on 20 local labeled runs was only `4/20 = 20%`, barely above chance for 8 groups
  - so that classifier family is currently not reliable enough to drive a real 2-step solve.

2026-07-05 transport/oracle update:
- `text/plain` top-level form POSTs can carry a **raw** GraphQL document to the internal handler without URL-encoding overhead.
  - Local validation from a Selenium-driven Firefox page on `http://172.23.0.1:8805/`:
    - create a popup form to `http://127.0.0.1:3001/graphql`
    - set `form.enctype = "text/plain"`
    - set a single input with `name = "<graphQL query>#"` and `value = ""`
    - the emitted body is `<query>#=\r\n`; GraphQL treats the trailing `=` as part of the `#...` comment, so the raw query executes
    - verified by `queriesLeft` dropping from `320` to `319` after submitting `query{a0:record(id:"000000000000000000000000"){hit}}`
- This removes the earlier `application/x-www-form-urlencoded` body inflation bottleneck:
  - example full-candidate raw query lengths remain the old raw numbers, but now the body limit is effectively the raw query itself, not the URL-encoded `query=...` form
  - for 210-candidate subsets, `repeats=96` produced raw length `996896`, which still fits under the internal `1mb` text-body limit
- Geckodriver branch refinement:
  - even with the **correct** local geckodriver port and **correct** live session id, a browser-origin `fetch(..., {method:"POST", mode:"no-cors", body: Blob(type="application/json")})` from an attacker page did **not** navigate the active session
  - practical result: the geckodriver route is still dead from a real attacker origin; the remaining issue is not just port/session discovery
- New scratch harnesses:
  - `scratch/single_subset_probe_server.py`
  - `scratch/run_single_subset_case.py`
  - these support one target subset query plus optional guaranteed-miss filler popups using the public record id
- Single-subset raw-transport observations:
  - plain single-request subset tests still overlap too much to trust as a direct yes/no oracle
  - saturated tests with fillers create more structure, but the signal is still unstable
  - example promising config:
    - `start=0 count=210 repeats=96 fillers=5 filler_repeats=10000 samples=1 gap=500`
    - observed miss traces included:
      - `hit=false diff=329 -> after0 ~= 5462 ms, q0=314`
      - `hit=false diff=367 -> after0 ~= 5810 ms, q0=314`
      - `hit=false diff=342 -> after0 ~= 5990 ms, q0=314`
    - observed hit traces included:
      - `hit=true diff=145 -> after0 ~= 1059 ms, q0=319`
      - `hit=true diff=156 -> after0 ~= 5374 ms, q0=315`
      - `hit=true diff=220 -> after0 ~= 5075 ms, q0=316`
      - but later runs also produced weaker/ambiguous hits such as `hit=true diff=280 -> after0 ~= 6841 ms, q0=314`
  - conclusion: this family became more interesting after the raw-body trick, but it is **not** yet reliable enough for a full remote solver
- 4-group weighted raw-transport retry:
  - patched `scratch/group_weight_probe_server.py` to use the same `text/plain` input-name trick
  - config `repeats=48,96,144,192 samples=2 gap=500 start_gap=0` now yields consistent structured traces, e.g. `q0=q1=316`, but group separation on `after0` time is still weak and overlapping
  - short local sample:
    - group 0: `after0 ~= 10041`
    - group 1: `after0 ~= 11062..11177`
    - group 2: `after0 ~= 10698..11133`
    - group 3: `after0 ~= 11050..11580`
  - this is better than the old 8-group encoded-body run, but still not clean enough to trust as-is

Current best next branch:
- keep the raw `text/plain` transport for every future GraphQL popup probe
- continue only with oracle families that exploit the stronger raw-body budget
- the most defensible next search space is either:
  - a more stable fixed-cardinality yes/no codebook using the 210-sized raw subset probe, or
  - a lower-entropy 3/4-group weighted classifier tuned specifically for raw transport

2026-07-05 later update:
- Strong new oracle, but not yet integrated into a full solve:
  - A **same-tab** raw `text/plain` GraphQL navigation performed *before the attack page load completes* gives a very clean bot-driver timing difference.
  - Local reproduction with a page that keeps load pending via an idle `<img src="/hold">`, then does `/api/register`, `/api/round/start`, and finally same-tab form-submits to `http://127.0.0.1:3001/graphql`:
    - all-miss full-candidate probe (`repeats=48`) -> Selenium `driver.get(...)` returned in ~= `2.85 s`
    - full-candidate hit probe (`repeats=48`) -> `driver.get(...)` returned in ~= `9.76 s`
    - resulting URL after `get()` was the internal GraphQL document (`http://127.0.0.1:3001/graphql`)
  - This is the strongest signal found so far for hit vs miss.
- Why it still does not finish the challenge yet:
  - the strong timing signal is visible from the bot driver's top-level page-load timing, but the current page loses script control once it same-tab navigates to internal GraphQL
  - several attempted ways to expose that timing to a surviving helper/controller page were too weak or collapsed:
    - attacker `img`/`iframe`/open-HTML hold connection lifetime did **not** reflect the long same-tab GraphQL runtime in a usable way
    - a surviving controller page polling `/api/state` only saw a small effect (on the order of ~= `2.05 s` miss vs `2.37 s` hit in one raw full-candidate test)
    - a surviving controller page probing the same host/port with harmless `POST text/plain "x"` requests to `http://127.0.0.1:3001/graphql` also only saw small first-probe delays (e.g. ~= `732 ms` miss vs `610 ms` hit), not a clean multi-second oracle
  - so the same-tab signal is real, but there is still no good in-visit control path that can exploit it and then continue the round
- Raw staggered multi-request retry:
  - config `repeats=8,16,24,32,48,64,96,160 samples=2 gap=500 start_gap=100` on `scratch/group_weight_probe_server.py` produced more structure than earlier raw tests:
    - some runs show `q0=313` with small `after0` and nontrivial `after1`, while others show `q0=312` with `after0 ~= 1.3-1.7 s` and `after1 ~= 3-5 ms`
  - but a quick local leave-one-out 1-NN score on 16 labeled runs was still only `6/16`, so this family is still too noisy to trust
- Single-request coded-weight retry:
  - added `scratch/single_weight_code_probe_server.py` and `scratch/run_single_weight_code_case.py`
  - config `repeats=8,16,24,32,48,64,80,112 samples=2 gap=500` with one raw request across all 421 candidates did **not** preserve enough weight information in the controller-visible signal; observed `after0` clustered around ~= `2.0-2.35 s` with `q0=319`
  - conclusion: that single-request branch is currently not viable from the helper/controller perspective
- Live instancer state changed unfavorably:
  - `POST https://nhnc-whale.whale-tw.com/api/instances` for challenge `mango` returned `503`
  - backend error body reported both `nhnc1` and `nhnc2` failing to create the Docker network:
    - `could not find an available, non-overlapping IPv4 address pool among the defaults to assign to the network`

2026-07-05 remote-bot update:
- The instancer partially recovered on `2026-07-05`:
  - new instances were issued at least twice:
    - `http://nhnc2.whale-tw.com:10030/`, created `2026-07-05T16:06:42Z`, expires `2026-07-05T16:21:42Z`
    - `http://nhnc2.whale-tw.com:10024/`, created `2026-07-05T16:13:22Z`, expires `2026-07-05T16:28:22Z`
  - later creation attempts started failing again with a Cloudflare `502 Bad gateway` from `https://nhnc-whale.whale-tw.com/api/instances`
- Important remote behavior is **not** matching the local direct-Firefox approximation:
  - using the same `helper_after_start=1` harness, a surviving attacker helper window can issue parallel `GET /api/state` probes with credentials while a disposable controller window same-tab submits a raw `text/plain` GraphQL document to `127.0.0.1:3001/graphql`
  - on the real remote bot, the **first** helper burst (`b0`) stalled for extremely long times:
    - full guaranteed miss (`mode=miss`, all future IDs, `repeats=48`, `queryLength=999296`) -> `b0` around `78.6 s`
    - full guaranteed hit (`mode=hit`, all 421 admin candidates, `repeats=48`, `queryLength=999296`) -> `b0` around `145.0 s`
  - later bursts in the same run dropped back to sub-second / low-hundreds-ms ranges
  - this is the first strong remote-separable signal found; the real remote bot is far more serializing/blocking than the local direct-Firefox harness
- Consequence for exploit design:
  - a long-lived attacker-controlled helper/orchestrator window is now the correct control plane
  - the helper can survive, measure `/api/state` timing with credentials, and launch disposable controller windows that same-tab document-submit raw GraphQL queries to localhost
  - because the remote bot appears to use a long hold/lock (consistent with the `VISIT_SECONDS=900` compose value rather than the earlier assumed `18 s`), one visit may support multiple sequential timed probes if the orchestrator can reuse the same target session
- New harnesses added for that path:
  - `scratch/same_tab_helper_burst_probe_server.py`
    - supports `helper_after_start=1`, `submit_after_helper`, deterministic future-miss subsets (`mode=miss` plus `start/count`), full guaranteed hit/miss, and structured JSON logs
  - `scratch/run_same_tab_helper_burst_case.py`
    - local direct-Firefox runner with optional DB-based labeling for real subsets
  - `scratch/same_tab_sequence_probe_server.py`
    - new orchestrator that keeps one attacker window alive, registers/starts once, then spawns disposable `about:blank` controller popups for multiple same-tab GraphQL submissions in one visit
  - `scratch/run_same_tab_sequence_case.py`
    - local runner for multi-step sequence plans
- Local sequence validation:
  - the sequence harness now works locally for multiple steps in one visit
  - example future-miss sequence:
    - step 0: `count=210`, `repeats=8`, `queryLength=81216` -> burst max about `466 ms`
    - step 1: `count=105`, `repeats=8`, `queryLength=40216` -> burst max about `193 ms`
- Current best next action when the instancer is healthy again:
  - use `same_tab_sequence_probe_server.py` on the real remote bot to calibrate several deterministic future-miss sizes and one or more guaranteed-hit sizes **within a single long visit**
  - then pivot that orchestrator from calibration steps to actual subset-search steps and finally to `POST /api/round/submit`
  - `GET /api/instances` currently returns `{"instances":[]}`
  - so there is no fresh live remote instance available **right now**, independent of the browser-oracle progress
