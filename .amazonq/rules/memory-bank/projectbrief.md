# Tech Stack

## Package Manager
- **pnpm** only (never npm or yarn)
- Monorepo via `pnpm-workspace.yaml`, packages under `packages/*`

## Backend (`packages/backend`)
- Node.js 18+ / TypeScript 5 (strict, CommonJS, ES2020)
- Express.js 4
- Supabase JS SDK — all runtime DB queries
- Knex.js — migrations and seeds only
- JWT (`jsonwebtoken`) + bcrypt (12 rounds)
- Nodemailer / SendGrid (`SENDGRID_API_KEY`)
- Winston logger
- Vitest + fast-check (property-based tests, min 100 runs each)
- ts-node-dev (dev server)

## Frontend (`packages/frontend`) — NOT STARTED
- React 18 + TypeScript + Vite 5
- shadcn/ui + Tailwind CSS + Radix UI
- React Router v6, Axios, React Hook Form, Vitest

## Database
- Supabase (hosted PostgreSQL) with RLS enabled
- Soft-delete pattern: `archived_at` + `is_active = false`, never hard-delete
- Knex handles schema only; Supabase JS client handles runtime queries

## Key Environment Variables (`packages/backend/.env`)
| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (bypasses RLS) |
| `DATABASE_URL` | Postgres connection string for Knex |
| `JWT_SECRET` | Min 32 chars |
| `JWT_EXPIRES_IN` | e.g. `8h` |
| `SENDGRID_API_KEY` | Email delivery |
| `EMAIL_FROM` | Sender address |
| `FRONTEND_URL` | Used in reset-password links |
| `PORT` | Default `3000` |
