import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

/** Password complexity rules matching backend validatePasswordComplexity. */
function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

function isPasswordValid(password: string): boolean {
  const checks = getPasswordChecks(password);
  return checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>();

  const watchedPassword = watch('password', '');
  const passwordChecks = getPasswordChecks(watchedPassword);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    if (!isPasswordValid(data.password)) {
      setError('Password does not meet complexity requirements.');
      return;
    }

    try {
      await authAPI.resetPassword(token, data.password);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. The link may have expired.';
      setError(message);
      toast.error(message);
    }
  };

  /* ── Missing or invalid token ── */
  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--gov-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl text-[var(--gov-secondary)] mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--gov-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl text-[var(--gov-secondary)] mb-2">Password Reset</h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now sign in with your new
              password.
            </p>
            <Button
              className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Reset form ── */
  return (
    <div className="min-h-screen bg-[var(--gov-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[var(--gov-primary)] rounded-full flex items-center justify-center mb-4">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl text-[var(--gov-secondary)] mb-2">Reset Password</h1>
            <p className="text-gray-600 text-center">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  {...register('password', {
                    required: 'Password is required',
                    validate: (value) =>
                      isPasswordValid(value) || 'Password does not meet all requirements',
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}

              {/* Password strength indicators */}
              {watchedPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <PasswordCheck passed={passwordChecks.minLength} label="At least 8 characters" />
                  <PasswordCheck passed={passwordChecks.hasUppercase} label="One uppercase letter" />
                  <PasswordCheck passed={passwordChecks.hasLowercase} label="One lowercase letter" />
                  <PasswordCheck passed={passwordChecks.hasNumber} label="One number" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="reset-confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="reset-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === watchedPassword || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Server error */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-[var(--gov-primary)] hover:underline"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper component ── */

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {passed ? (
        <CheckCircle2 size={14} className="text-green-600 shrink-0" />
      ) : (
        <XCircle size={14} className="text-gray-400 shrink-0" />
      )}
      <span className={passed ? 'text-green-700' : 'text-gray-500'}>{label}</span>
    </div>
  );
}
