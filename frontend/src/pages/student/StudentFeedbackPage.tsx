import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Building2, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Company, FeedbackItem, FeedbackTargetType } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { RatingStars } from '../../components/common/RatingStars';
import { Badge } from '../../components/common/Badge';

export const StudentFeedbackPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState<'company' | 'system'>('company');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Company review form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);
  const [cultureRating, setCultureRating] = useState(5);
  const [mentorshipRating, setMentorshipRating] = useState(5);
  const [learningRating, setLearningRating] = useState(5);
  const [workEnvRating, setWorkEnvRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [companyReview, setCompanyReview] = useState('');

  // System feedback form state
  const [systemTitle, setSystemTitle] = useState('');
  const [systemComment, setSystemComment] = useState('');
  const [systemRating, setSystemRating] = useState(5);

  useEffect(() => {
    api.listCompanies().then(res => {
      setCompanies(res);
      if (res.length > 0) setSelectedCompanyId(res[0].id);
    }).catch(() => {});
  }, []);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setIsSubmitting(true);
    try {
      await api.rateCompany(selectedCompanyId, {
        culture_rating: cultureRating,
        mentorship_rating: mentorshipRating,
        learning_rating: learningRating,
        work_env_rating: workEnvRating,
        overall_rating: overallRating,
        review: companyReview,
      });
      showToast({ type: 'success', title: 'Review Submitted', message: 'Thank you for contributing to campus internship transparency!' });
      setCompanyReview('');
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Could not submit review.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        target_type: 'SYSTEM',
        title: systemTitle,
        comment: systemComment,
        rating: systemRating,
      });
      showToast({ type: 'success', title: 'Feedback Recorded', message: 'Your suggestions have been submitted to the placement cell administrators.' });
      setSystemTitle('');
      setSystemComment('');
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Could not submit feedback.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Feedback & Corporate Reviews
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Share your candid evaluation of partner companies and suggest improvements for the campus platform
        </p>

        {/* Tab switch */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'company'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Rate Partner Company
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'system'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Platform Suggestion / Bug Report
          </button>
        </div>
      </div>

      {activeTab === 'company' ? (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Evaluate Corporate Internship Experience
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your feedback helps junior students make informed career decisions
            </p>
          </div>

          <form onSubmit={handleCompanySubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Partner Company *
              </label>
              <select
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>

            {/* 5-Criteria Ratings Rubric */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Company Culture:</span>
                <RatingStars interactive rating={cultureRating} onChange={setCultureRating} size="md" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Engineering Mentorship:</span>
                <RatingStars interactive rating={mentorshipRating} onChange={setMentorshipRating} size="md" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Technical Learning:</span>
                <RatingStars interactive rating={learningRating} onChange={setLearningRating} size="md" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Environment:</span>
                <RatingStars interactive rating={workEnvRating} onChange={setWorkEnvRating} size="md" />
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Overall Experience:</span>
                <RatingStars interactive rating={overallRating} onChange={setOverallRating} size="lg" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Review & Comments
              </label>
              <textarea
                rows={4}
                required
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Describe your day-to-day work, projects handled, support from senior staff, and advice for prospective interns..."
                value={companyReview}
                onChange={e => setCompanyReview(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Submit Company Evaluation
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Platform Feedback
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit feature requests, reporting errors, or suggestions to the university placement administration
            </p>
          </div>

          <form onSubmit={handleSystemSubmit} className="space-y-4">
            <Input
              label="Subject / Feedback Title *"
              required
              value={systemTitle}
              onChange={e => setSystemTitle(e.target.value)}
              placeholder="e.g. Add notification for interview calendar export to iCal"
            />

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rate Overall Platform Usability:
              </span>
              <RatingStars interactive rating={systemRating} onChange={setSystemRating} size="md" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description & Steps *
              </label>
              <textarea
                rows={5}
                required
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Provide specific details or suggestions to help us improve the platform..."
                value={systemComment}
                onChange={e => setSystemComment(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Send Platform Feedback
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};
