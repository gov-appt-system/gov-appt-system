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

### Task 11.1: GET /api/services and GET /api/services/:id
- **Files created:** `packages/backend/src/routes/services.ts`
- **Summary:** Implemented `GET /api/services` (returns all active, non-archived services) and `GET /api/services/:id` (returns a single active service by ID, 404 if not found). Both routes require authentication and are accessible to Client, Staff, and Manager roles. DB rows are mapped from snake_case to camelCase with `start_time`/`end_time`/`days_of_week` nested under `operatingHours`.

### Task 11.2: POST /api/services, PUT /api/services/:id, DELETE /api/services/:id
- **Files modified:** `packages/backend/src/routes/services.ts`
- **Summary:** Implemented three Manager-only mutation routes: `POST /api/services` (creates a service with case-insensitive name uniqueness check, returns 409 on duplicate), `PUT /api/services/:id` (partial update with name uniqueness check when name changes), and `DELETE /api/services/:id` (soft-archive: sets `is_active = false` and `archived_at = now()`). All mutations call `AuditLogger.logUserAction` with service details.

### Task 11: Backend REST API — Services Routes (Parent)
- **Files created:** `packages/backend/src/routes/services.ts`
- **Files modified:** `packages/backend/src/index.ts`
- **Summary:** Completed all services CRUD routes. Registered the services router at `/api/services` in the Express app. TypeScript build passes and all 35 existing tests pass.

### Task 3.5: Write property test for `generateTrackingNumber`
- **Files created:** `packages/backend/src/utils/tracking.test.ts`
- **Summary:** Added three property-based tests using fast-check for the tracking number utilities. Property 2 verifies that N generated tracking numbers are all distinct (uniqueness). Property 3 verifies that every generated tracking number passes `validateTrackingNumber` format validation. An additional structural test confirms `validateTrackingNumber` rejects arbitrary strings that don't match the `APT-YYYYMMDD-XXXXX` format. All 38 backend tests pass (5 test files).

### Task 16.3: AuthContext, ProtectedRoute, and RoleGuard
- **Files modified:** `packages/frontend/src/app/context/AuthContext.tsx`, `packages/frontend/src/app/routes.tsx`, `packages/frontend/src/app/pages/LoginPage.tsx`, `packages/frontend/src/app/components/index.ts`
- **Files created:** `packages/frontend/src/app/components/ProtectedRoute.tsx`, `packages/frontend/src/app/components/RoleGuard.tsx`
- **Summary:** Enhanced `AuthContext` with `role`, `hasRole()` helper, and an initialisation guard that prevents a flash of the login page for already-authenticated users. Created `ProtectedRoute` component that redirects unauthenticated users to `/login` while preserving the original URL in router state. Created `RoleGuard` component that restricts child routes to specified roles and redirects unauthorized users to their role-appropriate dashboard. Updated `routes.tsx` to wrap all protected routes with `ProtectedRoute` and nest role-specific routes under `RoleGuard`. Updated `LoginPage` to redirect back to the originally-requested URL after login.

### Task 17.2: Build RegisterPage (client self-registration)
- **Files created:** `packages/frontend/src/app/pages/RegisterPage.tsx`
- **Files modified:** `packages/frontend/src/app/services/api.ts` (added `RegisterData` interface, `register` mock method)
- **Summary:** Built a full client self-registration page with fields for first name, last name, email, phone, address, date of birth, and government ID. Enforces password complexity in the UI with real-time strength indicators (min 8 chars, uppercase, lowercase, number) matching the backend `validatePasswordComplexity` rules. Includes show/hide password toggles, confirm password validation, and Philippine mobile number format validation. Calls `authAPI.register()` (mock) and redirects to login on success.

### Task 17.3: Build ForgotPasswordPage and ResetPasswordPage
- **Files created:** `packages/frontend/src/app/pages/ForgotPasswordPage.tsx`, `packages/frontend/src/app/pages/ResetPasswordPage.tsx`
- **Files modified:** `packages/frontend/src/app/services/api.ts` (added `forgotPassword` and `resetPassword` mock methods), `packages/frontend/src/app/routes.tsx` (added `/register`, `/forgot-password`, `/reset-password` routes), `packages/frontend/src/app/pages/LoginPage.tsx` (replaced non-functional buttons with `Link` components for navigation)
- **Summary:** Built the forgot-password flow: `ForgotPasswordPage` accepts an email and shows a success message (never reveals whether the email exists to prevent enumeration). `ResetPasswordPage` reads a `?token=` query param, validates it, and presents a new-password form with real-time complexity indicators matching backend rules. Handles invalid/missing token and success states with dedicated UI. Fixed LoginPage "Forgot Password?" and "Register Now" buttons to navigate to the new routes.

### Task 17: Frontend Authentication Pages (Parent — complete)
- **Files created:** `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
- **Files modified:** `api.ts`, `routes.tsx`, `LoginPage.tsx`
- **Summary:** All three authentication page subtasks are complete. The frontend now has a full auth flow: Login → Register (client self-registration with password complexity), Forgot Password (email input with anti-enumeration), and Reset Password (token-based with complexity validation). All pages follow the existing design system (shadcn/ui, gov branding CSS vars, React Hook Form, sonner toasts). Build passes cleanly.

### Task 18.4: Build AppointmentDetailPage — read-only view with status timeline
- **Files created:** `packages/frontend/src/app/pages/AppointmentDetailPage.tsx`
- **Files modified:** `packages/frontend/src/app/routes.tsx`, `packages/frontend/src/app/services/api.ts`, `packages/frontend/src/app/components/StatusBadge.tsx`, `packages/frontend/src/app/pages/MyAppointmentsPage.tsx`
- **Summary:** Created a dedicated `AppointmentDetailPage` at route `/appointments/:id` with a visual status timeline showing appointment lifecycle progression (pending → confirmed → completed, with branching for cancelled/no_show). The page displays all appointment details (tracking number, service, date/time, personal details, remarks) using shadcn/ui components. Added `appointmentAPI.getById()` to the mock API layer. Updated `StatusBadge` to handle `no_show` status. Updated `MyAppointmentsPage` to navigate to the detail page instead of opening an inline modal. Route is protected by `ProtectedRoute` + `RoleGuard` (client-only).

### Task 18: Frontend — Client-Facing Pages (Parent Complete)
- **Summary:** All client-facing pages are now complete: BookingCalendarPage (18.1), BookingFormPage (18.2), AppointmentHistoryPage (18.3), AppointmentDetailPage with status timeline (18.4), and ClientProfilePage (18.5). Pages currently use mock data (localStorage-based) and will be wired to the real backend API once the REST routes are available.

### Task 20.1: Build AdminAccountsPage — list all staff/manager accounts, create account form, archive action
- **Files created:** `packages/frontend/src/app/pages/AdminAccountsPage.tsx`
- **Files modified:** `packages/frontend/src/app/routes.tsx`, `packages/frontend/src/app/components/Sidebar.tsx`
- **Summary:** Built the AdminAccountsPage for admin users to manage staff and manager accounts. Features include: a table listing all accounts with Name, Employee ID, Role, Department, Email, and Status columns; stat cards for total/active/archived counts; search by name or email; filters by role and status; a Create Account dialog with full validation and duplicate email prevention; an Edit Account dialog; and an Archive action with confirmation dialog that soft-deletes accounts (sets `isActive: false` and `archivedAt`). Added route at `/admin/accounts` under admin-only RoleGuard and "Account Management" sidebar item with `UserCog` icon.

### Task 20.2: Build AdminClientsPage — list and manage client accounts
- **Files created:** `packages/frontend/src/app/pages/AdminClientsPage.tsx`
- **Files modified:** `packages/frontend/src/app/routes.tsx`, `packages/frontend/src/app/components/Sidebar.tsx`
- **Summary:** Built the AdminClientsPage for admin users to view and manage client accounts. Features include: a table listing all clients with Name, Email, Phone, Government ID, Date of Birth, and Status columns; stat cards for total/active/archived counts; search by name, email, or government ID; status filter; a View Client Details dialog (read-only); an Edit Client dialog for updating name, phone, and address; and an Archive action with confirmation dialog that soft-deactivates accounts. Added route at `/admin/clients` under admin-only RoleGuard and "Client Management" sidebar item with `UserCheck` icon.
