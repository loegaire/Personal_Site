---
title: "Jail — Field Notes"
description: "Confirmed facts Local directory initially only contained notes.md; no source/binary artifacts. Challenge: Camel rider, category/title Jail, hint flag.txt. Remote service: http://chal3.teagod.tech:14514. Prov…"
published: "2026-07-04"
updated: "2026-07-04"
event: "nohacknoctf"
category: "Miscellaneous"
kind: "field-note"
status: "solved"
tags: ["Miscellaneous", "nohacknoctf", "Field notes"]
readingTime: 2
wordCount: 295
featured: false
sourcePath: "~/ctf/nohacknoctf/jail/notes.md"
---

Camel rider
500
0 0

Jail

    Hint: flag.txt

http://chal3.teagod.tech:14514 

ctfd instance token:[redacted instance token]

## Work log

### Confirmed facts
- Local directory initially only contained `notes.md`; no source/binary artifacts.
- Challenge: `Camel rider`, category/title `Jail`, hint `flag.txt`.
- Remote service: `http://chal3.teagod.tech:14514`.
- Provided CTFd instance token: `[redacted instance token]`.
- `POST /create` with the token set an instancer session cookie and returned an instance at `nc chal3.teagod.tech 10104`.
- Instance destroy time shown by instancer: `2026-07-04T17:15:06.397599797Z`.

### Current hypothesis
- Live HTTP jail/sandbox challenge; need fingerprint routes/filter and escape to read `flag.txt`.

### Next tests
- Connect to `chal3.teagod.tech 10104`.
- Capture banner/prompt and test basic syntax/filter behavior.

### Commands tried / observations
- `nc chal3.teagod.tech 10104`; banner:
  - `Welcome to Camel Rider!`
  - `Type ur code`
  - prompt `> `
- Payload `print 1` returned `1`, confirming Perl-like code execution.
- Same connection did not present a second prompt; sending another line caused broken pipe. Treat service as one-shot per connection.
- Added `scratch/probe.py` for repeatable socket probes. First batch timed out because the `10104` instance stopped accepting connections; need create fresh instance.
- Destroyed stale instance and created fresh one: `nc chal3.teagod.tech 10118`, destroy time `2026-07-04T17:19:03.172452536Z`.
- Updated `scratch/probe.py` to accept `HOST`/`PORT` environment variables; default port now `10118`.
- Fresh instance `10135` accepted payload `@ARGV=q(flag.txt);print <>` and returned `NHNC{lf8fnibf3fhiqfwbqubJmoyt3191qv3rH}`.
- Perl jail filter blocks quote characters and textual file APIs like `open`, `sysopen`, `readline`, `read`, `require`, plus `system`/`glob` style escapes. `q(...)` strings and `@ARGV` are allowed.
- Key bypass: set `@ARGV` to `q(flag.txt)` and use diamond operator `<>`; Perl implicitly opens files listed in `@ARGV`, avoiding the blocked `open` token.
- Added `solve.py`, which creates an instance, handles stale instancer allocations by destroying/recreating, sends `@ARGV=q(flag.txt);print <>`, and extracts the flag.
- Verification: `python3 solve.py` succeeded and printed `NHNC{cf8fnibf4fhiqfwbqubfmoyt5191qv3rM}`. Flags appear instance-specific; use `solve.py` to recover the active instance's flag.

### Final solve
- Payload: `@ARGV=q(flag.txt);print <>`
- Verified current flag: `NHNC{cf8fnibf4fhiqfwbqubfmoyt5191qv3rM}`
