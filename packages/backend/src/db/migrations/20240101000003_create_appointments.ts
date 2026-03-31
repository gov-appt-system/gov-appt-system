import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('appointments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('tracking_number', 20).unique().notNullable();
    table.uuid('client_id').notNullable().references('user_id').inTable('clients');
    table.uuid('service_id').notNullable().references('id').inTable('services');
    table.timestamp('appointment_date_time').notNullable();
    table.integer('duration').notNullable();
    table
      .string('status', 20)
      .notNullable()
      .defaultTo('pending')
      .checkIn(
        ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
        'appointments_status_check'
      );
    table.jsonb('personal_details').notNullable(); // snapshot of client details at booking time
    table.specificType('required_documents', 'TEXT[]');
    table.text('remarks');
    table.timestamp('archived_at').defaultTo(null);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('processed_by').references('user_id').inTable('staff_profiles'); // staff or manager who last acted
  });

  await knex.schema.raw('CREATE INDEX idx_appointments_client_id ON appointments(client_id)');
  await knex.schema.raw('CREATE INDEX idx_appointments_service_id ON appointments(service_id)');
  await knex.schema.raw('CREATE INDEX idx_appointments_date_time ON appointments(appointment_date_time)');
  await knex.schema.raw('CREATE INDEX idx_appointments_tracking_number ON appointments(tracking_number)');
  await knex.schema.raw('CREATE INDEX idx_appointments_status ON appointments(status)');
  await knex.schema.raw('CREATE INDEX idx_appointments_archived_at ON appointments(archived_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_appointments_archived_at');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_appointments_status');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_appointments_tracking_number');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_appointments_date_time');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_appointments_service_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_appointments_client_id');
  await knex.schema.dropTableIfExists('appointments');
}
