import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'brand' | 'emerald' | 'amber' | 'sky' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'brand',
}) => {
  const colorStyles = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border-brand-100 dark:border-brand-900',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border-sky-100 dark:border-sky-900',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-100 dark:border-rose-900',
  };

  return (
    <Card hover className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </span>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' : 'text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-400'
          }`}>
            {trend.isPositive ? '↑ ' : '↓ '}
            {trend.value} {trend.label}
          </div>
        )}
      </div>
    </Card>
  );
};
