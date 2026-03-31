import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('services', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description');
    table.string('department', 100).notNullable();
    table.integer('duration').notNullable(); // minutes per appointment slot
    table.integer('capacity').notNullable().defaultTo(1); // max concurrent appointments per slot
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.specificType('days_of_week', 'INTEGER[]').notNullable(); // 0=Sunday…6=Saturday
    table.specificType('required_documents', 'TEXT[]');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('archived_at').defaultTo(null);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users'); // must be a manager
  });

  await knex.schema.raw('CREATE INDEX idx_services_archived_at ON services(archived_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_services_archived_at');
  await knex.schema.dropTableIfExists('services');
}
