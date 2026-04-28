# Database Schema Changelog

## Removal of Knex.js — Migration to Plain SQL

### What changed

Knex.js was removed as a dependency. All schema definitions that lived in
`src/db/migrations/*.ts` and `src/db/seeds/*.ts` have been converted to plain
SQL files in `src/db/schema/`.

| Old file (Knex) | New file (SQL) |
|---|---|
| `20240101000001_create_users_and_profiles.ts` | `001_users_and_profiles.sql` |
| `20240101000002_create_services.ts` | `002_services.sql` |
| `20240101000003_create_appointments.ts` | `003_appointments.sql` |
| `20240101000004_create_service_assignments.ts` | `004_service_assignments.sql` |
| `20240101000005_create_audit_logs.ts` | `005_audit_logs.sql` |
| `20240101000006_create_views.ts` | `006_views.sql` |
| `01_dev_accounts.ts` (seed) | `007_seed_dev_accounts.sql` |

Files removed:
- `packages/backend/knexfile.ts`
- `packages/backend/src/db/migrations/` (entire folder)
- `packages/backend/src/db/seeds/` (entire folder)

Packages removed from `packages/backend/package.json`:
- `knex` (dependency)
- `pg` (dependency — only needed by Knex; Supabase JS uses its own transport)
- `@types/pg` (devDependency)

Scripts removed from `packages/backend/package.json`:
- `migrate` (`knex migrate:latest`)
- `migrate:rollback` (`knex migrate:rollback`)
- `seed` (`knex seed:run`)

### Trade-offs

**Gains**
- Fewer dependencies, smaller install footprint.
- No abstraction layer between you and Postgres — SQL is exactly what Supabase runs.
- Views, partial indexes, and array/JSONB columns are expressed naturally in SQL
  without Knex workarounds (`specificType`, `raw`).
- Easier to copy-paste into the Supabase SQL Editor or use with the Supabase CLI.

**Losses**
- No programmatic rollback. You must write `DROP`/`ALTER` statements manually if
  you need to undo a migration.
- No migration version tracking out of the box. Supabase CLI (`supabase migration`)
  provides this if you adopt it.
- The dev seed (`007_seed_dev_accounts.sql`) uses placeholder bcrypt hashes — you
  must generate real ones before running (see the comment in that file).

### Next steps — using Supabase directly

**Option A — Supabase Dashboard (quickest)**
1. Open your project in [supabase.com](https://supabase.com).
2. Go to SQL Editor.
3. Run each `00X_*.sql` file in order (001 → 006).
4. For dev seeding, generate real bcrypt hashes first, then run `007_seed_dev_accounts.sql`.

**Option B — Supabase CLI (recommended for teams)**
1. Install: `npm install -g supabase` (or `brew install supabase/tap/supabase`).
2. `supabase init` in the repo root (creates `supabase/` folder).
3. Copy the SQL files into `supabase/migrations/` with timestamp prefixes, e.g.
   `20240101000001_users_and_profiles.sql`.
4. `supabase db push` to apply against your linked project.
5. Commit the `supabase/migrations/` folder — this becomes your migration history.

**Option C — psql / any Postgres client**
```bash
psql "$DATABASE_URL" -f src/db/schema/001_users_and_profiles.sql
psql "$DATABASE_URL" -f src/db/schema/002_services.sql
# ... repeat in order
```

### Environment variables after this change

`DATABASE_URL` is no longer required (it was only used by Knex/pg).
The only required vars are now:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SENDGRID_API_KEY`

## 008_rls_policies.sql — Row Level Security

### What changed

Added Supabase Row Level Security (RLS) policies for all tables, matching the
RBAC permission matrix from the design document.

| File | Purpose |
|---|---|
| `008_rls_policies.sql` | RLS policies for all tables + helper functions |

### Helper functions

- `get_my_role()` — Returns the app-level role for the authenticated user by
  reading from the `users` table. Used in policy conditions.
- `is_assigned_to_service(service_id)` — Returns true if the authenticated user
  has an active `service_assignments` row for the given service.

### Policy summary

| Table | Client | Staff | Manager | Admin |
|---|---|---|---|---|
| `users` | Own row (R/W) | Own row (R/W) | Own row (R/W) | All rows (R/W) |
| `clients` | Own row (R/W) | — | — | All rows (R/W) |
| `staff_profiles` | — | Own row (R/W) | All rows (R) | All rows (R/W) |
| `admin_profiles` | — | — | — | Own row (R/W) |
| `services` | Active (R) | Active (R) | All (R/W/Create) | — |
| `appointments` | Own (R/W/Create) | Assigned services (R/W) | Assigned services (R/W) | — |
| `service_assignments` | — | Own (R) | All (R/W/Create) | — |
| `audit_logs` | — | — | — | All (R) |

### Notes

- The backend uses the **service-role key** which bypasses RLS. These policies
  protect data when the frontend connects directly via the Supabase anon key.
- Audit logs are **immutable** — no UPDATE or DELETE policies exist.
- No hard deletes are possible through RLS; the soft-delete pattern is enforced
  at the application layer.
- Apply this file **after** all previous schema files (001–007).
