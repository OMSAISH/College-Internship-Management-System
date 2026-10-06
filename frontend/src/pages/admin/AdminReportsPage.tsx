import React, { useState, useEffect } from 'react';
import {
  BarChart3, Download, FileSpreadsheet, TrendingUp,
  Users, Building2, Briefcase, CheckCircle2,
  RefreshCw, Award, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, PieChart, Pie, Cell
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

export const AdminReportsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingApps, setDownloadingApps] = useState(false);
  const [downloadingPlacements, setDownloadingPlacements] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to aggregate reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadApplications = async () => {
    try {
      setDownloadingApps(true);
      await api.downloadApplicationsCsv();
      showToast('Applications audit report downloaded (CSV)', 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setDownloadingApps(false);
    }
  };

  const handleDownloadPlacements = async () => {
    try {
      setDownloadingPlacements(true);
      await api.downloadPlacementsCsv();
      showToast('Accreditation placement summary downloaded (CSV)', 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setDownloadingPlacements(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mr-3 text-indigo-600" />
        <span className="text-base font-medium">Synthesizing institutional compliance intelligence...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Accreditation & Placement Compliance Reporting
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate audit-ready datasets, cohort progression metrics, and regulatory compliance exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={fetchReports} leftIcon={<RefreshCw className="w-4 h-4" />}>
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
            Export Placement Summary CSV
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Eligible Candidates</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.total_students}
              </div>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">Total undergraduate student roster</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Institutional Placements</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {data.overview.total_placements}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {data.overview.placement_rate}% Overall Institution Placement Rate
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Partner Companies</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {data.overview.total_companies}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">Active industry campus affiliates</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Average Monthly Stipend</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${data.overview.average_stipend.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">Across approved postings</div>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Recruitment & Placement Funnel Dynamics
              </h3>
              <p className="text-xs text-gray-500">Monthly application volume vs. verified offer acceptance</p>
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
                <Bar dataKey="applications" name="Applications Submitted" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placements" name="Offers Accepted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Candidate Pipeline Status Distribution
              </h3>
              <p className="text-xs text-gray-500">Overall state of all student applications</p>
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

      {/* Domain Opportunity Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Specialization Domain Market Demand
            </h3>
            <p className="text-xs text-gray-500">Distribution of corporate openings by technical discipline</p>
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
              <Bar dataKey="count" name="Opportunities Offered" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
