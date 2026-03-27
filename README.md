# Appointment Booking System

A web-based appointment scheduling system for government agencies with role-based access control, real-time availability, and email notifications.

**Stack:** React + TypeScript (frontend), Node.js/Express + TypeScript (backend), Supabase (PostgreSQL)

---

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project

---

## Setup

### 1. Clone and install

```cmd
git clone <repository-url>
cd appointment-booking-system
pnpm install
```

### 2. Configure environment variables

**Backend** — create `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@youragency.gov.ph

NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend** — create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run database migrations

```cmd
cd backend
pnpm run migrate
```

Optionally seed sample data:

```cmd
pnpm run seed
```

### 4. Start the app

From the root directory:

```cmd
pnpm run dev
```

Or individually:

```cmd
REM Terminal 1
cd backend && pnpm run dev

REM Terminal 2
cd frontend && pnpm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

---

## Common Commands

```cmd
pnpm run test:all          REM Run all tests
pnpm run lint:all          REM Lint all code
pnpm run build:all         REM Production build

REM From /backend
pnpm run migrate           REM Apply migrations
pnpm run migrate:rollback  REM Rollback last migration
pnpm run db:reset          REM Reset database
```

---

## Troubleshooting

**Port in use:**
```cmd
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

**Supabase connection failing:** Double-check `DATABASE_URL` format and that your Supabase project is active at https://app.supabase.com.
