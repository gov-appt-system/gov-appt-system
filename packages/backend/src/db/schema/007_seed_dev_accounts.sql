-- Seed: dev accounts
-- Password for ALL accounts: Dev@12345
-- Hash generated with: node gen-hash.js (bcrypt 10 rounds)
-- DO NOT use in production.

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
-- bcrypt hash: $2a$10$bVL9QXYTO0QxaoVRn7tAVOglwytGIg0ubbPvpQXRkaor28CQ89iDy
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.gov',   '$2a$10$bVL9QXYTO0QxaoVRn7tAVOglwytGIg0ubbPvpQXRkaor28CQ89iDy', 'admin',   TRUE),
  ('00000000-0000-0000-0000-000000000002', 'manager@example.gov', '$2a$10$bVL9QXYTO0QxaoVRn7tAVOglwytGIg0ubbPvpQXRkaor28CQ89iDy', 'manager', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'staff@example.gov',   '$2a$10$bVL9QXYTO0QxaoVRn7tAVOglwytGIg0ubbPvpQXRkaor28CQ89iDy', 'staff',   TRUE),
  ('00000000-0000-0000-0000-000000000004', 'client@example.com',  '$2a$10$bVL9QXYTO0QxaoVRn7tAVOglwytGIg0ubbPvpQXRkaor28CQ89iDy', 'client',  TRUE);

-- Admin profile
INSERT INTO admin_profiles (user_id, first_name, last_name, employee_id, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'System', 'Admin', 'EMP-ADMIN-001', 'IT Administration');

-- Manager and Staff profiles (both use staff_profiles table)
INSERT INTO staff_profiles (user_id, first_name, last_name, employee_id, department) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Maria', 'Santos',    'EMP-MGR-001', 'Civil Registry'),
  ('00000000-0000-0000-0000-000000000003', 'Juan',  'dela Cruz', 'EMP-STF-001', 'Civil Registry');

-- Client profile
INSERT INTO clients (user_id, first_name, last_name, phone_number, address, date_of_birth, government_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'Ana', 'Reyes', '+639171234567',
   '123 Rizal Street, Manila, Philippines', '1990-05-15', 'PSN-1234-5678');
