import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Calendar, CheckCircle2, Bookmark, Award,
  ArrowRight, Clock, MapPin, Building2, Sparkles, ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentProfile, Application, Interview, Internship } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ApplicationProgressTimeline } from '../../components/common/Timeline';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [recommended, setRecommended] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyStudentProfile().catch(() => null),
      api.getMyApplications().catch(() => []),
      api.listInterviews({ status_filter: 'SCHEDULED' }).catch(() => []),
      api.listInternships({ limit: 3, sort_by: 'stipend_high' }).catch(() => [])
    ]).then(([profRes, appsRes, ivsRes, recRes]) => {
      if (profRes) setProfile(profRes);
      setApplications(appsRes);
      setInterviews(ivsRes);
      setRecommended(recRes);
    }).finally(() => setIsLoading(false));
  }, []);

  // Compute counts
  const shortlistedCount = applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED').length;
  const acceptedCount = applications.filter(a => a.status === 'ACCEPTED').length;
  const completion = profile?.completion_percentage || 80;

  // Most active recent application
  const recentApp = applications[0];

  return (
    <div className="space-y-8">
      
      {/* Top Greeting & Profile Completion Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Good morning, {user?.first_name || 'Student'}! 👋
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {profile?.department || 'Computer Science'} • ID: {profile?.student_id_number || 'STU-2026'} • GPA: {profile?.gpa || '3.85'}
          </p>
        </div>

        {/* Profile Completion Widget */}
        <div className="sm:text-right w-full sm:w-64">
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Profile Completion</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">{completion}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          {completion < 100 && (
            <Link to="/student/profile" className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline mt-1 inline-block">
              Complete profile to boost matching →
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Applications"
          value={applications.length}
          subtitle="Submitted opportunities"
          icon={<FileText className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Shortlisted"
          value={shortlistedCount}
          subtitle="Passed initial screen"
          icon={<Sparkles className="w-5 h-5" />}
          color="sky"
        />
        <StatCard
          title="Interviews"
          value={interviews.length}
          subtitle="Upcoming scheduled"
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Accepted Offers"
          value={acceptedCount}
          subtitle="Verified placement"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* 2-Column Main Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Active Application Timeline + Recommended */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Application Status Tracker */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Application Tracking Pipeline
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {recentApp ? recentApp.internship?.title : 'No active applications yet'}
                </h2>
                {recentApp && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                    {recentApp.internship?.company?.name} • Applied on {new Date(recentApp.applied_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {recentApp && <StatusBadge status={recentApp.status} />}
            </div>

            {recentApp ? (
              <ApplicationProgressTimeline
                currentStatus={recentApp.status}
                events={(recentApp.timeline || []).map(t => ({
                  status: t.status,
                  label: t.status.replace(/_/g, ' '),
                  comment: t.comment,
                  date: t.created_at,
                  changedByName: t.changed_by_name,
                }))}
              />
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                You haven't submitted any applications yet. Explore openings to get started!
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link to="/student/applications">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All Applications ({applications.length})
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recommended Internships */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recommended For You
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Matches your {profile?.department || 'Engineering'} major and skill preferences
                </p>
              </div>
              <Link to="/internships">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                  Explore All
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommended.map(internship => (
                <Card key={internship.id} hover className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-sm border border-slate-200 dark:border-slate-700">
                        {internship.company?.name?.[0] || 'C'}
                      </div>
                      <Badge variant={internship.work_mode === 'REMOTE' ? 'success' : 'info'} size="sm">
                        {internship.work_mode.replace('_', ' ')}
                      </Badge>
                    </div>

                    <h4 className="mt-3 font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600">
                      <Link to={`/internships/${internship.id}`}>{internship.title}</Link>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{internship.company?.name}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {internship.skills_required.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${internship.stipend_amount.toLocaleString()}/mo
                    </span>
                    <Link to={`/internships/${internship.id}`}>
                      <Button size="sm">View Role</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Upcoming Interviews & Shortcuts */}
        <div className="space-y-6">
          
          {/* Upcoming Interviews Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" />
                Upcoming Interviews
              </h3>
              <Badge variant="brand" size="sm">{interviews.length}</Badge>
            </div>

            {interviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No upcoming interviews scheduled yet.
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map(iv => (
                  <div key={iv.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {iv.round_name}
                        </h4>
                        <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                          {iv.company_name || 'Partner Company'}
                        </p>
                      </div>
                      <Badge variant="brand" size="sm">Scheduled</Badge>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(iv.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{iv.interviewer_name}</span>
                      </div>
                    </div>

                    {iv.location_or_link && (
                      <div className="pt-1">
                        <a
                          href={iv.location_or_link.includes('http') ? iv.location_or_link : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                        >
                          Join Interview <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Shortcuts Card */}
          <Card className="p-6 space-y-3 bg-gradient-to-br from-brand-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-brand-950/20 border-brand-100 dark:border-brand-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Student Resources
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/student/profile" className="text-slate-700 dark:text-slate-300 hover:text-brand-600 flex items-center justify-between">
                  <span>Update Verified Resume</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/student/saved" className="text-slate-700 dark:text-slate-300 hover:text-brand-600 flex items-center justify-between">
                  <span>Saved Bookmarks</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/student/feedback" className="text-slate-700 dark:text-slate-300 hover:text-brand-600 flex items-center justify-between">
                  <span>Submit Company Review</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </Card>

        </div>

      </div>

    </div>
  );
};
