import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAs } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectAfterLogin = (role: string) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'FACULTY') navigate('/faculty/dashboard');
    else navigate('/student/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await login(email, password);
      showToast({ type: 'success', title: 'Welcome back!', message: `Logged in as ${user.full_name}` });
      redirectAfterLogin(user.role);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      showToast({ type: 'error', title: 'Authentication Failed', message: err.message || 'Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'faculty' | 'student') => {
    setIsLoading(true);
    setError(null);
    try {
      await quickLoginAs(role);
      showToast({ type: 'success', title: 'Demo Persona Loaded', message: `Signed in as ${role.toUpperCase()}` });
      redirectAfterLogin(role.toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/25 mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Sign in to CIMS Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter your institutional credentials to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8">
          
          {/* Quick Demo One-Click Access Box */}
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>One-Click Demo Credentials</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mb-3">
              Click any role to instantaneously sign in with pre-seeded demo credentials:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                disabled={isLoading}
                className="py-1.5 px-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 shadow-sm transition-all text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('faculty')}
                disabled={isLoading}
                className="py-1.5 px-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-800 hover:bg-brand-50 shadow-sm transition-all text-center"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={isLoading}
                className="py-1.5 px-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 shadow-sm transition-all text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. student@demo.local"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => alert("For testing, demo accounts passwords are:\nAdmin: Admin@1234\nFaculty: Faculty@1234\nStudent: Student@1234")}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an institutional account yet?{' '}
              <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
                Register as Student
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
