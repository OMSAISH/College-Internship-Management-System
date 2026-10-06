import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap, Mail, Lock, ShieldCheck, KeyRound,
  ArrowRight, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const LoginPage: React.FC = () => {
  const { login, complete2FALogin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Step 1: Email & Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Two-Factor Authentication
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const redirectAfterLogin = (role: string) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'FACULTY') navigate('/faculty/dashboard');
    else navigate('/student/dashboard');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await login(email, password);
      
      if (res.requires2FA && res.tempToken) {
        setTempToken(res.tempToken);
        setIs2FAStep(true);
        showToast({
          type: 'info',
          title: 'Two-Factor Required',
          message: 'Please enter the 6-digit code from your authenticator app.'
        });
      } else if (res.requires2FASetup && res.tempToken) {
        // Admin or user requiring mandatory 2FA configuration
        navigate(`/setup-2fa?ticket=${res.tempToken}&email=${encodeURIComponent(email)}`);
      } else if (res.user) {
        showToast({
          type: 'success',
          title: 'Welcome back!',
          message: `Logged in as ${res.user.first_name} ${res.user.last_name}`
        });
        redirectAfterLogin(res.user.role);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Please check your credentials.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;

    setError(null);
    setIsLoading(true);
    try {
      const user = await complete2FALogin(
        tempToken,
        useRecoveryCode ? undefined : totpCode,
        useRecoveryCode ? recoveryCode : undefined
      );

      showToast({
        type: 'success',
        title: 'Identity Verified',
        message: `Welcome back, ${user.first_name} ${user.last_name}`
      });
      redirectAfterLogin(user.role);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
      showToast({
        type: 'error',
        title: '2FA Failed',
        message: err.message || 'Invalid code.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/25 mb-3">
          {is2FAStep ? <ShieldCheck className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {is2FAStep ? 'Verify Your Identity' : 'Sanjivani University CIMS'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {is2FAStep
            ? (useRecoveryCode ? 'Enter one of your 10 backup recovery codes' : 'Enter the 6-digit code from your authenticator app')
            : 'Enter your institutional email & password to access your portal'}
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

          {!is2FAStep ? (
            /* Step 1: Password Login Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Institutional Email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@student.sanjivani.edu.in"
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
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
                  autoComplete="current-password"
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Portal
              </Button>
            </form>
          ) : (
            /* Step 2: Dedicated 2FA Screen */
            <form onSubmit={handle2FASubmit} className="space-y-5">
              <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 text-center">
                <p className="text-xs text-brand-900 dark:text-brand-200 font-medium">
                  Authentication Challenge for:
                </p>
                <p className="text-xs font-bold text-brand-700 dark:text-brand-300 mt-0.5 font-mono">
                  {email}
                </p>
              </div>

              {!useRecoveryCode ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 text-center">
                    6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Open Google Authenticator, Microsoft Authenticator, or Authy
                  </p>
                </div>
              ) : (
                <div>
                  <Input
                    label="Backup Recovery Code"
                    type="text"
                    autoFocus
                    required
                    value={recoveryCode}
                    onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    leftIcon={<KeyRound className="w-4 h-4" />}
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Recovery codes are single-use. Once verified, this code will be permanently consumed.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                disabled={!useRecoveryCode ? totpCode.length !== 6 : !recoveryCode.trim()}
              >
                Verify & Access Account
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseRecoveryCode(!useRecoveryCode);
                    setError(null);
                  }}
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {useRecoveryCode ? 'Use 6-digit authenticator code' : "Can't access authenticator? Use recovery code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIs2FAStep(false);
                    setTempToken(null);
                    setTotpCode('');
                    setRecoveryCode('');
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New student at Sanjivani University?{' '}
              <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
                Register account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
