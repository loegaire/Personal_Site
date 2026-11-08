---
title: "Misc Bash Ast Parser Jail Bypass"
description: "Use when solving CTF misc or jail challenges that parse Bash with an AST library, allow only echo or simple commands, block redirects or command nodes, or rely on bash-parser-style validation before executin…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Miscellaneous"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Miscellaneous", "Agentic Skills", "sandbox-escape"]
readingTime: 3
wordCount: 453
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/misc-bash-ast-parser-jail-bypass/SKILL.md"
---

# Misc Bash AST Parser Jail Bypass

## When to use

Use this skill when you see:
- JavaScript/Node services using `bash-parser`, `shell-quote`, or custom AST walking.
- Validators that allow only `echo`, block `Redirect`, or inspect `Command.name.text`.
- Empty command names, environment assignments, arithmetic expansion, arrays, command substitution, or here-doc edge cases.
- The service validates parsed Bash but later executes the original string in real Bash.

Do not use this skill when:
- The shell is not Bash-compatible.
- The policy is enforced by seccomp/AppArmor after execution rather than parser approval.
- The challenge is a Python/JS jail with no shell grammar mismatch.

## Core idea

Parser jails often validate a simplified AST, while Bash executes a much richer language. The bypass is to find syntax that the parser marks harmless or models incompletely, but Bash later expands into command execution, file read, or data exfiltration.

## Recognition signals

Look for:
- Recursive AST walkers that test `prop === "type"` and reject some node types.
- Checks like `if (ast.name && ast.name.text && ast.name.text !== "echo") reject`.
- Empty/falsy command names accepted accidentally.
- Environment assignments before commands.
- Arithmetic expansion `$((...))`, array indexing, indirect expansion, command substitution `$()`, process substitution, and variable expansion order.

## Standard workflow

1. Extract the parser and validator into a local harness.
2. Generate tiny Bash candidates and print both AST and execution behavior.
3. Search for accepted nodes with no command name or with command execution hidden inside a word.
4. Favor expansions that happen during `echo`, assignment, or arithmetic evaluation.
5. Avoid redirects if the validator explicitly detects them; use command substitution to move data into stdout or callbacks.
6. Once a bypass executes a benign command, adapt it to read the flag path or run the challenge command.

## Commands and tools

```bash
node - <<'JS'
const parse = require('bash-parser');
for (const s of process.argv.slice(1)) {
  try { console.log(s, JSON.stringify(parse(s), null, 2)); }
  catch (e) { console.log("parse fail", s, e.message); }
}
JS 'echo hi' 'a=1 echo $((a+1))'

# Execution-order probes in real Bash.
bash -lc 'x="1+1"; echo $((x+1))'
bash -lc 'arr=(a b); echo $((arr[$(echo 1)]+1))'
```

## Pitfalls

Common ways agents get this wrong:
- Trusting the AST output as Bash semantics.
- Ignoring expansion order; many payloads parse safely but execute during expansion.
- Using payloads that work in `sh` but not Bash, or vice versa.
- Forgetting that parser libraries can omit fields or represent malformed syntax differently than Bash.
- Jumping to brute force before writing a local parser/executor differential harness.

## Verification

Prove the solve path is real with:
- The accepted AST for the final payload.
- Local Bash output showing the hidden command ran.
- Remote service output or callback proving the same payload works under challenge execution.
- Final flag-format check.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| Google CTF 2024 | onlyecho | misc | A Bash AST validator allowed empty command names from environment assignment syntax; arithmetic and array expansion led to command substitution. |

## Sources

* https://blog.chummydns.com/blogs/google-ctf-2024/ - onlyecho analysis of `bash-parser` validation, falsy command names, environment variables, arithmetic expansion, and array indexing.
* https://ribombalt.github.io/ctf-writeup/2024/06/24/GoogleCTF2024 - alternate Google CTF 2024 writeup with parser-jail context and official-writeup links.
