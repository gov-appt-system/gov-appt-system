import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

// Default password for all seed accounts: Dev@12345
const DEFAULT_PASSWORD = 'Dev@12345';
const SALT_ROUNDS = 10;

export async function seed(knex: Knex): Promise<void> {
  // Clean up in reverse FK order
  await knex('service_assignments').del();
  await knex('audit_logs').del();
  await knex('appointments').del();
  await knex('services').del();
  await knex('admin_profiles').del();
  await knex('staff_profiles').del();
  await knex('clients').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Insert users
  const [adminUser, managerUser, staffUser, clientUser] = await knex('users')
    .insert([
      {
        email: 'admin@example.gov',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      },
      {
        email: 'manager@example.gov',
        password_hash: passwordHash,
        role: 'manager',
        is_active: true,
      },
      {
        email: 'staff@example.gov',
        password_hash: passwordHash,
        role: 'staff',
        is_active: true,
      },
      {
        email: 'client@example.com',
        password_hash: passwordHash,
        role: 'client',
        is_active: true,
      },
    ])
    .returning('id');

  const adminId = adminUser.id ?? adminUser;
  const managerId = managerUser.id ?? managerUser;
  const staffId = staffUser.id ?? staffUser;
  const clientId = clientUser.id ?? clientUser;

  // Admin profile
  await knex('admin_profiles').insert({
    user_id: adminId,
    first_name: 'System',
    last_name: 'Admin',
    employee_id: 'EMP-ADMIN-001',
    department: 'IT Administration',
  });

  // Manager profile (shares staff_profiles table)
  await knex('staff_profiles').insert({
    user_id: managerId,
    first_name: 'Maria',
    last_name: 'Santos',
    employee_id: 'EMP-MGR-001',
    department: 'Civil Registry',
  });

  // Staff profile
  await knex('staff_profiles').insert({
    user_id: staffId,
    first_name: 'Juan',
    last_name: 'dela Cruz',
    employee_id: 'EMP-STF-001',
    department: 'Civil Registry',
  });

  // Client profile
  await knex('clients').insert({
    user_id: clientId,
    first_name: 'Ana',
    last_name: 'Reyes',
    phone_number: '+639171234567',
    address: '123 Rizal Street, Manila, Philippines',
    date_of_birth: '1990-05-15',
    government_id: 'PSN-1234-5678',
  });
}
