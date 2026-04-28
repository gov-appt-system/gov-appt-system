-- Migration: 003_appointments
-- Replaces: 20240101000003_create_appointments.ts (Knex migration)

CREATE TABLE IF NOT EXISTS appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number       VARCHAR(20) UNIQUE NOT NULL,
  client_id             UUID NOT NULL REFERENCES clients(user_id),
  service_id            UUID NOT NULL REFERENCES services(id),
  appointment_date_time TIMESTAMPTZ NOT NULL,
  duration              INTEGER NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  personal_details      JSONB NOT NULL,  -- snapshot of client details at booking time
  required_documents    TEXT[],
  remarks               TEXT,
  archived_at           TIMESTAMPTZ DEFAULT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  processed_by          UUID REFERENCES staff_profiles(user_id) -- staff or manager who last acted
);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id       ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id      ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time       ON appointments(appointment_date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_tracking_number ON appointments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_appointments_status          ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_archived_at     ON appointments(archived_at);
