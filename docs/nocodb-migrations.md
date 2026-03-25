# NocoDB Migrations

Use backups for rollback and audits, and use migrations for intentional database changes.

## Commands

Status only:

```bash
npm run db:migrations
```

Apply pending migrations:

```bash
npm run db:migrations:apply
```

Apply pending migrations and create a backup first:

```bash
npm run db:migrations:apply:safe
```

Re-run all migrations:

```bash
npm run db:migrations:reapply
```

## Current migration order

1. `001-add-gateway-anchor-fields`
2. `002-populate-moko-research`
3. `003-seed-moko-additional-devices`
4. `004-add-linked-record-columns`
5. `005-backfill-linked-records`
6. `006-add-vendor-url-field`
7. `007-populate-vendor-urls`
8. `008-add-device-variant-schema`
9. `009-simplify-device-variants`
10. `010-add-device-sensors-field`
11. `011-populate-device-sensors`
12. `012-convert-device-sensors-to-multiselect`
13. `013-add-device-battery-life-field`
14. `014-populate-device-battery-life`
15. `015-merge-ethernet-poe-connectivity`

## Notes

- Migration history is stored locally in `.nocodb-migrations.json`.
- Backups still matter. They are your restore point if a migration writes bad data.
- The existing one-off scripts remain available if you need them directly.
