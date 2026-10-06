import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, Building2, ChevronDown, ChevronUp,
  AlertCircle, Download, ExternalLink, XCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, ApplicationStatus } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ApplicationProgressTimeline } from '../../components/common/Timeline';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentApplicationsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Withdraw Modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const fetchApplications = () => {
    setIsLoading(true);
    api.getMyApplications()
      .then(res => {
        setApplications(res);
        if (res.length > 0 && expandedAppId === null) {
          setExpandedAppId(res[0].id);
        }
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load your applications.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async () => {
    if (!selectedAppId || !withdrawReason.trim()) return;
    setIsSubmittingWithdraw(true);
    try {
      await api.withdrawApplication(selectedAppId, withdrawReason);
      showToast({ type: 'success', title: 'Application Withdrawn', message: 'Your application has been safely withdrawn.' });
      setWithdrawModalOpen(false);
      setWithdrawReason('');
      fetchApplications();
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Could not withdraw application.' });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Application Tracking & Status
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor real-time candidate screening, interview invitations, and institutional placement decisions
          </p>
        </div>
        <Link to="/internships">
          <Button size="sm">Browse More Roles</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No Applications Submitted"
          description="You have not applied for any internships yet. Explore verified opportunities to begin your career journey."
          actionText="Discover Internships"
          onAction={() => window.location.href = '/internships'}
        />
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const isExpanded = expandedAppId === app.id;
            const canWithdraw = app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && app.status !== 'WITHDRAWN';

            return (
              <Card key={app.id} className="overflow-hidden transition-all">
                {/* Application Header Row */}
                <div
                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-lg border border-slate-200 dark:border-slate-700 shrink-0">
                      {app.internship?.company?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {app.internship?.title}
                        </h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">
                        {app.internship?.company?.name} • {app.internship?.location}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applied on {new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Last update: {new Date(app.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold text-slate-500">
                      ₹{app.internship?.stipend_amount.toLocaleString()}/mo
                    </span>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Timeline and Details Drawer */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 space-y-6">
                    
                    {/* Status Progress Timeline */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Status Progression Timeline
                      </h4>
                      <ApplicationProgressTimeline
                        currentStatus={app.status}
                        events={(app.timeline || []).map(t => ({
                          status: t.status,
                          label: t.status.replace(/_/g, ' '),
                          comment: t.comment,
                          date: t.created_at,
                          changedByName: t.changed_by_name,
                        }))}
                      />
                    </div>

                    {/* Faculty Notes if available */}
                    {app.faculty_notes && (
                      <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-xs">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                          Coordinator / Reviewer Notes:
                        </span>
                        <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
                          {app.faculty_notes}
                        </p>
                      </div>
                    )}

                    {/* Submitted Cover Letter & Document */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Submitted Cover Letter
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed">
                          {app.cover_letter}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Attached Verified Resume
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {app.resume_url.split('/').pop()}
                          </p>
                        </div>
                        <div className="pt-3">
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Download / Preview PDF
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                      {canWithdraw ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppId(app.id);
                            setWithdrawModalOpen(true);
                          }}
                          className="text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" /> Withdraw Application
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Application is finalized</span>
                      )}

                      <Link to={`/internships/${app.internship_id}`}>
                        <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                          View Job Description
                        </Button>
                      </Link>
                    </div>

                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Withdraw Internship Application"
        subtitle="Are you sure you want to withdraw your candidate submission?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Withdrawing will remove your profile from active consideration by the recruiting committee. This action cannot be reversed unless authorized by an administrator.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Withdrawal *
            </label>
            <textarea
              required
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder="e.g. Accepted another offer, academic schedule conflict, etc."
              value={withdrawReason}
              onChange={e => setWithdrawReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setWithdrawModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmittingWithdraw}
              disabled={!withdrawReason.trim()}
              onClick={handleWithdraw}
            >
              Confirm Withdrawal
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
