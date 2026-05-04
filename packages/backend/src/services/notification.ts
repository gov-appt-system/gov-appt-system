/**
 * NotificationService
 * Handles all outbound email notifications using Resend.
 * Requirements: 2.5, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { Resend } from 'resend';
import { logger } from '../config/logger';
import { Appointment, AppointmentStatus } from '../types';

// ============================================================
// Configuration
// ============================================================

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const MAX_RETRY_COUNT = parseInt(process.env.EMAIL_MAX_RETRIES ?? '3', 10);

// ============================================================
// In-memory failure queue (Requirement 8.4)
// ============================================================

interface EmailFailure {
  id: string;
  to: string;
  subject: string;
  html: string;
  retries: number;
  lastError: string;
  createdAt: Date;
}

const failureQueue: EmailFailure[] = [];

// ============================================================
// Resend client
// ============================================================

const resend = new Resend(RESEND_API_KEY);

// ============================================================
// Core send helper
// ============================================================

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) {
    throw new Error(error.message);
  }
}


// ============================================================
// HTML Templates (Requirement 8.5 — government agency branding)
// ============================================================

const AGENCY_NAME = process.env.AGENCY_NAME ?? 'Government Agency';
const AGENCY_LOGO_URL = process.env.AGENCY_LOGO_URL ?? '';

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .header { background: #003087; color: #fff; padding: 24px 32px; }
    .header img { height: 48px; margin-bottom: 8px; display: block; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .footer { background: #f0f0f0; padding: 16px 32px; font-size: 12px; color: #666; text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold; }
    .badge-pending   { background: #fff3cd; color: #856404; }
    .badge-confirmed { background: #d1e7dd; color: #0f5132; }
    .badge-completed { background: #cfe2ff; color: #084298; }
    .badge-cancelled { background: #f8d7da; color: #842029; }
    .badge-no_show   { background: #e2e3e5; color: #41464b; }
    .badge-expired   { background: #fde2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 0; vertical-align: top; }
    td:first-child { font-weight: bold; width: 40%; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${AGENCY_LOGO_URL ? `<img src="${AGENCY_LOGO_URL}" alt="${AGENCY_NAME} logo" />` : ''}
      <h1>${AGENCY_NAME}</h1>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      This is an automated message from ${AGENCY_NAME}. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`;
}

function formatDateTime(dt: Date): string {
  return new Date(dt).toLocaleString('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  });
}

function statusBadge(status: string): string {
  return `<span class="badge badge-${status}">${status.replace('_', ' ').toUpperCase()}</span>`;
}

function appointmentTable(appt: Appointment, serviceName?: string): string {
  return `<table>
    <tr><td>Tracking Number</td><td><strong>${appt.trackingNumber}</strong></td></tr>
    <tr><td>Service</td><td>${serviceName ?? appt.serviceId}</td></tr>
    <tr><td>Date &amp; Time</td><td>${formatDateTime(appt.dateTime)}</td></tr>
    <tr><td>Status</td><td>${statusBadge(appt.status)}</td></tr>
    ${appt.remarks ? `<tr><td>Remarks</td><td>${appt.remarks}</td></tr>` : ''}
  </table>`;
}


// ============================================================
// 8.1 — sendBookingConfirmation (Requirements 2.5, 8.1, 8.5)
// ============================================================

/**
 * Sends a booking confirmation email to the client after a successful booking.
 */
export async function sendBookingConfirmation(
  appointment: Appointment,
  serviceName?: string,
): Promise<void> {
  const { personalDetails, trackingNumber } = appointment;
  const to = personalDetails.email;
  const subject = `Appointment Confirmed — ${trackingNumber}`;

  const body = `
    <h2>Your appointment has been booked</h2>
    <p>Dear ${personalDetails.firstName} ${personalDetails.lastName},</p>
    <p>Your appointment has been successfully scheduled. Please keep your tracking number for reference.</p>
    ${appointmentTable(appointment, serviceName)}
    <p>Please arrive 10 minutes before your scheduled time and bring all required documents.</p>
    <p>If you need to cancel, please do so at least 24 hours in advance through the online portal.</p>
  `;

  try {
    await sendEmail(to, subject, baseTemplate(subject, body));
    logger.info('sendBookingConfirmation: sent', { to, trackingNumber });
  } catch (err) {
    const error = err as Error;
    logger.error('sendBookingConfirmation: failed', { to, error: error.message });
    await logEmailFailure(to, subject, baseTemplate(subject, body), error.message);
  }
}

// ============================================================
// 8.1 — sendStatusUpdate (Requirements 3.5, 8.2, 8.5)
// ============================================================

/**
 * Sends a status update email when an appointment's status changes.
 */
export async function sendStatusUpdate(
  appointment: Appointment,
  oldStatus: AppointmentStatus,
  serviceName?: string,
): Promise<void> {
  const { personalDetails, trackingNumber, status } = appointment;
  const to = personalDetails.email;
  const subject = `Appointment Update — ${trackingNumber}`;

  const statusMessages: Record<string, string> = {
    [AppointmentStatus.CONFIRMED]: 'Your appointment has been <strong>confirmed</strong> by our staff.',
    [AppointmentStatus.COMPLETED]: 'Your appointment has been marked as <strong>completed</strong>. Thank you for visiting.',
    [AppointmentStatus.CANCELLED]: 'Your appointment has been <strong>cancelled</strong>. Please contact us if you have questions.',
    [AppointmentStatus.NO_SHOW]: 'Your appointment was marked as <strong>no-show</strong>. Please rebook if needed.',
    [AppointmentStatus.EXPIRED]: 'Your appointment has <strong>expired</strong> because it was not confirmed before the scheduled time. Please book a new appointment if needed.',
  };

  const message = statusMessages[status] ?? `Your appointment status has been updated from <em>${oldStatus}</em> to <em>${status}</em>.`;

  const body = `
    <h2>Appointment Status Update</h2>
    <p>Dear ${personalDetails.firstName} ${personalDetails.lastName},</p>
    <p>${message}</p>
    ${appointmentTable(appointment, serviceName)}
    <p>You can view your appointment details and history through the online portal.</p>
  `;

  try {
    await sendEmail(to, subject, baseTemplate(subject, body));
    logger.info('sendStatusUpdate: sent', { to, trackingNumber, oldStatus, newStatus: status });
  } catch (err) {
    const error = err as Error;
    logger.error('sendStatusUpdate: failed', { to, error: error.message });
    await logEmailFailure(to, subject, baseTemplate(subject, body), error.message);
  }
}


// ============================================================
// 8.2 — sendPasswordResetEmail (Requirement 8.3)
// ============================================================

/**
 * Sends a password reset email containing a secure, time-limited reset link.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
): Promise<void> {
  const subject = `Password Reset Request — ${AGENCY_NAME}`;

  const body = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset the password for your account associated with this email address.</p>
    <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
    <p style="text-align:center; margin: 32px 0;">
      <a href="${resetLink}"
         style="background:#003087;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Reset Password
      </a>
    </p>
    <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    <p style="font-size:12px;color:#888;">If the button above does not work, copy and paste this link into your browser:<br/>${resetLink}</p>
  `;

  try {
    await sendEmail(email, subject, baseTemplate(subject, body));
    logger.info('sendPasswordResetEmail: sent', { email });
  } catch (err) {
    const error = err as Error;
    logger.error('sendPasswordResetEmail: failed', { email, error: error.message });
    await logEmailFailure(email, subject, baseTemplate(subject, body), error.message);
  }
}


// ============================================================
// 8.3 — logEmailFailure & retryFailedEmails (Requirement 8.4)
// ============================================================

/**
 * Records a failed email delivery into the in-memory failure queue.
 * In production this could be persisted to an `email_failures` DB table.
 */
export async function logEmailFailure(
  to: string,
  subject: string,
  html: string,
  errorMessage: string,
): Promise<void> {
  const failure: EmailFailure = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    to,
    subject,
    html,
    retries: 0,
    lastError: errorMessage,
    createdAt: new Date(),
  };
  failureQueue.push(failure);
  logger.warn('logEmailFailure: queued for retry', { id: failure.id, to, subject });
}

/**
 * Retries all queued failed emails up to MAX_RETRY_COUNT times.
 * Removes entries that succeed or have exhausted retries.
 * Requirement 8.4 — configurable retry count via EMAIL_MAX_RETRIES env var.
 */
export async function retryFailedEmails(): Promise<void> {
  if (failureQueue.length === 0) return;

  logger.info('retryFailedEmails: starting', { queued: failureQueue.length });

  // Iterate over a snapshot so mutations during iteration are safe
  const snapshot = [...failureQueue];

  for (const failure of snapshot) {
    if (failure.retries >= MAX_RETRY_COUNT) {
      logger.error('retryFailedEmails: max retries exceeded, dropping', {
        id: failure.id,
        to: failure.to,
        retries: failure.retries,
      });
      const idx = failureQueue.indexOf(failure);
      if (idx !== -1) failureQueue.splice(idx, 1);
      continue;
    }

    try {
      await sendEmail(failure.to, failure.subject, failure.html);
      logger.info('retryFailedEmails: success', { id: failure.id, to: failure.to });
      const idx = failureQueue.indexOf(failure);
      if (idx !== -1) failureQueue.splice(idx, 1);
    } catch (err) {
      failure.retries += 1;
      failure.lastError = (err as Error).message;
      logger.warn('retryFailedEmails: retry failed', {
        id: failure.id,
        to: failure.to,
        retries: failure.retries,
        error: failure.lastError,
      });
    }
  }

  logger.info('retryFailedEmails: done', { remaining: failureQueue.length });
}

/**
 * Returns a read-only snapshot of the current failure queue (for monitoring/testing).
 */
export function getFailureQueue(): Readonly<EmailFailure[]> {
  return failureQueue;
}
