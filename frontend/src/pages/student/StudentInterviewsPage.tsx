import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, MapPin, Building2,
  ExternalLink, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Interview } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentInterviewsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.listInterviews()
      .then(setInterviews)
      .catch(() => showToast({ type: 'error', message: 'Could not load interviews.' }))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const upcoming = interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'RESCHEDULED');
  const past = interviews.filter(i => i.status === 'COMPLETED' || i.status === 'CANCELLED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Interview Schedule & Feedback
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Keep track of corporate screening rounds, calendar invites, and recruiter feedback
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
          >
            Calendar Grid
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-6 h-6" />}
          title="No Interviews Scheduled Yet"
          description="When faculty coordinators and corporate recruiters shortlist your application, your scheduled interview rounds will appear here."
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-8">
          
          {/* Upcoming Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" /> Upcoming Scheduled Rounds ({upcoming.length})
            </h2>

            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No upcoming rounds pending.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(iv => (
                  <Card key={iv.id} className="p-6 space-y-4 border-l-4 border-l-brand-600">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {iv.round_name}
                        </h3>
                        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                          {iv.company_name} • {iv.internship_title}
                        </p>
                      </div>
                      <Badge variant="brand" size="sm">
                        {iv.duration_minutes} Mins
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 font-medium">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <span>{new Date(iv.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>Interviewer: {iv.interviewer_name}</span>
                      </div>
                    </div>

                    {iv.location_or_link && (() => {
                      const match = iv.location_or_link.match(/(https?:\/\/[^\s]+)/);
                      const targetUrl = match ? match[0] : (iv.location_or_link.startsWith('http') ? iv.location_or_link : '#');
                      return (
                        <div className="pt-2">
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
                          >
                            Launch Virtual Meeting Room <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })()}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past / Completed Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed & Evaluated Rounds ({past.length})
            </h2>

            <div className="space-y-3">
              {past.map(iv => (
                <Card key={iv.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {iv.round_name}
                      </h4>
                      <StatusBadge status={iv.result} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {iv.company_name} • Conducted on {new Date(iv.scheduled_at).toLocaleDateString()}
                    </p>
                    {iv.feedback && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        "{iv.feedback}"
                      </p>
                    )}
                  </div>
                  <Badge variant="neutral" size="sm">Completed</Badge>
                </Card>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* Calendar Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-3 font-bold text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800 text-center">
              {day}
            </div>
          ))}
          {/* Calendar cell representation */}
          {interviews.map(iv => (
            <Card key={iv.id} className="p-3 text-xs space-y-1 bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900">
              <span className="font-bold text-slate-900 dark:text-white block truncate">{iv.round_name}</span>
              <span className="text-[10px] text-brand-600 block">{iv.company_name}</span>
              <span className="text-[10px] text-slate-400 block">{new Date(iv.scheduled_at).toLocaleDateString()}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
