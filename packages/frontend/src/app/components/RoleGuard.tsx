import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

interface RoleGuardProps {
  /** One or more roles that are allowed to access the child routes. */
  allowedRoles: UserRole[];
  /**
   * Where to redirect when the user's role is not in `allowedRoles`.
   * Defaults to the role-appropriate dashboard.
   */
  fallback?: string;
}

/**
 * Restricts child routes to users whose role is in `allowedRoles`.
 * Must be nested inside `<ProtectedRoute>` (which guarantees `user` is non-null).
 *
 * If the user's role is not permitted, they are redirected to their
 * role-appropriate dashboard (or a custom `fallback` path).
 */
export function RoleGuard({ allowedRoles, fallback }: RoleGuardProps) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    const redirectTo = fallback ?? getDashboardForRole(role);
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

/** Returns the default dashboard path for a given role. */
function getDashboardForRole(role: UserRole | null): string {
  switch (role) {
    case 'client':
      return '/dashboard';
    case 'staff':
    case 'manager':
    case 'admin':
      return '/staff-dashboard';
    default:
      return '/login';
  }
}
