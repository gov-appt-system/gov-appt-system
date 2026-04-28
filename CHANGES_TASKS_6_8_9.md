# Changelog — Tasks 6, 8, and 9

## Task 6 — Backend: CalendarService

**File:** `packages/backend/src/services/calendar.ts`

### 6.1 `getAvailableSlots(serviceId, date)`
- Queries the `services` table for duration, capacity, operating hours, and active status.
- Returns an empty array for archived/inactive services or dates outside `days_of_week`.
- Generates time slots from `start_time` to `end_time` in `duration`-minute increments.
- Fetches non-archived appointments for the day and counts bookings per slot.
- Returns a `TimeSlot[]` with `dateTime`, `available`, `capacity`, and `booked` fields.
- Requirement: 2.1

### 6.2 `checkSlotAvailability(serviceId, dateTime)` and `reserveSlot(serviceId, dateTime, duration)`
- `checkSlotAvailability` counts non-archived appointments within the slot window and returns `true` only if `count < capacity`.
- `reserveSlot` attempts an atomic reservation via a Postgres RPC (`reserve_appointment_slot`) that uses `SELECT FOR UPDATE` to prevent double booking.
- Falls back to `checkSlotAvailability` when the RPC is unavailable (dev environments).
- `releaseSlot` is a no-op placeholder; capacity is derived from live appointment counts.
- Requirement: 2.2

### 6.3 `isWithinServiceHours(serviceId, dateTime)`
- Validates the requested `dateTime` against `days_of_week`, `start_time`, and `end_time` from the `services` table.
- Returns `false` for archived/inactive services, wrong day of week, or time outside the operating window.
- Requirement: 3.3

### 6.4 Property tests (`calendar.test.ts`)

**Property 8 — No double booking** (Requirement 2.2)
- Verifies `checkSlotAvailability` returns `false` when `booked count === capacity` (100 runs).
- Verifies it returns `true` when `booked count < capacity` (100 runs).
- Verifies early `false` return for archived and inactive services.

**Property 9 — Outside-hours bookings rejected** (Requirement 3.3)
- Verifies `isWithinServiceHours` returns `false` for dates on non-operating days (100 runs).
- Verifies `false` for times strictly before `start_time` (100 runs).
- Verifies `false` for times at or after `end_time` (100 runs).
- Verifies `true` for times within the operating window (100 runs).

---

## Task 8 — Backend: NotificationService

**File:** `packages/backend/src/services/notification.ts`

### 8.1 `sendBookingConfirmation(appointment, serviceName?)` and `sendStatusUpdate(appointment, oldStatus, serviceName?)`
- Sends HTML emails using Nodemailer with government agency branding (configurable via `AGENCY_NAME` and `AGENCY_LOGO_URL` env vars).
- `sendBookingConfirmation` sends a confirmation with tracking number, service, date/time, and status badge after a successful booking.
- `sendStatusUpdate` sends a status change notification with a human-readable message per status (`confirmed`, `completed`, `cancelled`, `no_show`).
- Both methods call `logEmailFailure` on send errors for retry handling.
- Requirements: 2.5, 3.5, 8.1, 8.2, 8.5

### 8.2 `sendPasswordResetEmail(email, resetLink)`
- Sends a branded HTML email with a reset button and a plain-text fallback link.
- Reset link is valid for 1 hour (enforced by the token in `AuthService`).
- Failures are queued for retry via `logEmailFailure`.
- Requirement: 8.3

### 8.3 `logEmailFailure(to, subject, html, errorMessage)` and `retryFailedEmails()`
- `logEmailFailure` pushes failed sends to an in-memory queue with a unique ID, retry count, and timestamp.
- `retryFailedEmails` iterates the queue, retries each entry, and removes successes or entries that have exceeded `MAX_RETRY_COUNT` (configurable via `EMAIL_MAX_RETRIES` env var, default 3).
- `getFailureQueue()` exposes a read-only snapshot for monitoring and testing.
- Requirement: 8.4

### Transporter
- Uses SendGrid SMTP relay when `SENDGRID_API_KEY` is set.
- Falls back to a local SMTP server (e.g. Mailhog) for development via `SMTP_HOST` / `SMTP_PORT`.

---

## Task 9 — Checkpoint: Backend Services

- All backend unit and property tests were run: `pnpm --filter backend test --run`.
- Tests covering password utilities, auth, RBAC, calendar, and audit services passed.
- Codebase confirmed ready to proceed to REST API implementation (Task 10+).
