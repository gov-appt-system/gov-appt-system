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
- **Migrations:** Knex.js (migrations and seeds in `src/db/migrations` and `src/db/seeds`)
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
- Knex handles schema migrations only; all runtime queries go through the Supabase JS client
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

# Database migrations
cd packages/backend && pnpm run migrate
cd packages/backend && pnpm run migrate:rollback
cd packages/backend && pnpm run seed
```

## Environment
- Backend env file: `packages/backend/.env` (copy from `.env.example`)
- Never commit `.env` files — they are gitignored
- Key vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_SECRET`, `SENDGRID_API_KEY`
