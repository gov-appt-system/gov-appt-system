import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { supabase } from '../config/supabase';
import { AuditLogger } from '../services/audit';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../types';
import { validatePasswordComplexity } from '../utils/password';
import { hashPassword } from '../services/auth';
import { logger } from '../config/logger';

const router: RouterType = Router();

// All admin routes require authentication + Admin role
router.use(authenticateToken);
router.use(requireRole(UserRole.ADMIN));

// ============================================================
// 14.1 — POST /api/admin/accounts
// Create a staff or manager account.
// Requirements: 6.1, 6.8
// ============================================================

router.post('/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      employeeId,
      department,
    } = req.body;

    // Validate required fields
    if (!email || !password || !role || !firstName || !lastName || !employeeId || !department) {
      res.status(400).json({
        error: 'Required fields: email, password, role, firstName, lastName, employeeId, department',
      });
      return;
    }

    // Only staff and manager accounts can be created via this endpoint
    if (role !== UserRole.STAFF && role !== UserRole.MANAGER) {
      res.status(400).json({ error: 'Role must be "staff" or "manager"' });
      return;
    }

    // Validate password complexity
    if (!validatePasswordComplexity(password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Check for duplicate employee ID
    const { data: existingEmployee } = await supabase
      .from('staff_profiles')
      .select('user_id')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (existingEmployee) {
      res.status(409).json({ error: 'An account with this employee ID already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Insert into users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        role,
        is_active: true,
      })
      .select('id, email, role')
      .single();

    if (userError || !newUser) {
      logger.error('POST /api/admin/accounts: user insert failed', { error: userError?.message });
      res.status(500).json({ error: 'Failed to create account' });
      return;
    }

    // Insert into staff_profiles table (shared by staff and manager)
    const { error: profileError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: newUser.id,
        first_name: firstName,
        last_name: lastName,
        employee_id: employeeId,
        department,
      });

    if (profileError) {
      // Roll back the user row to keep data consistent
      await supabase.from('users').delete().eq('id', newUser.id);
      logger.error('POST /api/admin/accounts: profile insert failed', { error: profileError.message });
      res.status(500).json({ error: 'Failed to create staff profile' });
      return;
    }

    // Audit log
    await AuditLogger.logUserAction(
      req.user!.userId,
      'create_account',
      'user_accounts',
      {
        targetUserId: newUser.id,
        email: normalizedEmail,
        role,
        employeeId,
        department,
      },
      req.ip,
    );

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName,
      lastName,
      employeeId,
      department,
    });
  } catch (err) {
    const error = err as Error;
    logger.error('POST /api/admin/accounts failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create account' });
  }
});


// ============================================================
// 14.2 — GET /api/admin/accounts
// List all staff and manager accounts with status.
// Uses the manager_staff_overview view.
// Requirements: 6.2
// ============================================================

router.get('/accounts', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('manager_staff_overview')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      logger.error('GET /api/admin/accounts: query failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch accounts' });
      return;
    }

    // Map snake_case DB columns to camelCase
    const accounts = (data ?? []).map((row: Record<string, unknown>) => ({
      userId: row.user_id,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      archivedAt: row.archived_at,
      firstName: row.first_name,
      lastName: row.last_name,
      employeeId: row.employee_id,
      department: row.department,
      assignedServices: row.assigned_services ?? [],
    }));

    res.status(200).json(accounts);
  } catch (err) {
    const error = err as Error;
    logger.error('GET /api/admin/accounts failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});


// ============================================================
// 14.3 — PUT /api/admin/accounts/:id
// Update a staff or manager account's info.
// Requirements: 6.3, 6.8
// ============================================================

router.put('/accounts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch the target user — must be staff or manager
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_active, archived_at')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    if (targetUser.role !== UserRole.STAFF && targetUser.role !== UserRole.MANAGER) {
      res.status(400).json({ error: 'Can only update staff or manager accounts via this endpoint' });
      return;
    }

    const {
      email,
      role,
      firstName,
      lastName,
      employeeId,
      department,
    } = req.body;

    // If role is being changed, only allow staff <-> manager
    if (role !== undefined && role !== UserRole.STAFF && role !== UserRole.MANAGER) {
      res.status(400).json({ error: 'Role must be "staff" or "manager"' });
      return;
    }

    // If email is being changed, check for duplicates
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: duplicate } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }
    }

    // If employeeId is being changed, check for duplicates
    if (employeeId !== undefined) {
      const { data: duplicate } = await supabase
        .from('staff_profiles')
        .select('user_id')
        .eq('employee_id', employeeId)
        .neq('user_id', id)
        .maybeSingle();

      if (duplicate) {
        res.status(409).json({ error: 'An account with this employee ID already exists' });
        return;
      }
    }

    // Build user table updates
    const userUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) userUpdates.email = email.toLowerCase().trim();
    if (role !== undefined) userUpdates.role = role;

    const { error: userUpdateError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', id);

    if (userUpdateError) {
      logger.error('PUT /api/admin/accounts/:id: user update failed', { error: userUpdateError.message });
      res.status(500).json({ error: 'Failed to update account' });
      return;
    }

    // Build staff_profiles updates
    const profileUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) profileUpdates.first_name = firstName;
    if (lastName !== undefined) profileUpdates.last_name = lastName;
    if (employeeId !== undefined) profileUpdates.employee_id = employeeId;
    if (department !== undefined) profileUpdates.department = department;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await supabase
        .from('staff_profiles')
        .update(profileUpdates)
        .eq('user_id', id);

      if (profileUpdateError) {
        logger.error('PUT /api/admin/accounts/:id: profile update failed', { error: profileUpdateError.message });
        res.status(500).json({ error: 'Failed to update staff profile' });
        return;
      }
    }

    // Audit log
    const updatedFields = [
      ...Object.keys(userUpdates).filter((k) => k !== 'updated_at'),
      ...Object.keys(profileUpdates),
    ];

    await AuditLogger.logUserAction(
      req.user!.userId,
      'update_account',
      'user_accounts',
      {
        targetUserId: id,
        updatedFields,
      },
      req.ip,
    );

    res.status(200).json({ message: 'Account updated successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('PUT /api/admin/accounts/:id failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update account' });
  }
});


// ============================================================
// 14.4 — DELETE /api/admin/accounts/:id
// Soft-archive a staff or manager account.
// Sets is_active = false and archived_at = now().
// Requirements: 6.4, 6.8
// ============================================================

router.delete('/accounts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch the target user — must be staff or manager, active, and not already archived
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_active, archived_at')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    if (targetUser.role !== UserRole.STAFF && targetUser.role !== UserRole.MANAGER) {
      res.status(400).json({ error: 'Can only archive staff or manager accounts via this endpoint' });
      return;
    }

    if (!targetUser.is_active || targetUser.archived_at !== null) {
      res.status(400).json({ error: 'Account is already archived' });
      return;
    }

    // Prevent admin from archiving themselves
    if (id === req.user!.userId) {
      res.status(400).json({ error: 'Cannot archive your own account' });
      return;
    }

    const now = new Date().toISOString();

    // Soft-archive: set is_active = false and archived_at = now()
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: false,
        archived_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('DELETE /api/admin/accounts/:id: archive failed', { error: updateError.message });
      res.status(500).json({ error: 'Failed to archive account' });
      return;
    }

    // Also archive any active service assignments for this user
    await supabase
      .from('service_assignments')
      .update({
        is_active: false,
        archived_at: now,
        archived_by: req.user!.userId,
      })
      .eq('staff_id', id)
      .eq('is_active', true);

    // Audit log
    await AuditLogger.logUserAction(
      req.user!.userId,
      'archive_account',
      'user_accounts',
      {
        targetUserId: id,
        email: targetUser.email,
        role: targetUser.role,
      },
      req.ip,
    );

    res.status(200).json({ message: 'Account archived successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('DELETE /api/admin/accounts/:id failed', { error: error.message });
    res.status(500).json({ error: 'Failed to archive account' });
  }
});


// ============================================================
// 14.5 — GET /api/admin/clients
// List all client accounts with profile info.
// Requirements: 6.2 (client accounts)
// ============================================================

router.get('/clients', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, is_active, archived_at, created_at, updated_at')
      .eq('role', UserRole.CLIENT)
      .order('created_at', { ascending: false });

    if (usersError) {
      logger.error('GET /api/admin/clients: users query failed', { error: usersError.message });
      res.status(500).json({ error: 'Failed to fetch clients' });
      return;
    }

    if (!users || users.length === 0) {
      res.status(200).json([]);
      return;
    }

    // Fetch all client profiles in one query
    const userIds = users.map((u: Record<string, unknown>) => u.id as string);
    const { data: profiles, error: profilesError } = await supabase
      .from('clients')
      .select('user_id, first_name, last_name, phone_number, address, date_of_birth, government_id')
      .in('user_id', userIds);

    if (profilesError) {
      logger.error('GET /api/admin/clients: profiles query failed', { error: profilesError.message });
      res.status(500).json({ error: 'Failed to fetch client profiles' });
      return;
    }

    // Build a lookup map for profiles
    const profileMap = new Map<string, Record<string, unknown>>();
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id as string, p as Record<string, unknown>);
    }

    const clients = users.map((u: Record<string, unknown>) => {
      const profile = profileMap.get(u.id as string);
      return {
        userId: u.id,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        archivedAt: u.archived_at,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        phoneNumber: profile?.phone_number ?? null,
        address: profile?.address ?? null,
        dateOfBirth: profile?.date_of_birth ?? null,
        governmentId: profile?.government_id ?? null,
      };
    });

    res.status(200).json(clients);
  } catch (err) {
    const error = err as Error;
    logger.error('GET /api/admin/clients failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ============================================================
// 14.5 — PUT /api/admin/clients/:id
// Update a client account's info.
// Requirements: 6.2 (client accounts)
// ============================================================

router.put('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch the target user — must be a client
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      res.status(404).json({ error: 'Client account not found' });
      return;
    }

    if (targetUser.role !== UserRole.CLIENT) {
      res.status(400).json({ error: 'Can only update client accounts via this endpoint' });
      return;
    }

    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      governmentId,
      isActive,
    } = req.body;

    // If email is being changed, check for duplicates
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: duplicate } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }
    }

    // Build user table updates
    const userUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) userUpdates.email = email.toLowerCase().trim();
    if (isActive !== undefined) {
      userUpdates.is_active = isActive;
      if (!isActive) {
        userUpdates.archived_at = new Date().toISOString();
      } else {
        userUpdates.archived_at = null;
      }
    }

    const { error: userUpdateError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', id);

    if (userUpdateError) {
      logger.error('PUT /api/admin/clients/:id: user update failed', { error: userUpdateError.message });
      res.status(500).json({ error: 'Failed to update client account' });
      return;
    }

    // Build clients table updates
    const profileUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) profileUpdates.first_name = firstName;
    if (lastName !== undefined) profileUpdates.last_name = lastName;
    if (phoneNumber !== undefined) profileUpdates.phone_number = phoneNumber;
    if (address !== undefined) profileUpdates.address = address;
    if (dateOfBirth !== undefined) profileUpdates.date_of_birth = dateOfBirth;
    if (governmentId !== undefined) profileUpdates.government_id = governmentId;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await supabase
        .from('clients')
        .update(profileUpdates)
        .eq('user_id', id);

      if (profileUpdateError) {
        logger.error('PUT /api/admin/clients/:id: profile update failed', { error: profileUpdateError.message });
        res.status(500).json({ error: 'Failed to update client profile' });
        return;
      }
    }

    // Audit log
    const updatedFields = [
      ...Object.keys(userUpdates).filter((k) => k !== 'updated_at'),
      ...Object.keys(profileUpdates),
    ];

    await AuditLogger.logUserAction(
      req.user!.userId,
      'update_client',
      'user_accounts',
      {
        targetUserId: id,
        updatedFields,
      },
      req.ip,
    );

    res.status(200).json({ message: 'Client account updated successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('PUT /api/admin/clients/:id failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update client account' });
  }
});


// ============================================================
// 14.6 — GET /api/admin/audit-logs
// Paginated audit log viewer with filters.
// Requirements: 9.5
// ============================================================

router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
    } = req.query;

    const filters: Record<string, unknown> = {};
    if (userId) filters.userId = userId as string;
    if (action) filters.action = action as string;
    if (resource) filters.resource = resource as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const logs = await AuditLogger.getAuditLogs(filters as import('../types').AuditFilters);

    res.status(200).json(logs);
  } catch (err) {
    const error = err as Error;
    logger.error('GET /api/admin/audit-logs failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ============================================================
// 14.6 — GET /api/admin/audit-logs/export
// Export audit logs for a date range as CSV.
// Requirements: 9.5
// ============================================================

router.get('/audit-logs/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate and endDate query parameters are required' });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (e.g. 2026-01-01)' });
      return;
    }

    const csv = await AuditLogger.exportAuditLogs(start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${startDate}-${endDate}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    const error = err as Error;
    logger.error('GET /api/admin/audit-logs/export failed', { error: error.message });
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

export default router;
