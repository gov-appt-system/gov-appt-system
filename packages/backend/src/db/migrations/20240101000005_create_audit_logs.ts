import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // audit_logs — immutable record of all system actions (no soft-delete)
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.uuid('user_id').references('id').inTable('users'); // actor (NULL for system events)
    table.string('action', 100).notNullable();
    table.string('resource', 100).notNullable();
    table.jsonb('details');
    table.specificType('ip_address', 'INET');
  });

  await knex.schema.raw('CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp)');
  await knex.schema.raw('CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_audit_logs_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_audit_logs_timestamp');
  await knex.schema.dropTableIfExists('audit_logs');
}
