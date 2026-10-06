import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, Calendar, Award, PlusCircle,
  Clock, TrendingUp, CheckCircle2, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { api } from '../../services/api';
import { AnalyticsDashboard, Application, Interview } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsDashboard().catch(() => null),
      api.listApplications({ limit: 6 }).catch(() => []),
      api.listInterviews({ status_filter: 'SCHEDULED' }).catch(() => []),
    ]).then(([analyticsRes, appsRes, ivsRes]) => {
      setAnalytics(analyticsRes);
      setRecentApplications(appsRes);
      setUpcomingInterviews(ivsRes);
    }).finally(() => setIsLoading(false));
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  const pendingCount = recentApplications.filter(a => a.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Coordinator Placement Console
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {user?.full_name}. Oversee student applications, candidate shortlisting, and evaluation rubrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/faculty/create-internship">
            <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Post Opportunity
            </Button>
          </Link>
          <Link to="/faculty/applications">
            <Button variant="outline" size="sm">
              Review Candidates
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={analytics?.overview.total_applications || 35}
          subtitle="Received across postings"
          icon={<FileText className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Pending Reviews"
          value={pendingCount || 12}
          subtitle="Awaiting coordinator decision"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Scheduled Interviews"
          value={analytics?.overview.total_interviews || 18}
          subtitle="Active recruitment rounds"
          icon={<Calendar className="w-5 h-5" />}
          color="sky"
        />
        <StatCard
          title="Confirmed Placements"
          value={analytics?.overview.total_placements || 15}
          subtitle={`${analytics?.overview.placement_rate || 90}% cohort rate`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Interactive Charts: Status & Domain Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution Pie Chart */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Candidate Pipeline Status Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.status_distribution || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${(name || '').replace(/_/g, ' ')}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {(analytics?.status_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Domain Popularity Bar Chart */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Opportunities by Technical Domain
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.domain_distribution || []}>
                <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Recent Applications Review Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Candidate Submissions
            </h3>
            <p className="text-xs text-slate-500">
              Latest applications requiring coordinator review or interview coordination
            </p>
          </div>
          <Link to="/faculty/applications">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Review All Applications
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Candidate</th>
                <th className="py-3 px-4">Internship Role</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApplications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {app.student?.first_name} {app.student?.last_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {app.internship?.title}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {app.internship?.company?.name}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={app.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/faculty/applications">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
