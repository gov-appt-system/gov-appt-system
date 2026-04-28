import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import {
  authenticate,
  registerClient,
  terminateSession,
  sendPasswordResetEmail,
  resetPassword,
} from '../services/auth';
import { validatePasswordComplexity } from '../utils/password';
import { AuditLogger } from '../services/audit';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../config/logger';

const router: RouterType = Router();

/**
 * POST /api/auth/register — Client self-registration.
 * Requirements: 1.5, 1.6
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      governmentId,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phoneNumber || !address || !dateOfBirth || !governmentId) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate password complexity before calling the service
    if (!validatePasswordComplexity(password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
      });
      return;
    }

    const newUser = await registerClient({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      governmentId,
    });

    // Audit log after successful registration
    await AuditLogger.logUserAction(
      newUser.id,
      'register',
      'auth',
      { email: newUser.email },
      req.ip,
    );

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (err) {
    const error = err as Error;
    if (
      error.message.includes('already exists') ||
      error.message.includes('Password must be')
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    logger.error('POST /api/auth/register failed', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login — Authenticate user.
 * Requirements: 1.1, 1.2
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await authenticate(email, password);

    if (!result.success || !result.user || !result.token) {
      res.status(401).json({ error: result.error ?? 'Invalid credentials' });
      return;
    }

    // Audit log on successful login
    await AuditLogger.logUserAction(
      result.user.id,
      'login',
      'auth',
      { email: result.user.email, ip: req.ip },
      req.ip,
    );

    res.status(200).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      token: result.token,
    });
  } catch (err) {
    const error = err as Error;
    logger.error('POST /api/auth/login failed', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout — Terminate session (requires authentication).
 * Requirements: 1.4
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader!.slice(7); // We know it exists because authenticateToken passed

    await terminateSession(token);

    // Audit log on logout
    await AuditLogger.logUserAction(
      req.user!.userId,
      'logout',
      'auth',
      {},
      req.ip,
    );

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('POST /api/auth/logout failed', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /api/auth/forgot-password — Send password reset email.
 * Always returns 200 to prevent user enumeration.
 * Requirements: 1.7
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    await sendPasswordResetEmail(email);

    // Always return 200 regardless of whether the email exists
    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent' });
  } catch (err) {
    const error = err as Error;
    logger.error('POST /api/auth/forgot-password failed', { error: error.message });
    // Still return 200 to prevent enumeration
    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent' });
  }
});

/**
 * POST /api/auth/reset-password — Reset password using token.
 * Requirements: 1.7, 1.6
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    // Validate password complexity before calling the service
    if (!validatePasswordComplexity(newPassword)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
      });
      return;
    }

    await resetPassword(token, newPassword);

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    const error = err as Error;
    if (
      error.message.includes('Invalid or expired') ||
      error.message.includes('expired') ||
      error.message.includes('Password must be')
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    logger.error('POST /api/auth/reset-password failed', { error: error.message });
    res.status(500).json({ error: 'Password reset failed' });
  }
});

export default router;
