# Appointment Booking System

A government agency appointment scheduling system with role-based access control, real-time availability, and email notifications.

> **Status:** Backend API in active development. Frontend not yet started.

---

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (free tier works)

---

## Quick Setup (after cloning)

```bash
bash scripts/setup.sh
```

This will:
- Verify Node 18+ and pnpm are available
- Run `pnpm install` across all packages
`packages/backend/.env` if it doesn't exist yet

---

## Manual Setup

```bash
# 1. Install dependencies
pnpm install
pnpm approve-builds

# 2. Configure environment
cp packages/backend/.env.example packages/backend/.env
# then edit packages/backend/.env with your actual values
```

### Required environment variables (`packages/backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
key (server-side only) |
| `DATABASE_URL` | Direct Postgres connection string (for Knex migrations) |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `SENDGRID_API_KEY` | SendGrid API key for email |
| `EMAIL_FROM` | Sender address, e.g. `noreply@youragency.gov.ph` |
| `PORT` | Backend port (default `3000`) |
| `FRONTEND_URL` | Used in reset-password email links |

---

## Database

```bash
cd packages/backend

# Apply all migrations
te

# Rollback last migration
pnpm run migrate:rollback

# Seed dev accounts (client, staff, manager, admin)
pnpm run seed

# Reset database (rollback all + re-migrate + seed)
pnpm run db:reset
```

---

## Running the Backend

```bash
cd packages/backend
pnpm run dev
```

Server starts at `http://localhost:3000`

Health check: `GET http://localhost:3000/health`

---

## Testing

```bash
# All tests (from root)
pnpm test

# Backend only
cd packages/backend && pnpm test
```

Tests use [Vitest](https://vitest.dev/) and run once (no watch mode).

---

## Project Structure

```
appointment-booking-system/
├── packages/
│   ├── backend/          # Express + TypeScript API
│   │   ├── src/
│   │   │   ├── config/   # Supabase client, logger
│   │   │   ├── db/       # Knex migrations and seeds
│   │   │   ├── services/ # Auth, RBAC, Audit, Notification
│   │   │   ├── types/    # Shared TypeScript types
 yet started)
├── scripts/
│   └── setup.sh          # One-time setup script
└── pnpm-workspace.yaml
```

---

## Troubleshooting

**Port already in use:**
```bash
# Find the process
lsof -i :3000
# Kill it
kill -9 <PID>
```

**Supabase connection failing:**
- Double-check `DATABASE_URL` format: `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
- Make sure your Supabase project is active at https://app.supabase.com

**pnpm not found:**
```bash
npm install -g pnpm
```
│   │   │   └── utils/    # Password helpers, tracking
│   │   └── knexfile.ts
│   └── frontend/         # React app (not