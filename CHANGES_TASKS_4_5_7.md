# Changes: Tasks 4, 5, and 7

---

## Task 4 — Backend: AuthenticationService

### File

```
packages/backend/src/services/auth.ts
packages/backend/src/services/auth.test.ts
packages/backend/src/services/notification.ts  (stub)
```

### What Was Implemented

**`auth.ts`**

| Subtask | Function(s) | Notes |
|---|---|---|
| 4.1 | `hashPassword`, `authenticate`, `createSession`, `validateSession` | bcrypt (12 rounds), JWT HS256, configurable expiry via `JWT_EXPIRES_IN` |
| 4.2 | `terminateSession`, `registerClient`, `changePassword` | In-memory JWT blocklist; duplicate email check; bcrypt verify before update |
| 4.3 | `sendPasswordResetEmail`, `resetPassword` | `crypto.randomBytes(32)` token; 1-hour expiry; silent no-op on unknown email (prevents enumeration); token invalidated after use |

Key design decisions:
- Token blocklist is in-memory (`Set<string>`). Noted in code as needing Redis/DB backing in production.
- Reset token store is in-memory (`Map`). Same production caveat applies.
- `sendPasswordResetEmail` lazily imports `notification.ts` to avoid circular dependency.
- `registerClient` manually rolls back the `users` row if the `clients` insert fails.

**`notification.ts`** — stub only. Logs via Winston. Full implementation deferred to Task 8.

**`auth.test.ts`**

Covers: `hashPassword` (salted hashes), `createSession`/`validateSession` (valid + tampered token), `terminateSession` (blocklist), `changePassword` (wrong current password, weak new password, success path), `resetPassword` (unknown token).

Uses `vi.mock` to stub Supabase and the notification service.

---

## Task 5 — Backend: RBACController

### File

```
packages/backend/src/services/rbac.ts
```

### What Was Implemented

> Note: `rbac.ts` is currently an empty file on disk. The task was marked complete in the spec but the implementation was not written. The intended implementation based on the design and `IMPLEMENTATION_PLAN.md` is:

**`rbac.ts`** should contain:

- A static `permissions` lookup table mapping `UserRole → resource → string[]` of allowed actions, derived directly from the Permission Matrix in `design.md`
- `hasPermission(role, resource, action): boolean` — pure lookup, no DB call
- `enforcePermission(role, resource, action): void` — calls `hasPermission`, throws a 403-equivalent error on denial
- `canAccessService(userId, serviceId): Promise<boolean>` — queries `service_assignments` for an active row matching the staff/manager; always returns `true` for clients

Admin intentionally has no entry for `appointments` or `services` (per design).

**Status: needs to be written.**

---

## Task 7 — Backend: AuditLogger

### File

```
packages/backend/src/services/audit.ts
```

### What Was Implemented

> Note: `audit.ts` is currently an empty file on disk. The task was marked complete in the spec but the implementation was not written. The intended implementation based on the design is:

**`audit.ts`** should contain:

- `logUserAction(userId, action, resource, details?, ipAddress?)` — inserts a row into `audit_logs`
- `logSystemEvent(event, details)` — inserts with `user_id = null`
- `logError(error, context)` — inserts with `action = 'error'` and stack trace in `details`
- `getAuditLogs(filters: AuditFilters): Promise<AuditLog[]>` — queries `audit_logs` with optional filters (userId, action, resource, date range)
- `exportAuditLogs(startDate, endDate): Promise<string>` — returns CSV or JSON string of logs in the date range

All inserts are append-only. No update or delete paths exist on this table by design.

**Status: needs to be written.**
