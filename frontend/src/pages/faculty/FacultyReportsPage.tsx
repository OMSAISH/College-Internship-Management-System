import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  PieChart as PieIcon,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { AnalyticsDashboard } from '../../types';
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

export const FacultyReportsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingApps, setDownloadingApps] = useState(false);
  const [downloadingPlacements, setDownloadingPlacements] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load report analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDownloadApplications = async () => {
    try {
      setDownloadingApps(true);
      await api.downloadApplicationsCsv();
      showToast('Applications report CSV downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export applications', 'error');
    } finally {
      setDownloadingApps(false);
    }
  };

  const handleDownloadPlacements = async () => {
    try {
      setDownloadingPlacements(true);
      await api.downloadPlacementsCsv();
      showToast('Placement summary CSV downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export placements', 'error');
    } finally {
      setDownloadingPlacements(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mr-3 text-indigo-600" />
        <span className="text-base font-medium">Aggregating departmental placement intelligence...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Departmental Analytics & Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time cohort insights, conversion funnels, and accreditation audit exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchAnalytics} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadApplications}
            isLoading={downloadingApps}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Applications CSV
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadPlacements}
            isLoading={downloadingPlacements}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export Placements CSV
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Registered Students</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.total_students}
              </div>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Active student roster
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Successful Placements</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.total_placements}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Placement Conversion Rate: <span className="font-bold text-emerald-600">{data.overview.placement_rate}%</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Internship Postings</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.active_internships}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Across {data.overview.total_companies} Verified Corporate Partners
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Average Monthly Stipend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${data.overview.average_stipend.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Total Applications: <span className="font-semibold text-gray-900 dark:text-white">{data.overview.total_applications}</span>
          </div>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Application & Placement Trajectory
              </h3>
              <p className="text-xs text-gray-500">Monthly pipeline activity across current academic cycle</p>
            </div>
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

        {/* Status Distribution Pie */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Application Status Distribution
              </h3>
              <p className="text-xs text-gray-500">Pipeline progression breakdown across candidate pool</p>
            </div>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
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

      {/* Domain Opportunity Density */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Industry Domain Opportunity Density
            </h3>
            <p className="text-xs text-gray-500">Number of active postings cataloged by specialization domain</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.domain_distribution} layout="vertical">
              <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} />
              <YAxis
                dataKey="domain"
                type="category"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Opportunities" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tables: Top Students & Top Corporate Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              High Achieving Candidate Leaders
            </h3>
            <span className="text-xs text-gray-400">Ranked by GPA</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Candidate</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">GPA</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.top_students.slice(0, 6).map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{st.department}</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {st.gpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={st.placement_status === 'placed' ? 'success' : 'default'}
                        size="sm"
                      >
                        {st.placement_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Companies */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Top Corporate Partners
            </h3>
            <span className="text-xs text-gray-400">By Application Volume</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Enterprise</th>
                  <th className="px-3 py-2.5">Industry</th>
                  <th className="px-3 py-2.5">Postings</th>
                  <th className="px-3 py-2.5">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.top_companies.slice(0, 6).map((co) => (
                  <tr key={co.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                      {co.name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{co.industry}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300">
                      {co.internships_count} roles ({co.applications_count} apps)
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-amber-500">
                      ★ {co.average_rating.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
