# Architecture

## Monorepo Structure

gov-appointment-app/
├── packages/
│ ├── backend/
│ │ ├── src/
│ │ │ ├── config/ # supabase.ts (singleton client), logger.ts (Winston)
│ │ │ ├── db/
│ │ │ │ ├── migrations/ # 6 Knex migration files
│ │ │ │ └── seeds/ # 01_dev_accounts.ts
│ │ │ ├── services/ # auth, rbac, calendar, notification, audit
│ │ │ ├── types/ # index.ts — all shared interfaces & enums
│ │ │ ├── utils/ # password.ts, tracking.ts
│ │ │ └── index.ts # Express app entry (health check only so far)
│ │ └── knexfile.ts
│ └── frontend/ # React stub only (main.tsx)
├── .kiro/specs/ # requirements.md, tasks.md, design.md
├── .amazonq/rules/memory-bank/
└── scripts/setup.sh

## Database Schema (6 migrations)
1. `users` + `clients` + `staff_profiles` + `admin_profiles`
2. `services` (operating hours, capacity, soft-delete)
3. `appointments` (tracking_number, personal_details JSONB, status CHECK)
4. `service_assignments` (partial unique index on active assignments)
5. `audit_logs` (immutable — no soft-delete)
6. Views: `manager_staff_overview`, `manager_appointments_overview`

## Key Design Decisions
- Supabase service role key used server-side (bypasses RLS) — never expose to client
- JWT blocklist is in-memory (`Set<string>`) — must be replaced with Redis/DB in production
- Password reset tokens stored in-memory (`Map`) — must be persisted in production
- Email failure queue is in-memory — must be persisted in production
- `reserveSlot` uses Postgres RPC `reserve_appointment_slot` for atomic booking; falls back to non-atomic check in dev if RPC unavailable
- Manager and Staff share `staff_profiles` table; role distinguished by `users.role`
- Admin has NO access to Services or Appointments by design
