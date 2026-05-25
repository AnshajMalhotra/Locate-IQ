# Locate-IQ Handover

Last updated: 2026-05-25

This document is the operational handover for the current Locate-IQ system so the project can survive the original laptop being wiped or retired.

## Live System

- Frontend URL: `http://192.168.0.172:8081/`
- NocoDB URL: `http://192.168.0.172:8080/`
- VM host: `192.168.0.172`
- VM repo path: `/home/anshaj/Locate-IQ`
- GitHub repo: `https://github.com/AnshajMalhotra/Locate-IQ`
- Primary branch: `main`

## What Locate-IQ Is

Locate-IQ is a Vite + React + TypeScript single-page app that serves as an internal hardware catalog for gateways, anchors, tags, and beacons.

The app is deployed as a static site behind Nginx in Docker. There is no custom backend. The browser talks directly to NocoDB for reads and writes.

That means:

- frontend availability depends on the Docker container being up
- data availability depends on NocoDB being reachable at `:8080`
- editing from the UI writes directly to NocoDB

## Architecture

1. Source code lives in this repository.
2. `Dockerfile` builds the frontend with `npm run build`.
3. The build output is copied into an `nginx:alpine` image.
4. `docker-compose.yml` publishes Locate-IQ on port `8081`.
5. The frontend uses build-time environment variables for the NocoDB URL and API key.

Important consequence:

- `VITE_NOCODB_API_KEY` is bundled into the frontend at build time.
- Anyone with access to the served JS bundle can inspect the browser build and recover that token.
- If the app is kept, the NocoDB token should be rotated during handover.
- Longer term, a server-side proxy or a more restricted token model would be safer.

## Required Runtime Configuration

Create a `.env` file on the VM in `/home/anshaj/Locate-IQ` or export these variables before building:

| Variable | Purpose | Current/expected value |
| --- | --- | --- |
| `VITE_NOCODB_BASE_URL` | Frontend API target | `http://192.168.0.172:8080` |
| `VITE_NOCODB_API_KEY` | Frontend NocoDB token | live secret, do not commit |
| `NOCODB_BASE_ID` | Base used by admin scripts | `pys78cyayu9qnx1` |
| `VITE_NOCODB_TABLE_ID` | Main devices table reference | `m9qmti5iiexuqy0` |
| `VITE_NOCODB_VIEW_ID` | Current view reference | `vwhvuw6v9h7uvmm7` |
| `VITE_NOCODB_TABLE_LABEL` | Display label for the main table | `devices` |
| `LOCATEIQ_PORT` | Docker-published frontend port | `8081` by default |

Most admin scripts also accept:

- `NOCODB_BASE_URL`
- `NOCODB_API_TOKEN`

If those are missing, the scripts fall back to the `VITE_*` values from `.env`.

## Deployment and Operations

### Update the live app on the VM

```bash
cd /home/anshaj/Locate-IQ
git pull origin main
docker compose down
docker compose up --build -d
docker compose ps
```

If the host uses the older CLI:

```bash
cd /home/anshaj/Locate-IQ
git pull origin main
docker-compose down
docker-compose up --build -d
docker-compose ps
```

### Check logs

```bash
cd /home/anshaj/Locate-IQ
docker compose logs -f locate-iq
```

### Local development

```bash
npm install
npm run dev
```

### Production build check

```bash
npm run build
```

## Current Docker Behavior

- `docker-compose.yml` defines one service: `locate-iq`
- The container name is `locate-iq`
- Port mapping is `${LOCATEIQ_PORT:-8081}:80`
- Docker ignores `.env`, `dist`, `node_modules`, `backups`, and `.nocodb-migrations.json`

This means the VM must have its own `.env` file because that file is not sent in the Docker build context.

## Frontend Data Dependencies

The main app in `src/App.tsx` fetches these NocoDB tables directly:

| Logical name | Table ID |
| --- | --- |
| `devices` | `m9qmti5iiexuqy0` |
| `deviceSpecs` | `memlisdc3xexytd` |
| `connectivityOptions` | `mxncb34nggu29us` |
| `deviceConnectivity` | `matcygk3ad9amdh` |
| `protocols` | `m0kgf62uwun29bh` |
| `deviceProtocols` | `m18o650glclxota` |
| `applications` | `mhhyhm4qlc8btgc` |
| `deviceApplications` | `m1jj5i417hc407k` |
| `businessTags` | `mcoenl9hcd4p4g1` |
| `deviceTags` | `mvrow0le5anxvcc` |
| `gatewayProfiles` | `momj1rwqmub764f` |
| `anchorProfiles` | `m2w2nv5ygb0nz0t` |
| `deviceVariants` | `msmzgfblv22rlkh` |

The app also supports editing and creating device records from the UI. Because that write path is in the frontend, the token used at build time must allow writes.

## Repository Layout

Primary folders:

- `src/`: current production frontend
- `public/docs/`: UI-accessible PDFs and product documents
- `public/device-images/`: UI-accessible product images
- `scripts/`: NocoDB schema, import, enrichment, and maintenance scripts
- `docs/`: architecture notes, migration notes, and handover documentation
- `tmp/`: review artifacts and audit outputs from import/sync work

Legacy folder:

- `locateiq-frontend/`: older prototype and not the current deployed app

If cleanup is needed later, confirm nobody still depends on `locateiq-frontend/` before deleting it.

## Assets and Documents

The app can open PDFs directly from the repo when they are under `public/docs/...`.

Recommended storage:

- docs: `public/docs/<category>/<model>/`
- images: `public/device-images/<category>/` or nested model folders

Helpful references:

- `public/docs/README.md`
- `public/device-images/README.md`
- `docs/product-asset-directories.md`

Important note:

- Some devices still include legacy UNC or Windows file paths in `datasheetPath` or `documents`.
- Those links will only work if the user has access to the original file share.
- Prefer migrating documents to `public/docs/...` and then updating NocoDB to point to `/docs/...`.

## Database and Content Operations

### Safe baseline commands

```bash
npm run db:backup
npm run db:migrations
npm run db:migrations:apply:safe
```

### Available npm commands

| Command | Purpose |
| --- | --- |
| `npm run db:backup` | Export table schema and records to `backups/` |
| `npm run db:migrations` | Show migration status |
| `npm run db:migrations:apply` | Apply pending migrations |
| `npm run db:migrations:apply:safe` | Back up then apply pending migrations |
| `npm run db:migrations:reapply` | Re-run every migration in the ledger |
| `npm run db:migrate:gateway-anchor:apply` | Add gateway/anchor documentation fields |
| `npm run db:links:add:apply` | Add linked-record columns |
| `npm run db:links:backfill:apply` | Backfill linked-record data |
| `npm run db:docs:sync:apply` | Sync project doc paths into NocoDB |
| `npm run db:vendor:url:add:apply` | Add vendor URL field |
| `npm run db:vendor:url:sync:apply` | Populate vendor URLs |
| `npm run db:populate:moko:apply` | Populate MOKO research fields |
| `npm run db:anchors:links:apply` | Backfill anchor links |
| `npm run db:seed:moko-additional:apply` | Seed additional MOKO devices |
| `npm run db:sync:moko-portfolio-tags-beacons:apply` | Sync tag/beacon portfolio data |
| `npm run db:sync:moko-inventory-workbook:apply` | Sync inventory workbook content |
| `npm run db:normalize:device-keys:apply` | Normalize device keys |
| `npm run ingest:product -- ...` | Review-first import for a new product |

Migration order is maintained in:

- `scripts/migrations/index.mjs`
- `.nocodb-migrations.json` on each machine that has applied them

## Product Ingestion Workflow

For a new product:

1. Add the PDF to `public/docs/<category>/<model>/`
2. Add any product image to `public/device-images/...`
3. Run the review-first importer
4. Inspect the generated JSON in `tmp/ingestion-reviews/`
5. Apply only after review

Example:

```bash
npm run ingest:product -- --url "<product-url>" --pdf "public/docs/<category>/<model>/<file>.pdf" --category "<gateway|anchor|beacon|tag>"
```

Reference:

- `docs/product-ingestion-pipeline.md`

## What Must Be Preserved Before This Laptop Is Removed

Minimum checklist:

1. Confirm GitHub contains the latest code and assets.
2. Confirm the VM at `192.168.0.172` has pulled the latest `main`.
3. Confirm `/home/anshaj/Locate-IQ/.env` exists on the VM.
4. Rotate the NocoDB API key because it currently exists in local developer context and in built frontend bundles.
5. Verify the live app at `http://192.168.0.172:8081/` still loads after rotation and rebuild.
6. Verify NocoDB still loads at `http://192.168.0.172:8080/`.
7. Preserve any still-needed PDFs that only exist on Windows network shares.
8. Preserve `tmp/` review artifacts if the team wants the audit trail from recent ingestion work.

Recommended follow-up:

1. Move secrets to the VM only or to a shared password manager / secret store.
2. Replace remaining UNC file references with `/docs/...` web paths.
3. Decide whether `locateiq-frontend/` should be archived or deleted.
4. Add another maintainer with SSH access to the VM and GitHub access to the repo.

## Quick Recovery Checklist

If the site goes down but the VM is still reachable:

```bash
ssh <user>@192.168.0.172
cd /home/anshaj/Locate-IQ
git status
git pull origin main
docker compose up --build -d
docker compose ps
docker compose logs -f locate-iq
```

If the app loads but no data appears:

1. Check that NocoDB is reachable at `http://192.168.0.172:8080`
2. Check that the token in the VM `.env` is still valid
3. Rebuild the frontend container after any token or base URL change
4. Inspect the browser console for NocoDB `401`, `403`, or `404` responses

