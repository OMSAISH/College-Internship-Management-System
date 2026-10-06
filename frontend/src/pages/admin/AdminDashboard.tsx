import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, FileText,
  Calendar, CheckCircle2, TrendingUp, Award, Download,
  ShieldCheck, Settings, RefreshCw, AlertCircle, ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../services/api';
import { AnalyticsDashboard, AuditLogItem, Internship } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../contexts/NotificationContext';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  shortlisted: '#3b82f6',
  interview_scheduled: '#8b5cf6',
  accepted: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
};

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const { showToast } = useNotifications();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [pendingInternships, setPendingInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analytics, logs, pending] = await Promise.all([
        api.getAnalyticsDashboard(),
        api.listAuditLogs({ limit: 6 }),
        api.listInternships({ status_filter: 'pending' }),
      ]);
      setData(analytics);
      setRecentLogs(logs);
      setPendingInternships(pending);
    } catch (err: any) {
      showToast(err.message || 'Failed to load institutional dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExportPlacements = async () => {
    try {
      setExporting(true);
      await api.downloadPlacementsCsv();
      showToast('Accreditation placement summary exported', 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <span className="text-base font-medium">Loading Institutional Analytics & Security Telemetry...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="success" size="sm">SYSTEM ONLINE</Badge>
            <span className="text-xs text-indigo-200">Database: Active Relational • RBAC Enforced</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-indigo-400" />
            Institutional Executive Dashboard
          </h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
            Centralized governance for campus placements, partner verification, candidate progression, and university audit compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-none"
            onClick={handleExportPlacements}
            isLoading={exporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Placements
          </Button>
        </div>
      </div>

      {/* Pending Approvals Notice Banner if any */}
      {pendingInternships.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {pendingInternships.length} Opportunity Posting{pendingInternships.length > 1 ? 's' : ''} Awaiting Administrative Approval
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Postings must be verified for institutional guidelines before students can apply.
              </p>
            </div>
          </div>
          <Link to="/admin/internships">
            <Button size="sm" variant="secondary" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              Review Queue
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Students Enrolled</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.total_students}
              </div>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span>Placed: {data.overview.total_placements}</span>
            <span className="font-bold text-emerald-600">{data.overview.placement_rate}% Rate</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Partner Companies</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.total_companies}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span>Active Roles: {data.overview.active_internships}</span>
            <Link to="/admin/companies" className="text-blue-600 hover:underline">Manage &rarr;</Link>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Applications Processed</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.total_applications}
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span>Interviews: {data.overview.total_interviews}</span>
            <Link to="/admin/applications" className="text-purple-600 hover:underline">Inspect &rarr;</Link>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Average Monthly Stipend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${data.overview.average_stipend.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Across verified corporate opportunities
          </div>
        </Card>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Application vs Selection Velocity
              </h3>
              <p className="text-xs text-gray-500">Institutional recruitment trajectory across cycles</p>
            </div>
            <Link to="/admin/reports" className="text-xs font-semibold text-indigo-600 hover:underline">
              Detailed Reports &rarr;
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_trends}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="applications" name="Applications" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placements" name="Placements" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Funnel Donut */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Application Status Distribution
              </h3>
              <p className="text-xs text-gray-500">Holistic funnel conversion across student applications</p>
            </div>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                  label={(entry: any) => `${entry.status || entry.name}: ${entry.count || entry.value}`}
                >
                  {data.status_distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tables: Top Students & Top Corporate Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Highest Academic Rank Candidates
            </h3>
            <Link to="/admin/students" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All Students &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Dept</th>
                  <th className="px-3 py-2">GPA</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.top_students.slice(0, 5).map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{st.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{st.department}</td>
                    <td className="px-3 py-2 text-xs font-bold text-indigo-600">{st.gpa.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={st.placement_status === 'placed' ? 'success' : 'default'} size="sm">
                        {st.placement_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Corporate Partners Table */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Key Corporate Recruitment Partners
            </h3>
            <Link to="/admin/companies" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage Directory &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Industry</th>
                  <th className="px-3 py-2">Postings</th>
                  <th className="px-3 py-2">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.top_companies.slice(0, 5).map((co) => (
                  <tr key={co.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{co.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{co.industry}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                      {co.internships_count} roles ({co.applications_count} apps)
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-amber-500">★ {co.average_rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Live Security & Audit Logs Feed */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Recent Security Audit Events
            </h3>
            <p className="text-xs text-gray-500">Live operational ledger recording critical administrative mutations</p>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-indigo-600 hover:underline">
            View All Audit Logs &rarr;
          </Link>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="brand" size="sm">
                  {log.action}
                </Badge>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {log.details || `${log.entity_type} #${log.entity_id}`}
                </span>
                <span className="text-gray-400">by User #{log.user_id}</span>
              </div>
              <span className="text-gray-400 shrink-0">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
