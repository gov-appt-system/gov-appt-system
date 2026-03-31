import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { validatePasswordComplexity } from '../utils/password';
import { UserRole } from '../types/index';

const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '8h';
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

// In-memory JWT blocklist for terminated sessions.
// In production this should be backed by Redis or a DB table.
const tokenBlocklist = new Set<string>();

// ============================================================
// Types
// ============================================================

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
  token?: string;
  error?: string;
}

export interface SessionInfo {
  userId: string;
  role: UserRole;
  isValid: boolean;
}

export interface ClientRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string; // ISO date string
  governmentId: string;
}

// ============================================================
// 4.1 — hashPassword / authenticate / createSession / validateSession
// ============================================================

/**
 * Hashes a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies email + password against the users table.
 * Returns AuthResult with a signed JWT on success.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role, is_active, archived_at')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !user) {
    return { success: false, error: 'Invalid credentials' };
  }

  if (!user.is_active || user.archived_at) {
    return { success: false, error: 'Account is inactive' };
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return { success: false, error: 'Invalid credentials' };
  }

  const token = await createSession(user.id, user.role as UserRole);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.is_active,
    },
    token,
  };
}

/**
 * Creates a signed JWT for the given user.
 */
export async function createSession(
  userId: string,
  role: UserRole,
): Promise<string> {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Validates a JWT and returns session info.
 * Returns isValid: false if the token is expired, malformed, or blocklisted.
 */
export async function validateSession(token: string): Promise<SessionInfo> {
  if (tokenBlocklist.has(token)) {
    return { userId: '', role: UserRole.CLIENT, isValid: false };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    return {
      userId: payload.sub as string,
      role: payload.role as UserRole,
      isValid: true,
    };
  } catch {
    return { userId: '', role: UserRole.CLIENT, isValid: false };
  }
}

// ============================================================
// 4.2 — terminateSession / registerClient / changePassword
// ============================================================

/**
 * Adds the token to the in-memory blocklist, effectively terminating the session.
 */
export async function terminateSession(token: string): Promise<void> {
  tokenBlocklist.add(token);
}

/**
 * Self-registers a new client account.
 * Enforces password complexity and prevents duplicate emails.
 */
export async function registerClient(
  data: ClientRegistrationData,
): Promise<{ id: string; email: string; role: UserRole }> {
  if (!validatePasswordComplexity(data.password)) {
    throw new Error(
      'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
    );
  }

  const email = data.email.toLowerCase().trim();

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  // Insert into users table
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      role: UserRole.CLIENT,
      is_active: true,
    })
    .select('id, email, role')
    .single();

  if (userError || !newUser) {
    throw new Error(`Failed to create user: ${userError?.message}`);
  }

  // Insert into clients table
  const { error: clientError } = await supabase.from('clients').insert({
    user_id: newUser.id,
    first_name: data.firstName,
    last_name: data.lastName,
    phone_number: data.phoneNumber,
    address: data.address,
    date_of_birth: data.dateOfBirth,
    government_id: data.governmentId,
  });

  if (clientError) {
    // Roll back the user row to keep data consistent
    await supabase.from('users').delete().eq('id', newUser.id);
    throw new Error(`Failed to create client profile: ${clientError.message}`);
  }

  return { id: newUser.id, email: newUser.email, role: UserRole.CLIENT };
}

/**
 * Changes a user's password after verifying the current password.
 * Enforces complexity on the new password.
 * Requirements 5.4, 5.5
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  const currentMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!currentMatch) {
    throw new Error('Current password is incorrect');
  }

  if (!validatePasswordComplexity(newPassword)) {
    throw new Error(
      'New password must be at least 8 characters and contain uppercase, lowercase, and a number',
    );
  }

  const newHash = await hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }
}

// ============================================================
// 4.3 — sendPasswordResetEmail / resetPassword
// ============================================================

// In-memory store for reset tokens: token → { userId, expiresAt }
// In production, persist this in a DB table.
const resetTokenStore = new Map<string, { userId: string; expiresAt: number }>();

/**
 * Generates a signed, time-limited reset token and sends it via email.
 * Silently succeeds even if the email is not found (prevents user enumeration).
 * Requirements 1.7, 8.3
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, is_active, archived_at')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  // Silently return if user not found or inactive — prevents enumeration
  if (!user || !user.is_active || user.archived_at) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + RESET_TOKEN_EXPIRES_MS;

  resetTokenStore.set(token, { userId: user.id, expiresAt });

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  // Delegate to NotificationService (task 8); import lazily to avoid circular deps
  const { sendPasswordResetEmail: sendEmail } = await import('./notification');
  await sendEmail(user.email, resetLink);
}

/**
 * Validates the reset token and updates the user's password.
 * Invalidates the token after use.
 * Requirements 1.7
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const entry = resetTokenStore.get(token);

  if (!entry) {
    throw new Error('Invalid or expired reset token');
  }

  if (Date.now() > entry.expiresAt) {
    resetTokenStore.delete(token);
    throw new Error('Reset token has expired');
  }

  if (!validatePasswordComplexity(newPassword)) {
    throw new Error(
      'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
    );
  }

  const newHash = await hashPassword(newPassword);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('id', entry.userId);

  if (error) {
    throw new Error(`Failed to reset password: ${error.message}`);
  }

  // Invalidate the token after successful use
  resetTokenStore.delete(token);
}
