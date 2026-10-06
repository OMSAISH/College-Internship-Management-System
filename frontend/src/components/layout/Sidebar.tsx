import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, Calendar, Bookmark,
  UserCheck, MessageSquare, BarChart3, Settings, ShieldCheck,
  Building2, Users, Award, PlusCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';

export const Sidebar: React.FC = () => {
  const { user, quickLoginAs } = useAuth();
  if (!user) return null;

  const role = user.role;

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/internships', label: 'Discover Internships', icon: <Briefcase className="w-4 h-4" /> },
    { to: '/student/applications', label: 'My Applications', icon: <FileText className="w-4 h-4" /> },
    { to: '/student/interviews', label: 'Interview Schedule', icon: <Calendar className="w-4 h-4" /> },
    { to: '/student/saved', label: 'Saved Bookmarks', icon: <Bookmark className="w-4 h-4" /> },
    { to: '/student/profile', label: 'My Profile & Resume', icon: <UserCheck className="w-4 h-4" /> },
    { to: '/student/feedback', label: 'Feedback & Reviews', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/faculty/create-internship', label: 'Post Opportunity', icon: <PlusCircle className="w-4 h-4" /> },
    { to: '/faculty/applications', label: 'Candidate Review', icon: <FileText className="w-4 h-4" /> },
    { to: '/faculty/interviews', label: 'Interview Calendar', icon: <Calendar className="w-4 h-4" /> },
    { to: '/faculty/evaluations', label: 'Student Evaluations', icon: <Award className="w-4 h-4" /> },
    { to: '/faculty/reports', label: 'Placement Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/faculty/feedback', label: 'Student Feedback', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Institutional Analytics', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/admin/students', label: 'Manage Students', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/faculty', label: 'Faculty Coordinators', icon: <UserCheck className="w-4 h-4" /> },
    { to: '/admin/companies', label: 'Partner Companies', icon: <Building2 className="w-4 h-4" /> },
    { to: '/admin/internships', label: 'Internship Approvals', icon: <Briefcase className="w-4 h-4" /> },
    { to: '/admin/applications', label: 'All Applications', icon: <FileText className="w-4 h-4" /> },
    { to: '/admin/interviews', label: 'All Interviews', icon: <Calendar className="w-4 h-4" /> },
    { to: '/admin/evaluations', label: 'All Evaluations', icon: <Award className="w-4 h-4" /> },
    { to: '/admin/reports', label: 'Compliance & Export', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/admin/feedback', label: 'System Feedback', icon: <MessageSquare className="w-4 h-4" /> },
    { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/admin/settings', label: 'Platform Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'FACULTY' ? facultyLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        {/* User Card Profile Header in Sidebar */}
        <div className="p-3.5 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <div className="mt-1">
                <Badge
                  variant={role === 'ADMIN' ? 'danger' : role === 'FACULTY' ? 'brand' : 'success'}
                  size="sm"
                >
                  {role} PORTAL
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </p>
          {links.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.to}
              end={link.to.includes('dashboard')}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <span className="shrink-0">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Quick Role Switcher widget in sidebar */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
        <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
          <Sparkles className="w-3 h-3 text-amber-500" /> Demo Switcher
        </p>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => quickLoginAs('student')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors ${
              role === 'STUDENT'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => quickLoginAs('faculty')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors ${
              role === 'FACULTY'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:border-indigo-700'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => quickLoginAs('admin')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors ${
              role === 'ADMIN'
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:border-rose-700'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </aside>
  );
};
