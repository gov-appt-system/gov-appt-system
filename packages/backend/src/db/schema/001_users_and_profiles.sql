-- Migration: 001_users_and_profiles
-- Replaces: 20240101000001_create_users_and_profiles.ts (Knex migration)
-- Deploy via: Supabase Dashboard > SQL Editor, or supabase CLI `supabase db push`

-- users — base identity table for all roles
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('client', 'staff', 'manager', 'admin')),
  is_active     BOOLEAN DEFAULT TRUE,
  archived_at   TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- clients — self-registered Filipino citizens
CREATE TABLE IF NOT EXISTS clients (
  user_id        UUID PRIMARY KEY REFERENCES users(id),
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  phone_number   VARCHAR(20) NOT NULL,
  address        TEXT NOT NULL,
  date_of_birth  DATE NOT NULL,
  government_id  VARCHAR(50) NOT NULL
);

-- staff_profiles — shared by 'staff' and 'manager' roles
CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id      UUID PRIMARY KEY REFERENCES users(id),
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  employee_id  VARCHAR(50) UNIQUE NOT NULL,
  department   VARCHAR(100) NOT NULL
);

-- admin_profiles — system-wide administrators
CREATE TABLE IF NOT EXISTS admin_profiles (
  user_id      UUID PRIMARY KEY REFERENCES users(id),
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  employee_id  VARCHAR(50) UNIQUE NOT NULL,
  department   VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_archived_at ON users(archived_at);
