import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Star, MapPin, Briefcase, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { Company } from '../../types';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.listCompanies({ search: search || undefined, industry: industry || undefined })
      .then(setCompanies)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, industry]);

  const industries = Array.from(new Set(companies.map(c => c.industry))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Corporate Partner Directory
            </h1>
            <Badge variant="brand" size="sm">{companies.length} Partners</Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verified institutional employers actively recruiting students for curricular internships
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full sm:w-64"
          />
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full sm:w-48 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="No Companies Found"
          description="Try changing your search terms or industry filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(comp => (
            <Card key={comp.id} hover className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    {comp.name[0]}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{comp.average_rating > 0 ? comp.average_rating.toFixed(1) : '5.0'}</span>
                  </div>
                </div>

                <h3 className="mt-4 font-bold text-base text-slate-900 dark:text-white">
                  {comp.name}
                </h3>
                <p className="text-xs font-medium text-brand-600 dark:text-brand-400">
                  {comp.industry}
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {comp.about}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {comp.location}
                </span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {comp.active_internships_count || 0} Open Roles
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
