# Changes: Tasks 1 – 3

---

## Task 1 — Initialize Monorepo and Project Structure

### File Structure

```
/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── packages/
│   ├── backend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── knexfile.ts
│   │   └── .env.example
│   └── frontend/
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
```

### Files and Purpose

| File | Purpose |
|---|---|
| `package.json` (root) | Workspace root — defines recursive `test`, `build`, and `dev` scripts; enforces Node ≥18 and pnpm ≥8 |
| `pnpm-workspace.yaml` | Declares `packages/*` as pnpm workspace members so both packages share a single `node_modules` hoisting |
| `tsconfig.base.json` | Shared TypeScript config (ES2020, strict mode, commonjs, source maps) extended by both packages |
| `packages/backend/package.json` | Backend package — lists runtime deps (Express, Knex, Supabase, bcrypt, JWT, Winston, Nodemailer) and dev deps (Vitest, fast-check, TypeScript) |
| `packages/backend/tsconfig.json` | Extends root tsconfig; sets `src/` as rootDir and `dist/` as outDir |
| `packages/backend/knexfile.ts` | Knex configuration pointing at `DATABASE_URL` env var; used by `pnpm migrate` and `pnpm seed` |
| `packages/backend/.env.example` | Documents all required backend env vars: Supabase URL/keys, DATABASE_URL, JWT secret/expiry, SendGrid key, PORT |
| `packages/frontend/package.json` | Frontend package — lists React 18, Vite, shadcn/ui primitives, Tailwind, React Router, Axios, React Hook Form |
| `packages/frontend/tsconfig.json` | Extends root tsconfig; adds DOM libs, ESNext module, bundler resolution, and `jsx: react-jsx` |
| `packages/frontend/.env.example` | Documents frontend env vars: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### Functionality

- Single pnpm workspace with two packages (`backend`, `frontend`) sharing one lockfile and TypeScript base config.
- Root-level scripts delegate to each package recursively (`pnpm --recursive test/build/dev`).
- Environment variable templates ensure developers know exactly what secrets to supply before running either package.

---

## Task 2 — Database Schema and Migrations

### File Structure

```
packages/backend/src/db/
├── migrations/
│   ├── 20240101000001_create_users_and_profiles.ts
│   ├── 20240101000002_create_services.ts
│   ├── 20240101000003_create_appointments.ts
│   ├── 20240101000004_create_service_assignments.ts
│   ├── 20240101000005_create_audit_logs.ts
│   └── 20240101000006_create_views.ts
└── seeds/
    └── 01_dev_accounts.ts
```

### Files and Purpose

| File | Purpose |
|---|---|
| `20240101000001_create_users_and_profiles.ts` | Creates the `users` base table plus `clients`, `staff_profiles`, and `admin_profiles` profile tables |
| `20240101000002_create_services.ts` | Creates the `services` table with operating hours columns and soft-delete support |
| `20240101000003_create_appointments.ts` | Creates the `appointments` table with JSONB personal details, status CHECK constraint, and tracking number |
| `20240101000004_create_service_assignments.ts` | Creates the `service_assignments` table with a partial unique index for active assignments |
| `20240101000005_create_audit_logs.ts` | Creates the immutable `audit_logs` table (no soft-delete columns) |
| `20240101000006_create_views.ts` | Creates `manager_staff_overview` and `manager_appointments_overview` database views |
| `01_dev_accounts.ts` | Seed file that inserts one admin, one manager, one staff, and one client account for local development |

### Functionality

**Migration 1 — Users and Profiles**
- `users`: UUID PK, unique email, bcrypt password hash, role CHECK (`client | staff | manager | admin`), `is_active`, `archived_at` (soft-delete), timestamps. Indexes on `role` and `archived_at`.
- `clients`: 1-to-1 with `users`; stores citizen-specific fields (name, phone, address, DOB, government ID).
- `staff_profiles`: Shared by both `staff` and `manager` roles; stores employee ID and department. Role is distinguished by `users.role`.
- `admin_profiles`: Separate profile table for admins; same shape as staff but semantically distinct.

**Migration 2 — Services**
- `services`: Stores service name, description, department, slot duration (minutes), capacity (concurrent appointments), `start_time`/`end_time` (TIME), `days_of_week` (INTEGER[]), required documents (TEXT[]), soft-delete columns, and `created_by` FK to the manager who created it.

**Migration 3 — Appointments**
- `appointments`: Unique `tracking_number`, FK to `clients` and `services`, `appointment_date_time`, `status` CHECK (`pending | confirmed | completed | cancelled | no_show`), `personal_details` JSONB (snapshot at booking time), `processed_by` FK to `staff_profiles`. Six indexes covering client, service, datetime, tracking number, status, and archived_at.

**Migration 4 — Service Assignments**
- `service_assignments`: Links staff to services. `assigned_by` and `archived_by` FKs track which manager made/removed the assignment. Partial unique index `idx_service_assignments_active` on `(staff_id, service_id) WHERE is_active = true` — allows re-assignment after archiving without violating uniqueness.

**Migration 5 — Audit Logs**
- `audit_logs`: Immutable append-only table. No `archived_at` or `is_active` columns by design. Stores actor (`user_id`), `action`, `resource`, `details` JSONB, and `ip_address` (INET type). Indexes on `timestamp` and `user_id`.

**Migration 6 — Views**
- `manager_staff_overview`: Joins `users`, `staff_profiles`, `service_assignments`, and `services` to give managers a single query showing each staff member alongside their currently active assigned services as a JSON array.
- `manager_appointments_overview`: Joins `appointments` with `services` to expose service name, department, and manager ID alongside every appointment row — used by the manager dashboard.

**Seed — Dev Accounts**
- Clears all tables in reverse FK order before inserting.
- Hashes a shared default password (`Dev@12345`) with bcrypt (10 rounds).
- Creates four accounts: `admin@example.gov`, `manager@example.gov`, `staff@example.gov`, `client@example.com`.
- Inserts matching profile rows in `admin_profiles`, `staff_profiles` (×2 for manager and staff), and `clients`.

---

## Task 3 — Backend: Shared Types, Utilities, and Configuration

### File Structure

```
packages/backend/src/
├── types/
│   └── index.ts
├── utils/
│   ├── password.ts
│   └── tracking.ts
└── config/
    ├── logger.ts
    └── supabase.ts
```

### Files and Purpose

| File | Purpose |
|---|---|
| `types/index.ts` | Single source of truth for all shared TypeScript interfaces and enums used across the backend |
| `utils/password.ts` | Pure utility function for validating password complexity |
| `utils/tracking.ts` | Generates and validates appointment tracking numbers |
| `config/logger.ts` | Winston logger singleton with environment-aware formatting |
| `config/supabase.ts` | Supabase client singleton using the service role key for server-side DB operations |

### Functionality

**`types/index.ts`**

Exports all domain types consumed by services, routes, and tests:

- `UserRole` enum — `client | staff | manager | admin`
- `AppointmentStatus` enum — `pending | confirmed | completed | cancelled | no_show`
- `User`, `Client`, `Staff`, `Manager`, `Admin` interfaces — base user shape extended per role
- `PersonalDetails`, `EmergencyContact` — JSONB snapshot structure stored in appointments
- `Appointment` — full appointment record including status, tracking number, and soft-delete field
- `Service`, `ServiceHours` — service configuration including operating hours and capacity
- `ServiceAssignment` — staff-to-service link with audit fields (`assignedBy`, `archivedBy`)
- `TimeSlot` — availability slot shape returned by CalendarService
- `AuditLog`, `AuditFilters` — audit record and query filter shapes

**`utils/password.ts` — `validatePasswordComplexity(password: string): boolean`**

Returns `true` only when all four conditions are met:
1. Length ≥ 8 characters
2. Contains at least one uppercase letter (`/[A-Z]/`)
3. Contains at least one lowercase letter (`/[a-z]/`)
4. Contains at least one digit (`/[0-9]/`)

Used by auth routes on registration and password change (Requirements 1.6, 5.4).

**`utils/tracking.ts` — `generateTrackingNumber()` and `validateTrackingNumber()`**

- `generateTrackingNumber()`: Builds a string in the format `APT-YYYYMMDD-XXXXX` where the date part is derived from `new Date()` and the 5-character suffix is randomly sampled from `A-Z0-9` (36 possible characters per position = 36^5 ≈ 60 million combinations per day).
- `validateTrackingNumber(trackingNumber)`: Tests the string against `/^APT-\d{8}-[A-Z0-9]{5}$/` — used by property tests and the tracking lookup route.

**`config/logger.ts` — Winston logger singleton**

- Log level: `debug` in development, `info` in production (controlled by `NODE_ENV`).
- Format pipeline: `errors()` (captures stack traces) → `timestamp()` → `colorize()` (dev only) → custom `printf` that appends the stack trace on a new line when present.
- Single `Console` transport — production deployments can add file or cloud transports without changing this file.

**`config/supabase.ts` — Supabase client singleton**

- Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment; throws at startup if either is missing (fail-fast).
- Creates a single `SupabaseClient` instance with `autoRefreshToken: false` and `persistSession: false` — appropriate for a stateless server process.
- Uses the service role key which bypasses Row Level Security; this client must only be used in trusted server-side code, never exposed to the frontend.
