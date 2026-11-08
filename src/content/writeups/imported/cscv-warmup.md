---
title: "MDPress — warmup (113.20.103.55:5001)"
description: "Target Markdown publishing app \"MDPress\". nginx -> JSON API. Auth = JWT (HS256, Bearer). Login: hustabc / aaaa. uid u238487662de0691d4bdf23dc, role=user, token AC-269DCD5D. JWT payload: {\"sub\":\"692\",\"iat\":..…"
published: "2026-11-08"
updated: "2026-11-08"
event: "cscv"
category: "Miscellaneous"
kind: "field-note"
status: "reference"
tags: ["Miscellaneous", "cscv", "Field notes", "jwt"]
readingTime: 1
wordCount: 182
featured: false
sourcePath: "~/ctf/cscv/warmup/notes.md"
---

# MDPress — warmup (113.20.103.55:5001)

## Target
Markdown publishing app "MDPress". nginx -> JSON API. Auth = JWT (HS256, Bearer).
Login: hustabc / aaaa.  uid u_238487662de0691d4bdf23dc, role=user, token AC-269DCD5D.
JWT payload: {"sub":"692","iat":...,"exp":...} HS256.

## API
- POST /api/auth/login        {username,password} -> {token(JWT)}
- GET  /api/users/me          -> {bio,displayName,role,token(AC-),uid,username}
- GET  /api/discussions       -> list [{author,created_at,id(numeric),title}]
- GET  /api/discussions/{uuid}-> {author,content(md),created_at,id(uuid),sig(u_...),title}
- POST /api/discussions/{uuid}/compile-latex -> compiles STORED content w/ pandoc->pdflatex; returns PDF or {error,log}
  (no request body; server compiles stored markdown by uuid)

## Key findings / hypotheses
- PDF export = pandoc md->latex then pdflatex server-side on USER content. -> LaTeX injection.
  * Pandoc passes raw LaTeX through: \input{/etc/passwd}, \lstinputlisting{}, \verbatiminput{} => arbitrary file read.
  * If shell-escape enabled: \write18/\input{|cmd} => RCE.
- compile-latex error leaks full pdflatex log (verbose path/info disclosure).
- Preamble uses: article.cls, verbatim, fontenc, inputenc, lmodern, geometry, hyperref.
  Note: Pandoc "Shaded"/highlighting env NOT defined in preamble (code fence -> Shaded undefined -> compile fails).
- role=user / "account code" AC- => possible privilege field / IDOR to admin.

## Next
- Find create-article endpoint (likely POST /api/discussions).
- Publish article with \input{/etc/passwd} (avoid code fences -> Shaded). Export -> confirm file read.
- Then read flag (/flag, /flag.txt, app source, env).
