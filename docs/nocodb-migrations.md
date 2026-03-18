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

## Notes

- Migration history is stored locally in `.nocodb-migrations.json`.
- Backups still matter. They are your restore point if a migration writes bad data.
- The existing one-off scripts remain available if you need them directly.
