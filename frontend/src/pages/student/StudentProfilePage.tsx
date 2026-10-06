import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, GraduationCap, Award,
  Code, FolderGit2, FileText, Upload, Edit3, Plus,
  Trash2, ExternalLink, Download, CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editGpa, setEditGpa] = useState(3.5);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const fetchProfile = () => {
    setIsLoading(true);
    api.getMyStudentProfile()
      .then(res => {
        setProfile(res);
        setEditBio(res.bio || '');
        setEditDept(res.department || '');
        setEditGpa(res.gpa || 3.5);
        setEditSkills(res.skills || []);
      })
      .catch(() => showToast({ type: 'error', message: 'Failed to load profile.' }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateMyStudentProfile({
        bio: editBio,
        department: editDept,
        gpa: editGpa,
        skills: editSkills,
      });
      setProfile(updated);
      setEditModalOpen(false);
      showToast({ type: 'success', title: 'Profile Updated', message: 'Your student profile details have been saved.' });
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Could not update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast({ type: 'error', message: 'Only PDF format is permitted for resumes.' });
      return;
    }

    setIsUploadingResume(true);
    try {
      const res = await api.uploadResume(file);
      showToast({ type: 'success', title: 'Resume Uploaded', message: res.message });
      fetchProfile();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to upload resume file.' });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!editSkills.includes(newSkill.trim())) {
      setEditSkills([...editSkills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkills(editSkills.filter(s => s !== skillToRemove));
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  const completion = profile.completion_percentage || 85;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* LinkedIn-Style Banner & Header Card */}
      <Card className="overflow-hidden">
        {/* Academic Banner Cover */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-brand-900 via-indigo-800 to-slate-900 relative">
          <div className="absolute top-4 right-4">
            <Badge variant="brand" size="sm" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Placement Status: {profile.placement_status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Profile Avatar & Primary Details */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center font-black text-brand-600 text-3xl shrink-0">
                {user?.first_name[0]}{user?.last_name[0]}
              </div>
              <div className="pb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {user?.full_name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {profile.department} • Sanjivani University, Kopargaon
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  PRN: {profile.student_id_number} • Class of {profile.batch_year}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setEditModalOpen(true)}
            >
              Edit Profile
            </Button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cumulative CGPA</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{profile.gpa} / 10.0</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Verified Email</span>
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate block">{user?.email}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone</span>
              <span className="text-xs text-slate-700 dark:text-slate-300">{user?.phone || 'Not configured'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Profile Strength</span>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{completion}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Resume Management Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" /> Verified PDF Resume
          </h2>
          {profile.resume_url && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for one-click applications
            </span>
          )}
        </div>

        {profile.resume_url ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {profile.resume_filename || 'Official_Resume.pdf'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Last updated {profile.resume_updated_at ? new Date(profile.resume_updated_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download / View
              </a>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" /> {isUploadingResume ? 'Uploading...' : 'Replace'}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                  disabled={isUploadingResume}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No resume uploaded yet
            </p>
            <p className="text-[11px] text-slate-400">
              Upload your verified PDF resume to enable one-click application submission
            </p>
            <div className="pt-2">
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" /> Choose PDF File
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </label>
            </div>
          </div>
        )}
      </Card>

      {/* About Summary */}
      <Card className="p-6 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          About & Career Objective
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {profile.bio || "No summary provided yet. Click Edit Profile to describe your academic focus, career aspirations, and technical specializations."}
        </p>
      </Card>

      {/* Skills Showcase */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-brand-600" /> Verified Technical Skills
          </h2>
          <span className="text-xs text-slate-400">{profile.skills.length} skills listed</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.skills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No skills added yet.</p>
          ) : (
            profile.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800 shadow-subtle"
              >
                {skill}
              </span>
            ))
          )}
        </div>
      </Card>

      {/* Projects Showcase */}
      {profile.projects && profile.projects.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FolderGit2 className="w-4 h-4 text-brand-600" /> Featured Engineering Projects
          </h2>
          <div className="space-y-4">
            {profile.projects.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {proj.title}
                  </h3>
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Repository <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.tech_stack.map((t, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Profile"
        subtitle="Update your department, GPA, bio summary, and skill badges"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Academic Department"
              value={editDept}
              onChange={e => setEditDept(e.target.value)}
            />
            <Input
              label="Cumulative CGPA (Scale 0.0 - 10.0)"
              type="number"
              step="0.01"
              min="0.0"
              max="10.0"
              value={editGpa}
              onChange={e => setEditGpa(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bio Summary & Objective
            </label>
            <textarea
              rows={4}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Tell recruiters about your background, strengths, and goals..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Add Skills
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g. Docker, Python, Machine Learning"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" size="sm" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
              {editSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={handleSaveProfile}>
              Save Profile
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
