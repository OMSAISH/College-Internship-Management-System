import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Download, Star,
  Calendar, Check, X, Clock, ExternalLink, MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, ApplicationStatus, Internship } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { RatingStars } from '../../components/common/RatingStars';
import { EmptyState } from '../../components/common/EmptyState';

export const FacultyApplicationsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Review Candidate Modal
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [facultyNotes, setFacultyNotes] = useState('');
  const [facultyRating, setFacultyRating] = useState(4);
  const [statusComment, setStatusComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Schedule Interview Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewer_name: 'Dr. Jane Smith (Tech Lead)',
    interviewer_email: 'recruiting@partner.example.com',
    round_name: 'Technical Architecture Round',
    scheduled_at: '',
    duration_minutes: 45,
    location_or_link: 'Google Meet: https://meet.google.com/xyz-cims-tech',
  });
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchApplications = () => {
    setIsLoading(true);
    api.listApplications({
      internship_id: selectedInternshipId ? Number(selectedInternshipId) : undefined,
      status_filter: selectedStatus ? (selectedStatus as ApplicationStatus) : undefined,
      search: search || undefined,
    }).then(setApplications)
      .catch(() => showToast({ type: 'error', message: 'Failed to fetch candidate applications.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    api.listInternships().then(setInternships).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, 200);
    return () => clearTimeout(timer);
  }, [selectedInternshipId, selectedStatus, search]);

  const handleOpenReview = (app: Application) => {
    setActiveApp(app);
    setFacultyNotes(app.faculty_notes || '');
    setFacultyRating(app.faculty_rating || 4);
    setStatusComment('');
  };

  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!activeApp) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateApplicationStatus(activeApp.id, {
        status: newStatus,
        comment: statusComment || `Status changed to ${newStatus} by faculty coordinator.`,
        faculty_notes: facultyNotes,
        faculty_rating: facultyRating,
      });
      showToast({ type: 'success', title: `Candidate Marked ${newStatus}`, message: `Status updated for ${updated.student?.full_name}` });
      setActiveApp(null);
      fetchApplications();
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Could not update application status.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;
    setIsScheduling(true);
    try {
      await api.scheduleInterview({
        application_id: activeApp.id,
        ...interviewForm,
        scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
      });
      showToast({ type: 'success', title: 'Interview Dispatched!', message: `Interview invitation sent to ${activeApp.student?.full_name}` });
      setScheduleModalOpen(false);
      setActiveApp(null);
      fetchApplications();
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Failed to schedule interview round.' });
    } finally {
      setIsScheduling(false);
    }
  };

  // Pre-fill next day afternoon interview time
  const handleOpenScheduleModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(14, 0, 0, 0);
    setInterviewForm(prev => ({
      ...prev,
      scheduled_at: tomorrow.toISOString().slice(0, 16),
    }));
    setScheduleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Candidate Application Review
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Screen student profiles, evaluate verified resumes, and schedule candidate interview rounds
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search candidate name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <select
          value={selectedInternshipId}
          onChange={e => setSelectedInternshipId(e.target.value)}
          className="w-full md:w-64 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Internship Roles</option>
          {internships.map(i => (
            <option key={i.id} value={i.id}>{i.title} ({i.company?.name})</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="w-full md:w-48 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
          <option value="ACCEPTED">Accepted / Placed</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </Card>

      {/* Applications Review Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No Candidate Applications Found"
          description="Try changing your search terms or filter criteria to see applications."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Candidate Name</th>
                  <th className="py-3.5 px-4">Internship Role</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {app.student?.first_name} {app.student?.last_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {app.student?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {app.internship?.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.internship?.company?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(app)}
                      >
                        Review Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recruitment Review Modal */}
      {activeApp && (
        <Modal
          isOpen={!!activeApp}
          onClose={() => setActiveApp(null)}
          title={`Review Candidate: ${activeApp.student?.full_name}`}
          subtitle={`Application for ${activeApp.internship?.title} at ${activeApp.internship?.company?.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            
            {/* Candidate Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Candidate Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{activeApp.student?.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeApp.qualifications?.department || 'Engineering'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Cumulative GPA</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{activeApp.qualifications?.gpa || '3.50'} / 4.0</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Status</span>
                <StatusBadge status={activeApp.status} size="sm" />
              </div>
            </div>

            {/* Resume Access Button */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Candidate Verified Resume
                  </p>
                  <p className="text-[11px] text-slate-400">PDF document submitted with application</p>
                </div>
              </div>
              <a
                href={activeApp.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download / View PDF
              </a>
            </div>

            {/* Cover Letter */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Candidate Cover Letter & Statement
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                {activeApp.cover_letter}
              </div>
            </div>

            {/* Coordinator Evaluation Ratings & Notes */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Coordinator Screening Rating:
                </span>
                <RatingStars interactive rating={facultyRating} onChange={setFacultyRating} size="md" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Private Faculty Notes (Evaluator eyes only)
                </label>
                <textarea
                  rows={2}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  value={facultyNotes}
                  onChange={e => setFacultyNotes(e.target.value)}
                  placeholder="e.g. Strong foundational system knowledge, passes pre-qualification."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Change Comment (Visible to student)
                </label>
                <input
                  type="text"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  value={statusComment}
                  onChange={e => setStatusComment(e.target.value)}
                  placeholder="e.g. Shortlisted for upcoming technical interview."
                />
              </div>
            </div>

            {/* Action Decision Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isUpdatingStatus}
                  onClick={() => handleUpdateStatus('SHORTLISTED')}
                  className="text-brand-600 border-brand-200"
                >
                  Shortlist Candidate
                </Button>
                <Button
                  size="sm"
                  onClick={handleOpenScheduleModal}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Schedule Interview
                </Button>
                <Button
                  size="sm"
                  isLoading={isUpdatingStatus}
                  onClick={() => handleUpdateStatus('ACCEPTED')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Accept Offer
                </Button>
              </div>

              <Button
                variant="danger"
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => handleUpdateStatus('REJECTED')}
              >
                Reject Application
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModalOpen && (
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title={`Schedule Interview: ${activeApp?.student?.full_name}`}
          subtitle={`For ${activeApp?.internship?.title}`}
        >
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <Input
              label="Interview Round Name *"
              required
              value={interviewForm.round_name}
              onChange={e => setInterviewForm({ ...interviewForm, round_name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Interviewer Name *"
                required
                value={interviewForm.interviewer_name}
                onChange={e => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
              />
              <Input
                label="Interviewer Email"
                value={interviewForm.interviewer_email}
                onChange={e => setInterviewForm({ ...interviewForm, interviewer_email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date & Time *"
                type="datetime-local"
                required
                value={interviewForm.scheduled_at}
                onChange={e => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })}
              />
              <Input
                label="Duration (Minutes) *"
                type="number"
                min="15"
                max="180"
                value={interviewForm.duration_minutes}
                onChange={e => setInterviewForm({ ...interviewForm, duration_minutes: parseInt(e.target.value) || 45 })}
              />
            </div>

            <Input
              label="Meeting Link / Physical Venue *"
              required
              value={interviewForm.location_or_link}
              onChange={e => setInterviewForm({ ...interviewForm, location_or_link: e.target.value })}
              placeholder="e.g. Google Meet: https://meet.google.com/..."
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isScheduling}>
                Confirm & Dispatch Invite
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
