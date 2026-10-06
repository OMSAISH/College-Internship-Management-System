import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Eye, Download,
  ExternalLink, Calendar, CheckCircle2, Clock,
  RefreshCw, Building2, User, Star
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, ApplicationStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { ApplicationProgressTimeline } from '../../components/common/Timeline';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminApplicationsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.listApplications({
        search: searchTerm || undefined,
        status_filter: statusFilter || undefined,
      });
      setApplications(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  // KPIs
  const total = applications.length;
  const pending = applications.filter((a) => a.status === ApplicationStatus.PENDING).length;
  const shortlisted = applications.filter((a) => a.status === ApplicationStatus.SHORTLISTED).length;
  const interviewed = applications.filter((a) => a.status === ApplicationStatus.INTERVIEW_SCHEDULED).length;
  const accepted = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED).length;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <Badge variant="warning">Under Review</Badge>;
      case ApplicationStatus.SHORTLISTED:
        return <Badge variant="info">Shortlisted</Badge>;
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        return <Badge variant="brand">Interview Scheduled</Badge>;
      case ApplicationStatus.ACCEPTED:
        return <Badge variant="success">Accepted / Placed</Badge>;
      case ApplicationStatus.REJECTED:
        return <Badge variant="danger">Rejected</Badge>;
      case ApplicationStatus.WITHDRAWN:
        return <Badge variant="default">Withdrawn</Badge>;
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
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Application Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Global repository tracking candidate applications across all departments and corporate opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchApplications} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => api.downloadApplicationsCsv()}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Applications CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-3 border-l-4 border-l-gray-400">
          <div className="text-[11px] text-gray-500 font-medium">Total Received</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{total}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-amber-500">
          <div className="text-[11px] text-gray-500 font-medium">Under Review</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{pending}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-blue-500">
          <div className="text-[11px] text-gray-500 font-medium">Shortlisted</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{shortlisted}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-purple-500">
          <div className="text-[11px] text-gray-500 font-medium">Interviews</div>
          <div className="text-xl font-bold text-purple-600 mt-0.5">{interviewed}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-emerald-500">
          <div className="text-[11px] text-gray-500 font-medium">Selections / Placed</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{accepted}</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search candidate name, role, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Application Statuses' },
              { value: ApplicationStatus.PENDING, label: 'Under Review' },
              { value: ApplicationStatus.SHORTLISTED, label: 'Shortlisted' },
              { value: ApplicationStatus.INTERVIEW_SCHEDULED, label: 'Interview Scheduled' },
              { value: ApplicationStatus.ACCEPTED, label: 'Accepted / Placed' },
              { value: ApplicationStatus.REJECTED, label: 'Rejected' },
              { value: ApplicationStatus.WITHDRAWN, label: 'Withdrawn' },
            ]}
          />

          <div className="flex justify-end">
            <Button variant="outline" type="submit">
              Filter Applications
            </Button>
          </div>
        </form>
      </Card>

      {/* Applications Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading institutional applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No applications found"
              description="No applications matched your search or status query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Applied Opportunity</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Coordinator Rating</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {app.student_name}
                      </div>
                      <div className="text-xs text-gray-400">{app.student_email}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-200">
                        {app.internship_title}
                      </div>
                      <div className="text-xs text-gray-400">{app.company_name}</div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">{getStatusBadge(app.status)}</td>

                    <td className="px-4 py-3">
                      {app.faculty_rating ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {app.faculty_rating} / 5
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unrated</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* INSPECT APPLICATION MODAL */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Application Record #${selectedApp.id}: ${selectedApp.student_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {selectedApp.internship_title}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedApp.company_name} • Applied on{' '}
                  {new Date(selectedApp.applied_at).toLocaleDateString()}
                </p>
              </div>
              <div>{getStatusBadge(selectedApp.status)}</div>
            </div>

            {/* Application Progress Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Lifecycle Progression History
              </h4>
              <div className="p-4 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700">
                <ApplicationProgressTimeline status={selectedApp.status} />
              </div>
            </div>

            {/* Cover Letter */}
            {selectedApp.cover_letter && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Submitted Cover Letter
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {selectedApp.cover_letter}
                </p>
              </div>
            )}

            {/* Resume Link */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Candidate Resume Document
              </h4>
              {selectedApp.resume_url ? (
                <a
                  href={selectedApp.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <FileText className="w-4 h-4" /> Download Submitted Resume (PDF)
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-gray-400">No document attached</span>
              )}
            </div>

            {/* Coordinator Notes */}
            {selectedApp.faculty_notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <span className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                  Coordinator Evaluation Notes:
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  {selectedApp.faculty_notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
