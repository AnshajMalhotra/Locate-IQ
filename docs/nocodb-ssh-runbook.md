# NocoDB SSH Runbook

Date: 2026-03-16

## What this gives you

This repo now includes two Node scripts for managing your NocoDB base from a Linux VM over SSH:

- `scripts/nocodb-backup.mjs`: exports table metadata and all rows into timestamped JSON backups
- `scripts/nocodb-add-gateway-anchor-fields.mjs`: adds the recommended Gateway and Anchor documentation fields

The migration script is dry-run by default.

## Required config

Add these values on the VM before running the scripts:

```bash
export NOCODB_BASE_URL="http://192.168.0.172:8080"
export NOCODB_API_TOKEN="YOUR_WORKING_TOKEN"
export NOCODB_BASE_ID="pys78cyayu9qnx1"
```

You can also keep these in the repo `.env` file.

## Recommended sequence

### 1. SSH to the VM

```bash
ssh your-user@your-server
```

### 2. Go to the project folder

```bash
cd /path/to/Locate-IQ
```

### 3. Back up NocoDB first

```bash
node scripts/nocodb-backup.mjs
```

This creates:

```bash
backups/nocodb-<timestamp>/
```

Each table gets:

- `<table>.schema.json`
- `<table>.records.json`

### 4. Preview schema changes

```bash
node scripts/nocodb-add-gateway-anchor-fields.mjs
```

This prints all missing fields without changing the database.

### 5. Apply schema changes

```bash
node scripts/nocodb-add-gateway-anchor-fields.mjs --apply
```

## SSH one-liners

### Backup over SSH

```bash
ssh your-user@your-server 'cd /path/to/Locate-IQ && node scripts/nocodb-backup.mjs'
```

### Dry-run migration over SSH

```bash
ssh your-user@your-server 'cd /path/to/Locate-IQ && node scripts/nocodb-add-gateway-anchor-fields.mjs'
```

### Apply migration over SSH

```bash
ssh your-user@your-server 'cd /path/to/Locate-IQ && node scripts/nocodb-add-gateway-anchor-fields.mjs --apply'
```

## Suggested workflow

- run backup before every schema change
- run dry-run first to confirm the missing fields
- apply changes only after reviewing the dry-run output
- keep the `backups/` folder out of Git

## Important note

The field-creation script uses the NocoDB metadata API and is designed to be additive only.

It does not:

- delete columns
- overwrite existing columns
- delete records
- overwrite records

That makes it safe as a first migration tool for your current database.
