import { supabase } from '../config/supabase';
import { UserRole } from '../types';

// ============================================================
// Permission Matrix
// Single source of truth for all RBAC checks.
// Maps resource -> action -> set of allowed roles.
// ============================================================

type Action = string;
type Resource = string;

const PERMISSION_MATRIX: Record<Resource, Record<Action, UserRole[]>> = {
  auth: {
    login: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
    logout: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
    register: [UserRole.CLIENT],
    password_reset: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
  },
  own_profile: {
    view: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
    edit: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
    deactivate: [UserRole.CLIENT],
  },
  appointments: {
    book: [UserRole.CLIENT],
    view_own: [UserRole.CLIENT],
    track: [UserRole.CLIENT],
    view_queue: [UserRole.STAFF, UserRole.MANAGER],
    update_status: [UserRole.STAFF, UserRole.MANAGER],
    cancel_own: [UserRole.CLIENT],
  },
  services: {
    view: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER],
    create: [UserRole.MANAGER],
    edit: [UserRole.MANAGER],
    archive: [UserRole.MANAGER],
  },
  staff_assignments: {
    assign: [UserRole.MANAGER],
    remove: [UserRole.MANAGER],
    view: [UserRole.MANAGER],
  },
  user_accounts: {
    create_staff: [UserRole.ADMIN],
    create_manager: [UserRole.ADMIN],
    view_staff_managers: [UserRole.ADMIN],
    archive: [UserRole.ADMIN],
    view_clients: [UserRole.ADMIN],
    manage_clients: [UserRole.ADMIN],
  },
  audit_logs: {
    view: [UserRole.ADMIN],
    export: [UserRole.ADMIN],
  },
};

// ============================================================
// RBACController
// ============================================================

export class RBACController {
  /**
   * Returns true if the given role has permission for resource/action.
   * Does NOT check is_active — call enforcePermission for full validation.
   */
  hasPermission(role: UserRole, resource: Resource, action: Action): boolean {
    const allowedRoles = PERMISSION_MATRIX[resource]?.[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
  }

  /**
   * Fetches the user's role and active status from the DB, then checks
   * the permission matrix. Throws a 403 error on denial or if the user
   * is archived/inactive.
   */
  async enforcePermission(
    userId: string,
    resource: Resource,
    action: Action,
  ): Promise<void> {
    const { data: user, error } = await supabase
      .from('users')
      .select('role, is_active, archived_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw Object.assign(new Error('User not found'), { statusCode: 403 });
    }

    if (!user.is_active || user.archived_at !== null) {
      throw Object.assign(
        new Error('Access denied: account is inactive or archived'),
        { statusCode: 403 },
      );
    }

    if (!this.hasPermission(user.role as UserRole, resource, action)) {
      throw Object.assign(
        new Error(`Access denied: role '${user.role}' cannot perform '${action}' on '${resource}'`),
        { statusCode: 403 },
      );
    }
  }

  /**
   * Returns true if the user may access the given service:
   * - Clients always have access (to book/view services)
   * - Staff/Manager must have an active service_assignments row
   */
  async canAccessService(userId: string, serviceId: string): Promise<boolean> {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, is_active, archived_at')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.is_active || user.archived_at !== null) {
      return false;
    }

    if (user.role === UserRole.CLIENT) {
      return true;
    }

    if (user.role === UserRole.STAFF || user.role === UserRole.MANAGER) {
      const { data: assignment, error: assignError } = await supabase
        .from('service_assignments')
        .select('id')
        .eq('staff_id', userId)
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .maybeSingle();

      if (assignError) return false;
      return assignment !== null;
    }

    // Admin has no access to services by design
    return false;
  }
}

export const rbacController = new RBACController();
