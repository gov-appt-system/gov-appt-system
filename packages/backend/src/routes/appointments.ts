import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { supabase } from '../config/supabase';
import { AuditLogger } from '../services/audit';
import { authenticateToken, requireRole } from '../middleware/auth';
import { checkSlotAvailability, reserveSlot, isWithinServiceHours } from '../services/calendar';
import { sendBookingConfirmation, sendStatusUpdate } from '../services/notification';
import { generateTrackingNumber } from '../utils/tracking';
import { UserRole, AppointmentStatus } from '../types';
import { logger } from '../config/logger';

const router: RouterType = Router();

// All appointment routes require authentication
router.use(authenticateToken);

/**
 * POST /api/appointments — Book a new appointment.
 * Client only.
 *
 * Body:
 *   serviceId: string (UUID)
 *   dateTime: string (ISO 8601)
 *   duration: number (minutes)
 *   personalDetails: { firstName, lastName, phoneNumber, email, address, dateOfBirth, governmentId, emergencyContact? }
 *   requiredDocuments?: string[]
 *   remarks?: string
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1
 */
router.post(
  '/',
  requireRole(UserRole.CLIENT),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const clientId = req.user!.userId;
      const {
        serviceId,
        dateTime,
        duration,
        personalDetails,
        requiredDocuments,
        remarks,
      } = req.body;

      // ── Validate required fields ──────────────────────────────
      if (!serviceId || !dateTime || !duration || !personalDetails) {
        res.status(400).json({
          error: 'Required fields: serviceId, dateTime, duration, personalDetails',
        });
        return;
      }

      // Validate personalDetails required sub-fields
      const requiredPersonalFields = [
        'firstName',
        'lastName',
        'phoneNumber',
        'email',
        'address',
        'dateOfBirth',
        'governmentId',
      ];
      const missingFields = requiredPersonalFields.filter(
        (f) => !personalDetails[f],
      );
      if (missingFields.length > 0) {
        res.status(400).json({
          error: `Missing required personal details: ${missingFields.join(', ')}`,
        });
        return;
      }

      // Validate dateTime is a valid date
      const appointmentDateTime = new Date(dateTime);
      if (isNaN(appointmentDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid dateTime format' });
        return;
      }

      // Validate duration is a positive number
      if (typeof duration !== 'number' || duration <= 0) {
        res.status(400).json({ error: 'Duration must be a positive number (minutes)' });
        return;
      }

      // ── Verify the service exists and is active ───────────────
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id, name, is_active, archived_at')
        .eq('id', serviceId)
        .eq('is_active', true)
        .is('archived_at', null)
        .single();

      if (serviceError || !service) {
        res.status(404).json({ error: 'Service not found or inactive' });
        return;
      }

      // ── Check slot availability (Requirement 2.1, 2.2) ───────
      const isAvailable = await checkSlotAvailability(serviceId, appointmentDateTime);
      if (!isAvailable) {
        res.status(409).json({ error: 'The requested time slot is no longer available' });
        return;
      }

      // ── Reserve the slot atomically (Requirement 2.2) ─────────
      const reserved = await reserveSlot(serviceId, appointmentDateTime, duration);
      if (!reserved) {
        res.status(409).json({ error: 'Failed to reserve the time slot — it may have been taken' });
        return;
      }

      // ── Generate tracking number (Requirement 2.4) ────────────
      const trackingNumber = generateTrackingNumber();

      // ── Persist the appointment (Requirement 2.3, 2.6, 9.1) ──
      const { data: appointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          tracking_number: trackingNumber,
          client_id: clientId,
          service_id: serviceId,
          appointment_date_time: appointmentDateTime.toISOString(),
          duration,
          status: AppointmentStatus.PENDING,
          personal_details: personalDetails,
          required_documents: requiredDocuments ?? [],
          remarks: remarks ?? null,
        })
        .select('*')
        .single();

      if (insertError || !appointment) {
        logger.error('POST /api/appointments: insert failed', {
          error: insertError?.message,
        });
        res.status(500).json({ error: 'Failed to create appointment' });
        return;
      }

      // ── Send booking confirmation email (Requirement 2.5) ─────
      // Fire-and-forget: email failures are logged but do not block the response
      const appointmentForEmail = {
        id: appointment.id as string,
        trackingNumber,
        clientId,
        serviceId,
        dateTime: appointmentDateTime,
        duration,
        status: AppointmentStatus.PENDING,
        personalDetails,
        requiredDocuments: requiredDocuments ?? [],
        remarks: remarks ?? undefined,
        archivedAt: null,
        createdAt: new Date(appointment.created_at as string),
        updatedAt: new Date(appointment.updated_at as string),
      };

      sendBookingConfirmation(appointmentForEmail, service.name as string).catch(
        (err) => {
          logger.error('POST /api/appointments: email send failed', {
            error: (err as Error).message,
            trackingNumber,
          });
        },
      );

      // ── Audit log (Requirement 9.1) ───────────────────────────
      await AuditLogger.logUserAction(
        clientId,
        'book_appointment',
        'appointments',
        {
          appointmentId: appointment.id,
          trackingNumber,
          serviceId,
          serviceName: service.name,
          dateTime: appointmentDateTime.toISOString(),
        },
        req.ip,
      );

      // ── Return the created appointment ────────────────────────
      res.status(201).json({
        id: appointment.id,
        trackingNumber,
        clientId,
        serviceId,
        dateTime: appointment.appointment_date_time,
        duration: appointment.duration,
        status: appointment.status,
        personalDetails: appointment.personal_details,
        requiredDocuments: appointment.required_documents,
        remarks: appointment.remarks,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at,
      });
    } catch (err) {
      const error = err as Error;
      logger.error('POST /api/appointments failed', { error: error.message });
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  },
);

/**
 * GET /api/appointments — List appointments.
 *
 * - Client: returns only the client's own appointments (filter by client_id)
 * - Staff: returns appointments for services the staff member is assigned to
 *          (via active service_assignments)
 * - Manager: same as Staff — appointments for assigned services
 * - Admin: 403 (Admin has no access to Appointments per the permission matrix)
 *
 * Optional query parameters:
 *   status     — filter by appointment status
 *   serviceId  — filter by specific service
 *   search     — search by tracking number
 *
 * Results are sorted by appointment_date_time descending (newest first).
 *
 * Requirements: 3.1, 4.1, 4.2
 */
router.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      // ── Admin has no access to Appointments ───────────────────
      if (role === UserRole.ADMIN) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      // ── Extract optional query filters ────────────────────────
      const statusFilter = req.query.status as string | undefined;
      const serviceIdFilter = req.query.serviceId as string | undefined;
      const searchFilter = req.query.search as string | undefined;

      // ── Build the base query ──────────────────────────────────
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date_time', { ascending: false });

      // ── Role-based filtering ──────────────────────────────────
      if (role === UserRole.CLIENT) {
        // Clients see only their own appointments (Requirement 4.1, 4.2)
        query = query.eq('client_id', userId);
      } else if (role === UserRole.STAFF || role === UserRole.MANAGER) {
        // Staff/Manager see appointments for their assigned services (Requirement 3.1)
        const { data: assignments, error: assignError } = await supabase
          .from('service_assignments')
          .select('service_id')
          .eq('staff_id', userId)
          .eq('is_active', true);

        if (assignError) {
          logger.error('GET /api/appointments: failed to fetch service assignments', {
            error: assignError.message,
            userId,
          });
          res.status(500).json({ error: 'Failed to fetch appointments' });
          return;
        }

        const assignedServiceIds = (assignments ?? []).map(
          (a: { service_id: string }) => a.service_id,
        );

        if (assignedServiceIds.length === 0) {
          // No assigned services — return empty list
          res.json([]);
          return;
        }

        query = query.in('service_id', assignedServiceIds);
      }

      // ── Apply optional filters ────────────────────────────────
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (serviceIdFilter) {
        query = query.eq('service_id', serviceIdFilter);
      }

      if (searchFilter) {
        query = query.ilike('tracking_number', `%${searchFilter}%`);
      }

      // ── Execute query ─────────────────────────────────────────
      const { data: appointments, error: fetchError } = await query;

      if (fetchError) {
        logger.error('GET /api/appointments: query failed', {
          error: fetchError.message,
          userId,
        });
        res.status(500).json({ error: 'Failed to fetch appointments' });
        return;
      }

      // ── Map snake_case DB columns to camelCase response ───────
      const mapped = (appointments ?? []).map((row: Record<string, unknown>) =>
        mapAppointmentRow(row),
      );

      res.json(mapped);
    } catch (err) {
      const error = err as Error;
      logger.error('GET /api/appointments failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },
);

/**
 * Helper: map a raw snake_case appointment DB row to a camelCase response object.
 */
function mapAppointmentRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    clientId: row.client_id,
    serviceId: row.service_id,
    dateTime: row.appointment_date_time,
    duration: row.duration,
    status: row.status,
    personalDetails: row.personal_details,
    requiredDocuments: row.required_documents,
    remarks: row.remarks,
    processedBy: row.processed_by,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/appointments/track/:trackingNumber — Look up appointment by tracking number.
 * Client only.
 *
 * - Finds the appointment by its tracking_number column
 * - Verifies the appointment belongs to the requesting client (client_id = req.user.userId)
 * - Returns 404 if not found or doesn't belong to the client
 *
 * IMPORTANT: This route MUST be defined BEFORE /:id to prevent Express
 * from matching "track" as an :id parameter.
 *
 * Requirements: 4.1, 4.4
 */
router.get(
  '/track/:trackingNumber',
  requireRole(UserRole.CLIENT),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { trackingNumber } = req.params;

      // ── Look up appointment by tracking number ────────────────
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

      if (fetchError) {
        logger.error('GET /api/appointments/track/:trackingNumber: query failed', {
          error: fetchError.message,
          trackingNumber,
        });
        res.status(500).json({ error: 'Failed to fetch appointment' });
        return;
      }

      // ── Not found or doesn't belong to this client ────────────
      if (!appointment || appointment.client_id !== userId) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      res.json(mapAppointmentRow(appointment as Record<string, unknown>));
    } catch (err) {
      const error = err as Error;
      logger.error('GET /api/appointments/track/:trackingNumber failed', {
        error: error.message,
      });
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  },
);

/**
 * GET /api/appointments/:id — Get a single appointment by ID.
 *
 * - Client: can only view their own appointment (client_id = req.user.userId)
 * - Staff/Manager: can only view appointments for their assigned services
 *   (checked via service_assignments)
 * - Admin: 403 (Admin has no access to Appointments per the permission matrix)
 * - Returns 404 if appointment not found or user doesn't have access
 *
 * Requirements: 4.1, 4.3
 */
router.get(
  '/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { id } = req.params;

      // ── Admin has no access to Appointments ───────────────────
      if (role === UserRole.ADMIN) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      // ── Fetch the appointment ─────────────────────────────────
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        logger.error('GET /api/appointments/:id: query failed', {
          error: fetchError.message,
          appointmentId: id,
        });
        res.status(500).json({ error: 'Failed to fetch appointment' });
        return;
      }

      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // ── Role-based access check ───────────────────────────────
      if (role === UserRole.CLIENT) {
        // Clients can only view their own appointments
        if (appointment.client_id !== userId) {
          res.status(404).json({ error: 'Appointment not found' });
          return;
        }
      } else if (role === UserRole.STAFF || role === UserRole.MANAGER) {
        // Staff/Manager can only view appointments for their assigned services
        const { data: assignment, error: assignError } = await supabase
          .from('service_assignments')
          .select('id')
          .eq('staff_id', userId)
          .eq('service_id', appointment.service_id)
          .eq('is_active', true)
          .maybeSingle();

        if (assignError) {
          logger.error('GET /api/appointments/:id: failed to check service assignment', {
            error: assignError.message,
            userId,
            serviceId: appointment.service_id,
          });
          res.status(500).json({ error: 'Failed to fetch appointment' });
          return;
        }

        if (!assignment) {
          res.status(404).json({ error: 'Appointment not found' });
          return;
        }
      }

      res.json(mapAppointmentRow(appointment as Record<string, unknown>));
    } catch (err) {
      const error = err as Error;
      logger.error('GET /api/appointments/:id failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  },
);

/**
 * Valid status transitions.
 * Terminal statuses (completed, cancelled, no_show) allow no further transitions.
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

/** Terminal statuses that trigger soft-archive (Requirement 3.6). */
const TERMINAL_STATUSES: string[] = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

/**
 * PUT /api/appointments/:id — Update an appointment (Staff/Manager only).
 *
 * Body (all optional):
 *   status:  string — new status (must follow valid transition rules)
 *   remarks: string — staff remarks to attach to the appointment
 *
 * Behaviour:
 *   1. Verifies the appointment exists and the caller has access via service_assignments
 *   2. Validates status transition rules (pending→confirmed→completed/cancelled/no_show)
 *   3. Validates service hours when status is being changed (Requirement 3.3)
 *   4. Soft-archives on terminal statuses (Requirement 3.6)
 *   5. Sets processed_by to the acting staff/manager
 *   6. Sends status update email (fire-and-forget) (Requirement 3.5)
 *   7. Logs the action via AuditLogger (Requirement 3.7)
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
router.put(
  '/:id',
  requireRole(UserRole.STAFF, UserRole.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { status: newStatus, remarks } = req.body as {
        status?: string;
        remarks?: string;
      };

      // ── At least one field must be provided ───────────────────
      if (!newStatus && remarks === undefined) {
        res.status(400).json({ error: 'At least one of status or remarks must be provided' });
        return;
      }

      // ── Fetch the appointment ─────────────────────────────────
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        logger.error('PUT /api/appointments/:id: query failed', {
          error: fetchError.message,
          appointmentId: id,
        });
        res.status(500).json({ error: 'Failed to fetch appointment' });
        return;
      }

      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // ── Verify staff/manager has access via service_assignments ─
      const { data: assignment, error: assignError } = await supabase
        .from('service_assignments')
        .select('id')
        .eq('staff_id', userId)
        .eq('service_id', appointment.service_id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignError) {
        logger.error('PUT /api/appointments/:id: failed to check service assignment', {
          error: assignError.message,
          userId,
          serviceId: appointment.service_id,
        });
        res.status(500).json({ error: 'Failed to update appointment' });
        return;
      }

      if (!assignment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // ── Status transition validation (Requirement 3.2) ────────
      const currentStatus = appointment.status as string;

      if (newStatus) {
        const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];

        if (allowedTransitions.length === 0) {
          res.status(400).json({
            error: `Appointment is in terminal status '${currentStatus}' and cannot be updated`,
          });
          return;
        }

        if (!allowedTransitions.includes(newStatus)) {
          res.status(400).json({
            error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
          });
          return;
        }

        // ── Service hours validation (Requirement 3.3) ──────────
        const appointmentDateTime = new Date(appointment.appointment_date_time as string);
        const withinHours = await isWithinServiceHours(
          appointment.service_id as string,
          appointmentDateTime,
        );

        if (!withinHours) {
          res.status(400).json({
            error: 'Cannot update appointment status outside of configured service hours',
          });
          return;
        }
      }

      // ── Build the update payload ──────────────────────────────
      const updatePayload: Record<string, unknown> = {
        processed_by: userId,
        updated_at: new Date().toISOString(),
      };

      if (newStatus) {
        updatePayload.status = newStatus;

        // Soft-archive on terminal statuses (Requirement 3.6)
        if (TERMINAL_STATUSES.includes(newStatus)) {
          updatePayload.archived_at = new Date().toISOString();
        }
      }

      if (remarks !== undefined) {
        updatePayload.remarks = remarks;
      }

      // ── Persist the update ────────────────────────────────────
      const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError || !updated) {
        logger.error('PUT /api/appointments/:id: update failed', {
          error: updateError?.message,
          appointmentId: id,
        });
        res.status(500).json({ error: 'Failed to update appointment' });
        return;
      }

      // ── Send status update email (fire-and-forget) (Req 3.5) ──
      if (newStatus) {
        const appointmentForEmail = {
          id: updated.id as string,
          trackingNumber: updated.tracking_number as string,
          clientId: updated.client_id as string,
          serviceId: updated.service_id as string,
          dateTime: new Date(updated.appointment_date_time as string),
          duration: updated.duration as number,
          status: updated.status as AppointmentStatus,
          personalDetails: updated.personal_details as {
            firstName: string;
            lastName: string;
            phoneNumber: string;
            email: string;
            address: string;
            dateOfBirth: Date;
            governmentId: string;
          },
          requiredDocuments: (updated.required_documents as string[]) ?? [],
          remarks: (updated.remarks as string) ?? undefined,
          archivedAt: updated.archived_at ? new Date(updated.archived_at as string) : null,
          createdAt: new Date(updated.created_at as string),
          updatedAt: new Date(updated.updated_at as string),
          processedBy: updated.processed_by as string,
        };

        sendStatusUpdate(
          appointmentForEmail,
          currentStatus as AppointmentStatus,
        ).catch((err) => {
          logger.error('PUT /api/appointments/:id: email send failed', {
            error: (err as Error).message,
            appointmentId: id,
          });
        });
      }

      // ── Audit log (Requirement 3.7) ───────────────────────────
      await AuditLogger.logUserAction(
        userId,
        'update_appointment',
        'appointments',
        {
          appointmentId: id,
          trackingNumber: updated.tracking_number,
          ...(newStatus ? { oldStatus: currentStatus, newStatus } : {}),
          ...(remarks !== undefined ? { remarks } : {}),
        },
        req.ip,
      );

      // ── Return the updated appointment (camelCase) ────────────
      res.json(mapAppointmentRow(updated as Record<string, unknown>));
    } catch (err) {
      const error = err as Error;
      logger.error('PUT /api/appointments/:id failed', { error: error.message });
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  },
);

/**
 * DELETE /api/appointments/:id — Cancel a pending appointment (Client only).
 *
 * Soft-cancel: sets status to 'cancelled', archived_at to now, updated_at to now.
 * No records are ever permanently deleted.
 *
 * - Only the owning client may cancel (client_id = req.user.userId)
 * - Only appointments in 'pending' status may be cancelled by clients
 *
 * Requirements: 2.2 (cancel own pending)
 */
router.delete(
  '/:id',
  requireRole(UserRole.CLIENT),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      // ── Fetch the appointment ─────────────────────────────────
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        logger.error('DELETE /api/appointments/:id: query failed', {
          error: fetchError.message,
          appointmentId: id,
        });
        res.status(500).json({ error: 'Failed to cancel appointment' });
        return;
      }

      // ── Verify ownership — return 404 if not found or not owned ─
      if (!appointment || appointment.client_id !== userId) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // ── Only pending appointments can be cancelled by clients ──
      if (appointment.status !== AppointmentStatus.PENDING) {
        res.status(400).json({
          error: 'Only pending appointments can be cancelled',
        });
        return;
      }

      // ── Soft-cancel: update status, archived_at, updated_at ───
      const now = new Date().toISOString();

      const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update({
          status: AppointmentStatus.CANCELLED,
          archived_at: now,
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError || !updated) {
        logger.error('DELETE /api/appointments/:id: update failed', {
          error: updateError?.message,
          appointmentId: id,
        });
        res.status(500).json({ error: 'Failed to cancel appointment' });
        return;
      }

      // ── Audit log ─────────────────────────────────────────────
      await AuditLogger.logUserAction(
        userId,
        'cancel_appointment',
        'appointments',
        {
          appointmentId: id,
          trackingNumber: updated.tracking_number,
          previousStatus: AppointmentStatus.PENDING,
          newStatus: AppointmentStatus.CANCELLED,
        },
        req.ip,
      );

      // ── Return the updated appointment (camelCase) ────────────
      res.json(mapAppointmentRow(updated as Record<string, unknown>));
    } catch (err) {
      const error = err as Error;
      logger.error('DELETE /api/appointments/:id failed', { error: error.message });
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  },
);

export default router;
