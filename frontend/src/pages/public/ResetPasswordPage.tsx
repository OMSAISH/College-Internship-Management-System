import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Check, X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useNotifications } from '../../contexts/NotificationContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const checks = [
    { label: 'Minimum 8 characters', valid: newPassword.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(newPassword) },
    { label: 'Number (0-9)', valid: /[0-9]/.test(newPassword) },
    { label: 'Special character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=[\]{}|;':,.<>?/]/.test(newPassword) },
  ];
  const isPasswordValid = checks.every(c => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing or invalid password reset token.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please fulfill all password security rules.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await api.resetPassword({ token, new_password: newPassword });
      setIsSuccess(true);
      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been reset. Please sign in with your new credentials.'
      });
    } catch (err: any) {
      setError(err.message || 'The password reset token is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/25 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create New Password
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter and confirm your new secure account password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Password Requirements:
                </p>
                {checks.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {c.valid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 stroke-[2]" />
                    )}
                    <span className={c.valid ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={!isPasswordValid || newPassword !== confirmPassword}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Reset & Update Password
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Reset Complete
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Your password has been securely updated. All active sessions have been invalidated across all devices.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button size="lg" className="w-full">
                    Sign In with New Password
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
