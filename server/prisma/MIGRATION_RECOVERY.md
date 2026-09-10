# Migration history recovery blocker

The checked-in migration chain is not a complete history. Its first migration, `20260105_add_product_catalog`, creates catalog tables and immediately adds foreign keys to `businesses`, but no earlier migration in this repository creates `businesses`, users, roles, permissions, sessions, or branches. It also incorrectly adds `TEXT[]` columns named `categories`, `units`, and `products` to `businesses`; Prisma relations do not require relation columns. Later phases likewise have large schema areas with no migration files.

This explains `P3006/P1014` in a fresh shadow database: replay starts from an empty database and the first migration references `businesses`, which does not exist. It is migration ordering/history loss, not a PostgreSQL connection problem.

Do not edit an already-applied migration or run `migrate reset` on production. Safe recovery requires database-specific evidence not present in this checkout:

1. Make a separate sanitized clone/backup of production.
2. Record `SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at;` on that clone.
3. Compare the clone with `server/prisma/schema.prisma` using `prisma migrate diff`.
4. If production was originally created with `db push` and has no authoritative migration chain, archive the broken migration directory on a release branch, generate one baseline SQL migration from the verified schema, review it, and mark that baseline applied with `prisma migrate resolve --applied <baseline>` on the clone first.
5. If production has applied migration records, restore the missing historical migration files/checksums from the original deployment artifact instead; do not squash or modify them.
6. Only after clone rehearsal succeeds should the exact resolve/deploy procedure be repeated against production.

No migration file was modified by this repair pass because doing so without `_prisma_migrations` and a schema-only production dump could corrupt the working database.
