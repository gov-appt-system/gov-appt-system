import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('service_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('staff_id').notNullable().references('user_id').inTable('staff_profiles');
    table.uuid('service_id').notNullable().references('id').inTable('services');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.uuid('assigned_by').references('id').inTable('users'); // must be a manager
    table.timestamp('archived_at').defaultTo(null); // NULL = active; set on removal
    table.uuid('archived_by').references('id').inTable('users'); // manager who removed the assignment
  });

  // Partial unique index — only one active assignment per staff+service pair
  await knex.schema.raw(
    'CREATE UNIQUE INDEX idx_service_assignments_active ON service_assignments(staff_id, service_id) WHERE is_active = true'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_service_assignments_active');
  await knex.schema.dropTableIfExists('service_assignments');
}
