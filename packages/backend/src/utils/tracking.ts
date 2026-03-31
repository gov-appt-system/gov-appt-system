const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a unique alphanumeric tracking number in the format APT-YYYYMMDD-XXXXX.
 * The random suffix uses 5 alphanumeric characters (uppercase + digits).
 */
export function generateTrackingNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return `APT-${datePart}-${suffix}`;
}

/**
 * Validates that a string matches the tracking number format: APT-YYYYMMDD-XXXXX
 */
export function validateTrackingNumber(trackingNumber: string): boolean {
  return /^APT-\d{8}-[A-Z0-9]{5}$/.test(trackingNumber);
}
