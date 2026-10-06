import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Building2, ExternalLink,
  CheckCircle2, XCircle, Edit, AlertCircle, RefreshCw,
  Search, Filter, User, MapPin
} from 'lucide-react';
import { api } from '../../services/api';
import { Interview, InterviewResult, InterviewStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminInterviewsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Complete Interview Outcome Modal
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [outcomeResult, setOutcomeResult] = useState<InterviewResult>(InterviewResult.PASSED);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.listInterviews({
        status_filter: statusFilter || undefined,
      });
      setInterviews(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterview) return;

    try {
      setSubmitting(true);
      await api.completeInterview(activeInterview.id, {
        result: outcomeResult,
        feedback: feedbackText,
      });
      showToast('Interview outcome officially recorded!', 'success');
      setActiveInterview(null);
      setFeedbackText('');
      fetchInterviews();
    } catch (err: any) {
      showToast(err.message || 'Failed to record outcome', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = interviews.filter((it) => {
    const sName = it.student_name || '';
    const title = it.internship_title || '';
    const comp = it.company_name || '';
    const inter = it.interviewer_name || '';
    const q = searchTerm.toLowerCase();
    return (
      sName.toLowerCase().includes(q) ||
      title.toLowerCase().includes(q) ||
      comp.toLowerCase().includes(q) ||
      inter.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case InterviewStatus.SCHEDULED:
        return <Badge variant="info">Scheduled</Badge>;
      case InterviewStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case InterviewStatus.CANCELLED:
        return <Badge variant="danger">Cancelled</Badge>;
      case InterviewStatus.RESCHEDULED:
        return <Badge variant="warning">Rescheduled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getResultBadge = (result?: InterviewResult) => {
    if (!result) return null;
    switch (result) {
      case InterviewResult.PASSED:
        return <Badge variant="success">Passed</Badge>;
      case InterviewResult.FAILED:
        return <Badge variant="danger">Failed</Badge>;
      case InterviewResult.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">{result}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Interview Schedules & Outcomes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Centrally oversee corporate screening calls, technical rounds, and offer selections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchInterviews} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="text-xs text-gray-500 font-medium">Total Interviews Tracked</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{interviews.length}</div>
          <div className="text-xs text-gray-400 mt-1">Technical & HR rounds</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-xs text-gray-500 font-medium">Scheduled & Upcoming</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {interviews.filter((i) => i.status === InterviewStatus.SCHEDULED).length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Active calendar bookings</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-gray-500 font-medium">Completed & Concluded</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {interviews.filter((i) => i.status === InterviewStatus.COMPLETED).length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Results officially logged</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search candidate, company, role, or interviewer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Interview Statuses' },
              { value: InterviewStatus.SCHEDULED, label: 'Scheduled' },
              { value: InterviewStatus.COMPLETED, label: 'Completed' },
              { value: InterviewStatus.RESCHEDULED, label: 'Rescheduled' },
              { value: InterviewStatus.CANCELLED, label: 'Cancelled' },
            ]}
          />
        </div>
      </Card>

      {/* Interviews Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading interview calendar...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No interviews found"
              description="No interviews match your search parameters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Opportunity & Partner</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Interviewer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {it.student_name}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-gray-200">{it.internship_title}</div>
                      <div className="text-xs text-gray-400">{it.company_name}</div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      <div>{new Date(it.scheduled_at).toLocaleDateString()}</div>
                      <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {new Date(it.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                      <div>{it.interviewer_name}</div>
                      <div className="text-gray-400">{it.interviewer_email}</div>
                    </td>

                    <td className="px-4 py-3">{getStatusBadge(it.status)}</td>

                    <td className="px-4 py-3">
                      {it.result ? getResultBadge(it.result) : <span className="text-xs text-gray-400">Pending</span>}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {it.meeting_link && (
                          <a
                            href={it.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded"
                          >
                            Meeting <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {it.status === InterviewStatus.SCHEDULED && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveInterview(it);
                              setOutcomeResult(InterviewResult.PASSED);
                              setFeedbackText(it.feedback || '');
                            }}
                          >
                            Log Outcome
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* LOG OUTCOME MODAL */}
      {activeInterview && (
        <Modal
          isOpen={!!activeInterview}
          onClose={() => setActiveInterview(null)}
          title={`Log Interview Result: ${activeInterview.student_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordOutcome} className="space-y-4">
            <Select
              label="Evaluation Decision"
              value={outcomeResult}
              onChange={(e) => setOutcomeResult(e.target.value as InterviewResult)}
              options={[
                { value: InterviewResult.PASSED, label: 'PASSED (Eligible for Offer)' },
                { value: InterviewResult.FAILED, label: 'FAILED (Rejected)' },
                { value: InterviewResult.PENDING, label: 'PENDING FURTHER ROUND' },
              ]}
            />

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interviewer / Coordinator Remarks
              </label>
              <textarea
                rows={3}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Candidate demonstrated deep knowledge in system architecture..."
                className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" type="button" onClick={() => setActiveInterview(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={submitting}>
                Save Outcome
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
