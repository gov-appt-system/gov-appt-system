import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { supabase } from '../config/supabase';
import { AuditLogger } from '../services/audit';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../types';
import { logger } from '../config/logger';

// mergeParams: true so we can access :id from the parent services router
const router: RouterType = Router({ mergeParams: true });

// All assignment routes require authentication + Manager role
router.use(authenticateToken);
router.use(requireRole(UserRole.MANAGER));

// ============================================================
// Helper: map a DB row (snake_case) to the ServiceAssignment shape (camelCase)
// ============================================================
function mapAssignmentRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    staffId: row.staff_id,
    serviceId: row.service_id,
    isActive: row.is_active,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
  };
}

/**
 * POST /api/services/:id/assignments — Assign a staff member to a service.
 * Manager only.
 *
 * Body: { staffId: string }
 *
 * Validates:
 * - The service exists and is active
 * - The target user exists, is active, and has role = 'staff'
 * - No active assignment already exists for this staff + service pair
 *
 * Requirements: 6.5, 6.8
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceId = req.params.id;
    const { staffId } = req.body;
    const managerId = req.user!.userId;

    // Validate required field
    if (!staffId) {
      res.status(400).json({ error: 'staffId is required' });
      return;
    }

    // 1. Verify the service exists and is active
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', serviceId)
      .eq('is_active', true)
      .is('archived_at', null)
      .single();

    if (serviceError || !service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // 2. Verify the target user exists, is active, and has role = 'staff'
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active, archived_at')
      .eq('id', staffId)
      .single();

    if (userError || !targetUser) {
      res.status(404).json({ error: 'Staff user not found' });
      return;
    }

    if (!targetUser.is_active || targetUser.archived_at !== null) {
      res.status(400).json({ error: 'Cannot assign an inactive or archived user' });
      return;
    }

    if (targetUser.role !== UserRole.STAFF) {
      res.status(400).json({ error: 'Only users with the staff role can be assigned to services' });
      return;
    }

    // 3. Check for existing active assignment
    const { data: existingAssignment, error: checkError } = await supabase
      .from('service_assignments')
      .select('id')
      .eq('staff_id', staffId)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      logger.error('POST assignments: duplicate check failed', { error: checkError.message });
      res.status(500).json({ error: 'Failed to create assignment' });
      return;
    }

    if (existingAssignment) {
      res.status(409).json({ error: 'Staff member is already assigned to this service' });
      return;
    }

    // 4. Create the assignment
    const { data: created, error: insertError } = await supabase
      .from('service_assignments')
      .insert({
        staff_id: staffId,
        service_id: serviceId,
        assigned_by: managerId,
      })
      .select('*')
      .single();

    if (insertError || !created) {
      logger.error('POST assignments: insert failed', { error: insertError?.message });
      res.status(500).json({ error: 'Failed to create assignment' });
      return;
    }

    // 5. Audit log
    await AuditLogger.logUserAction(
      managerId,
      'assign_staff',
      'staff_assignments',
      {
        assignmentId: created.id,
        staffId,
        serviceId,
        serviceName: service.name,
        staffEmail: targetUser.email,
      },
      req.ip,
    );

    res.status(201).json(mapAssignmentRow(created));
  } catch (err) {
    const error = err as Error;
    logger.error('POST /api/services/:id/assignments failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

/**
 * GET /api/services/:id/assignments — List all active assignments for a service.
 * Manager only.
 *
 * Returns assignment records joined with staff profile info.
 *
 * Requirements: 6.6
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const serviceId = req.params.id;

    // Verify the service exists
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Fetch active assignments for this service
    const { data: assignments, error: fetchError } = await supabase
      .from('service_assignments')
      .select('*, staff_profiles!inner(first_name, last_name, employee_id, department), users!service_assignments_staff_id_fkey(email)')
      .eq('service_id', serviceId)
      .eq('is_active', true);

    if (fetchError) {
      logger.error('GET assignments: query failed', { error: fetchError.message });
      // Fallback: fetch without joins if the join syntax fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('service_assignments')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true);

      if (fallbackError) {
        logger.error('GET assignments: fallback query also failed', { error: fallbackError.message });
        res.status(500).json({ error: 'Failed to fetch assignments' });
        return;
      }

      res.status(200).json((fallbackData ?? []).map(mapAssignmentRow));
      return;
    }

    // Map rows with staff profile info included
    const result = (assignments ?? []).map((row: Record<string, unknown>) => {
      const staffProfile = row.staff_profiles as Record<string, unknown> | null;
      const userRecord = row.users as Record<string, unknown> | null;

      return {
        ...mapAssignmentRow(row),
        staff: staffProfile
          ? {
              firstName: staffProfile.first_name,
              lastName: staffProfile.last_name,
              employeeId: staffProfile.employee_id,
              department: staffProfile.department,
              email: userRecord?.email ?? null,
            }
          : null,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as Error;
    logger.error('GET /api/services/:id/assignments failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

/**
 * DELETE /api/services/:id/assignments/:assignmentId — Soft-archive an assignment.
 * Manager only. Sets is_active = false, archived_at = now(), archived_by = manager.
 *
 * Requirements: 6.7, 6.8
 */
router.delete('/:assignmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: serviceId, assignmentId } = req.params;
    const managerId = req.user!.userId;

    // Fetch the assignment — must be active and belong to the specified service
    const { data: assignment, error: fetchError } = await supabase
      .from('service_assignments')
      .select('*, staff_profiles!inner(first_name, last_name)')
      .eq('id', assignmentId)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .single();

    if (fetchError || !assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const now = new Date().toISOString();

    // Soft-archive the assignment
    const { error: updateError } = await supabase
      .from('service_assignments')
      .update({
        is_active: false,
        archived_at: now,
        archived_by: managerId,
      })
      .eq('id', assignmentId);

    if (updateError) {
      logger.error('DELETE assignment: archive failed', { error: updateError.message });
      res.status(500).json({ error: 'Failed to remove assignment' });
      return;
    }

    const staffProfile = assignment.staff_profiles as Record<string, unknown> | null;

    // Audit log
    await AuditLogger.logUserAction(
      managerId,
      'remove_staff_assignment',
      'staff_assignments',
      {
        assignmentId,
        staffId: assignment.staff_id,
        serviceId,
        staffName: staffProfile
          ? `${staffProfile.first_name} ${staffProfile.last_name}`
          : assignment.staff_id,
      },
      req.ip,
    );

    res.status(200).json({ message: 'Assignment removed successfully' });
  } catch (err) {
    const error = err as Error;
    logger.error('DELETE /api/services/:id/assignments/:assignmentId failed', { error: error.message });
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

export default router;
