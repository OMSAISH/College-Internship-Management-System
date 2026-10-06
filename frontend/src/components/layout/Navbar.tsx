import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, LogOut, User as UserIcon,
  ChevronDown, Sparkles, Building2, Briefcase
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DarkModeToggle } from '../common/DarkModeToggle';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'FACULTY') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Sanjivani <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/50">CIMS</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Sanjivani University • Training & Placement Cell
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Public / Discovery) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/internships"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              Explore Internships
            </Link>
            <Link
              to="/companies"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              Partner Companies
            </Link>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            
            {/* Quick Demo Switcher Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                title="Quick Demo Role Switcher"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Accounts</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {demoMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-premium z-50 p-2 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setDemoMenuOpen(false)}
                >
                  <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Persona
                  </p>
                  <button
                    onClick={async () => {
                      await quickLoginAs('admin');
                      setDemoMenuOpen(false);
                      navigate('/admin/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Admin Portal</p>
                      <p className="text-[10px] text-slate-400">admin@demo.local</p>
                    </div>
                    <Badge variant="danger" size="sm">Admin</Badge>
                  </button>
                  <button
                    onClick={async () => {
                      await quickLoginAs('faculty');
                      setDemoMenuOpen(false);
                      navigate('/faculty/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Faculty Coordinator</p>
                      <p className="text-[10px] text-slate-400">faculty@demo.local</p>
                    </div>
                    <Badge variant="brand" size="sm">Faculty</Badge>
                  </button>
                  <button
                    onClick={async () => {
                      await quickLoginAs('student');
                      setDemoMenuOpen(false);
                      navigate('/student/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Student Candidate</p>
                      <p className="text-[10px] text-slate-400">student@demo.local</p>
                    </div>
                    <Badge variant="success" size="sm">Student</Badge>
                  </button>
                </div>
              )}
            </div>

            <DarkModeToggle />

            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold text-xs flex items-center justify-center border border-brand-200 dark:border-brand-800">
                      {user?.first_name?.[0] || 'U'}
                    </div>
                    <div className="hidden sm:block text-left pr-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-premium z-50 p-1.5 animate-in fade-in zoom-in-95"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm shadow-brand-500/20 transition-all hover:shadow-brand-500/30"
                >
                  Register
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
