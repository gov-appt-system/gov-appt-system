# Changes: Tasks 5 and 7

---

## Task 5 - Backend: RBACController

### File Structure

```
packages/backend/src/
└── services/
    └── rbac.ts
```

### Purpose of the File

| File | Purpose |
|---|---|
| `services/rbac.ts` | Static permission matrix and all RBAC enforcement functions |

---

### How It Works

#### 5.1 - Permission Matrix, hasPermission, enforcePermission

**Permission Matrix**

A nested object `permissionMatrix[resource][action]` where each value is a `Set<UserRole>`.

| Resource | Actions defined |
|---|---|
| auth | login, logout, register, password_reset |
| own_profile | view, edit, deactivate |
| appointments | book, view_own, track, view_queue, update_status, cancel |
| services | view, create, edit, archive |
| staff_assignments | assign, remove, view |
| user_accounts | create_staff, create_manager, view_all, archive, manage_clients |
| audit_logs | view, export |

Key rules reflected in the matrix:
- Only CLIENT can register, book, view_own, track, and cancel appointments.
- Only MANAGER can create/edit/archive services and manage staff assignments.
- Only ADMIN can manage user accounts and access audit logs.
- ADMIN has no access to services or appointments by design (intentional separation per spec).

**hasPermission(role, resource, action): boolean**
- Pure lookup: `permissionMatrix[resource]?.[action]?.has(role) ?? false`.
- No database queries, synchronous, fast.
- Returns `false` for any unknown resource or action (safe default).

**ForbiddenError**
- Custom error class extending `Error` with `statusCode = 403` and `name = 'ForbiddenError'`.
- Lets route error handlers distinguish permission denials from other errors and respond with HTTP 403.

**enforcePermission(role, resource, action): void**
- Calls `hasPermission`; throws `ForbiddenError` if it returns false.
- Used in route middleware and service methods to gate access in a single line.

---

#### 5.2 - canAccessService(userId, serviceId): Promise\<boolean\>

Determines whether a user may access a specific service's appointment queue (Requirements 3.1, 6.5).

Flow:
1. Fetches the user's `role`, `is_active`, and `archived_at` from `users`.
2. Returns `false` immediately if user is not found, inactive, or archived.
3. Role-based decision:
   - CLIENT: always `true` (clients can book any active service).
   - ADMIN: always `false` (no access to services by design).
   - STAFF or MANAGER: queries `service_assignments` for an active row matching `(staff_id = userId, service_id = serviceId, is_active = true)`. Returns `true` only if such a row exists.

This means a staff member who has been unassigned (assignment archived) immediately loses queue access without any code changes. The assignment row is the access gate.

---

## Task 7 - Backend: AuditLogger

### File Structure

```
packages/backend/src/
└── services/
    └── audit.ts
```

### Purpose of the File

| File | Purpose |
|---|---|
| `services/audit.ts` | Immutable audit log writer and reader; all system actions, user events, and errors are funnelled through this module |

---

### How It Works

#### 7.1 - logUserAction, logSystemEvent, logError

All three functions insert a single row into `audit_logs`. No update or delete paths exist anywhere in this module — the table is append-only by design.

**logUserAction(userId, action, resource, details?, ipAddress?)**
- Inserts a row with the authenticated actor's `user_id`, the action string, the resource string, an optional `details` JSONB payload, and an optional IP address.
- Used by every route that mutates data (login, logout, booking, status updates, account management, service changes).
- On DB failure, logs the error via Winston but does not throw — audit failures must not break the primary operation.

**logSystemEvent(event, details)**
- Inserts a row with `user_id = null` (no actor) and `resource = 'system'`.
- Used for background jobs, scheduled tasks, and any automated system behaviour that has no human actor.

**logError(error, context)**
- Inserts a row with `action = 'error'` and `resource = 'system'`.
- The `details` JSONB contains `message`, `stack`, and any additional context fields passed in.
- If the DB insert itself fails, falls back to Winston so the error is never silently lost.

---

#### 7.2 - getAuditLogs, exportAuditLogs

**getAuditLogs(filters: AuditFilters): Promise\<AuditLog[]\>**
- Builds a Supabase query ordered by `timestamp DESC`.
- Applies filters incrementally: `userId`, `action`, `resource`, `startDate` (gte), `endDate` (lte). All filters are optional and combinable.
- Maps raw DB rows to typed `AuditLog` objects via `rowToAuditLog`, converting snake_case columns to camelCase and coercing `timestamp` strings to `Date` instances.
- Throws on DB error (unlike the write functions) so callers can surface a proper HTTP 500 to the admin.

**exportAuditLogs(startDate, endDate, format): Promise\<string\>**
- Delegates to `getAuditLogs` with the date range as filters.
- `format = 'json'`: returns a pretty-printed JSON string of the `AuditLog[]` array.
- `format = 'csv'` (default): builds a CSV string with a fixed header row (`id, timestamp, user_id, action, resource, details, ip_address`). Each value is passed through `csvEscape` which wraps in double-quotes and escapes any internal double-quotes — handles JSON in the `details` column safely.
