/**
 * NotificationService — stub implementation.
 * Full implementation is in Task 8.
 */

import { logger } from '../config/logger';

/**
 * Sends a password reset email with the provided reset link.
 * Requirements: 1.7, 8.3
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
): Promise<void> {
  // TODO (Task 8): replace with real email provider (SendGrid / Nodemailer)
  logger.info('sendPasswordResetEmail', { email, resetLink });
}

/**
 * Sends a booking confirmation email to the client.
 * Requirements: 2.5, 8.1
 */
export async function sendBookingConfirmation(
  appointment: Record<string, unknown>,
): Promise<void> {
  logger.info('sendBookingConfirmation', { appointmentId: appointment['id'] });
}

/**
 * Sends a status update email to the client.
 * Requirements: 3.5, 8.2
 */
export async function sendStatusUpdate(
  appointment: Record<string, unknown>,
  oldStatus: string,
): Promise<void> {
  logger.info('sendStatusUpdate', {
    appointmentId: appointment['id'],
    oldStatus,
  });
}
