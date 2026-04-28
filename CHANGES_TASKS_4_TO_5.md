# Changes: Tasks 4 - 5

---

## Task 4 - Backend: AuthenticationService

### File Structure

```
packages/backend/src/
├── services/
│   ├── auth.ts
│   ├── auth.test.ts
│   └── notification.ts
```

### Purpose of Each File

| File | Purpose |
|---|---|
| `services/auth.ts` | Full AuthenticationService: password hashing, login, JWT sessions, logout, client registration, password change, and password reset |
| `services/auth.test.ts` | Unit tests for core auth functions: hash round-trip, JWT creation/validation, session termination, and password change guards |
| `services/notification.ts` | Stub for NotificationService (full impl is Task 8); imported lazily by auth.ts to send reset link emails |

---

### How It Works

#### 4.1 - hashPassword, authenticate, createSession, validateSession

**hashPassword(password)**
Wraps bcrypt.hash with 12 salt rounds. High enough to resist brute force, low enough to not bottleneck login.

**authenticate(email, password)**
- Queries users table for the email (lowercased and trimmed).
- Rejects if user is not found, inactive (is_active = false), or archived (archived_at is set).
- Uses bcrypt.compare to verify the password against the stored hash.
- On success, calls createSession and returns an AuthResult with the signed JWT.
- Returns a generic "Invalid credentials" for both not-found and wrong-password cases to prevent user enumeration.

**createSession(userId, role)**
- Signs a JWT using HS256 with JWT_SECRET and JWT_EXPIRES_IN from env (defaults: dev-secret, 8h).
- Payload contains sub (user ID) and role.

**validateSession(token)**
- Checks the in-memory blocklist first. If the token is there, returns isValid: false immediately.
- Calls jwt.verify with HS256 explicitly specified.
- Any failure (expired, tampered, malformed) returns isValid: false.

---

#### 4.2 - terminateSession, registerClient, changePassword

**terminateSession(token)**
- Adds the token to a Set (the blocklist).
- Subsequent validateSession calls with that token are rejected before JWT verification runs.
- In-memory only; production should back this with Redis or a DB table.

**registerClient(data)**
- Validates password complexity via validatePasswordComplexity, throws if it fails.
- Lowercases and trims the email, checks for an existing users row, throws on duplicate.
- Inserts into users (role = client) then into clients (profile row).
- If the clients insert fails, rolls back the users row to keep data consistent.
- Returns { id, email, role } on success.

**changePassword(userId, currentPassword, newPassword)**
- Fetches current password_hash from users.
- Uses bcrypt.compare to verify currentPassword, throws "Current password is incorrect" on mismatch (Req 5.5).
- Validates newPassword complexity, throws if it fails (Req 5.4).
- Updates password_hash and updated_at in users.

---

#### 4.3 - sendPasswordResetEmail, resetPassword

**sendPasswordResetEmail(email)**
- Looks up user by email. Returns silently if not found or inactive (prevents enumeration).
- Generates a 32-byte cryptographically random hex token via crypto.randomBytes.
- Stores { userId, expiresAt } in an in-memory Map keyed by the token. Expiry is 1 hour.
- Builds a reset link (FRONTEND_URL/reset-password?token=...) and delegates to NotificationService.
- The notification import is done lazily (await import('./notification')) to avoid circular dependencies.

**resetPassword(token, newPassword)**
- Looks up the token in the store, throws "Invalid or expired reset token" if not found.
- Checks expiresAt against Date.now(), throws "Reset token has expired" and removes the entry if stale.
- Validates newPassword complexity.
- Updates password_hash in users.
- Deletes the token from the store after use (one-time use only).

---

#### 4.4 - Unit Tests (auth.test.ts)

Written with Vitest. Supabase and the notification service are mocked so tests run without a live database.

| Test | What it verifies |
|---|---|
| hashPassword round-trip | bcrypt.compare returns true for the original password |
| hashPassword salted | Two hashes of the same password are different strings |
| createSession / validateSession valid | Returns isValid: true with correct userId and role |
| createSession / validateSession tampered | Appending chars to a token returns isValid: false |
| terminateSession | After termination, validateSession returns isValid: false |
| changePassword wrong current | Throws "Current password is incorrect" |
| changePassword weak new password | Throws complexity error |
| changePassword success | Resolves without error |
| resetPassword unknown token | Throws "Invalid or expired reset token" |

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
| `services/rbac.ts` | Static permission matrix and all RBAC enforcement functions; single source of truth for what each role can do |

---

### How It Works

#### 5.1 - Permission Matrix, hasPermission, enforcePermission

**Permission Matrix**

A nested object permissionMatrix[resource][action] where each value is a Set of allowed UserRoles. Mirrors the design document table exactly.

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
- Pure lookup: permissionMatrix[resource]?.[action]?.has(role) ?? false.
- No database queries, synchronous, fast.
- Returns false for any unknown resource or action (safe default).

**ForbiddenError**
- Custom error class extending Error with statusCode = 403 and name = 'ForbiddenError'.
- Lets route error handlers distinguish permission denials from other errors and respond with HTTP 403.

**enforcePermission(role, resource, action): void**
- Calls hasPermission; throws ForbiddenError if it returns false.
- Used in route middleware and service methods to gate access in a single line.

---

#### 5.2 - canAccessService(userId, serviceId): Promise<boolean>

Determines whether a user may access a specific service's appointment queue (Req 3.1, 6.5).

Flow:
1. Fetches the user's role, is_active, and archived_at from users.
2. Returns false immediately if user is not found, inactive, or archived.
3. Role-based decision:
   - CLIENT: always true (clients can book any active service).
   - ADMIN: always false (no access to services by design).
   - STAFF or MANAGER: queries service_assignments for an active row matching (staff_id = userId, service_id = serviceId, is_active = true). Returns true only if such a row exists.

This means a staff member who has been unassigned (assignment archived) immediately loses queue access without any code changes. The assignment row is the access gate.

---

### Notification Stub (notification.ts)

Created as part of Task 4 to unblock the password reset flow. Three exported async functions:
- sendPasswordResetEmail(email, resetLink)
- sendBookingConfirmation(appointment)
- sendStatusUpdate(appointment, oldStatus)

All currently log via Winston and return. Full implementation is deferred to Task 8.
