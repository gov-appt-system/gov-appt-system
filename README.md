# Government Appointment Booking System

A government agency appointment scheduling system with role-based access control, real-time availability, and email notifications.



**Working Prototype (Frontend):**
[View Figma Prototype](https://www.figma.com/make/J66xF8HBB6PSimi7D7KHdo/Government-Appointment-Booking-System?p=f&t=MVCBImR2iRFXcUt9-0&preview-route=%2Flogin)

> **Status:** Backend API accomplished as well as Frontend | Rigorous testing needed
---

## Team Branches pag may guimalaw sa main branch ggulpihin q

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

```bash
git push origin <your-branch-name>
```

### Examples per team

```bash
# Staging branch
-> staging-branch kumbaga predployment

# main branch
->main : main repo used by vercel and supabase


---

## 5. Recommended Workflow (Daily)

```bash
# 1. Pull latest before you start
git pull origin <your-branch>

# 2. Make your changes...

# 3. Stage and commit
git add .
git commit -m "brief description of what you did"

# 4. Push
git push origin <your-branch>
```

---

## Tips

- **Never push directly to `main`** — always work on your team's branch
- Write clear commit messages (e.g. `"add login form validation"` not `"fix stuff"`)
- Pull before you push to avoid merge conflicts (WAG MAG FFORCE HAA)
- If you get a merge conflict, ask your team lead before resolving it
```
