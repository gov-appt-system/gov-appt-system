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
- Verify pnpm are available
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

# eh since backend branch to (root folder works too_
cd ..
pnpm --filter backend test 2>&1
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
# Rundown of Major Backend Files


## Entry Point

### `src/index.ts`
* Bootstraps the Express app, attaches JSON body parsing, and exposes a `GET /health` endpoint.
* Starts the server on `PORT` (default `3000`).
* **Note:** No routes are wired yet — API routes are the next implementation phase (tasks 10–14).

---

## Config

### `src/config/supabase.ts`
* Creates a **singleton** Supabase client using the service role key.
* The service role key bypasses Row Level Security — intentionally used only server-side.
* Throws immediately on startup if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing.

### `src/config/logger.ts`
* Creates a **Winston logger** singleton.
* **In development:** Colorized output with `debug` level.
* **In production:** Plain text with `info` level only.
* Includes stack traces for `Error` objects.

---

## Services

### `src/services/auth.ts`
* `hashPassword` — bcrypt hashes with 12 rounds.
* `authenticate` — Looks up user by email, checks `is_active`/`archived_at`, compares bcrypt hash, and returns a signed JWT on success.
* `createSession` / `validateSession` — Signs/verifies HS256 JWTs; blocklisted tokens are rejected via an in-memory `Set`.
* `terminateSession` — Adds the token to the blocklist (logout).
* `registerClient` — Validates password complexity, checks for duplicate email, inserts into `users` then `clients`; rolls back the `users` row if the `clients` insert fails.
* `changePassword` — Verifies current password before updating; enforces complexity on the new password.
* `sendPasswordResetEmail` / `resetPassword` — Generates a `crypto.randomBytes` token stored in an in-memory `Map` with a 1-hour expiry; delegates email sending to `notification.ts`.

### `src/services/rbac.ts`
* Holds the full permission matrix as a static lookup table (`PERMISSION_MATRIX`) mapping `resource` → `action` → allowed `roles[]`.
* `hasPermission(role, resource, action)` — Pure synchronous check against the matrix.
* `enforcePermission(userId, resource, action)` — Fetches the user from DB, checks `is_active`/`archived_at`, then calls `hasPermission`; throws a 403 error on denial.
* `canAccessService(userId, serviceId)` — Clients always pass; staff/managers must have an active `service_assignments` row; admins are always denied (by design).

### `src/services/calendar.ts`
* `getAvailableSlots(serviceId, date)` — Generates all time slots for the day based on `start_time`, `end_time`, and `duration`; counts existing non-archived appointments per slot to compute booked vs. capacity.
* `checkSlotAvailability` — Counts active appointments in a slot window and compares against capacity.
* `reserveSlot` — Attempts an atomic reservation via a Postgres RPC (`reserve_appointment_slot`); falls back to `checkSlotAvailability` if the RPC isn't deployed (dev only).
* `releaseSlot` — No-op; capacity is derived from live appointment counts so no explicit release is needed.
* `isWithinServiceHours` — Checks `days_of_week`, `start_time`, and `end_time` against a given datetime (all UTC).

### `src/services/audit.ts`
* `logUserAction` — Inserts a row into `audit_logs` with actor, action, resource, details, and IP.
* `logSystemEvent` — Same but with no user actor (`user_id = null`).
* `logError` — Logs error message + stack trace as a system event.
* `getAuditLogs(filters)` — Queries `audit_logs` with optional filters (userId, action, resource, date range), ordered newest-first.
* `exportAuditLogs(startDate, endDate)` — Returns a CSV string of logs in the date range.
* **Note:** Audit failures never throw — they log to Winston instead so they don't break the caller.

### `src/services/notification.ts`
* Uses Nodemailer with SendGrid SMTP relay (falls back to local SMTP like Mailhog in dev).
* `sendBookingConfirmation` — Sends a branded HTML email with tracking number, service, date/time, and status.
* `sendStatusUpdate` — Sends a status change email with a human-readable message per status.
* `sendPasswordResetEmail` — Sends a reset link button email valid for 1 hour.
* `logEmailFailure` / `retryFailedEmails` — Failed emails go into an in-memory queue; `retryFailedEmails` retries up to `MAX_RETRY_COUNT` times (default 3, configurable via `EMAIL_MAX_RETRIES`).

---

## Utils

### `src/utils/password.ts`
* `validatePasswordComplexity(password)` — Returns `true` only if the password is ≥8 chars, has an uppercase letter, a lowercase letter, and a digit.

### `src/utils/tracking.ts`
* `generateTrackingNumber()` — Produces `APT-YYYYMMDD-XXXXX` where the suffix is 5 random uppercase alphanumeric characters.
* `validateTrackingNumber(str)` — Regex check against the `APT-YYYYMMDD-XXXXX` format.