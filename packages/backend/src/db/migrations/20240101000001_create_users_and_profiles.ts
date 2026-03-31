import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // users — base identity table for all roles
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table
      .string('role', 20)
      .notNullable()
      .checkIn(['client', 'staff', 'manager', 'admin'], 'users_role_check');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('archived_at').defaultTo(null);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // clients — self-registered Filipino citizens
  await knex.schema.createTable('clients', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone_number', 20).notNullable();
    table.text('address').notNullable();
    table.date('date_of_birth').notNullable();
    table.string('government_id', 50).notNullable();
  });

  // staff_profiles — shared by 'staff' and 'manager' roles
  await knex.schema.createTable('staff_profiles', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('employee_id', 50).unique().notNullable();
    table.string('department', 100).notNullable();
  });

  // admin_profiles — system-wide administrators
  await knex.schema.createTable('admin_profiles', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('employee_id', 50).unique().notNullable();
    table.string('department', 100).notNullable();
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_users_role ON users(role)');
  await knex.schema.raw('CREATE INDEX idx_users_archived_at ON users(archived_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_archived_at');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_role');
  await knex.schema.dropTableIfExists('admin_profiles');
  await knex.schema.dropTableIfExists('staff_profiles');
  await knex.schema.dropTableIfExists('clients');
  await knex.schema.dropTableIfExists('users');
}
