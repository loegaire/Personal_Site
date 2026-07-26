---
title: "Watch Tv — Field Notes"
description: "Confirmed facts Challenge: watch tv, value 499, prompt says \"watching tvvvvvvvvvv\". Remote service: http://tpe.chal2.teagod.tech:8000/. Local downloaded artifact present: watchingtvbinonly.zip. No AGENTS.md…"
published: "2026-07-04"
updated: "2026-07-04"
event: "nohacknoctf"
category: "Web Security"
kind: "field-note"
status: "solved"
tags: ["Web Security", "nohacknoctf", "Field notes"]
readingTime: 4
wordCount: 808
featured: false
sourcePath: "~/ctf/nohacknoctf/watch_tv/notes.md"
---

## watch tv notes

### Confirmed facts
- Challenge: `watch tv`, value 499, prompt says "watching tvvvvvvvvvv".
- Remote service: `http://tpe.chal2.teagod.tech:8000/`.
- Local downloaded artifact present: `watchingtv_binonly.zip`.
- No `AGENTS.md` found in or above the challenge directory.
- ZIP contains `docker-compose.yml`, a `chal-panel` Python HTTP service, and a huge `tv-app/dist/tv-app` ELF.
- `chal-panel/server.py` exposes `/hitme`; if request Host is one of `chal`, `chal-panel`, `localhost`, `127.0.0.1`, it records a hit and the panel homepage displays the flag.
- `tv-app` container exposes noVNC on port 6080 and runs `/app/tv-app` inside Xvfb.
- `tv-app` is a stripped x86-64 PIE ELF, dynamically linked only to libc; strings show Nuitka/Python, PySide6/Qt, `requests`, `urllib3`, and `mpv`.
- Direct timed run of `tv-app` created a temporary Nuitka onefile directory under `/tmp/onefile_*`; partial copy captured `artifacts/tv-app-extract-live/tv-app.bin` (about 94 MB).
- User provided a CTFd token for creating a remote instance later; do not record token value in notes.
- Fresh remote instance created 2026-07-04 09:56 UTC. TV/noVNC URL uses suffix `...747a0`, panel URL uses suffix `...747a1`; expires at `2026-07-04T10:06:07.321571351Z`.
- Playwright MCP can load `/vnc.html?autoconnect=1&resize=scale`; the VNC canvas shows the TV app loaded in News view with Taiwanese news video cards.
- QML `Text` objects use AutoText by default and a local PySide probe showed literal rich-text `<img src="http://...">` causes a Qt HTTP fetch. Direct Search/Channel UI inputs pass through `stripHtml`, so complete tags entered there are stripped.
- The grid `Image.source` uses returned `thumbnail` directly unless it starts with `/`; a malicious search/channel result with `videoThumbnails[0].url = "http://chal:8080/hitme"` would trigger the hit automatically.
- `video_info` descriptions are not stripped before QML display; clicking a video whose YouTube shortDescription decodes to a literal rich-text image tag triggers the internal hit.
- Final flag: `NHNC{ssrf_tv_local_f1d8563947d8421ba6f93a6120921092}`.

### Commands tried / useful output
- `rg --files -uu` showed `notes.md` and `watchingtv_binonly.zip`.
- `curl -i http://tpe.chal2.teagod.tech:8000/` returns an instancer form.
- `curl -X POST /create` with blank token returns `Invalid Token`.
- `unzip -l watchingtv_binonly.zip` showed the app and panel files.
- `readelf -S tv-app` shows a huge `.rodata` section containing onefile data.
- `strings tv-app | rg ...` found Nuitka onefile environment strings including `NUITKA_ONEFILE_PARENT`, `NUITKA_ONEFILE_DIRECTORY`, `NUITKA_ONEFILE_RANDOM`.
- Full onefile extraction succeeded with `QT_QPA_PLATFORM=offscreen`; extracted `artifacts/tv-app-extract-full/` (~638 MB).
- Important extracted files: `ui/main.qml`, `backend/yt_api.pl`, `config.yaml`, `perl_lib/lib/perl5/WWW/PipeViewer/*`.
- `ui/main.qml` has Search and Channel ID inputs. Channel input calls `backend.fetch_videos("channel", clean)`.
- `backend/yt_api.pl` reads optional `config.yaml` key `invidious_instance`; if set to an internal URL it would make an SSRF request, but default is blank and no UI setter found yet.
- `WWW::PipeViewer::Channels::uploads($channel_id)` falls back to `_make_feed_url("channels/$channel_id/videos")`; `_make_feed_url` concatenates path without encoding.
- Local LWP tests show `../`, `//host`, `@host`, raw CR/LF, tab, and backslash payloads stay under the original host in the request line; null bytes fail before request.
- Dynamic `strace` of extracted app shows backend calls use argv list, e.g. `execve(... ["perl", "backend/yt_api.pl", "news", ""])`; no shell injection.
- Created remote instance. Public URLs:
  - noVNC/tv-app: `http://2ef2eac2b0bc4957b71d39b31c2eca590.chal2.teagod.tech:8000`
  - chal panel: `http://2ef2eac2b0bc4957b71d39b31c2eca591.chal2.teagod.tech:8000`
- Direct `Host: chal` to panel is blocked by front proxy routing (404 before backend).
- Duplicate Host headers are rejected by front proxy (400). Absolute-form request line reaches backend but proxy rewrites/preserves Host so panel remains WAITING.
- `inv.nadeko.net/redirect?...` returns 302 to other public Invidious instances, not to arbitrary supplied URL; path traversal to `/redirect` did not yield internal redirect.
- noVNC/static websockify tests did not show an obvious way to make the TV container connect to arbitrary HTTP targets through query parameters.
- Compiled Nuitka constants show backend slots/methods including `get_subscriptions_json`, `subscribe`, `fetch_video_description`, `fetch_videos`, `play_video`, and `send_mpv_command`; visible QML only calls `fetch_videos`, subscriptions, and `fetch_video_description`.
- `play_video` builds a `QProcess`/mpv argv list with `https://www.youtube.com/watch?v=` + video ID and is not called by visible QML.
- Playwright/noVNC GUI interaction works after clicking the VNC canvas and using `#noVNC_keyboardinput`.
- GUI test on live instance: selected Channels, focused channel ID field, cleared it with repeated Backspace, submitted clean `http://chal:8080/hitme`; panel remained WAITING. Direct URL as channel input is not enough.
- YouTube search found the intended video: ID `kk-h-pTHYNk`, title `watchtvpwn7391`, author `AI Fired Me`.
- The video description is `%3Cimg src=%22http://chal:8080/hitme%22%3E`; `yt_api.pl` percent-decodes this to `<img src="http://chal:8080/hitme">` in the video detail path.
- Playwright MCP coordinate click into the scaled noVNC search field worked. Search for `watchtvpwn7391` returned one selected result; pressing Enter on the result triggered the decoded description render.
- After result activation, the panel returned `NHNC{ssrf_tv_local_f1d8563947d8421ba6f93a6120921092}`.

### Solve path
- Internal panel only shows the flag after a request to `/hitme` with internal Host (`chal`, `chal-panel`, `localhost`, or `127.0.0.1`).
- The TV app fetches YouTube metadata. Search/channel display data is stripped, but the `video_info` path does `url_decode($vd->{shortDescription} // "")` and sends it to QML.
- QML renders `clickedVideoDesc` in a default `Text` item (`AutoText`), so a decoded `<img src="http://chal:8080/hitme">` becomes an active rich-text image fetch.
- The challenge video `watchtvpwn7391` contains exactly the percent-encoded image tag in its description.
- GUI steps: open noVNC, click the search box, search `watchtvpwn7391`, activate the result, then read the chal panel.

### After-solve artifacts
- `solve.py` automates instance creation from `CTFD_TOKEN` or `--token`, drives the noVNC GUI with Playwright, and polls the panel for the flag.
- `skill.md` records the reusable QML AutoText SSRF technique and dead ends.
