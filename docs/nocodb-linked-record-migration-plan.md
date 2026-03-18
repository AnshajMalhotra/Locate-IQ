# NocoDB Linked-Record Migration Plan

Date: 2026-03-16

## Goal

Convert the current key-based relationship model into true NocoDB linked-record relationships without breaking:

- the live frontend
- existing migration scripts
- current data population scripts
- current NocoDB editing workflow

This plan is designed for a safe phased rollout.

## Current Problem

The database currently joins records using text keys such as:

- `device_key`
- `protocol_key`
- `connectivity_key`
- `application_key`
- `tag_key`

This works, but it creates avoidable maintenance risk:

- typos can silently break joins
- renaming keys becomes dangerous
- NocoDB linked views and relation browsing are underused
- non-technical users must understand manual keys

## Current Tables

Core tables:

- `devices`
- `device_specs`
- `gateway_protocol_profiles`
- `anchor_positioning_profiles`

Lookup tables:

- `connectivity_options`
- `protocols`
- `applications`
- `business_tags`

Join tables:

- `device_connectivity`
- `device_protocols`
- `device_applications`
- `device_tags`

## Recommended Target Model

### 1. Keep `devices` as the hub

`devices` remains the central table.

All single-record child tables should link directly to `devices`:

- `device_specs.device`
- `gateway_protocol_profiles.device`
- `anchor_positioning_profiles.device`

All many-to-many join tables should use linked records on both sides:

- `device_connectivity.device`
- `device_connectivity.connectivity_option`
- `device_protocols.device`
- `device_protocols.protocol`
- `device_applications.device`
- `device_applications.application`
- `device_tags.device`
- `device_tags.business_tag`

## Migration Principles

### Rule 1

Do not remove existing key columns at first.

### Rule 2

Add linked-record columns alongside current key columns.

### Rule 3

Backfill linked fields from existing keys.

### Rule 4

Update frontend and scripts to support both old and new fields during transition.

### Rule 5

Only remove old key fields after validation.

## Phase Plan

## Phase 1: Add direct links from child tables to `devices`

These are the safest and highest-value changes.

### Tables

- `device_specs`
- `gateway_protocol_profiles`
- `anchor_positioning_profiles`

### Add linked-record columns

- `device_specs.device_ref`
- `gateway_protocol_profiles.device_ref`
- `anchor_positioning_profiles.device_ref`

### Backfill logic

Match:

- `child.device_key`
- to `devices.device_key`

and write the corresponding linked record.

### Why first

- one-to-one or one-to-many pattern is simple
- immediately improves navigation in NocoDB
- low risk of duplication mistakes

## Phase 2: Convert join tables to linked records

### Table: `device_connectivity`

Add:

- `device_ref` -> linked to `devices`
- `connectivity_ref` -> linked to `connectivity_options`

Backfill from:

- `device_key -> devices.device_key`
- `connectivity_key -> connectivity_options.connectivity_key`

### Table: `device_protocols`

Add:

- `device_ref` -> linked to `devices`
- `protocol_ref` -> linked to `protocols`

Backfill from:

- `device_key -> devices.device_key`
- `protocol_key -> protocols.protocol_key`

### Table: `device_applications`

Add:

- `device_ref` -> linked to `devices`
- `application_ref` -> linked to `applications`

Backfill from:

- `device_key -> devices.device_key`
- `application_key -> applications.application_key`

### Table: `device_tags`

Add:

- `device_ref` -> linked to `devices`
- `tag_ref` -> linked to `business_tags`

Backfill from:

- `device_key -> devices.device_key`
- `tag_key -> business_tags.tag_key`

## Phase 3: Switch reads to linked fields

After backfill is verified, update:

- frontend data loaders
- migration scripts
- seed scripts

Preferred logic:

- use linked records when present
- fall back to legacy key fields during transition

## Phase 4: Make linked fields the system of record

Once everything is stable:

- stop writing new `*_key` values in join logic where possible
- write linked fields first
- optionally keep key fields as technical identifiers only

## Phase 5: Optional cleanup

Only after verification:

- remove obsolete key columns from join tables
- or keep them as immutable integration IDs if useful for scripts

For this project, I recommend keeping `device_key` in `devices` permanently as a stable technical identifier.

## Recommended Per-Table Blueprint

## `devices`

Keep:

- `device_key`
- `device_name`
- `manufacturer`
- `model_number`
- `category`
- `subcategory`
- `role`
- `description`
- `datasheet_path`
- `status`

Why:

- `device_key` is still valuable as a stable machine-readable ID
- linked records do not replace the need for a durable internal key

## `device_specs`

Keep current fields.

Add:

- `device_ref` linked to `devices`

Future preference:

- frontend should join via `device_ref`
- `device_key` may remain for scripting compatibility

## `gateway_protocol_profiles`

Keep current fields.

Add:

- `device_ref` linked to `devices`

## `anchor_positioning_profiles`

Keep current fields.

Add:

- `device_ref` linked to `devices`

## `device_connectivity`

Keep current fields for now.

Add:

- `device_ref`
- `connectivity_ref`

Preferred long-term display fields:

- show linked device title
- show linked connectivity type

## `device_protocols`

Keep current fields for now.

Add:

- `device_ref`
- `protocol_ref`

## `device_applications`

Keep current fields for now.

Add:

- `device_ref`
- `application_ref`

## `device_tags`

Keep current fields for now.

Add:

- `device_ref`
- `tag_ref`

## Validation Checklist

Before removing any old fields, verify:

- every `device_specs` row has exactly one linked `device_ref`
- every `gateway_protocol_profiles` row has exactly one linked `device_ref`
- every `anchor_positioning_profiles` row has exactly one linked `device_ref`
- every join table row resolves both linked references successfully
- no linked field points to the wrong device
- frontend loads correctly using linked reads
- migration and seed scripts remain idempotent

## Script Strategy

Recommended future migration sequence:

1. `004-add-linked-record-columns`
2. `005-backfill-linked-records`
3. `006-read-prefer-linked-records`
4. `007-cleanup-legacy-key-fields` (optional, much later)

Two migration scripts are now scaffolded in this repo:

- [`scripts/nocodb-add-linked-record-columns.mjs`](/c:/Users/Anshaj/Desktop/Locate-IQ/scripts/nocodb-add-linked-record-columns.mjs)
- [`scripts/nocodb-backfill-linked-records.mjs`](/c:/Users/Anshaj/Desktop/Locate-IQ/scripts/nocodb-backfill-linked-records.mjs)

They are safe by default and only write changes when run with `--apply`.

## Frontend Transition Strategy

Current frontend already builds a normalized dataset in [`src/App.tsx`](/c:/Users/Anshaj/Desktop/Locate-IQ/src/App.tsx).

When linked fields are introduced:

- first keep using current table fetches
- if linked values are returned in API payloads, read them preferentially
- if linked values are absent, continue using current `*_key` joins

This avoids a big-bang frontend rewrite.

## Recommendation

Best rollout order:

1. Add `device_ref` links to `device_specs`, `gateway_protocol_profiles`, and `anchor_positioning_profiles`
2. Backfill and validate those links
3. Add linked refs to the four join tables
4. Backfill and validate join tables
5. Update frontend/scripts to prefer linked relations
6. Decide later whether to retire old key columns

## Final Opinion

Yes, linked records are the right next step.

For Locate-IQ they will improve:

- maintainability
- editing safety
- onboarding for interns
- data browsing in NocoDB
- long-term scalability of your knowledge base

But the right way is a phased migration, not a full replacement in one shot.
