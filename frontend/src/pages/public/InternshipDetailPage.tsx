import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, DollarSign, Building2,
  Bookmark, CheckCircle2, ArrowLeft, ExternalLink,
  Share2, ShieldCheck, Briefcase, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Internship } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const InternshipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [internship, setInternship] = useState<Internship | null>(null);
  const [similar, setSimilar] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.getInternship(Number(id))
      .then(res => {
        setInternship(res);
        // Fetch similar postings in same domain
        api.listInternships({ domain: res.domain, limit: 3 })
          .then(list => setSimilar(list.filter(i => i.id !== res.id)))
          .catch(() => {});
      })
      .catch(() => {
        showToast({ type: 'error', message: 'Internship opportunity not found.' });
      })
      .finally(() => setIsLoading(false));
  }, [id, showToast]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      showToast({ type: 'info', title: 'Sign In Required', message: 'Please sign in or register to submit an internship application.' });
      navigate('/login');
      return;
    }
    if (user?.role !== 'STUDENT') {
      showToast({ type: 'warning', message: 'Applications can only be submitted by registered student candidates.' });
      return;
    }
    navigate(`/student/apply/${internship?.id}`);
  };

  const handleBookmarkToggle = async () => {
    if (!internship) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.toggleBookmark(internship.id);
      setInternship({ ...internship, is_bookmarked: res.bookmarked });
      showToast({ type: 'success', message: res.message });
    } catch (e: any) {
      showToast({ type: 'error', message: 'Failed to update bookmark.' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse mb-8" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Internship not found</h2>
        <p className="mt-2 text-xs text-slate-500">The opportunity you are looking for may have been closed or archived.</p>
        <Link to="/internships" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <Link to="/internships" className="flex items-center gap-1.5 hover:text-brand-600 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all internships
        </Link>
        <span>Posting ID: #{internship.id}</span>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-brand-600 text-2xl border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
              {internship.company?.name?.[0] || 'C'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {internship.title}
                </h1>
                {internship.is_featured && (
                  <Badge variant="brand" size="sm">Featured</Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {internship.company?.name}
              </p>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {internship.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> {internship.domain}
                </span>
                <span>•</span>
                <Badge variant={internship.work_mode === 'REMOTE' ? 'success' : 'info'} size="sm">
                  {internship.work_mode.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBookmarkToggle}
              className={`p-2.5 rounded-xl border transition-colors ${
                internship.is_bookmarked
                  ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-600'
              }`}
              title="Save to bookmarks"
            >
              <Bookmark className={`w-5 h-5 ${internship.is_bookmarked ? 'fill-amber-500' : ''}`} />
            </button>
            <Button size="lg" onClick={handleApplyClick} className="shadow-md">
              Apply Now
            </Button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stipend</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              ₹{internship.stipend_amount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">per month (INR)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Duration</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {internship.duration_weeks} Weeks
            </span>
            <span className="text-[10px] text-slate-400 block">{internship.openings} Openings</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Term Window</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
              {new Date(internship.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(internship.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-400 block">Full-time cohort</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deadline</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block mt-0.5">
              {new Date(internship.application_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-400 block">Closing promptly</span>
          </div>
        </div>
      </Card>

      {/* Main Grid: Details Body + Company Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Internship Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                About the Internship
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {internship.description}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Key Responsibilities
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {internship.responsibilities}
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Required Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2 pt-1">
                {internship.skills_required.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Candidate Eligibility
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {internship.eligibility_criteria}
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Benefits & Perks
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {internship.benefits}
              </p>
            </div>
          </Card>

          {/* Similar Opportunities */}
          {similar.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Similar Internships in {internship.domain}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {similar.map(s => (
                  <Card key={s.id} hover className="p-4">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600">
                      <Link to={`/internships/${s.id}`}>{s.title}</Link>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{s.company?.name} • ₹{s.stipend_amount.toLocaleString()}/mo</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Company & Application Process Card */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hiring Organization
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-lg border border-slate-200 dark:border-slate-700">
                {internship.company?.name?.[0] || 'C'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {internship.company?.name}
                </h4>
                <p className="text-xs text-slate-400">{internship.company?.industry}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
              {internship.company?.about}
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Location:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{internship.company?.location}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Verification:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Institutional Partner
                </span>
              </div>
              {internship.company?.website && (
                <div className="pt-1">
                  <a
                    href={internship.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Visit Corporate Website <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Sticky Quick Action Box */}
          <Card className="p-6 space-y-4 bg-brand-50/50 dark:bg-brand-950/20 border-brand-200/60 dark:border-brand-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Application Deadline
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Applications are reviewed on a rolling basis by university coordinators and company interview panels.
            </p>
            <Button size="lg" className="w-full shadow-md" onClick={handleApplyClick}>
              Apply For This Opportunity
            </Button>
          </Card>
        </div>

      </div>

    </div>
  );
};
