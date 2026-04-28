import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');

    try {
      await authAPI.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err: unknown) {
      // Always show success to prevent email enumeration.
      // The API should also behave this way, but we handle it client-side too.
      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast.success('Reset link sent! Check your email.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gov-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[var(--gov-primary)] rounded-full flex items-center justify-center mb-4">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl text-[var(--gov-secondary)] mb-2">Forgot Password</h1>
            <p className="text-gray-600 text-center">
              {submitted
                ? 'Check your email for a reset link'
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {submitted ? (
            /* ── Success state ── */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <Mail size={32} className="mx-auto text-green-600 mb-2" />
                <p className="text-sm text-green-800">
                  If an account exists for <strong>{submittedEmail}</strong>, you will receive a
                  password reset link shortly.
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                  setSubmittedEmail('');
                }}
              >
                Try a different email
              </Button>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
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
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

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
