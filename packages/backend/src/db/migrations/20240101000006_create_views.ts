import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // All staff accounts with their active assigned services (manager dashboard)
  await knex.schema.raw(`
    CREATE VIEW manager_staff_overview AS
    SELECT
      u.id            AS user_id,
      u.email,
      u.role,
      u.is_active,
      u.archived_at,
      sp.first_name,
      sp.last_name,
      sp.employee_id,
      sp.department,
      COALESCE(
        json_agg(
          json_build_object(
            'service_id',   sa.service_id,
            'service_name', svc.name,
            'assigned_at',  sa.assigned_at,
            'assigned_by',  sa.assigned_by
          )
        ) FILTER (WHERE sa.service_id IS NOT NULL AND sa.is_active = true),
        '[]'
      ) AS assigned_services
    FROM users u
    JOIN staff_profiles sp ON sp.user_id = u.id
    LEFT JOIN service_assignments sa  ON sa.staff_id = u.id
    LEFT JOIN services svc            ON svc.id = sa.service_id
    WHERE u.role = 'staff'
    GROUP BY u.id, u.email, u.role, u.is_active, u.archived_at,
             sp.first_name, sp.last_name, sp.employee_id, sp.department
  `);

  // All appointments across all services (manager oversight — active and archived)
  await knex.schema.raw(`
    CREATE VIEW manager_appointments_overview AS
    SELECT
      a.*,
      svc.name        AS service_name,
      svc.department  AS service_department,
      svc.created_by  AS service_manager_id
    FROM appointments a
    JOIN services svc ON svc.id = a.service_id
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP VIEW IF EXISTS manager_appointments_overview');
  await knex.schema.raw('DROP VIEW IF EXISTS manager_staff_overview');
}
