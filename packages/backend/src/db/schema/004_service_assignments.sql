-- Migration: 004_service_assignments
-- Replaces: 20240101000004_create_service_assignments.ts (Knex migration)

CREATE TABLE IF NOT EXISTS service_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID NOT NULL REFERENCES staff_profiles(user_id),
  service_id  UUID NOT NULL REFERENCES services(id),
  is_active   BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),   -- must be a manager
  archived_at TIMESTAMPTZ DEFAULT NULL,    -- NULL = active; set on removal
  archived_by UUID REFERENCES users(id)    -- manager who removed the assignment
);

-- Only one active assignment per staff+service pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_assignments_active
  ON service_assignments(staff_id, service_id)
  WHERE is_active = TRUE;
