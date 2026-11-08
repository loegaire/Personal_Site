---
title: "Ghost Dependency (REV-01)"
description: "Technical notes from Ghost Dependency (REV-01)."
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Reverse Engineering"
kind: "field-note"
status: "solved"
tags: ["Reverse Engineering", "cscv", "Field notes"]
readingTime: 1
wordCount: 98
featured: false
sourcePath: "~/ctf/cscv/re2/notes.md"
---

# Ghost Dependency (REV-01)
## SOLVED: CSCV2026{pr0v3nanc3_b34ts_4_trust3d_n4m3} (4-field proof, verified with original flag.enc copy from ~/.local/share/ctf-worker-data/jobs/Ghost_Dependency-104)
- player.7z pw Nca@2026; old GhostDependency.zip removed per user.
- crate: telemetry-core-0.8.1 sha256 00ebb39a...d463 (only crate shipping build.rs; SBOM digest 80d43375... matches nothing)
- build.rs sha256 9158c894...5f91; leaks b"build-secret-rotation" via cargo:rustc-env=EXFIL_PAYLOAD.
- warehouse-agent main @0x7b60: async state machine; state A writes nonce[0:8]=LE 0x8a8524691d599009, state B nonce[8:16]=LE 0xc07e6756fddb90eb;
  inline HMAC-SHA256(key=nonce, "host-id"), hex first 6 bytes -> host-39113c02654a (verified == runtime output).
- activation_hex = sha256(crate_sha256:host_id) per old FORMAT.md (new format doesn't restate it) — UNVERIFIED, no local verifier.
## Next: submit proof.json; if rejected, try activation = full HMAC hex (39113c02...981e).
