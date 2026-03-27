# RBAC Implementation Plan

This document covers how to implement the Role-Based Access Control system described in the design's Permission Matrix. It is the most architecturally critical piece of the backend — everything else depends on it being correct.

---

## How It Works (Overview)

Every API request goes through two middleware layers before reaching the route handler:

```
Request → [auth.middleware] → [rbac.middleware] → Route Handler
```

1. `auth.middleware` validates the JWT and attaches the decoded user (`req.user`) to the request.
2. `rbac.middleware` checks `req.user.role` against the permission matrix for the requested resource and action.
3. If either check fails, the request is rejected before the handler ever runs.

---

## File Structure

```
backend/src/
├── middleware/
│   ├── auth.middleware.ts     ← validates JWT, attaches req.user
│   └── rbac.middleware.ts     ← checks role against permission matrix
├── config/
│   └── permissions.ts         ← the permission matrix (single source of truth)
└── routes/
    ├── appointments.routes.ts  ← example of wiring middleware to routes
    ├── services.routes.ts
    └── users.routes.ts
```

---

## Step 1 — Define the Permission Matrix

**File:** `backend/src/config/permissions.ts`

This is the single source of truth. Every allowed action per role is listed here. If it's not in this file, it's denied.

```typescript
import { UserRole } from '../models/user.model'

// Maps role → resource → allowed actions
export const permissions: Record<UserRole, Record<string, string[]>> = {
  client: {
    appointments: ['create', 'view_own', 'cancel', 'track'],
    profile:      ['view', 'edit', 'deactivate'],
    services:     ['view'],
  },
  staff: {
    appointments: ['view_queue', 'update_status', 'add_remarks'],
    profile:      ['view', 'edit'],
    services:     ['view'],
  },
  manager: {
    appointments:       ['view_queue', 'update_status', 'add_remarks'],
    profile:            ['view', 'edit'],
    services:           ['view', 'create', 'edit', 'archive'],
    staff_assignments:  ['create', 'remove', 'view'],
  },
  admin: {
    profile:       ['view', 'edit'],
    user_accounts: ['create', 'view', 'edit', 'archive'],
    audit_logs:    ['view', 'export'],
  },
}

// Helper — used by rbac.middleware
export function isAllowed(role: UserRole, resource: string, action: string): boolean {
  return permissions[role]?.[resource]?.includes(action) ?? false
}
```

> Note: Admin intentionally has no entry for `appointments` or `services`. Any request from an admin to those resources will return 403.

---

## Step 2 — Auth Middleware

**File:** `backend/src/middleware/auth.middleware.ts`

Validates the JWT from the `Authorization` header and attaches the decoded payload to `req.user`. Must run before RBAC.

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
```

---

## Step 3 — RBAC Middleware

**File:** `backend/src/middleware/rbac.middleware.ts`

Returns a middleware function pre-configured with the resource and action to check. Uses `isAllowed()` from the permissions config.

```typescript
import { Response, NextFunction } from 'express'
import { isAllowed } from '../config/permissions'
import { AuthenticatedRequest } from './auth.middleware'
import { UserRole } from '../models/user.model'

export function requirePermission(resource: string, action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role as UserRole

    if (!role) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    if (!isAllowed(role, resource, action)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}
```

---

## Step 4 — Wire Middleware to Routes

**File:** `backend/src/routes/appointments.routes.ts`

Apply `authenticate` first (always), then `requirePermission` with the matching resource/action from the matrix.

```typescript
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import * as AppointmentsController from '../controllers/appointments.controller'

const router = Router()

// Client books an appointment
router.post(
  '/',
  authenticate,
  requirePermission('appointments', 'create'),
  AppointmentsController.create
)

// Staff/Manager views their service queue
router.get(
  '/queue',
  authenticate,
  requirePermission('appointments', 'view_queue'),
  AppointmentsController.getQueue
)

// Staff/Manager updates appointment status
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('appointments', 'update_status'),
  AppointmentsController.updateStatus
)

// Client views their own appointments
router.get(
  '/my',
  authenticate,
  requirePermission('appointments', 'view_own'),
  AppointmentsController.getOwn
)

export default router
```

**File:** `backend/src/routes/services.routes.ts`

```typescript
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import * as ServicesController from '../controllers/services.controller'

const router = Router()

// Anyone authenticated can view services (for booking calendar)
router.get(
  '/',
  authenticate,
  requirePermission('services', 'view'),
  ServicesController.getAll
)

// Manager only — create, edit, archive
router.post(
  '/',
  authenticate,
  requirePermission('services', 'create'),
  ServicesController.create
)

router.patch(
  '/:id',
  authenticate,
  requirePermission('services', 'edit'),
  ServicesController.update
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('services', 'archive'),
  ServicesController.archive
)

export default router
```

**File:** `backend/src/routes/users.routes.ts`

```typescript
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import * as UsersController from '../controllers/users.controller'

const router = Router()

// Admin only — create staff or manager accounts
router.post(
  '/',
  authenticate,
  requirePermission('user_accounts', 'create'),
  UsersController.create
)

// Admin only — view all staff/manager accounts
router.get(
  '/',
  authenticate,
  requirePermission('user_accounts', 'view'),
  UsersController.getAll
)

// Admin only — archive an account
router.delete(
  '/:id',
  authenticate,
  requirePermission('user_accounts', 'archive'),
  UsersController.archive
)

export default router
```

---

## Step 5 — Register Routes in app.ts

**File:** `backend/src/app.ts`

```typescript
import express from 'express'
import appointmentsRouter from './routes/appointments.routes'
import servicesRouter from './routes/services.routes'
import usersRouter from './routes/users.routes'

const app = express()
app.use(express.json())

app.use('/api/appointments', appointmentsRouter)
app.use('/api/services', servicesRouter)
app.use('/api/users', usersRouter)

export default app
```

---

## What Each Role Can Hit

| Route | Method | Required Permission | Allowed Roles |
|---|---|---|---|
| `/api/appointments` | POST | `appointments:create` | client |
| `/api/appointments/my` | GET | `appointments:view_own` | client |
| `/api/appointments/queue` | GET | `appointments:view_queue` | staff, manager |
| `/api/appointments/:id/status` | PATCH | `appointments:update_status` | staff, manager |
| `/api/services` | GET | `services:view` | client, staff, manager |
| `/api/services` | POST | `services:create` | manager |
| `/api/services/:id` | PATCH | `services:edit` | manager |
| `/api/services/:id` | DELETE | `services:archive` | manager |
| `/api/users` | POST | `user_accounts:create` | admin |
| `/api/users` | GET | `user_accounts:view` | admin |
| `/api/users/:id` | DELETE | `user_accounts:archive` | admin |

---

## Key Points for Students

- Never check roles directly in a controller (`if (user.role === 'admin')`). Always go through `requirePermission`. This keeps the logic in one place.
- If you need to add a new permission, add it to `permissions.ts` first, then wire the middleware to the route. Nothing else needs to change.
- The order of middleware matters: `authenticate` must always come before `requirePermission` because RBAC needs `req.user` to exist.
- A 401 means "you're not logged in." A 403 means "you're logged in but not allowed." Keep these distinct.
