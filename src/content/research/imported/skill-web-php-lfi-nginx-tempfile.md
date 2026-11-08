---
title: "Web Php Lfi Nginx Tempfile"
description: "Use when solving CTF web challenges with PHP local file inclusion behind Nginx/PHP-FPM, disabled uploads or sessions, readable /proc paths, large request bodies, client body buffering, deleted temp files, or…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills"]
readingTime: 3
wordCount: 466
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-php-lfi-nginx-tempfile/SKILL.md"
---

# Web PHP LFI Nginx Tempfile

## When to use

Use this skill when you see:
- PHP code like `include($_GET["file"])`, `include_once`, `require`, or wrapper-enabled LFI.
- Nginx plus PHP-FPM, especially same-user workers such as `www-data`.
- File uploads/session tricks disabled but `/proc` is readable through the LFI.
- Large client bodies accepted by Nginx.
- Error messages or configs referencing `/var/lib/nginx/body`, `client_body_temp_path`, or `fastcgi_buffering`.

Do not use this skill when:
- The stack is Apache-only or another frontend without equivalent open temp body files.
- LFI can only read files and cannot reach PHP include/execute behavior.
- `/proc/<pid>/fd` is blocked by container policy or permissions and no alternate descriptor path exists.

## Core idea

Nginx may buffer large request bodies into temporary files, then unlink those files while keeping the file descriptor open. PHP LFI can sometimes include the deleted body via `/proc/<nginx-pid>/fd/<fd>`. Because PHP may resolve direct fd symlinks to a deleted pathname, use procfs path indirection to force inclusion through the live descriptor.

## Recognition signals

Look for:
- `file_uploads=0`, disabled session upload progress, or hardened `/tmp` that makes classic PHP LFI tricks fail.
- LFI can read `/proc/cpuinfo`, `/proc/sys/kernel/pid_max`, or `/proc/<pid>/cmdline`.
- `nginx: worker process` visible through `/proc/<pid>/cmdline`.
- Body buffering thresholds that can be exceeded by a POST/GET body.
- Include errors mentioning deleted temp files.

## Standard workflow

1. Confirm the LFI executes PHP content, not just displays text.
2. Use LFI to enumerate CPU count, `pid_max`, and Nginx worker PIDs.
3. Start concurrent requests with large bodies containing a PHP payload.
4. In parallel, brute-force worker file descriptors through procfs.
5. Use an indirection path such as `/proc/self/fd/<pid>/../../../<pid>/fd/<fd>` when direct fd inclusion fails.
6. Once payload execution is confirmed, switch the payload to the minimal command needed for the flag path.

## Commands and tools

```bash
# LFI probes.
curl 'http://target/?file=/proc/cpuinfo'
curl 'http://target/?file=/proc/sys/kernel/pid_max'

# Find Nginx workers through the LFI.
for pid in $(seq 1 32768); do
  curl -s "http://target/?file=/proc/$pid/cmdline" | grep -q 'nginx: worker process' && echo "$pid"
done

# Payload body must exceed Nginx buffering threshold.
python3 - <<'PY'
print('<?php system($_GET["c"]); /*' + 'A' * 20000)
PY
```

## Pitfalls

Common ways agents get this wrong:
- Including `/proc/<pid>/fd/<fd>` directly and giving up when PHP resolves it to a deleted filename.
- Using a body too small to force Nginx disk buffering.
- Enumerating PHP-FPM PIDs instead of Nginx worker descriptors.
- Forgetting to race with concurrent uploaders and fd brute-forcers.
- Assuming `/proc/self` is the Nginx worker; it is usually the PHP process.

## Verification

Prove the solve path is real with:
- LFI output from `/proc` proving process enumeration.
- A descriptor path that executes a benign command such as `id`.
- A final command output or recovered file content matching expected flag format.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| hxp CTF 2021 | includer's revenge / counter | web | Nginx client-body buffering can create an includable PHP payload even when PHP uploads and sessions are disabled. |
| hxp CTF 2021 | counter | web | Procfs fd indirection bypasses PHP's resolution of deleted Nginx temp-file symlinks. |

## Sources

* https://hxp.io/blog/88/The-end-of-PHP-LFI-challenges-/ - hxp summary tying the technique to includer's revenge and counter.
* https://bierbaumer.net/security/php-lfi-with-nginx-assistance/ - full reusable explanation, process enumeration, descriptor indirection, and exploit workflow.
