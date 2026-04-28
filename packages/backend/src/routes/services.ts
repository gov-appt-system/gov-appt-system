import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { supabase } from '../config/supabase';
import { AuditLogger } from '../services/audit';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../types';
import { logger } from '../config/logger';

const router: RouterType = Router();

// All services routes require authentication
router.use(authenticateToken);

// ============================================================
// Helper: map a DB row (snake_case) to the Service interface shape (camelCase)
// ============================================================
function mapServiceRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    department: row.department,
    duration: row.duration,
    capacity: row.capacity,
    operatingHours: {
      startTime: row.start_time,
      endTime: row.end_time,
      daysOfWeek: row.days_of_week,
    },
    requiredDocuments: row.required_documents ?? [],
    isActive: row.is_active,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * GET /api/services — List all active, non-archived services.
 * Accessible to Client, Staff, and Manager roles.
 * Requirements: 7.2
 */
router.get(
  '/',
  requireRole(UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .is('archived_at', null);

      if (error) {
        logger.error('GET /api/services: DB query failed', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch services' });
        return;
      }

      const services = (data ?? []).map(mapServiceRow);
      res.status(200).json(services);
    } catch (err) {
      const error = err as Error;
      logger.error('GET /api/services failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  },
);

/**
 * GET /api/services/:id — Fetch a single active service by ID.
 * Accessible to Client, Staff, and Manager roles.
 * Requirements: 7.2
 */
router.get(
  '/:id',
  requireRole(UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .is('archived_at', null)
        .single();

      if (error || !data) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.status(200).json(mapServiceRow(data));
    } catch (err) {
      const error = err as Error;
      logger.error('GET /api/services/:id failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  },
);

/**
 * POST /api/services — Create a new service.
 * Manager only.
 * Requirements: 7.1, 7.5, 7.6
 */
router.post(
  '/',
  requireRole(UserRole.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        department,
        duration,
        capacity,
        startTime,
        endTime,
        daysOfWeek,
        requiredDocuments,
      } = req.body;

      // Validate required fields
      if (
        !name ||
        !description ||
        !department ||
        !duration ||
        !capacity ||
        !startTime ||
        !endTime ||
        !daysOfWeek
      ) {
        res.status(400).json({
          error: 'Required fields: name, description, department, duration, capacity, startTime, endTime, daysOfWeek',
        });
        return;
      }

      // Check uniqueness: case-insensitive name among active services
      const { data: existing, error: checkError } = await supabase
        .from('services')
        .select('id')
        .ilike('name', name)
        .eq('is_active', true)
        .is('archived_at', null);

      if (checkError) {
        logger.error('POST /api/services: uniqueness check failed', { error: checkError.message });
        res.status(500).json({ error: 'Failed to create service' });
        return;
      }

      if (existing && existing.length > 0) {
        res.status(409).json({ error: 'A service with this name already exists' });
        return;
      }

      // Insert the new service
      const { data: created, error: insertError } = await supabase
        .from('services')
        .insert({
          name,
          description,
          department,
          duration,
          capacity,
          start_time: startTime,
          end_time: endTime,
          days_of_week: daysOfWeek,
          required_documents: requiredDocuments ?? [],
          created_by: req.user!.userId,
        })
        .select('*')
        .single();

      if (insertError || !created) {
        logger.error('POST /api/services: insert failed', { error: insertError?.message });
        res.status(500).json({ error: 'Failed to create service' });
        return;
      }

      // Audit log
      await AuditLogger.logUserAction(
        req.user!.userId,
        'create_service',
        'services',
        { serviceId: created.id, name },
        req.ip,
      );

      res.status(201).json(mapServiceRow(created));
    } catch (err) {
      const error = err as Error;
      logger.error('POST /api/services failed', { error: error.message });
      res.status(500).json({ error: 'Failed to create service' });
    }
  },
);

/**
 * PUT /api/services/:id — Update an existing service.
 * Manager only.
 * Requirements: 7.3, 7.5, 7.6
 */
router.put(
  '/:id',
  requireRole(UserRole.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Fetch existing service
      const { data: existing, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .is('archived_at', null)
        .single();

      if (fetchError || !existing) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      const {
        name,
        description,
        department,
        duration,
        capacity,
        startTime,
        endTime,
        daysOfWeek,
        requiredDocuments,
      } = req.body;

      // If name is being changed, check uniqueness (exclude current service)
      if (name && name !== existing.name) {
        const { data: duplicate, error: checkError } = await supabase
          .from('services')
          .select('id')
          .ilike('name', name)
          .eq('is_active', true)
          .is('archived_at', null)
          .neq('id', id);

        if (checkError) {
          logger.error('PUT /api/services/:id: uniqueness check failed', { error: checkError.message });
          res.status(500).json({ error: 'Failed to update service' });
          return;
        }

        if (duplicate && duplicate.length > 0) {
          res.status(409).json({ error: 'A service with this name already exists' });
          return;
        }
      }

      // Build update payload — only include provided fields
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (department !== undefined) updates.department = department;
      if (duration !== undefined) updates.duration = duration;
      if (capacity !== undefined) updates.capacity = capacity;
      if (startTime !== undefined) updates.start_time = startTime;
      if (endTime !== undefined) updates.end_time = endTime;
      if (daysOfWeek !== undefined) updates.days_of_week = daysOfWeek;
      if (requiredDocuments !== undefined) updates.required_documents = requiredDocuments;

      const { data: updated, error: updateError } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError || !updated) {
        logger.error('PUT /api/services/:id: update failed', { error: updateError?.message });
        res.status(500).json({ error: 'Failed to update service' });
        return;
      }

      // Audit log
      await AuditLogger.logUserAction(
        req.user!.userId,
        'update_service',
        'services',
        { serviceId: id, updatedFields: Object.keys(updates).filter((k) => k !== 'updated_at') },
        req.ip,
      );

      res.status(200).json(mapServiceRow(updated));
    } catch (err) {
      const error = err as Error;
      logger.error('PUT /api/services/:id failed', { error: error.message });
      res.status(500).json({ error: 'Failed to update service' });
    }
  },
);

/**
 * DELETE /api/services/:id — Soft-archive a service.
 * Manager only. Sets is_active = false and archived_at = now().
 * Requirements: 7.4, 7.6
 */
router.delete(
  '/:id',
  requireRole(UserRole.MANAGER),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Fetch existing service — must be active and not already archived
      const { data: existing, error: fetchError } = await supabase
        .from('services')
        .select('id, name')
        .eq('id', id)
        .eq('is_active', true)
        .is('archived_at', null)
        .single();

      if (fetchError || !existing) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('services')
        .update({
          is_active: false,
          archived_at: now,
          updated_at: now,
        })
        .eq('id', id);

      if (updateError) {
        logger.error('DELETE /api/services/:id: archive failed', { error: updateError.message });
        res.status(500).json({ error: 'Failed to archive service' });
        return;
      }

      // Audit log
      await AuditLogger.logUserAction(
        req.user!.userId,
        'archive_service',
        'services',
        { serviceId: id, name: existing.name },
        req.ip,
      );

      res.status(200).json({ message: 'Service archived successfully' });
    } catch (err) {
      const error = err as Error;
      logger.error('DELETE /api/services/:id failed', { error: error.message });
      res.status(500).json({ error: 'Failed to archive service' });
    }
  },
);

export default router;
