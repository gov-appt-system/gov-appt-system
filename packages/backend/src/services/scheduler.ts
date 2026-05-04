/**
 * Appointment Expiry Scheduler
 *
 * Runs periodically to:
 * 1. Expire pending appointments whose dateTime + duration has passed → status = 'expired'
 * 2. Mark confirmed appointments whose dateTime + duration has passed → status = 'no_show'
 *
 * Both transitions soft-archive the appointment and send email + in-app notifications.
 */

import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { AppointmentStatus } from '../types';
import { sendStatusUpdate } from './notification';
import { createNotification } from './inAppNotification';
import { AuditLogger } from './audit';

// ============================================================
// Configuration
// ============================================================

/** Cron expression: every 15 minutes */
const SCHEDULE = process.env.EXPIRY_CRON_SCHEDULE ?? '*/15 * * * *';

// ============================================================
// Core expiry logic
// ============================================================

export async function processExpiredAppointments(): Promise<{
  expiredCount: number;
  noShowCount: number;
}> {
  const now = new Date();
  let expiredCount = 0;
  let noShowCount = 0;

  // ── 1. Expire stale PENDING appointments ────────────────────
  // Find pending appointments where appointment_date_time + duration (in minutes) < now
  const { data: stalePending, error: pendingError } = await supabase
    .from('appointments')
    .select('*')
    .eq('status', AppointmentStatus.PENDING)
    .is('archived_at', null)
    .lte('appointment_date_time', now.toISOString());

  if (pendingError) {
    logger.error('processExpiredAppointments: failed to fetch stale pending', {
      error: pendingError.message,
    });
  } else {
    for (const appt of stalePending ?? []) {
      const apptEnd = new Date(
        new Date(appt.appointment_date_time as string).getTime() +
        (appt.duration as number) * 60 * 1000,
      );

      if (apptEnd <= now) {
        await transitionAppointment(
          appt,
          AppointmentStatus.PENDING,
          AppointmentStatus.EXPIRED,
          now,
        );
        expiredCount++;
      }
    }
  }

  // ── 2. Auto no-show stale CONFIRMED appointments ────────────
  const { data: staleConfirmed, error: confirmedError } = await supabase
    .from('appointments')
    .select('*')
    .eq('status', AppointmentStatus.CONFIRMED)
    .is('archived_at', null)
    .lte('appointment_date_time', now.toISOString());

  if (confirmedError) {
    logger.error('processExpiredAppointments: failed to fetch stale confirmed', {
      error: confirmedError.message,
    });
  } else {
    for (const appt of staleConfirmed ?? []) {
      const apptEnd = new Date(
        new Date(appt.appointment_date_time as string).getTime() +
        (appt.duration as number) * 60 * 1000,
      );

      if (apptEnd <= now) {
        await transitionAppointment(
          appt,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.NO_SHOW,
          now,
        );
        noShowCount++;
      }
    }
  }

  if (expiredCount > 0 || noShowCount > 0) {
    logger.info('processExpiredAppointments: completed', {
      expiredCount,
      noShowCount,
    });
  }

  return { expiredCount, noShowCount };
}

// ============================================================
// Transition helper (exported for use by inline expiry checks)
// ============================================================

export async function transitionAppointment(
  appt: Record<string, unknown>,
  oldStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
  now: Date,
): Promise<void> {
  const appointmentId = appt.id as string;
  const trackingNumber = appt.tracking_number as string;
  const clientId = appt.client_id as string;

  // Update the appointment
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      status: newStatus,
      archived_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', appointmentId);

  if (updateError) {
    logger.error('transitionAppointment: update failed', {
      error: updateError.message,
      appointmentId,
      newStatus,
    });
    return;
  }

  // Build appointment object for email
  const personalDetails = appt.personal_details as {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    address: string;
    dateOfBirth: Date;
    governmentId: string;
  };

  const appointmentForEmail = {
    id: appointmentId,
    trackingNumber,
    clientId,
    serviceId: appt.service_id as string,
    dateTime: new Date(appt.appointment_date_time as string),
    duration: appt.duration as number,
    status: newStatus,
    personalDetails,
    requiredDocuments: (appt.required_documents as string[]) ?? [],
    remarks: (appt.remarks as string) ?? undefined,
    archivedAt: now,
    createdAt: new Date(appt.created_at as string),
    updatedAt: now,
  };

  // Send email notification (fire-and-forget)
  sendStatusUpdate(appointmentForEmail, oldStatus).catch((err) => {
    logger.error('transitionAppointment: email failed', {
      error: (err as Error).message,
      appointmentId,
    });
  });

  // Create in-app notification for the client
  const notifTitle =
    newStatus === AppointmentStatus.EXPIRED
      ? 'Appointment Expired'
      : 'Appointment Marked as No-Show';

  const notifMessage =
    newStatus === AppointmentStatus.EXPIRED
      ? `Your appointment (${trackingNumber}) has expired because it was not confirmed before the scheduled time. Please book a new appointment.`
      : `Your appointment (${trackingNumber}) has been marked as no-show because it was not attended. Please contact us if this is an error.`;

  createNotification(
    clientId,
    notifTitle,
    notifMessage,
    'warning',
    { appointmentId, trackingNumber },
  ).catch((err) => {
    logger.error('transitionAppointment: in-app notification failed', {
      error: (err as Error).message,
      appointmentId,
    });
  });

  // Audit log
  AuditLogger.logSystemEvent(
    'auto_expire_appointment',
    {
      appointmentId,
      trackingNumber,
      oldStatus,
      newStatus,
    },
  ).catch((err) => {
    logger.error('transitionAppointment: audit log failed', {
      error: (err as Error).message,
      appointmentId,
    });
  });
}

// ============================================================
// Start the scheduler
// ============================================================

/**
 * Inline expiry check for a list of appointment rows.
 * Transitions stale pending → expired and stale confirmed → no_show,
 * then returns the rows with corrected status/archived_at values.
 *
 * This is called at read-time (GET endpoints) so the client sees
 * up-to-date statuses immediately without waiting for the cron job.
 */
export async function expireStaleRows(
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const now = new Date();
  const result: Record<string, unknown>[] = [];

  for (const row of rows) {
    const status = row.status as string;
    const archivedAt = row.archived_at;

    // Only process non-archived pending/confirmed appointments
    if (archivedAt || (status !== AppointmentStatus.PENDING && status !== AppointmentStatus.CONFIRMED)) {
      result.push(row);
      continue;
    }

    const apptEnd = new Date(
      new Date(row.appointment_date_time as string).getTime() +
      (row.duration as number) * 60 * 1000,
    );

    if (apptEnd > now) {
      // Not stale yet
      result.push(row);
      continue;
    }

    // Determine the new status
    const newStatus =
      status === AppointmentStatus.PENDING
        ? AppointmentStatus.EXPIRED
        : AppointmentStatus.NO_SHOW;

    // Transition in the DB (fire-and-forget for notifications/audit)
    await transitionAppointment(
      row,
      status as AppointmentStatus,
      newStatus,
      now,
    );

    // Return the row with updated fields so the response is correct
    result.push({
      ...row,
      status: newStatus,
      archived_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  }

  return result;
}

export function startExpiryScheduler(): void {
  if (!cron.validate(SCHEDULE)) {
    logger.error('startExpiryScheduler: invalid cron expression', { SCHEDULE });
    return;
  }

  cron.schedule(SCHEDULE, async () => {
    logger.info('Expiry scheduler: running...');
    try {
      await processExpiredAppointments();
    } catch (err) {
      logger.error('Expiry scheduler: unhandled error', {
        error: (err as Error).message,
      });
    }
  });

  logger.info('Expiry scheduler started', { schedule: SCHEDULE });
}
