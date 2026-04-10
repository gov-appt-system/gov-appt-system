# Backend Services

## `src/services/auth.ts`
| Function | Description |
|---|---|
| `hashPassword(password)` | bcrypt hash, 12 rounds |
| `authenticate(email, password)` | Verifies credentials, returns JWT |
| `createSession(userId, role)` | Signs JWT (HS256) |
| `validateSession(token)` | Verifies JWT, checks blocklist |
| `terminateSession(token)` | Adds token to in-memory blocklist |
| `registerClient(data)` | Self-registration; inserts users + clients rows; rolls back on failure |
| `changePassword(userId, current, new)` | Verifies current, enforces complexity, updates hash |
| `sendPasswordResetEmail(email)` | Generates token, sends link via NotificationService; silent on unknown email |
| `resetPassword(token, newPassword)` | Validates token expiry, updates hash, invalidates token |

## `src/services/rbac.ts` — `RBACController`
- `hasPermission(role, resource, action)` — static matrix lookup
- `enforcePermission(userId, resource, action)` — DB check + throws 403
- `canAccessService(userId, serviceId)` — clients always true; staff/manager need active `service_assignments` row

Permission matrix resources: `auth`, `own_profile`, `appointments`, `services`, `staff_assignments`, `user_accounts`, `audit_logs`

## `src/services/calendar.ts`
| Function | Description |
|---|---|
| `getAvailableSlots(serviceId, date)` | Returns `TimeSlot[]` with booked counts per slot |
| `checkSlotAvailability(serviceId, dateTime)` | Returns bool — has remaining capacity |
| `reserveSlot(serviceId, dateTime, duration)` | Atomic via `reserve_appointment_slot` RPC; dev fallback |
| `releaseSlot(serviceId, dateTime)` | No-op — capacity derived from live appointment counts |
| `isWithinServiceHours(serviceId, dateTime)` | Validates against `start_time`, `end_time`, `days_of_week` |
| `getServiceHours(serviceId)` | Returns `ServiceHours` config |

## `src/services/notification.ts`
- Transport: SendGrid SMTP relay if `SENDGRID_API_KEY` set; else local SMTP (Mailhog/Ethereal)
- `sendBookingConfirmation(appointment, serviceName?)` — HTML email with tracking number
- `sendStatusUpdate(appointment, oldStatus, serviceName?)` — status change email
- `sendPasswordResetEmail(email, resetLink)` — 1-hour reset link email
- `logEmailFailure(...)` — queues to in-memory `failureQueue`
- `retryFailedEmails()` — retries up to `EMAIL_MAX_RETRIES` (default 3)
- `getFailureQueue()` — read-only snapshot for monitoring
- All emails use `baseTemplate()` with government agency branding (`AGENCY_NAME`, `AGENCY_LOGO_URL`)

## `src/services/audit.ts` — `AuditLogger`
- `logUserAction(userId, action, resource, details?, ipAddress?)` — authenticated actor
- `logSystemEvent(event, details)` — no human actor
- `logError(error, context)` — error with stack trace
- `getAuditLogs(filters)` — filterable by userId, action, resource, date range
- `exportAuditLogs(startDate, endDate)` — returns CSV string
- Failures are logged to Winston but never thrown (audit must not break callers)

## `src/utils/`
- `validatePasswordComplexity(password)` — min 8 chars, uppercase, lowercase, digit
- `generateTrackingNumber()` — format: `APT-YYYYMMDD-XXXXX` (5 alphanumeric chars)
- `validateTrackingNumber(trackingNumber)` — regex: `/^APT-\d{8}-[A-Z0-9]{5}$/`
