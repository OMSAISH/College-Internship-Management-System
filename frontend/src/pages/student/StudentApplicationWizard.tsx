import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, Upload, Check, AlertCircle, ArrowLeft,
  ArrowRight, ShieldCheck, User, Mail, GraduationCap, Building2
} from 'lucide-react';
import { api } from '../../services/api';
import { Internship, StudentProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Stepper } from '../../components/common/Stepper';

export const StudentApplicationWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [internship, setInternship] = useState<Internship | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State across steps
  const [formData, setFormData] = useState({
    // Step 1: Personal info
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: '',
    gpa: 3.5,
    // Step 2: Resume
    resume_url: '',
    resume_filename: '',
    // Step 3: Cover Letter
    cover_letter: '',
    // Step 4: Qualifications
    graduation_year: 2026,
    relevant_coursework: '',
    github_or_portfolio: '',
    availability_confirmed: true,
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      api.getInternship(Number(id)),
      api.getMyStudentProfile().catch(() => null),
    ]).then(([intRes, profRes]) => {
      setInternship(intRes);
      if (profRes) {
        setProfile(profRes);
        setFormData(prev => ({
          ...prev,
          department: profRes.department || 'Computer Science',
          gpa: profRes.gpa || 3.5,
          resume_url: profRes.resume_url || '',
          resume_filename: profRes.resume_filename || 'Default_Verified_Resume.pdf',
          github_or_portfolio: profRes.github_url || profRes.portfolio_url || '',
        }));
      }
    }).catch(() => {
      showToast({ type: 'error', message: 'Could not load internship details.' });
      navigate('/internships');
    }).finally(() => setIsLoading(false));
  }, [id, navigate, showToast]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast({ type: 'error', message: 'Only PDF format is permitted for resumes.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', message: 'File size exceeds maximum allowed 5MB limit.' });
      return;
    }

    setIsUploadingResume(true);
    try {
      const res = await api.uploadResume(file);
      setFormData(prev => ({
        ...prev,
        resume_url: res.resume_url,
        resume_filename: res.resume_filename,
      }));
      setResumeFile(file);
      showToast({ type: 'success', title: 'Resume Uploaded', message: res.message });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Failed to upload resume file.' });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const steps = [
    { title: 'Personal Info' },
    { title: 'Resume' },
    { title: 'Cover Letter' },
    { title: 'Qualifications' },
    { title: 'Review & Submit' },
  ];

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        showToast({ type: 'error', message: 'Please complete all required personal details.' });
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.resume_url) {
        showToast({ type: 'error', message: 'A PDF resume is mandatory to apply.' });
        return;
      }
    }
    if (currentStep === 3) {
      if (formData.cover_letter.trim().length < 20) {
        showToast({ type: 'error', message: 'Please provide a cover letter of at least 20 characters.' });
        return;
      }
    }
    setCurrentStep(prev => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmitFinal = async () => {
    if (!internship) return;
    setIsSubmitting(true);
    try {
      await api.submitApplication({
        internship_id: internship.id,
        resume_url: formData.resume_url,
        cover_letter: formData.cover_letter,
        qualifications: {
          department: formData.department,
          gpa: formData.gpa,
          graduation_year: formData.graduation_year,
          relevant_coursework: formData.relevant_coursework,
          portfolio_url: formData.github_or_portfolio,
        },
      });

      showToast({
        type: 'success',
        title: 'Application Submitted! 🎉',
        message: `Your application for ${internship.title} has been forwarded to faculty coordinators.`,
      });
      navigate('/student/applications');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Application Failed',
        message: err.message || 'Could not submit application.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !internship) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Preparing application wizard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={`/internships/${internship.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Internship Details
        </Link>
        <span className="text-xs text-slate-400">Step {currentStep} of 5</span>
      </div>

      {/* Target Role Card */}
      <Card className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/60 dark:border-brand-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 flex items-center justify-center font-bold text-brand-600">
            {internship.company?.name?.[0] || 'C'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {internship.title}
            </h2>
            <p className="text-xs text-brand-600 dark:text-brand-400">
              {internship.company?.name} • ${internship.stipend_amount.toLocaleString()}/mo • {internship.location}
            </p>
          </div>
        </div>
      </Card>

      {/* Stepper Wizard Indicator */}
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={step => step < currentStep && setCurrentStep(step)}
      />

      {/* Wizard Form Cards */}
      <Card className="p-6 sm:p-8 space-y-6">
        
        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 1: Personal & Institutional Details
              </h3>
              <p className="text-xs text-slate-500">
                Verify that your candidate contact details and department are accurate
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
              <Input
                label="Last Name *"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Institutional Email *"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Contact Phone"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Academic Department"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                label="Current Cumulative GPA"
                type="number"
                step="0.01"
                min="0.0"
                max="4.0"
                value={formData.gpa}
                onChange={e => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Resume */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 2: Resume Verification
              </h3>
              <p className="text-xs text-slate-500">
                Attach your official PDF resume for employer review (Max 5MB)
              </p>
            </div>

            {formData.resume_url ? (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {formData.resume_filename || 'Verified_Resume.pdf'}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                      Verified & attached to application
                    </p>
                  </div>
                </div>
                <a
                  href={formData.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Preview
                </a>
              </div>
            ) : null}

            {/* Upload or replace */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formData.resume_url ? 'Upload a replacement resume (PDF only)' : 'Upload your PDF resume'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Single PDF file up to 5MB
                </p>
              </div>
              <div>
                <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm">
                  {isUploadingResume ? 'Uploading...' : 'Choose PDF File'}
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
          </div>
        )}

        {/* STEP 3: Cover Letter */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 3: Cover Letter & Statement of Interest
              </h3>
              <p className="text-xs text-slate-500">
                Explain why you are an ideal candidate for {internship.title} at {internship.company?.name}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Statement / Cover Letter (Minimum 20 characters) *
              </label>
              <textarea
                rows={8}
                required
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Describe your relevant technical background, coursework, previous projects, and enthusiasm for this role..."
                value={formData.cover_letter}
                onChange={e => setFormData({ ...formData, cover_letter: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 text-right mt-1">
                {formData.cover_letter.length} characters
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Qualifications */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 4: Academic Qualifications & Coursework
              </h3>
              <p className="text-xs text-slate-500">
                Provide academic context to help the recruitment committee screen your application
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Anticipated Graduation Year"
                type="number"
                value={formData.graduation_year}
                onChange={e => setFormData({ ...formData, graduation_year: parseInt(e.target.value) || 2026 })}
              />
              <Input
                label="GitHub or Portfolio URL"
                placeholder="https://github.com/..."
                value={formData.github_or_portfolio}
                onChange={e => setFormData({ ...formData, github_or_portfolio: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Relevant Academic Coursework
              </label>
              <Input
                placeholder="e.g. Data Structures, Distributed Systems, Database Architecture, Machine Learning"
                value={formData.relevant_coursework}
                onChange={e => setFormData({ ...formData, relevant_coursework: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.availability_confirmed}
                  onChange={e => setFormData({ ...formData, availability_confirmed: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>I confirm that I am available full-time during the {internship.duration_weeks}-week cohort window.</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: Final Review & Confirmation */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 5: Review & Final Confirmation
              </h3>
              <p className="text-xs text-slate-500">
                Please double-check your application data before submitting to the coordinator
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                  Candidate Details
                </span>
                <p><span className="text-slate-400">Name:</span> {formData.first_name} {formData.last_name}</p>
                <p><span className="text-slate-400">Email:</span> {formData.email}</p>
                <p><span className="text-slate-400">Department:</span> {formData.department} (GPA: {formData.gpa})</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                  Attached Resume
                </span>
                <p className="font-semibold text-brand-600 truncate">{formData.resume_filename}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                  Cover Letter Preview
                </span>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-4">
                  {formData.cover_letter}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Institutional Academic Declaration:</p>
                <p className="text-[11px] leading-relaxed">
                  By clicking Submit Application, you certify that all information provided is accurate and adheres to the University Code of Academic Conduct.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Navigation Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="outline" size="sm" onClick={handleBack} disabled={isSubmitting}>
              Previous Step
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button size="sm" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Save & Next Step
            </Button>
          ) : (
            <Button
              size="lg"
              isLoading={isSubmitting}
              onClick={handleSubmitFinal}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md text-white font-bold"
            >
              Submit Application
            </Button>
          )}
        </div>

      </Card>
    </div>
  );
};
