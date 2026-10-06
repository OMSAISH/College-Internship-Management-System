import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Building2, ExternalLink,
  CheckCircle2, XCircle, Edit, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Interview, InterviewResult, InterviewStatus } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const FacultyInterviewsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Complete Interview Result Modal
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [result, setResult] = useState<InterviewResult>('PASSED');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInterviews = () => {
    setIsLoading(true);
    api.listInterviews()
      .then(setInterviews)
      .catch(() => showToast({ type: 'error', message: 'Failed to load interviews.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterview) return;
    setIsSubmitting(true);
    try {
      await api.completeInterview(activeInterview.id, { result, feedback });
      showToast({ type: 'success', title: 'Interview Recorded', message: `Result marked as ${result}` });
      setActiveInterview(null);
      setFeedback('');
      fetchInterviews();
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Could not record interview outcome.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Interview Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor and record results for candidate screening rounds and technical interviews
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6" />}
          title="No Interviews on Schedule"
          description="When you shortlist candidate applications, schedule interview rounds from the Candidate Review tab."
        />
      ) : (
        <div className="space-y-4">
          {interviews.map(iv => (
            <Card key={iv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {iv.round_name}
                  </h3>
                  <StatusBadge status={iv.status} size="sm" />
                  {iv.result !== 'PENDING' && (
                    <StatusBadge status={iv.result} size="sm" />
                  )}
                </div>

                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  Candidate: {iv.student_name} ({iv.student_email})
                </p>
                <p className="text-xs text-slate-500">
                  {iv.internship_title} • {iv.company_name}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(iv.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>Interviewer: {iv.interviewer_name}</span>
                </div>

                {iv.feedback && (
                  <p className="mt-2 text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    Feedback: "{iv.feedback}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {iv.location_or_link && (() => {
                  const match = iv.location_or_link.match(/(https?:\/\/[^\s]+)/);
                  const targetUrl = match ? match[0] : (iv.location_or_link.startsWith('http') ? iv.location_or_link : '#');
                  return (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg flex items-center gap-1"
                    >
                      Meeting Link <ExternalLink className="w-3 h-3" />
                    </a>
                  );
                })()}

                {iv.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveInterview(iv);
                      setResult('PASSED');
                      setFeedback('');
                    }}
                  >
                    Record Outcome
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Record Outcome Modal */}
      {activeInterview && (
        <Modal
          isOpen={!!activeInterview}
          onClose={() => setActiveInterview(null)}
          title={`Record Outcome: ${activeInterview.round_name}`}
          subtitle={`Candidate: ${activeInterview.student_name}`}
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Evaluation Decision *
              </label>
              <select
                value={result}
                onChange={e => setResult(e.target.value as InterviewResult)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="PASSED">Passed (Recommended for Next Step/Offer)</option>
                <option value="ON_HOLD">On Hold (Pending Further Discussion)</option>
                <option value="FAILED">Failed (Did not meet rubric requirements)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Constructive Feedback & Notes *
              </label>
              <textarea
                rows={4}
                required
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white leading-relaxed focus:outline-none"
                placeholder="Detail technical strengths, areas for growth, and code performance..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setActiveInterview(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Save Outcome & Notify Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
