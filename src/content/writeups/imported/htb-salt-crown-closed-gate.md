---
title: "Closed Gate — working notes"
description: "Workspace contains no supplied challenge artifact besides this notes file. Two advertised remote endpoints: 154.57.164.77:32259 and 154.57.164.77:30524. :30524 is the SaltCrown briefing; /player-creds.json s…"
published: "2026-07-24"
updated: "2026-07-24"
event: "HTB"
category: "Hardware / RF"
kind: "field-note"
status: "solved"
tags: ["Hardware / RF", "HTB", "Field notes"]
readingTime: 3
wordCount: 442
featured: false
sourcePath: "~/ctf/HTB/salt_crown/closed_gate/notes.md"
---

# Closed Gate — working notes

## Confirmed facts

- Workspace contains no supplied challenge artifact besides this notes file.
- Two advertised remote endpoints: `154.57.164.77:32259` and `154.57.164.77:30524`.
- `:30524` is the SaltCrown briefing; `/player-creds.json` supplies valid AWS credentials for IAM user `registry-outer-clerk` in `us-east-1`.
- `:32259` is the AWS-compatible API endpoint. `sts:GetCallerIdentity` succeeds for account `728491650384`; `ListQueues`, `GetQueueUrl`, `ListTables`, `Scan`, and `DescribeTable` are denied.
- The named SQS queues are reachable by constructing the URL as `http://154.57.164.77:32259/728491650384/<queue-name>`. `sqs:ReceiveMessage` succeeds. The named DynamoDB table permits `GetItem` with partition key `plate_id`.
- The first ten maintenance records were all decoys (statuses `CLOSED`, `ARCHIVED`, `SEIZED`, `REVOKED`, `DRAFT`, or `VOID`); each table record says production jobs require status `ACTIVE`.
- A bounded collection found 100 maintenance messages / 86 unique plates and exactly one `ACTIVE` record: `PLATE-4E8C`, job `registry-job-custody-4e8c`. Its live index record names `arn:aws:iam::728491650384:role/registry-custody-reader`, `registry-indexer`, `shard-custodian`, and `registry-verifier-runner`, plus bucket `registry-sealed-artifacts` and live bundle `bundles/live/registry-policy-bundle-4e8c.enc`.
- The outer clerk can assume only `registry-custody-reader` with external ID `registry-job-custody-4e8c`. Custody can assume only `registry-indexer` with external ID `registry-indexer-relay-4e8c` among the listed roles.
- Custody can read/decrypt the live bundle. It contains `ShardReaderPolicy`: `secretsmanager:GetSecretValue` on `registry/shard/live-shard-4e8c-*` and `kms:Decrypt` on key `a8862246-1085-44fa-b2b6-771d3c14ba97`.
- `ShardReaderPolicy` initially had only `sts:GetCallerIdentity` in version `v1`; the indexer can create a default policy version. Installing the bundle's exact JSON as version `v2` enables the disclosed secret/KMS permissions.
- The complete role chain is outer clerk → `registry-custody-reader` (`registry-job-custody-4e8c`) → `registry-indexer` (`registry-indexer-relay-4e8c`) → `registry-verifier-runner` (`registry-verifier-bind-4e8c`) → `shard-custodian` (`registry-custodian-seal-4e8c`).
- `shard-custodian` reads secret `registry/shard/live-shard-4e8c` (ARN suffix `V0QJO7`) and decrypts it with KMS, yielding the verified flag `HTB{registry_outer_shard_verifier_aa1a379999b30aafdc91c1b0340aa59a}`.

## Failed / constrained paths

- Service enumeration is intentionally denied; direct named-resource access is required.
- `sqs:ChangeMessageVisibility` is denied. A bounded queue collection experiment received messages with a 120-second visibility timeout before discovering this; no messages were deleted, and they will reappear automatically.

## Current hypothesis

- The live plate is an `ACTIVE` item referenced by a later maintenance message and/or the custody-notification queue. Its table record should contain the usable external ID or policy-bundle pointer needed for the next stage.

## Next tests

- After the temporary SQS visibility timeout expires, collect a bounded set while writing every response to disk before post-processing, then fetch the associated DynamoDB records.
- Re-poll the notification queue for a custody record and correlate it with the active maintenance plate.
- Assume `registry-indexer` through custody, fetch the live shard secret, and decrypt it if it is another `kms:v3:` blob.

## Verification

- `solve.py` completed the full discovery, role chain, policy-version update, secret read, and KMS decrypt in one run; output was the flag above.
- An immediate second run correctly encountered no candidate because the first run's read-only SQS receipts were still within their 120-second visibility timeout; messages reappear automatically and no messages were deleted.
