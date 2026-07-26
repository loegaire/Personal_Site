---
title: "Closed Gate — HTB Writeup"
description: "This challenge models an AWS privilege-chain extraction problem. The foothold credential can’t list resources directly, but service-specific behavior allows discovery through a known queue and DynamoDB recor…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Binary Exploitation"
kind: "writeup"
status: "solved"
tags: ["Binary Exploitation", "HTB", "Writeup"]
readingTime: 3
wordCount: 467
featured: false
sourcePath: "~/ctf/HTB/salt_crown/closed_gate/writeup.md"
---

# Closed Gate — HTB Writeup

## Summary

This challenge models an AWS privilege-chain extraction problem.
The foothold credential can’t list resources directly, but service-specific behavior allows discovery through a known queue and DynamoDB record.
From there, a chain of role assumptions plus a policy version update leads to the secret containing the flag.

Final flag:

`HTB{registry_outer_shard_verifier_aa1a379999b30aafdc91c1b0340aa59a}`

## 1) Initial Reconnaissance

1. Opened the web endpoint:

```bash
curl http://154.57.164.77:30524/
```

The page described:
- Player credentials endpoint: `/player-creds.json`
- Secondary AWS endpoint: `154.57.164.77:32259`
- Challenge context and flag format.

2. Pulled and parsed the provided credentials:

```bash
curl -s http://154.57.164.77:30524/player-creds.json
```

Recovered values:
- `aws_access_key_id: AKIA…REDACTED`
- `aws_secret_access_key: [redacted]`
- `region: us-east-1`
- Suggested endpoint in notes: `127.0.0.1:4566` (real one is remote port `32259`)

3. Verified the identity with STS:

```python
boto3.client("sts", endpoint_url="http://154.57.164.77:32259", ...).get_caller_identity()
```

Verified account: `728491650384`, user ARN:
`arn:aws:iam::728491650384:user/registry-outer-clerk`.

## 2) Discovering Targets (with Least Privilege Blocks)

Initial API calls were intentionally restricted:
- `sqs.list_queues`, `sqs.get_queue_url`: denied
- `dynamodb.list_tables`, `scan`, `describe_table`: denied

Directly addressing known resources by name still worked.

## 3) Find the Active Plate Record

Known queue names from challenge text:
- `registry-plate-notify-queue`
- `registry-maintenance-queue`

Using direct queue URLs, messages were received from maintenance queue:

```python
queue_url = f"{endpoint}/728491650384/registry-maintenance-queue"
sqs.receive_message(MaxNumberOfMessages=10, VisibilityTimeout=120, WaitTimeSeconds=20)
```

Most records were decoys with statuses like:
`CLOSED`, `ARCHIVED`, `SEIZED`, `REVOKED`, etc.

By correlating active candidates against `registry-plate-index`, one matching row was found:

- `plate_id`: `PLATE-4E8C`
- `status`: `ACTIVE`

Relevant live record fields included:
- `custody_role_arn`: `arn:aws:iam::728491650384:role/registry-custody-reader`
- `indexer_role_arn`: `arn:aws:iam::728491650384:role/registry-indexer`
- `verifier_role_arn`: `arn:aws:iam::728491650384:role/registry-verifier-runner`
- `custodian_role_arn`: `arn:aws:iam::728491650384:role/shard-custodian`
- `custody_external_id`: `registry-job-custody-4e8c`
- `indexer_external_id`: `registry-indexer-relay-4e8c`
- `verifier_external_id`: `registry-verifier-bind-4e8c`
- `custodian_external_id`: `registry-custodian-seal-4e8c`
- `artifacts_bucket`: `registry-sealed-artifacts`
- policy bundle key: `bundles/live/registry-policy-bundle-4e8c.enc`
- KMS key in record (for bundle): `2d0c9754-9267-4ca3-9e00-8e3513203518`

## 4) Role-Chaining Exploit

The role chain had to be followed exactly with external IDs:

1. `registry-outer-clerk` → `registry-custody-reader`  
   External ID: `registry-job-custody-4e8c`

2. `registry-custody-reader` → `registry-indexer`  
   External ID: `registry-indexer-relay-4e8c`

3. `registry-indexer` → `registry-verifier-runner`  
   External ID: `registry-verifier-bind-4e8c`

4. `registry-verifier-runner` → `shard-custodian`  
   External ID: `registry-custodian-seal-4e8c`

This progression was validated by `sts:AssumeRole` success/failure testing and by successful subsequent service access.

## 5) Extract Policy Bundle and Repair Permissions

From custody role:
- Downloaded encrypted bundle from S3:
  `registry-sealed-artifacts/bundles/live/registry-policy-bundle-4e8c.enc`
- Decrypted via KMS (policy-custody path) to JSON indicating required access shape.

Bundle plaintext policy document:
- allows `secretsmanager:GetSecretValue` on
  `arn:aws:secretsmanager:us-east-1:728491650384:secret:registry/shard/live-shard-4e8c-*`
- and `kms:Decrypt` on a specific KMS key.
- policy was already associated as managed policy `ShardReaderPolicy`, but active version only contained `GetCallerIdentity`.

Constraint check:
- `attach_role_policy` attempts for indexer/verifier were denied.
- Updating policy version on existing managed policy was allowed.

Action taken:
- Added policy document version (v2) as default for `arn:aws:iam::728491650384:policy/ShardReaderPolicy`.

## 6) Secret Retrieval and Flag

With the chain now ending at `shard-custodian`:
- Read secret: `registry/shard/live-shard-4e8c`
- Decrypted secret binary with KMS.
- Decoded to reveal final flag.

Recovered flag:

`HTB{registry_outer_shard_verifier_aa1a379999b30aafdc91c1b0340aa59a}`

## 7) Notes / Pitfalls

- Maintenance queue messages were set with `VisibilityTimeout` (120s in script), so immediate re-runs can show zero candidates until visibility expires.
- The workflow is deterministic after role chain alignment and the policy version adjustment.

## 8) Files Produced

- `solve.py` — full automated solver
- `notes.md` — investigative notes and confirmations
- `skill.md` — reusable AWS-chaining methodology for this category
- `artifacts/live_shard_secret.bin` — raw decrypted secret bytes
- `artifacts/live_shard_secret.bin.decoded` — text-decoded secret
