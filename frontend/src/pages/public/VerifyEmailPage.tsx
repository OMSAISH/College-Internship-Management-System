import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing verification token in link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.verifyEmail(token);
        setStatus('success');
        setUserEmail(res.email);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'The verification link is invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Email Verification
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Sanjivani University Institutional Identity Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 text-center">
          {status === 'loading' && (
            <div className="py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Verifying your email address...
              </p>
              <p className="text-xs text-slate-400">
                Please wait while we confirm your security credentials.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Email Successfully Verified!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Your institutional email address ({userEmail}) is confirmed. You can now log in and configure Two-Factor Authentication.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Continue to Login & 2FA Setup
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Verification Failed
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login">
                  <Button variant="outline" size="md" className="w-full">
                    Return to Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="ghost" size="md" className="w-full">
                    Register New Account
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
