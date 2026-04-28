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

### Task 20.3: Build AuditLogsPage — paginated audit log viewer with filters, export button
- **Files created:** `packages/frontend/src/app/pages/AuditLogsPage.tsx`
- **Files modified:** `packages/frontend/src/app/routes.tsx`, `packages/frontend/src/app/components/Sidebar.tsx`
- **Summary:** Built the AuditLogsPage for admin users to view and export system activity logs. Features include: a paginated table (10 entries/page) with Timestamp, User, Action, Resource, Details, and IP Address columns sorted newest-first; 25 mock audit log entries spanning 7 days; filters for user search, action type, resource type, and date range with a Clear Filters button; stat cards for total entries, today's events, and unique users; Export CSV and Export JSON buttons that generate downloadable files from filtered data. Added route at `/admin/audit-logs` under admin-only RoleGuard and "Audit Logs" sidebar item with `Shield` icon.

### Task 20: Frontend — Admin Pages (Parent)
- **Files created:** `AdminAccountsPage.tsx`, `AdminClientsPage.tsx`, `AuditLogsPage.tsx`
- **Files modified:** `routes.tsx`, `Sidebar.tsx`
- **Summary:** Completed all three admin pages: Account Management (staff/manager CRUD with archive), Client Management (view/edit/archive clients), and Audit Logs (paginated viewer with filters and CSV/JSON export). All pages are admin-only, registered in the router and sidebar, and follow consistent patterns using DashboardLayout, shadcn/ui, and mock data.

### Task 12.1: POST /api/services/:id/assignments (Manager only)
- **Files created:** `packages/backend/src/routes/assignments.ts`
- **Files modified:** `packages/backend/src/index.ts`
- **Summary:** Implemented `POST /api/services/:id/assignments` endpoint for managers to assign staff to services. Validates that the service exists and is active, the target user exists with `role = 'staff'` and is active, and no duplicate active assignment exists (returns 409 if already assigned). Creates a `service_assignments` row and logs the action via `AuditLogger`. The route file uses `mergeParams: true` to access the `:id` param from the parent services router.

### Task 12.2: GET /api/services/:id/assignments and DELETE /api/services/:id/assignments/:assignmentId (Manager only)
- **Files modified:** `packages/backend/src/routes/assignments.ts`
- **Summary:** Implemented `GET /api/services/:id/assignments` to list all active assignments for a service with joined staff profile info (name, employee ID, department, email). Implemented `DELETE /api/services/:id/assignments/:assignmentId` for soft-archiving assignments (sets `is_active = false`, `archived_at`, and `archived_by`). Both endpoints are Manager-only and audit-logged.

### Task 12: Backend REST API — Staff Assignment Routes (Parent)
- **Files created:** `packages/backend/src/routes/assignments.ts`
- **Files modified:** `packages/backend/src/index.ts`
- **Summary:** Completed all staff assignment CRUD routes. Created a dedicated assignments router mounted at `/api/services/:id/assignments` with three endpoints: POST (assign staff), GET (list assignments with staff profile details), and DELETE (soft-archive assignment). All routes enforce Manager-only access via `requireRole(UserRole.MANAGER)` and log actions via `AuditLogger`. TypeScript build passes and all 38 existing tests pass.

### Task 13.1: POST /api/appointments (Client only — book appointment)
- **Files created:** `packages/backend/src/routes/appointments.ts`
- **Files modified:** `packages/backend/src/index.ts`
- **Summary:** Implemented `POST /api/appointments` endpoint for clients to book appointments. Validates request body (serviceId, dateTime, duration, personalDetails with required sub-fields), verifies the service exists and is active, checks slot availability via `CalendarService.checkSlotAvailability`, reserves the slot atomically via `CalendarService.reserveSlot`, generates a tracking number via `generateTrackingNumber`, inserts the appointment into the database with status `pending` and `personal_details` as JSONB, sends booking confirmation email (fire-and-forget), and logs the action via `AuditLogger`. Returns 201 with the created appointment including tracking number. Registered the appointments router at `/api/appointments` in the Express app.

### Task 13.2: GET /api/appointments (role-based appointment listing)
- **Files modified:** `packages/backend/src/routes/appointments.ts`
- **Summary:** Implemented `GET /api/appointments` with role-based filtering. Clients see only their own appointments (by `client_id`). Staff and Managers see appointments for their assigned services (via active `service_assignments`). Admin gets 403 per the permission matrix. Supports optional query parameters: `status`, `serviceId`, and `search` (tracking number ilike). Results sorted by `appointment_date_time` descending. Response maps snake_case DB columns to camelCase.

### Task 13.3: GET /api/appointments/:id and GET /api/appointments/track/:trackingNumber
- **Files modified:** `packages/backend/src/routes/appointments.ts`
- **Summary:** Added two routes: `GET /api/appointments/track/:trackingNumber` (Client only — looks up by tracking number, verifies ownership) and `GET /api/appointments/:id` (Client sees own, Staff/Manager sees assigned services, Admin gets 403). Extracted shared `mapAppointmentRow()` helper for snake_case-to-camelCase mapping. The `/track/` route is defined before `/:id` to prevent Express param collision.

### Task 13.4: PUT /api/appointments/:id (Staff/Manager — status update and remarks)
- **Files modified:** `packages/backend/src/routes/appointments.ts`
- **Summary:** Implemented `PUT /api/appointments/:id` for Staff and Manager roles. Enforces status transition rules (`pending→confirmed/cancelled`, `confirmed→completed/cancelled/no_show`, terminal statuses reject updates). Validates service hours via `isWithinServiceHours` before status changes. Soft-archives appointments on terminal statuses (`archived_at = now()`). Sets `processed_by` to the acting user. Sends status update email (fire-and-forget) and logs via `AuditLogger`. Added `VALID_STATUS_TRANSITIONS` map and `TERMINAL_STATUSES` constants.

### Task 13.5: DELETE /api/appointments/:id (Client — soft-cancel pending appointment)
- **Files modified:** `packages/backend/src/routes/appointments.ts`
- **Summary:** Implemented `DELETE /api/appointments/:id` for Client role only. Verifies the appointment belongs to the requesting client and is in `pending` status (returns 400 otherwise). Soft-cancels by setting `status = 'cancelled'`, `archived_at = now()`, and `updated_at = now()`. Logs the cancellation via `AuditLogger`. No records are permanently deleted.

### Task 13: Backend REST API — Appointment Routes (Parent Complete)
- **Files created:** `packages/backend/src/routes/appointments.ts`
- **Files modified:** `packages/backend/src/index.ts`
- **Summary:** Completed all five appointment route subtasks. The appointments router provides: `POST /` (client booking with slot validation, tracking number, email confirmation), `GET /` (role-based listing with filters), `GET /track/:trackingNumber` (client tracking lookup), `GET /:id` (single appointment with access control), `PUT /:id` (staff/manager status updates with transition validation and service hours check), and `DELETE /:id` (client soft-cancel of pending appointments). All routes enforce RBAC, audit-log mutations, and follow the soft-delete pattern. Backend builds cleanly and all 38 tests pass.

### Task 14: Backend REST API — Admin Account Management Routes
- **Files created:** `packages/backend/src/routes/admin.ts`
- **Files modified:** `packages/backend/src/index.ts`
- **Summary:** Implemented all six admin-only API endpoints behind `authenticateToken` + `requireRole(ADMIN)` middleware:
  - **14.1** `POST /api/admin/accounts` — Creates staff or manager accounts with password complexity validation, duplicate email/employeeId checks, inserts into `users` + `staff_profiles`, and audit logs the action.
  - **14.2** `GET /api/admin/accounts` — Lists all staff and manager accounts using the `manager_staff_overview` database view, returning camelCase-mapped results with assigned services.
  - **14.3** `PUT /api/admin/accounts/:id` — Updates staff/manager account info (email, role, name, employeeId, department) with duplicate checks and audit logging.
  - **14.4** `DELETE /api/admin/accounts/:id` — Soft-archives staff/manager accounts (sets `is_active=false`, `archived_at=now()`), also archives their active service assignments, with audit logging.
  - **14.5** `GET /api/admin/clients` — Lists all client accounts with profile info. `PUT /api/admin/clients/:id` — Updates client account and profile fields with duplicate email check and audit logging.
  - **14.6** `GET /api/admin/audit-logs` — Paginated audit log viewer with optional filters (userId, action, resource, startDate, endDate). `GET /api/admin/audit-logs/export` — Exports audit logs as CSV for a date range.
  - Registered the admin router at `/api/admin` in the Express app entry point.
  - Build passes (`tsc`), all 38 existing tests pass.
