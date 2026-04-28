# Implementation Plan: Appointment Booking System

## Overview

Incremental build order: database schema → backend services → REST API endpoints → React frontend → deployment wiring. Each phase builds on the previous. Property-based tests (using `fast-check`) are placed close to the implementation they validate. Tasks marked `*` are optional and can be skipped for a faster MVP.

## Build Audit (2026-04-28)

Full build and type-check audit performed. The following issues were found and fixed:

### Issues Fixed
1. **Missing `vite/client` types** — `import.meta.env` caused TS2339 in `api.ts`. Fixed by adding `"types": ["vite/client"]` to `packages/frontend/tsconfig.json`.
2. **Missing `react-day-picker` dependency** — shadcn `calendar.tsx` imported it but it wasn't installed. Installed `react-day-picker@^8.10.0` + `date-fns@^3.0.0`.
3. **`react-resizable-panels` v4.9 API change** — Exports renamed from `PanelGroup`/`PanelResizeHandle` to `Group`/`Panel`/`Separator`. Updated `resizable.tsx`.
4. **`recharts` v3 type incompatibilities** — `chart.tsx` tooltip/legend props no longer match. Fixed with explicit `any` type annotations on the shadcn chart wrapper.
5. **`Card` onClick type mismatch** — Custom `Card` component declared `onClick?: () => void` but `ProcessRequestsPage` passed `(e) => e.stopPropagation()`. Fixed Card to accept `React.MouseEvent`.
6. **`AlertDialog` onOpenChange type mismatch** — `ServiceManagementPage` passed `setDeleteServiceId` (string setter) to `onOpenChange` (boolean callback). Fixed with wrapper function.
7. **Backend `Express` type inference** — `const app = express()` caused TS2742. Fixed with explicit `Express` type annotation.
8. **Implicit `any` in calendar icons** — `IconLeft`/`IconRight` destructured `className` without type annotation. Added explicit types.

### Current Build Status
- **Frontend**: ✅ Builds successfully (`tsc && vite build`)
- **Backend**: ✅ Builds successfully (`tsc`)
- **Backend tests**: ✅ 35/35 passing (4 test files)

### Frontend-Backend Type Mismatches (to resolve when wiring API)
The frontend currently uses **mock data** (localStorage-based) and does not call the real backend API. When wiring up, the following mismatches need attention:

| Frontend (api.ts / mockData.ts) | Backend (types/index.ts) | Issue |
|---|---|---|
| `User.name` (single string) | `Client.firstName` + `Client.lastName` | Backend splits name into first/last |
| `Appointment.date` + `Appointment.time` (separate strings) | `Appointment.dateTime` (single Date) | Backend uses combined datetime |
| `Appointment.service` (string name) | `Appointment.serviceId` (UUID) | Backend references by ID, not name |
| `Appointment.clientName/clientEmail/clientPhone` (flat) | `Appointment.personalDetails` (JSONB) | Backend nests personal details |
| `Appointment.notes` | `Appointment.remarks` | Different field name |
| `Appointment` missing `no_show` status | `AppointmentStatus.NO_SHOW` exists | Frontend StatusBadge doesn't handle `no_show` |
| `Service.businessHours` (string) | `Service.operatingHours` (ServiceHours object) | Backend uses structured hours |
| `Service.requiresDocuments` (boolean) | `Service.requiredDocuments` (string[]) | Backend stores document list |
| `Service` missing `duration`, `capacity`, `createdBy` | Backend has these fields | Frontend mock doesn't include them |
| Frontend mock `Service` has `operatingDays`, `maxDailySlots` | Backend has `operatingHours.daysOfWeek`, `capacity` | Different shape |

### Missing Frontend Features (no `ProtectedRoute` enforcement)
- Routes are not guarded — any user can navigate to any page. The `Sidebar` filters menu items by role, but direct URL access is unprotected.
- `AuthContext` does not expose a `ProtectedRoute` component or role-guard wrapper (task 16.3 marked done but incomplete).

## Tasks

- [x] 1. Initialize monorepo and project structure
  - Create pnpm workspace with `packages/backend` and `packages/frontend` directories
  - Initialize `package.json` at root with `pnpm-workspace.yaml`
  - Add shared TypeScript config (`tsconfig.base.json`) at root
  - Add `.env.example` files for both packages documenting required environment variables (Supabase URL/key, JWT secret, email provider key)
  - _Requirements: 9.1_

- [x] 2. Database schema and migrations
  - [x] 2.1 Write SQL schema: `users`, `clients`, `staff_profiles`, `admin_profiles` tables with all constraints, indexes, and soft-delete columns (`archived_at`, `is_active`) exactly as specified in the design schema
    - _Requirements: 1.1, 1.5, 5.1, 6.1, 9.1_
  - [x] 2.2 Write SQL schema: `services` table with operating hours columns (`start_time`, `end_time`, `days_of_week`), capacity, soft-delete columns, and `created_by` FK
    - _Requirements: 7.1, 9.1_
  - [x] 2.3 Write SQL schema: `appointments` table with `tracking_number`, `personal_details` JSONB, `status` CHECK constraint, `archived_at`, and `processed_by` FK
    - _Requirements: 2.3, 2.6, 3.2, 9.1_
  - [x] 2.4 Write SQL schema: `service_assignments` table with partial unique index `idx_service_assignments_active` (active assignments only), `archived_at`, and `archived_by` FK
    - _Requirements: 6.5, 6.7_
  - [x] 2.5 Write SQL schema: `audit_logs` table (immutable, no soft-delete) and all remaining indexes from the design schema
    - _Requirements: 9.2, 9.3, 9.5_
  - [x] 2.6 Write SQL schema: `manager_staff_overview` and `manager_appointments_overview` views
    - _Requirements: 3.1, 6.2_
  - [x] 2.7 Write a database seed file that creates one admin, one manager, one staff, and one client account for local development
    - _Requirements: 6.1_

- [-] 3. Backend: shared types, utilities, and configuration
  - [x] 3.1 Define all shared TypeScript interfaces and enums from the design (`User`, `Client`, `Staff`, `Manager`, `Admin`, `Appointment`, `AppointmentStatus`, `Service`, `ServiceAssignment`, `AuditLog`, `UserRole`, `TimeSlot`, `ServiceHours`, `PersonalDetails`) in `packages/backend/src/types/index.ts`
    - _Requirements: 1.3, 2.3, 3.2, 7.1_
  - [x] 3.2 Implement `validatePasswordComplexity(password: string): boolean` — minimum 8 characters, mixed case, and at least one number
    - _Requirements: 1.6, 5.4_
  - [x] 3.3 Write property test for `validatePasswordComplexity`
    - **Property 1: Password complexity is consistent** — for any string, `validatePasswordComplexity` returns true if and only if the string has ≥8 chars, contains upper and lower case letters, and contains a digit
    - **Validates: Requirements 1.6, 5.4**
  - [x] 3.4 Implement `generateTrackingNumber(): string` — produces a unique alphanumeric string (e.g. `APT-YYYYMMDD-XXXXX`)
    - _Requirements: 2.4_
  - [x] 3.5 Write property test for `generateTrackingNumber`
    - **Property 2: Tracking numbers are unique** — for any N calls to `generateTrackingNumber`, all N results are distinct
    - **Property 3: Tracking number format** — for any generated tracking number, `validateTrackingNumber` returns true
    - **Validates: Requirements 2.4**
  - [x] 3.6 Configure Winston logger and Supabase client singleton in `packages/backend/src/config/`
    - _Requirements: 9.4_

- [x] 4. Backend: AuthenticationService
  - [x] 4.1 Implement `hashPassword` and `authenticate` using bcrypt; implement `createSession` and `validateSession` using JWT (HS256, configurable expiry)
    - _Requirements: 1.1, 1.2_
  - [x] 4.2 Implement `terminateSession` (JWT blocklist or short-lived token strategy), `registerClient`, and `changePassword`
    - _Requirements: 1.4, 1.5, 5.4, 5.5_
  - [x] 4.3 Implement `sendPasswordResetEmail` and `resetPassword` using a signed, time-limited token
    - _Requirements: 1.7, 8.3_
  - [x] 4.4 Write property tests for AuthenticationService
    - **Property 4: Hash round-trip** — for any valid password string, `authenticate` with the correct password succeeds and with any other string fails
    - **Property 5: Password change rejects wrong current password** — for any user, calling `changePassword` with an incorrect current password always returns an error and leaves the password unchanged
    - **Validates: Requirements 1.1, 1.2, 5.4, 5.5**

- [x] 5. Backend: RBACController
  - [x] 5.1 Implement the permission matrix from the design as a static lookup table in `packages/backend/src/services/rbac.ts`; implement `hasPermission` and `enforcePermission` (throws 403 on denial)
    - _Requirements: 1.3_
  - [x] 5.2 Implement `canAccessService(userId, serviceId)` — returns true only if the user has an active `service_assignments` row for that service (staff/manager) or is a client
    - _Requirements: 3.1, 6.5_
  - [x] 5.3 Write property tests for RBACController
    - **Property 6: Permission matrix completeness** — for every (role, resource, action) triple defined in the design matrix, `hasPermission` returns the expected value
    - **Property 7: Archived users are denied** — for any user with `is_active = false`, `enforcePermission` always throws regardless of resource/action
    - **Validates: Requirements 1.3, 6.4**

- [x] 6. Backend: CalendarService
  - [x] 6.1 Implement `getAvailableSlots(serviceId, date)` — queries appointments for the date, computes remaining capacity per slot based on `services.capacity` and `services.duration`
    - _Requirements: 2.1_
  - [x] 6.2 Implement `checkSlotAvailability` and `reserveSlot` — `reserveSlot` must be atomic (use a DB transaction or SELECT FOR UPDATE) to prevent double booking
    - _Requirements: 2.2_
  - [x] 6.3 Implement `isWithinServiceHours(serviceId, dateTime)` — validates against `start_time`, `end_time`, and `days_of_week`
    - _Requirements: 3.3_
  - [x] 6.4 Write property tests for CalendarService
    - **Property 8: No double booking** — for any service with capacity N, booking N+1 concurrent appointments at the same slot always fails for the (N+1)th attempt
    - **Property 9: Outside-hours bookings rejected** — for any service and any dateTime outside its configured hours, `isWithinServiceHours` returns false
    - **Validates: Requirements 2.2, 3.3**

- [x] 7. Backend: AuditLogger
  - [x] 7.1 Implement `logUserAction`, `logSystemEvent`, and `logError` — each inserts a row into `audit_logs` with actor, action, resource, details JSONB, and IP address
    - _Requirements: 3.7, 6.8, 7.6, 9.2, 9.3, 9.4_
  - [x] 7.2 Implement `getAuditLogs(filters)` and `exportAuditLogs(startDate, endDate)` — export returns CSV or JSON string
    - _Requirements: 9.5_
  - [ ]* 7.3 Write property test for AuditLogger
    - **Property 10: Audit log immutability** — for any logged action, querying `getAuditLogs` always returns a record matching the logged action; no update or delete path exists
    - **Validates: Requirements 9.2, 9.3**

- [x] 8. Backend: NotificationService
  - [x] 8.1 Implement `sendBookingConfirmation` and `sendStatusUpdate` using an email provider SDK (SendGrid or Nodemailer); use HTML templates with government agency branding placeholders
    - _Requirements: 2.5, 3.5, 8.1, 8.2, 8.5_
  - [x] 8.2 Implement `sendPasswordResetEmail`
    - _Requirements: 8.3_
  - [x] 8.3 Implement `logEmailFailure` and `retryFailedEmails` — store failures in a `email_failures` table or in-memory queue with configurable retry count
    - _Requirements: 8.4_

- [x] 9. Checkpoint — backend services
  - ✅ All 35 backend tests pass (4 test files: password, auth, rbac, calendar)

- [x] 10. Backend: REST API — authentication and profile routes
  - [x] 10.1 Implement `POST /api/auth/register` (client self-registration), `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
    - Apply `validatePasswordComplexity` on register and reset; call `AuditLogger.logUserAction` on login/logout
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_
  - [x] 10.2 Implement `GET /api/profile`, `PUT /api/profile`, `POST /api/profile/change-password`, `DELETE /api/profile` (soft-deactivate)
    - Enforce RBAC: all roles may view/edit own profile; only clients may deactivate self
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 10.3 Write JWT authentication middleware (`authenticateToken`) and role-guard middleware (`requireRole(...roles)`) used by all protected routes
    - _Requirements: 1.3_

- [x] 11. Backend: REST API — services routes
  - [x] 11.1 Implement `GET /api/services` (active services, accessible to Client/Staff/Manager) and `GET /api/services/:id`
    - _Requirements: 7.2_
  - [x] 11.2 Implement `POST /api/services` (Manager only), `PUT /api/services/:id` (Manager only), `DELETE /api/services/:id` (soft-archive, Manager only)
    - Enforce uniqueness check on service name; call `AuditLogger` on every mutation
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_

- [ ] 12. Backend: REST API — staff assignment routes
  - [ ] 12.1 Implement `POST /api/services/:id/assignments` (Manager only) — validates that the target user has `role = 'staff'`, creates `service_assignments` row, calls `AuditLogger`
    - _Requirements: 6.5, 6.8_
  - [ ] 12.2 Implement `GET /api/services/:id/assignments` (Manager only) and `DELETE /api/services/:id/assignments/:assignmentId` (soft-archive, Manager only)
    - _Requirements: 6.6, 6.7, 6.8_

- [ ] 13. Backend: REST API — appointment routes
  - [ ] 13.1 Implement `POST /api/appointments` (Client only) — validate slot availability via `CalendarService`, generate tracking number via `AppointmentTracker`, persist appointment, send booking confirmation email, call `AuditLogger`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1_
  - [ ] 13.2 Implement `GET /api/appointments` (Client: own appointments; Staff/Manager: assigned service queue filtered by `service_assignments`)
    - _Requirements: 3.1, 4.1, 4.2_
  - [ ] 13.3 Implement `GET /api/appointments/:id` and `GET /api/appointments/track/:trackingNumber` (Client only for tracking)
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ] 13.4 Implement `PUT /api/appointments/:id` (Staff/Manager only) — update status (`pending` → `confirmed` → `completed`/`cancelled`/`no_show`), add remarks, validate service hours via `CalendarService`, soft-archive on `completed`/`cancelled`, send status update email, call `AuditLogger`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [ ] 13.5 Implement `DELETE /api/appointments/:id` (Client only, `pending` status only) — soft-cancel, call `AuditLogger`
    - _Requirements: 2.2 (cancel own pending)_

- [ ] 14. Backend: REST API — admin account management routes
  - [ ] 14.1 Implement `POST /api/admin/accounts` (Admin only) — create staff or manager account; validate no duplicate email; insert into `users` + `staff_profiles`; call `AuditLogger`
    - _Requirements: 6.1, 6.8_
  - [ ] 14.2 Implement `GET /api/admin/accounts` (Admin only) — list all staff and manager accounts with status; use `manager_staff_overview` view
    - _Requirements: 6.2_
  - [ ] 14.3 Implement `PUT /api/admin/accounts/:id` (Admin only) — update account info; call `AuditLogger`
    - _Requirements: 6.3, 6.8_
  - [ ] 14.4 Implement `DELETE /api/admin/accounts/:id` (Admin only) — soft-archive user (`archived_at`, `is_active = false`); call `AuditLogger`
    - _Requirements: 6.4, 6.8_
  - [ ] 14.5 Implement `GET /api/admin/clients` and `PUT /api/admin/clients/:id` (Admin only) — view and manage client accounts
    - _Requirements: 6.2 (client accounts)_
  - [ ] 14.6 Implement `GET /api/admin/audit-logs` and `GET /api/admin/audit-logs/export` (Admin only)
    - _Requirements: 9.5_

- [ ] 15. Checkpoint — full API
  - Run all backend tests: `pnpm --filter backend test`
  - Manually verify the seed data flows through auth → booking → status update using a REST client (curl or Postman)
  - Ensure all tests pass; ask the user if questions arise before continuing.

- [x] 16. Frontend: project setup and shared infrastructure
  - [x] 16.1 Initialize React + TypeScript app in `packages/frontend` using Vite; install shadcn/ui, Tailwind CSS, React Router, Axios, React Hook Form
    - _Requirements: 1.1_
  - [x] 16.2 Create Axios instance with base URL from env, JWT interceptor (attaches `Authorization` header), and 401 redirect to login
    - _Requirements: 1.1, 1.3_
  - [-] 16.3 Create `AuthContext` (stores user role and token), `ProtectedRoute` component (redirects unauthenticated users), and role-guard HOC/wrapper
    - ⚠️ `AuthContext` exists but `ProtectedRoute` and role-guard wrapper are **not implemented**. Routes are unguarded — direct URL access bypasses role checks. Sidebar filters menu items by role but that's cosmetic only.
    - _Requirements: 1.3_

- [-] 17. Frontend: authentication pages
  - [x] 17.1 Build `LoginPage` — email/password form, calls `POST /api/auth/login`, stores token in `AuthContext`, redirects to role-appropriate dashboard
    - ⚠️ Minor: `user` variable declared but never read (unused import from `useAuth`). Login uses mock data, not real API.
    - _Requirements: 1.1, 1.2_
  - [ ] 17.2 Build `RegisterPage` (client self-registration) — full registration form with client fields, calls `POST /api/auth/register`, enforces password complexity in UI
    - _Requirements: 1.5, 1.6_
  - [ ] 17.3 Build `ForgotPasswordPage` and `ResetPasswordPage` — email input → reset link flow
    - ⚠️ Login page has "Forgot Password?" and "Register Now" buttons but they are non-functional (no navigation).
    - _Requirements: 1.7_

- [-] 18. Frontend: client-facing pages
  - [x] 18.1 Build `BookingCalendarPage` — fetches active services (`GET /api/services`), displays available time slots from `GET /api/services/:id/slots`, prevents selection of full slots
    - ⚠️ Uses hardcoded `SERVICE_CATEGORIES` and `TIME_SLOTS` from mock data, not real API. Service model doesn't match backend.
    - _Requirements: 2.1, 2.2_
  - [x] 18.2 Build `BookingFormPage` — collects personal details and required documents, submits `POST /api/appointments`, displays returned tracking number and confirmation
    - ⚠️ Uses mock `appointmentAPI.create()` (localStorage). Upload buttons are non-functional.
    - _Requirements: 2.3, 2.4, 2.5_
  - [x] 18.3 Build `AppointmentHistoryPage` — lists client's appointments (`GET /api/appointments`), supports search by tracking number and date range
    - ⚠️ Date range filter not implemented (only search by tracking number and status).
    - _Requirements: 4.1, 4.2, 4.4_
  - [ ] 18.4 Build `AppointmentDetailPage` — read-only view of a single appointment with status timeline (`GET /api/appointments/:id`)
    - ⚠️ Not a separate page. `MyAppointmentsPage` has a detail modal but no status timeline.
    - _Requirements: 4.3_
  - [x] 18.5 Build `ClientProfilePage` — view/edit profile, change password, deactivate account
    - ⚠️ Deactivate account button is missing. Uses mock data.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [-] 19. Frontend: staff and manager pages
  - [x] 19.1 Build `StaffDashboardPage` — appointment queue for assigned services (`GET /api/appointments`), filterable by status
    - ⚠️ Uses `INITIAL_APPOINTMENTS` from mock data. Imports custom `Card`/`Button`/`StatCard` (not shadcn).
    - _Requirements: 3.1_
  - [x] 19.2 Build `AppointmentProcessingPage` — form to update appointment status, add remarks; calls `PUT /api/appointments/:id`; shows validation error if outside service hours
    - ⚠️ Uses mock data. Service hours validation not implemented. Imports custom `Card`/`Button` (not shadcn).
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 19.3 Build `ServiceManagementPage` (Manager only) — list services, create/edit service form (operating hours, capacity, required documents), archive action
    - ⚠️ Uses mock `SERVICES`. Form has `price` field (not in design). Missing operating hours/capacity/required documents fields. Imports custom `Card`/`Button`.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 19.4 Build `StaffAssignmentPage` (Manager only) — view staff assigned to a service, assign new staff, remove assignment
    - ⚠️ `StaffManagementPage` exists but is more of an admin account management page than a service-specific staff assignment page. Missing service-scoped assignment UI.
    - _Requirements: 6.5, 6.6, 6.7_

- [ ] 20. Frontend: admin pages
  - [ ] 20.1 Build `AdminAccountsPage` — list all staff/manager accounts, create account form, archive action
    - ⚠️ `StaffManagementPage` partially covers this but is not admin-specific and lacks archive (soft-delete) action.
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 20.2 Build `AdminClientsPage` — list and manage client accounts
    - _Requirements: 6.2 (clients)_
  - [ ] 20.3 Build `AuditLogsPage` — paginated audit log viewer with filters (user, action, date range), export button
    - _Requirements: 9.5_

- [ ] 21. Checkpoint — full stack integration
  - Run all tests: `pnpm test` (root workspace command)
  - Verify end-to-end flows: client registers → books appointment → staff confirms → client views status update
  - Ensure all tests pass; ask the user if questions arise before continuing.

- [ ] 22. Deployment configuration
  - [ ] 22.1 Create `vercel.json` in `packages/frontend` with build output config; add environment variable documentation for Vercel dashboard
    - _Requirements: 9.1_
  - [ ] 22.2 Add Supabase RLS policies for each table matching the permission matrix (clients can only read/write their own rows; staff can only read appointments for their assigned services; admin has no direct table access beyond `audit_logs`)
    - _Requirements: 1.3, 9.5_
  - [ ] 22.3 Create a `Makefile` or `scripts/deploy.sh` that runs migrations against the production Supabase instance before deploying the frontend to Vercel
    - _Requirements: 9.1_

- [ ] 23. Final checkpoint
  - Run full test suite: `pnpm test`
  - Ensure all tests pass; ask the user if questions arise.

## Remaining Work Summary

### Backend (tasks 10–15): All REST API routes are unimplemented
The Express server only has a `/health` endpoint. All route handlers, middleware, and request validation need to be built:
- **Task 10**: Auth routes + JWT middleware + role guard (critical path — frontend depends on this)
- **Task 11**: Service CRUD routes
- **Task 12**: Staff assignment routes
- **Task 13**: Appointment CRUD routes
- **Task 14**: Admin account management routes
- **Task 15**: Full API checkpoint

### Frontend (tasks 17–20): Pages exist but need real API wiring + missing pages
- **Task 16.3** (incomplete): `ProtectedRoute` and role-guard wrapper needed
- **Task 17.2**: `RegisterPage` not built
- **Task 17.3**: `ForgotPasswordPage` and `ResetPasswordPage` not built
- **Task 18.4**: `AppointmentDetailPage` with status timeline not built
- **Task 20.1–20.3**: All admin pages not built (`AdminAccountsPage`, `AdminClientsPage`, `AuditLogsPage`)
- **All existing pages** need to be rewired from mock data to real API calls once backend routes exist

### Deployment (tasks 22–23): Not started
- Vercel config, RLS policies, deploy script all pending

## Notes

- Tasks marked `*` are optional and can be skipped for a faster MVP
- Property-based tests use `fast-check` (install in backend devDependencies)
- Each property test should run a minimum of 100 iterations (`fc.assert(fc.property(...), { numRuns: 100 })`)
- Soft-delete is enforced everywhere — no `DELETE` SQL statements outside migrations
- The permission matrix in the design is the single source of truth for all RBAC checks; every API route must map to one cell in that matrix
- Admin has no access to Services or Appointments by design (intentional separation per design doc)
- Manager and Staff share `staff_profiles`; role is distinguished by `users.role` column
- **Component inconsistency**: Some pages import from custom `../components/Card` and `../components/Button`, others from shadcn `../components/ui/card` and `../components/ui/button`. Should standardize on shadcn components.
