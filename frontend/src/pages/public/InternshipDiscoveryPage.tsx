import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, MapPin, Calendar, Clock, DollarSign,
  Bookmark, Building2, Check, ArrowUpDown, X, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { Internship, WorkMode } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const InternshipDiscoveryPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('');
  const [minStipend, setMinStipend] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(26);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const fetchInternships = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listInternships({
        search: search || undefined,
        domain: selectedDomain || undefined,
        work_mode: selectedWorkMode || undefined,
        min_stipend: minStipend > 0 ? minStipend : undefined,
        duration_weeks: maxDuration < 26 ? maxDuration : undefined,
        sort_by: sortBy,
      });
      setInternships(data);
    } catch (err: any) {
      showToast({ type: 'error', message: 'Failed to load internships.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedDomain, selectedWorkMode, minStipend, maxDuration, sortBy, showToast]);

  useEffect(() => {
    api.getDomains().then(setDomains).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInternships();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInternships]);

  const handleToggleBookmark = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.toggleBookmark(id);
      setInternships(prev =>
        prev.map(item => (item.id === id ? { ...item, is_bookmarked: res.bookmarked } : item))
      );
      showToast({ type: 'success', message: res.message });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Could not update bookmark.' });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedDomain('');
    setSelectedWorkMode('');
    setMinStipend(0);
    setMaxDuration(26);
    setSortBy('newest');
  };

  const hasActiveFilters = search || selectedDomain || selectedWorkMode || minStipend > 0 || maxDuration < 26;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Internship Opportunities
            </h1>
            <Badge variant="brand" size="sm">
              {internships.length} Available
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Discover verified enterprise opportunities aligned with academic curriculum
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle"
          >
            <Filter className="w-4 h-4 text-brand-600" />
            Filters {hasActiveFilters && '• Active'}
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="newest">Recently Posted</option>
              <option value="stipend_high">Highest Stipend</option>
              <option value="deadline_soon">Deadline Closing Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Internship Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Side Filters Sidebar */}
        <div className={`md:block ${filterDrawerOpen ? 'block' : 'hidden'} md:col-span-1 space-y-6`}>
          <Card className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-brand-600" />
                Refine Search
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Keyword or Skill
              </label>
              <Input
                type="text"
                placeholder="Python, React, Cloud..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Domain Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Engineering Domain
              </label>
              <select
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">All Domains</option>
                {domains.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Work Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Mode
              </label>
              <div className="space-y-1.5">
                {['', 'ON_SITE', 'REMOTE', 'HYBRID'].map(mode => (
                  <label key={mode} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="radio"
                      name="work_mode"
                      checked={selectedWorkMode === mode}
                      onChange={() => setSelectedWorkMode(mode)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>{mode === '' ? 'Any Work Mode' : mode.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Stipend */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Minimum Stipend
                </label>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  ${minStipend}/mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="250"
                value={minStipend}
                onChange={e => setMinStipend(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>$0</span>
                <span>$2,000</span>
                <span>$4,000+</span>
              </div>
            </div>

            {/* Max Duration */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Max Duration
                </label>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  {maxDuration} Weeks
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="26"
                step="2"
                value={maxDuration}
                onChange={e => setMaxDuration(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>4 weeks</span>
                <span>12 weeks</span>
                <span>6 months</span>
              </div>
            </div>

          </Card>
        </div>

        {/* Right Side Internship Cards Marketplace */}
        <div className="md:col-span-3 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : internships.length === 0 ? (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title="No Matching Internships Found"
              description="Try adjusting your keyword, domain, or stipend filters to discover active opportunities."
              actionText="Reset All Filters"
              onAction={clearFilters}
            />
          ) : (
            internships.map(internship => (
              <Card
                key={internship.id}
                hover
                className="p-5 sm:p-6 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left Logo + Meta */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-lg border border-slate-200 dark:border-slate-700 shrink-0">
                      {internship.company?.name?.[0] || 'C'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/internships/${internship.id}`}
                          className="font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          {internship.title}
                        </Link>
                        {internship.is_featured && (
                          <Badge variant="brand" size="sm">Featured</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {internship.company?.name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {internship.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {internship.duration_weeks} Weeks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Bookmark & Work Mode */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={e => handleToggleBookmark(internship.id, e)}
                      aria-label="Bookmark Internship"
                      className={`p-2 rounded-xl border transition-colors ${
                        internship.is_bookmarked
                          ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${internship.is_bookmarked ? 'fill-amber-500' : ''}`} />
                    </button>
                    <Badge variant={internship.work_mode === 'REMOTE' ? 'success' : 'info'} size="sm">
                      {internship.work_mode.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Description Preview */}
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {internship.description}
                </p>

                {/* Skills Chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {internship.skills_required.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer Strip */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Monthly Stipend: </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${internship.stipend_amount.toLocaleString()} USD
                      </span>
                    </div>
                    <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Deadline: {new Date(internship.application_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/internships/${internship.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/internships/${internship.id}`}>
                      <Button size="sm">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
