-- Migration: 005_audit_logs
-- Replaces: 20240101000005_create_audit_logs.ts (Knex migration)

-- audit_logs — immutable record of all system actions (no soft-delete)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp  TIMESTAMPTZ DEFAULT NOW(),
  user_id    UUID REFERENCES users(id),  -- actor (NULL for system events)
  action     VARCHAR(100) NOT NULL,
  resource   VARCHAR(100) NOT NULL,
  details    JSONB,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id   ON audit_logs(user_id);
