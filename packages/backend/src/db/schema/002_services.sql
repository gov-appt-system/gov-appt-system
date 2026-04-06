-- Migration: 002_services
-- Replaces: 20240101000002_create_services.ts (Knex migration)

CREATE TABLE IF NOT EXISTS services (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(200) NOT NULL,
  description        TEXT,
  department         VARCHAR(100) NOT NULL,
  duration           INTEGER NOT NULL,           -- minutes per appointment slot
  capacity           INTEGER NOT NULL DEFAULT 1, -- max concurrent appointments per slot
  start_time         TIME NOT NULL,
  end_time           TIME NOT NULL,
  days_of_week       INTEGER[] NOT NULL,          -- 0=Sunday…6=Saturday
  required_documents TEXT[],
  is_active          BOOLEAN DEFAULT TRUE,
  archived_at        TIMESTAMPTZ DEFAULT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  created_by         UUID REFERENCES users(id)   -- must be a manager
);

CREATE INDEX IF NOT EXISTS idx_services_archived_at ON services(archived_at);
