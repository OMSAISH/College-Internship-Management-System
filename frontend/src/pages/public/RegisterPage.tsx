import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Phone, Check, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

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
      setError('Please fulfill all password security requirements.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const user = await register(formData);
      showToast({ type: 'success', title: 'Registration Successful!', message: `Welcome to CIMS, ${user.full_name}` });
      if (user.role === 'FACULTY') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      showToast({ type: 'error', title: 'Registration Error', message: err.message || 'Could not complete registration.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/25 mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create Institutional Account
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Join the centralized campus internship management system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Jane"
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Last Name"
                required
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>

            <Input
              label="Email Address"
              type="text"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane.doe@university.edu"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 019-2831"
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Select
              label="Institutional Role"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'STUDENT', label: 'Student Candidate' },
                { value: 'FACULTY', label: 'Faculty Coordinator' }
              ]}
            />

            <div>
              <Input
                label="Create Password"
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
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={!isPasswordValid}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register & Continue
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already registered?{' '}
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
