import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Clock, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Internship } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentSavedPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [saved, setSaved] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSaved = () => {
    setIsLoading(true);
    api.getMyBookmarks()
      .then(setSaved)
      .catch(() => showToast({ type: 'error', message: 'Failed to fetch saved internships.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (id: number) => {
    try {
      await api.toggleBookmark(id);
      setSaved(prev => prev.filter(i => i.id !== id));
      showToast({ type: 'success', message: 'Removed from saved internships.' });
    } catch (e: any) {
      showToast({ type: 'error', message: 'Could not remove bookmark.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Saved Opportunities
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Keep track of bookmark positions you intend to apply for before the deadline closes
          </p>
        </div>
        <Link to="/internships">
          <Button size="sm">Explore More Roles</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-6 h-6" />}
          title="No Saved Internships"
          description="Click the bookmark icon on any opportunity in the marketplace to save it here for quick access."
          actionText="Browse Internships"
          onAction={() => window.location.href = '/internships'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {saved.map(internship => (
            <Card key={internship.id} hover className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-base border border-slate-200 dark:border-slate-700 shrink-0">
                      {internship.company?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white hover:text-brand-600">
                        <Link to={`/internships/${internship.id}`}>{internship.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500">{internship.company?.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(internship.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {internship.location}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${internship.stipend_amount.toLocaleString()}/mo
                  </span>
                  <span>•</span>
                  <Badge variant={internship.work_mode === 'REMOTE' ? 'success' : 'info'} size="sm">
                    {internship.work_mode.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
                </span>
                <Link to={`/internships/${internship.id}`}>
                  <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Apply Now
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
