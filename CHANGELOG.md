# Changelog

## 2026-04-28

### Task 10.3: JWT Authentication Middleware and Role-Guard Middleware
- **Files created:** `packages/backend/src/middleware/auth.ts`, `packages/backend/src/types/express.d.ts`
- **Summary:** Created `authenticateToken` middleware that extracts JWT from the `Authorization: Bearer` header, validates it via the auth service, and attaches `req.user = { userId, role }` to the request. Created `requireRole(...roles)` middleware factory that checks the user's role against allowed roles and returns 403 if unauthorized. Added Express Request type extension for the `user` property.

### Task 10.1: Auth Routes (register, login, logout, forgot-password, reset-password)
- **Files created:** `packages/backend/src/routes/auth.ts`
- **Files modified:** `packages/backend/src/index.ts`, `packages/backend/package.json`
- **Summary:** Implemented five authentication endpoints: `POST /api/auth/register` (client self-registration with password complexity validation), `POST /api/auth/login` (authentication with audit logging), `POST /api/auth/logout` (session termination), `POST /api/auth/forgot-password` (always returns 200 to prevent user enumeration), and `POST /api/auth/reset-password` (token-based password reset with complexity validation). All mutations are audit-logged with IP address.

### Task 10.2: Profile Routes (view, edit, change-password, deactivate)
- **Files created:** `packages/backend/src/routes/profile.ts`
- **Summary:** Implemented four profile management endpoints behind authentication: `GET /api/profile` (fetches user + role-specific profile from clients/staff_profiles/admin_profiles), `PUT /api/profile` (updates only role-appropriate fields), `POST /api/profile/change-password` (delegates to auth service), and `DELETE /api/profile` (soft-deactivate, clients only via RBAC enforcement). All mutations are audit-logged.

### Task 10: Backend REST API — Authentication and Profile Routes (Parent)
- **Files created:** `packages/backend/src/middleware/auth.ts`, `packages/backend/src/types/express.d.ts`, `packages/backend/src/routes/auth.ts`, `packages/backend/src/routes/profile.ts`
- **Files modified:** `packages/backend/src/index.ts`, `packages/backend/package.json`
- **Summary:** Completed all three subtasks (10.1, 10.2, 10.3). Added CORS middleware (`cors` package), mounted auth and profile routers, and added global error handling middleware to the Express app. TypeScript build passes and all 35 existing tests pass.
