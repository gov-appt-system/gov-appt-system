# Tech Stack

## Package Manager
- **pnpm** (v8+) is the only package manager used in this project. Never use npm or yarn to install packages.
- Workspace managed via `pnpm-workspace.yaml` with packages under `packages/*`.
- To install all dependencies: `pnpm install` from the root.

## Backend (`packages/backend`)
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5 (strict mode, CommonJS modules, ES2020 target)
- **Framework:** Express.js 4
- **Database client:** Supabase JS SDK (`@supabase/supabase-js`) for runtime queries
- **Migrations:** Plain SQL files in `src/db/schema/` — apply via Supabase Dashboard SQL Editor or Supabase CLI
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (12 rounds)
- **Email:** Nodemailer / SendGrid via `SENDGRID_API_KEY`
- **Logging:** Winston
- **Testing:** Vitest + fast-check (property-based tests)
- **Dev server:** `ts-node-dev` with `--respawn`

## Frontend (`packages/frontend`) — not yet started
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 5
- **UI:** shadcn/ui + Tailwind CSS + Radix UI primitives
- **Routing:** React Router v6
- **HTTP:** Axios
- **Forms:** React Hook Form
- **Testing:** Vitest

## Database
- **Supabase (PostgreSQL)** — hosted Postgres with RLS enabled
- All runtime queries go through the Supabase JS client
- Schema is defined as plain SQL in `packages/backend/src/db/schema/` — apply in order via Supabase Dashboard or CLI
- Soft-delete pattern: records are never hard-deleted; `archived_at` is set instead

## Common Commands

```bash
# Install all packages (run from root)
pnpm install

# Backend dev server
cd packages/backend && pnpm run dev

# Run all tests
pnpm test

# Backend tests only
cd packages/backend && pnpm test

# Compile TypeScript
cd packages/backend && pnpm run build

# Apply schema (run SQL files in order via Supabase Dashboard or CLI)
# See packages/backend/src/db/schema/SCHEMA_CHANGELOG.md for instructions
```

## Environment
- Backend env file: `packages/backend/.env` (copy from `.env.example`)
- Never commit `.env` files — they are gitignored
- Key vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SENDGRID_API_KEY`
- `DATABASE_URL` is no longer required (was only used by Knex)
