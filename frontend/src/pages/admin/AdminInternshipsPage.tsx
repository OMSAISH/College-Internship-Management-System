import React, { useState, useEffect } from 'react';
import {
  Briefcase, Search, Filter, CheckCircle2, XCircle,
  AlertCircle, Star, Calendar, MapPin, DollarSign,
  RefreshCw, Eye, ShieldCheck, Sparkles, Building2
} from 'lucide-react';
import { api } from '../../services/api';
import { Internship, InternshipStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminInternshipsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Modal State
  const [reviewingItem, setReviewingItem] = useState<Internship | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const res = await api.listInternships({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      setInternships(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load internships', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [statusFilter]);

  const handleDecision = async (approve: boolean) => {
    if (!reviewingItem) return;
    try {
      setProcessing(true);
      await api.approveInternship(reviewingItem.id, approve, decisionNotes);
      showToast(
        `Internship "${reviewingItem.title}" has been ${approve ? 'approved' : 'rejected'}.`,
        approve ? 'success' : 'warning'
      );
      setReviewingItem(null);
      setDecisionNotes('');
      fetchInternships();
    } catch (err: any) {
      showToast(err.message || 'Decision failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // KPIs
  const total = internships.length;
  const pendingCount = internships.filter((i) => i.status === InternshipStatus.PENDING).length;
  const approvedCount = internships.filter((i) => i.status === InternshipStatus.APPROVED).length;
  const rejectedCount = internships.filter((i) => i.status === InternshipStatus.REJECTED).length;

  const getStatusBadge = (status: InternshipStatus) => {
    switch (status) {
      case InternshipStatus.APPROVED:
        return <Badge variant="success">Approved</Badge>;
      case InternshipStatus.PENDING:
        return <Badge variant="warning">Pending Approval</Badge>;
      case InternshipStatus.REJECTED:
        return <Badge variant="danger">Rejected</Badge>;
      case InternshipStatus.CLOSED:
        return <Badge variant="default">Closed</Badge>;
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
            <Briefcase className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Internship Opportunity Governance & Approvals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review faculty & partner company postings, enforce compensation standards, and approve opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchInternships} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`p-4 border-l-4 cursor-pointer transition-shadow hover:shadow ${
            statusFilter === InternshipStatus.PENDING
              ? 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
              : 'border-l-amber-500'
          }`}
          onClick={() => setStatusFilter(InternshipStatus.PENDING)}
        >
          <div className="text-xs text-gray-500 font-medium">Pending Administrative Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Requires verification
          </div>
        </Card>

        <Card
          className={`p-4 border-l-4 cursor-pointer transition-shadow hover:shadow ${
            statusFilter === InternshipStatus.APPROVED
              ? 'border-l-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
              : 'border-l-emerald-600'
          }`}
          onClick={() => setStatusFilter(InternshipStatus.APPROVED)}
        >
          <div className="text-xs text-gray-500 font-medium">Approved & Published</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Visible to students</div>
        </Card>

        <Card
          className={`p-4 border-l-4 cursor-pointer transition-shadow hover:shadow ${
            statusFilter === InternshipStatus.REJECTED
              ? 'border-l-red-600 bg-red-50/40 dark:bg-red-950/20 ring-2 ring-red-500/20'
              : 'border-l-red-600'
          }`}
          onClick={() => setStatusFilter(InternshipStatus.REJECTED)}
        >
          <div className="text-xs text-gray-500 font-medium">Rejected / Non-Compliant</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Failed guidelines</div>
        </Card>

        <Card
          className={`p-4 border-l-4 cursor-pointer transition-shadow hover:shadow ${
            statusFilter === 'ALL'
              ? 'border-l-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
              : 'border-l-indigo-600'
          }`}
          onClick={() => setStatusFilter('ALL')}
        >
          <div className="text-xs text-gray-500 font-medium">Total Opportunity Postings</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{total}</div>
          <div className="text-xs text-gray-400 mt-1">Across all statuses</div>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search posting title, domain, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInternships()}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: InternshipStatus.PENDING, label: 'Pending Approval' },
              { value: InternshipStatus.APPROVED, label: 'Approved' },
              { value: InternshipStatus.REJECTED, label: 'Rejected' },
              { value: InternshipStatus.CLOSED, label: 'Closed' },
            ]}
          />

          <div className="flex justify-end">
            <Button variant="outline" onClick={fetchInternships}>
              Apply Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading internship records...
          </div>
        ) : internships.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No internships found"
              description="No postings match your status or search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Mode & Duration</th>
                  <th className="px-4 py-3">Stipend</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {internships.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {item.title}
                          {item.is_featured && (
                            <span title="Featured">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {item.company?.name} • {item.location}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                      {item.domain}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{item.work_mode}</span> • {item.duration_weeks} wks
                    </td>

                    <td className="px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{item.stipend_amount.toLocaleString()}/mo
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(item.application_deadline).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>

                    <td className="px-4 py-3 text-right">
                      {item.status === InternshipStatus.PENDING ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setReviewingItem(item);
                            setDecisionNotes('');
                          }}
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                        >
                          Review & Decide
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReviewingItem(item);
                            setDecisionNotes(item.admin_approval_notes || '');
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* REVIEW & APPROVAL MODAL */}
      {reviewingItem && (
        <Modal
          isOpen={!!reviewingItem}
          onClose={() => setReviewingItem(null)}
          title={`Administrative Review: ${reviewingItem.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-base">
                  {reviewingItem.company?.name}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  ₹{reviewingItem.stipend_amount.toLocaleString()} / month
                </span>
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                <span>Domain: {reviewingItem.domain}</span>
                <span>Work Mode: {reviewingItem.work_mode}</span>
                <span>Duration: {reviewingItem.duration_weeks} weeks</span>
                <span>
                  Deadline: {new Date(reviewingItem.application_deadline).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Opportunity Description
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg max-h-48 overflow-y-auto">
                {reviewingItem.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Administrative Notes / Reason for Decision
              </h4>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Institutional compliance remarks sent to the faculty coordinator / company..."
                className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setReviewingItem(null)}>
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  isLoading={processing}
                  onClick={() => handleDecision(false)}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Reject Opportunity
                </Button>
                <Button
                  variant="primary"
                  isLoading={processing}
                  onClick={() => handleDecision(true)}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve & Publish
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
