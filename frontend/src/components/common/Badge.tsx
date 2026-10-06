import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'brand' | 'default';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  dot = false,
}) => {
  const base = 'inline-flex items-center font-medium rounded-full border transition-colors';

  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800',
    brand: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const dots: Record<string, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    brand: 'bg-indigo-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-500',
    default: 'bg-slate-500',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dots[variant])}></span>}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || '';
  if (norm === 'ACCEPTED' || norm === 'COMPLETED' || norm === 'PASSED' || norm === 'PLACED' || norm === 'APPROVED') {
    return <Badge variant="success" size={size} dot>{status.replace(/_/g, ' ')}</Badge>;
  }
  if (norm === 'PENDING' || norm === 'PENDING_APPROVAL' || norm === 'SUBMITTED' || norm === 'IN_REVIEW' || norm === 'ON_HOLD') {
    return <Badge variant="warning" size={size} dot>{status.replace(/_/g, ' ')}</Badge>;
  }
  if (norm === 'SHORTLISTED' || norm === 'INTERVIEW_SCHEDULED' || norm === 'SCHEDULED' || norm === 'RESCHEDULED') {
    return <Badge variant="brand" size={size} dot>{status.replace(/_/g, ' ')}</Badge>;
  }
  if (norm === 'REJECTED' || norm === 'CANCELLED' || norm === 'FAILED') {
    return <Badge variant="danger" size={size} dot>{status.replace(/_/g, ' ')}</Badge>;
  }
  return <Badge variant="neutral" size={size}>{status?.replace(/_/g, ' ') || 'UNKNOWN'}</Badge>;
};
