import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { ApplicationStatus } from '../../types';

export interface TimelineEvent {
  status: ApplicationStatus | string;
  label: string;
  comment?: string | null;
  date?: string | null;
  changedByName?: string | null;
}

export interface TimelineProps {
  events?: TimelineEvent[];
  currentStatus?: ApplicationStatus | string;
  status?: ApplicationStatus | string;
}

export const ApplicationProgressTimeline: React.FC<TimelineProps> = ({
  events = [],
  currentStatus,
  status,
}) => {
  const effectiveStatus = (status || currentStatus || 'pending').toLowerCase();
  const stages = ['pending', 'shortlisted', 'interview_scheduled', 'accepted'];
  const stageIndex = stages.indexOf(effectiveStatus);

  const allStages = [
    { key: 'pending', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview_scheduled', label: 'Interview Scheduled' },
    { key: 'accepted', label: 'Accepted' },
  ];

  const getStatusIcon = (st: string, isActive: boolean, isPast: boolean) => {
    const s = st.toLowerCase();
    if (s === 'rejected') return <XCircle className="w-5 h-5 text-rose-500" />;
    if (s === 'withdrawn') return <AlertCircle className="w-5 h-5 text-slate-500" />;
    if (isPast || isActive) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    return <Clock className="w-5 h-5 text-slate-300 dark:text-slate-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Visual Stages Bar */}
      <div className="flex items-center justify-between relative px-2 py-3">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
        {allStages.map((stage, idx) => {
          const isCompleted =
            events.some((e) => String(e.status).toLowerCase() === stage.key) ||
            (stageIndex !== -1 && idx < stageIndex) ||
            effectiveStatus === 'accepted';
          const isCurrent = effectiveStatus === stage.key;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className="text-[11px] font-medium mt-1 text-slate-600 dark:text-slate-400 text-center">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal statuses (Rejected / Withdrawn) indicator */}
      {(effectiveStatus === 'rejected' || effectiveStatus === 'withdrawn') && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
            effectiveStatus === 'rejected'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
              : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
          }`}
        >
          {getStatusIcon(effectiveStatus, true, false)}
          <span>
            Application has been marked as{' '}
            <strong className="capitalize">{effectiveStatus}</strong>.
          </span>
        </div>
      )}

      {/* Detailed events list if events exist */}
      {events.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {ev.label || String(ev.status).replace(/_/g, ' ')}
                </span>
                {ev.changedByName && <span> by {ev.changedByName}</span>}
                {ev.date && <span className="text-[10px] text-slate-400 ml-1.5">({ev.date})</span>}
                {ev.comment && <p className="text-[11px] text-slate-500 mt-0.5">{ev.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
