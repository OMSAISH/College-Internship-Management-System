import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Mail, Lock, User, Phone, Check, X,
  ArrowRight, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { api } from '../../services/api';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useNotifications();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'STUDENT',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Password rules validation
  const pwd = formData.password;
  const checks = [
    { label: 'Minimum 8 characters', valid: pwd.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(pwd) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(pwd) },
    { label: 'Number (0-9)', valid: /[0-9]/.test(pwd) },
    { label: 'Special character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=[\]{}|;':,.<>?/]/.test(pwd) },
  ];
  const isPasswordValid = checks.every(c => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password security criteria.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      // Role is locked to STUDENT for public registration
      await register({
        ...formData,
        role: 'STUDENT'
      });
      setRegisteredEmail(formData.email);
      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Verification link sent to your institutional email address.'
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      showToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'Could not complete registration.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      await api.resendVerification(registeredEmail);
      showToast({
        type: 'info',
        title: 'Email Sent',
        message: 'A fresh verification link has been dispatched to your email.'
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not resend email.'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/25 mb-3">
          {registeredEmail ? <CheckCircle2 className="w-7 h-7 text-emerald-300" /> : <GraduationCap className="w-7 h-7" />}
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {registeredEmail ? 'Verify Your Email' : 'Student Account Registration'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {registeredEmail
            ? `Confirmation link sent to ${registeredEmail}`
            : 'Sanjivani University Centralized Training & Placement Portal'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {!registeredEmail ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Aarav"
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Last Name"
                  required
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Sharma"
                />
              </div>

              <Input
                label="Student Email Address"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="aarav.sharma@student.sanjivani.edu.in"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="font-semibold">Registered Role:</span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Student Candidate
                </span>
              </div>

              <div>
                <Input
                  label="Create Strong Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                {/* Password Requirements Checklist */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Password Security Rules:
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
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={!isPasswordValid}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account & Send Verification
              </Button>
            </form>
          ) : (
            /* Post-Registration Email Verification Notice */
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left">
                <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  We've sent a cryptographically secure verification link to <strong>{registeredEmail}</strong>.
                  Please check your inbox and click the link to confirm your email and proceed to Two-Factor Authentication setup.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleResend}
                  isLoading={resending}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Resend Verification Email
                </Button>

                <Link to="/login">
                  <Button variant="ghost" size="md" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already verified?{' '}
              <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
