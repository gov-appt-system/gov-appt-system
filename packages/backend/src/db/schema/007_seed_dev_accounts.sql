-- Seed: dev accounts
-- Replaces: 01_dev_accounts.ts (Knex seed)
-- NOTE: password_hash below is bcrypt(10 rounds) of 'Dev@12345'
--       Regenerate with: node -e "const b=require('bcrypt');b.hash('Dev@12345',10).then(console.log)"
--       DO NOT use in production.

-- Clean up in reverse FK order
DELETE FROM service_assignments;
DELETE FROM audit_logs;
DELETE FROM appointments;
DELETE FROM services;
DELETE FROM admin_profiles;
DELETE FROM staff_profiles;
DELETE FROM clients;
DELETE FROM users;

-- Insert base users (password: Dev@12345)
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.gov',   '$2b$10$PLACEHOLDER_HASH_ADMIN',   'admin',   TRUE),
  ('00000000-0000-0000-0000-000000000002', 'manager@example.gov', '$2b$10$PLACEHOLDER_HASH_MANAGER', 'manager', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'staff@example.gov',   '$2b$10$PLACEHOLDER_HASH_STAFF',   'staff',   TRUE),
  ('00000000-0000-0000-0000-000000000004', 'client@example.com',  '$2b$10$PLACEHOLDER_HASH_CLIENT',  'client',  TRUE);

-- NOTE: Replace PLACEHOLDER_HASH_* values with actual bcrypt hashes before running.

INSERT INTO admin_profiles (user_id, first_name, last_name, employee_id, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'System', 'Admin', 'EMP-ADMIN-001', 'IT Administration');

INSERT INTO staff_profiles (user_id, first_name, last_name, employee_id, department) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Maria', 'Santos',    'EMP-MGR-001', 'Civil Registry'),
  ('00000000-0000-0000-0000-000000000003', 'Juan',  'dela Cruz', 'EMP-STF-001', 'Civil Registry');

INSERT INTO clients (user_id, first_name, last_name, phone_number, address, date_of_birth, government_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'Ana', 'Reyes', '+639171234567',
   '123 Rizal Street, Manila, Philippines', '1990-05-15', 'PSN-1234-5678');
