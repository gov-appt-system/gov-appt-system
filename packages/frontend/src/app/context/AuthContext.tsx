import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { authAPI, User } from '../services/api';

export type UserRole = 'client' | 'staff' | 'manager' | 'admin';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  /** Check whether the current user has one of the given roles. */
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialising, setInitialising] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setInitialising(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const role: UserRole | null = user?.role ?? null;

  const hasRole = useCallback(
    (...roles: UserRole[]) => role !== null && roles.includes(role),
    [role],
  );

  // Don't render children until we've checked for an existing session.
  // This prevents a flash of the login page when the user is already authenticated.
  if (initialising) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ user, role, login, logout, isAuthenticated: !!user, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}