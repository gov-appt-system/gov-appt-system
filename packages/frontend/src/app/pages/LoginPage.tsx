import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface LoginFormData {
  email: string;
  password: string;
}

/** Return the default landing page for a given role. */
function dashboardForRole(role: string): string {
  return role === 'client' ? '/dashboard' : '/staff-dashboard';
}

export function LoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();

  // If the user is already authenticated, redirect away from the login page.
  useEffect(() => {
    if (isAuthenticated && role) {
      const from = (location.state as { from?: Location })?.from;
      navigate(from ?? dashboardForRole(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate, location.state]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    try {
      const success = await login(data.email, data.password);
      if (success) {
        toast.success('Login successful!');

        // After login the AuthContext state updates synchronously in the
        // same render cycle, so read the role from localStorage (which
        // authAPI.login already wrote) to decide where to redirect.
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const from = (location.state as { from?: Location })?.from;
        navigate(from ?? dashboardForRole(currentUser.role), { replace: true });
      } else {
        const errorMsg = 'Invalid email or password. Please check your credentials.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An error occurred. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gov-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[var(--gov-primary)] rounded-full flex items-center justify-center mb-4">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl text-[var(--gov-secondary)] mb-2">
              Government Appointment System
            </h1>
            <p className="text-gray-600 text-center">Sign in to manage your appointments</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <Link
              to="/forgot-password"
              className="text-[var(--gov-primary)] hover:underline text-sm w-full text-center block"
            >
              Forgot Password?
            </Link>
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--gov-primary)] hover:underline">
                Register Now
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Accounts:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Client:</span>
                <span>client@gov.ph / client123</span>
              </div>
              <div className="flex justify-between">
                <span>Staff:</span>
                <span>staff@gov.ph / staff123</span>
              </div>
              <div className="flex justify-between">
                <span>Manager:</span>
                <span>manager@gov.ph / manager123</span>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span>admin@gov.ph / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}