---
title: "Web Node Prototype Pollution Gadgets"
description: "Use when solving CTF web challenges involving Node.js, Bun, Deno, JavaScript object merges, __proto__/constructor/prototype keys, polluted config objects, YAML/template output paths, EJS-like template option…"
published: "2026-09-21"
updated: "2026-09-21"
event: "Agentic Skills"
category: "Web Security"
kind: "skill"
status: "reference"
tags: ["agentic_skill", "Web Security", "Agentic Skills", "ssti", "deserialization"]
readingTime: 3
wordCount: 531
featured: false
sourcePath: "~/ctf/writeups/ctf_skill_research/staging_skills/web-node-prototype-pollution-gadgets/SKILL.md"
---

# Web Node Prototype Pollution Gadgets

## When to use

Use this skill when you see:
- Recursive merge, `lodash.merge`, `deepmerge`, YAML/JSON deserialization, or dot-path setters.
- User-controlled keys such as `__proto__`, `constructor.prototype`, or dotted paths like `signed.__proto__.x`.
- Server-side JavaScript runtimes: Node.js, Bun, Deno.
- Config objects with defaults read from ordinary object properties.
- Output path, template delimiter, command, environment, or serialization options influenced by object properties.

Do not use this skill when:
- The pollution is only client-side and no server-side gadget is reachable.
- The object sink uses `Object.create(null)`, `Map`, or strict own-property checks for every sensitive read.
- You only have a normal path traversal or template injection without prototype influence.

## Core idea

Prototype pollution is an input primitive, not the exploit by itself. The reusable workflow is to prove a polluted property is read through the prototype chain by a security-relevant gadget: path construction, template compilation, process spawning, request signing, or file serialization. In modern CTFs, the winning gadget is often a config/default object rather than a direct `eval`.

## Recognition signals

Look for:
- `obj[key] = value` with attacker-controlled nested keys.
- Libraries that convert dotted keys into nested objects.
- Signature wrappers that sign `data` but then merge/serialize it with defaults.
- `for...in` loops over untrusted objects.
- Reads like `options.outputPrefix`, `settings.delimiter`, `config.shell`, or `opts.client` without `hasOwn`.
- Generated files written under a prefix/suffix controlled by config.

## Standard workflow

1. Confirm the pollution primitive locally with a harmless marker: `({}).polluted`.
2. Search for all property reads reachable after parsing/merge.
3. Rank gadgets by impact: file path/write, template compile/eval, process spawn, request target, auth bypass.
4. Preserve any valid signature or MAC by polluting fields that are outside the signed own-properties, if applicable.
5. Chain the polluted config to a second primitive such as path traversal, source overwrite, template delimiter control, or command execution.
6. Re-run with clean process state; prototype pollution may persist across requests in a long-lived server.

## Commands and tools

```bash
rg -n '__proto__|constructor|prototype|merge|assign|for \\(|for\\s*\\(|outputPrefix|delimiter|template|spawn|exec|writeFile|yaml|serialize' .

node - <<'JS'
const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
Object.assign({}, payload);
console.log(({}).polluted);
JS

# Safer gadget audit: find inherited reads by replacing options with a Proxy in local harnesses.
```

## Pitfalls

Common ways agents get this wrong:
- Declaring victory after setting `({}).x`; find the gadget that consumes it.
- Missing dotted-key parsers that turn `signed.__proto__.x` into a pollution path.
- Overwriting signed data and breaking validation when the exploit can pollute defaults instead.
- Forgetting that null bytes, path normalization, or suffixes may affect file-write gadgets.
- Assuming EJS/templating gadgets from old writeups still work in patched versions.

## Verification

Prove the solve path is real with:
- A local pollution proof before and after request handling.
- Evidence that the polluted property reaches the chosen sink.
- A controlled file write, template execution, source overwrite, or benign command output.
- Final verifier/flag-format proof after replacing the benign payload.

## Examples from writeups

| CTF | Challenge | Category | Lesson |
| --- | --------- | -------- | ------ |
| DownUnderCTF 2024 | Prisoner Processor | web | A dotted `signed.__proto__` path changed an output-prefix option; the gadget chained into path traversal and source overwrite. |
| hxp CTF 2022 | required | rev/web | Prototype-pollution behavior in Node.js can be used as an obfuscation and state-manipulation primitive, not only as direct RCE. |

## Sources

* https://zenn.dev/tchen/articles/e29be3efc78724 - Prisoner Processor analysis with Bun/Hono setup, signed examples, path traversal, and RCE objective.
* https://jiniljeil.github.io/ctf/2024/07/05/DownUnderCTF.html - exploit sketch using `signed.__proto__` to control output prefix and overwrite runtime source.
* https://github.com/DownUnderCTF/Challenges_2024_Public - official DUCTF 2024 challenge files and solutions index.
* https://hxp.io/ - hxp CTF 2022 required/valentine summaries showing prototype-pollution and template-gadget themes.
