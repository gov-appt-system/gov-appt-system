import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { supabase } from '../config/supabase';
import { changePassword } from '../services/auth';
import { rbacController } from '../services/rbac';
import { AuditLogger } from '../services/audit';
import { authenticateToken } from '../middleware/auth';
import { UserRole } from '../types';
import { logger } from '../config/logger';

const router: RouterType = Router();

// All profile routes require authentication
router.use(authenticateToken);

/**
 * GET /api/profile — Fetch the authenticated user's profile.
 * Returns user info + role-specific profile details.
 * Requirements: 5.1
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    // Fetch base user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch role-specific profile
    let profile: Record<string, unknown> | null = null;

    if (role === UserRole.CLIENT) {
      const { data, error } = await supabase
        .from('clients')
        .select('first_name, last_name, phone_number, address, date_of_birth, government_id')
        .eq('user_id', userId)
        .single();

      if (!error && data) profile = data;
    } else if (role === UserRole.STAFF || role === UserRole.MANAGER) {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('first_name, last_name, employee_id, department')
        .eq('user_id', userId)
        .single();

      if (!error && data) profile = data;
    } else if (role === UserRole.ADMIN) {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('first_name, last_name, employee_id, department')
        .eq('user_id', userId)
        .single();

      if (!error && data) profile = data;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      profile,
    });
  } catch (err) {
    const error = err as Error;
    logger.error('GET /api/profile failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profile — Update the authenticated user's profile fields.
 * Only allows updating fields appropriate to the role.
 * Requirements: 5.2
 */
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    let table: string;
    let allowedFields: string[];

    if (role === UserRole.CLIENT) {
      table = 'clients';
      allowedFields = ['first_name', 'last_name', 'phone_number', 'address', 'date_of_birth', 'government_id'];
    } else if (role === UserRole.STAFF || role === UserRole.MANAGER) {
      table = 'staff_profiles';
      allowedFields = ['first_name', 'last_name', 'department'];
    } else if (role === UserRole.ADMIN) {
      table = 'admin_profiles';
      allowedFields = ['first_name', 'last_name', 'department'];
    } else {
      res.status(400).json({ error: 'Unknown role' });
      return;
    }

    // Filter request body to only allowed fields
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(updates)
      .eq('user_id', userId);

    if (updateError) {
      logger.error('PUT /api/profile: DB update failed', { error: updateError.message });
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }

    // Update the users table updated_at timestamp
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);

    // Audit log
    await AuditLogger.logUserAction(
      userId,
      'update_profile',
      'own_profile',
      { updatedFields: Object.keys(updates) },
      req.ip,
    );

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('PUT /api/profile failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/profile/change-password — Change the authenticated user's password.
 * Requires currentPassword and newPassword in body.
 * Requirements: 5.4, 5.5
 */
router.post('/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    await changePassword(userId, currentPassword, newPassword);

    // Audit log
    await AuditLogger.logUserAction(
      userId,
      'change_password',
      'own_profile',
      {},
      req.ip,
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    const error = err as Error;
    if (
      error.message.includes('incorrect') ||
      error.message.includes('Password must be') ||
      error.message.includes('New password must be')
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    logger.error('POST /api/profile/change-password failed', { error: error.message });
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * DELETE /api/profile — Soft-deactivate the authenticated user's account.
 * Only clients may deactivate their own account.
 * Requirements: 5.3
 */
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    // Enforce RBAC: only clients may deactivate self
    try {
      await rbacController.enforcePermission(userId, 'own_profile', 'deactivate');
    } catch (rbacErr) {
      const rbacError = rbacErr as Error & { statusCode?: number };
      res.status(rbacError.statusCode ?? 403).json({ error: rbacError.message });
      return;
    }

    // Soft-deactivate: set is_active = false and archived_at = now()
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('DELETE /api/profile: DB update failed', { error: updateError.message });
      res.status(500).json({ error: 'Failed to deactivate account' });
      return;
    }

    // Audit log
    await AuditLogger.logUserAction(
      userId,
      'deactivate_account',
      'own_profile',
      { role },
      req.ip,
    );

    res.status(200).json({ message: 'Account deactivated successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('DELETE /api/profile failed', { error: error.message });
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

export default router;
