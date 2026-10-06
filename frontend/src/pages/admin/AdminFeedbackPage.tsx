import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Search, Filter, CheckCircle2, AlertCircle,
  Star, RefreshCw, Send, ShieldCheck, Building2, Laptop, Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import { FeedbackItem, FeedbackTargetType, FeedbackStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminFeedbackPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Response Modal State
  const [respondingFeedback, setRespondingFeedback] = useState<FeedbackItem | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>(FeedbackStatus.RESOLVED);
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.listFeedbacks({
        target_type: (targetTypeFilter as FeedbackTargetType) || undefined,
        status_filter: statusFilter || undefined,
      });
      setFeedbacks(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [targetTypeFilter, statusFilter]);

  const handleOpenRespond = (fb: FeedbackItem) => {
    setRespondingFeedback(fb);
    setAdminResponseText(fb.admin_response || '');
    setSelectedStatus(fb.status || FeedbackStatus.RESOLVED);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingFeedback) return;

    try {
      setSubmitting(true);
      await api.updateFeedback(respondingFeedback.id, {
        status: selectedStatus,
        admin_response: adminResponseText,
      });
      showToast('Institutional response recorded successfully!', 'success');
      setRespondingFeedback(null);
      fetchFeedbacks();
    } catch (err: any) {
      showToast(err.message || 'Failed to record response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const total = feedbacks.length;
  const pendingCount = feedbacks.filter((f) => f.status === FeedbackStatus.SUBMITTED).length;
  const resolvedCount = feedbacks.filter((f) => f.status === FeedbackStatus.RESOLVED).length;

  const getTargetIcon = (type: FeedbackTargetType) => {
    switch (type) {
      case FeedbackTargetType.COMPANY:
        return <Building2 className="w-3.5 h-3.5 text-blue-500" />;
      case FeedbackTargetType.INTERNSHIP:
        return <Briefcase className="w-3.5 h-3.5 text-emerald-500" />;
      case FeedbackTargetType.PLATFORM:
      default:
        return <Laptop className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.SUBMITTED:
        return <Badge variant="warning">Submitted</Badge>;
      case FeedbackStatus.REVIEWED:
        return <Badge variant="info">In Review</Badge>;
      case FeedbackStatus.RESOLVED:
        return <Badge variant="success">Addressed / Resolved</Badge>;
      case FeedbackStatus.ARCHIVED:
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Suggestions & Feedback Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review student satisfaction, enterprise evaluations, platform suggestions, and log official responses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchFeedbacks} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="text-xs text-gray-500 font-medium">Total Feedback Submissions</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{total}</div>
          <div className="text-xs text-gray-400 mt-1">From students & stakeholders</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="text-xs text-gray-500 font-medium">Awaiting Institutional Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-xs text-amber-600 mt-1">Unanswered inquiries or ratings</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-gray-500 font-medium">Resolved / Acknowledged</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Completed responses</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'All Target Categories' },
              { value: FeedbackTargetType.PLATFORM, label: 'Platform & Experience' },
              { value: FeedbackTargetType.COMPANY, label: 'Company Reviews' },
              { value: FeedbackTargetType.INTERNSHIP, label: 'Internship Opportunity' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Review Statuses' },
              { value: FeedbackStatus.SUBMITTED, label: 'Submitted (Pending)' },
              { value: FeedbackStatus.REVIEWED, label: 'Under Review' },
              { value: FeedbackStatus.RESOLVED, label: 'Resolved / Answered' },
              { value: FeedbackStatus.ARCHIVED, label: 'Archived' },
            ]}
          />
        </div>
      </Card>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading feedback entries...
        </div>
      ) : feedbacks.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No feedback entries found"
            description="No student or stakeholder feedback matches the selected parameters."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <Card key={fb.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 mt-0.5">
                    {getTargetIcon(fb.target_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {fb.title}
                      </h3>
                      {getStatusBadge(fb.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted by {fb.from_user_name || 'Enrolled Student'} •{' '}
                      {new Date(fb.created_at).toLocaleDateString()} • Target:{' '}
                      <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                        {fb.target_type}
                      </span>
                    </p>
                  </div>
                </div>

                {fb.rating && (
                  <div className="flex items-center gap-1 text-sm font-bold text-amber-500 shrink-0">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {fb.rating} / 5
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                {fb.comment}
              </p>

              {fb.admin_response && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-xs">
                  <div className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Official Institutional Response
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{fb.admin_response}</p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRespond(fb)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {fb.admin_response ? 'Update Response & Status' : 'Respond to Feedback'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* RESPOND MODAL */}
      {respondingFeedback && (
        <Modal
          isOpen={!!respondingFeedback}
          onClose={() => setRespondingFeedback(null)}
          title={`Respond to Feedback: "${respondingFeedback.title}"`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveResponse} className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-gray-500">Student Comment:</span>
              <p className="text-gray-800 dark:text-gray-200 italic">
                "{respondingFeedback.comment}"
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Official Institutional Response <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                placeholder="Enter official coordinator / administrative remarks..."
                className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Select
              label="Update Workflow Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus)}
              options={[
                { value: FeedbackStatus.REVIEWED, label: 'Mark Under Review' },
                { value: FeedbackStatus.RESOLVED, label: 'Mark Resolved & Addressed' },
                { value: FeedbackStatus.ARCHIVED, label: 'Archive Feedback' },
              ]}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" type="button" onClick={() => setRespondingFeedback(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={submitting}>
                Save & Publish Response
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
