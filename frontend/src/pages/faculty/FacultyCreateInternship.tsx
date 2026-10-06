import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Building2, Calendar, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Company, WorkMode } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

export const FacultyCreateInternship: React.FC = () => {
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    company_id: 0,
    title: '',
    domain: 'Software Engineering',
    work_mode: 'HYBRID' as WorkMode,
    stipend_amount: 2500,
    duration_weeks: 12,
    openings: 2,
    location: '',
    start_date: '',
    end_date: '',
    application_deadline: '',
    skills_required: '',
    description: '',
    responsibilities: '',
    requirements: '',
    eligibility_criteria: 'Must be an enrolled student with GPA 3.0 or higher.',
    benefits: 'Competitive monthly stipend, 1-on-1 industry mentorship, and potential full-time offer.',
    is_featured: false,
  });

  useEffect(() => {
    api.listCompanies().then(res => {
      setCompanies(res);
      if (res.length > 0) {
        setFormData(prev => ({
          ...prev,
          company_id: res[0].id,
          location: res[0].location,
        }));
      }
    }).catch(() => {});

    // Set reasonable default dates
    const today = new Date();
    const deadline = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const start = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + 150 * 24 * 60 * 60 * 1000);

    setFormData(prev => ({
      ...prev,
      application_deadline: deadline.toISOString().split('T')[0],
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      showToast({ type: 'error', message: 'Please select a hiring company.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsArray = formData.skills_required
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await api.createInternship({
        ...formData,
        skills_required: skillsArray.length > 0 ? skillsArray : ['Engineering', 'Problem Solving'],
      });

      showToast({ type: 'success', title: 'Internship Opportunity Posted!', message: 'The posting is now active on the student marketplace.' });
      navigate('/faculty/dashboard');
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Could not create internship posting.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Post Internship Opportunity
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Publish a new verified corporate internship listing for student discovery and application
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Partner Company *
              </label>
              <select
                value={formData.company_id}
                onChange={e => {
                  const compId = Number(e.target.value);
                  const selectedComp = companies.find(c => c.id === compId);
                  setFormData({
                    ...formData,
                    company_id: compId,
                    location: selectedComp ? selectedComp.location : formData.location,
                  });
                }}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.location})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Position / Role Title *"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Distributed Systems Software Intern"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Technical Domain"
              value={formData.domain}
              onChange={e => setFormData({ ...formData, domain: e.target.value })}
              options={[
                { value: 'Software Engineering', label: 'Software Engineering' },
                { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
                { value: 'Data Science', label: 'Data Science' },
                { value: 'Cybersecurity', label: 'Cybersecurity' },
                { value: 'Cloud & DevOps', label: 'Cloud & DevOps' },
                { value: 'Robotics', label: 'Robotics & Hardware' },
                { value: 'UI/UX & Frontend', label: 'UI/UX & Frontend' },
              ]}
            />

            <Select
              label="Work Mode"
              value={formData.work_mode}
              onChange={e => setFormData({ ...formData, work_mode: e.target.value as WorkMode })}
              options={[
                { value: 'HYBRID', label: 'Hybrid' },
                { value: 'REMOTE', label: 'Remote' },
                { value: 'ON_SITE', label: 'On-Site' },
              ]}
            />

            <Input
              label="Work Location"
              required
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Seattle, WA"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Monthly Stipend ($ USD) *"
              type="number"
              min="0"
              value={formData.stipend_amount}
              onChange={e => setFormData({ ...formData, stipend_amount: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="Duration (Weeks) *"
              type="number"
              min="4"
              max="26"
              value={formData.duration_weeks}
              onChange={e => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 12 })}
            />

            <Input
              label="Total Available Openings"
              type="number"
              min="1"
              value={formData.openings}
              onChange={e => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Important Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <Input
              label="Application Deadline *"
              type="date"
              required
              value={formData.application_deadline}
              onChange={e => setFormData({ ...formData, application_deadline: e.target.value })}
            />
            <Input
              label="Cohort Start Date *"
              type="date"
              required
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="Cohort End Date *"
              type="date"
              required
              value={formData.end_date}
              onChange={e => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <Input
            label="Required Skills (Comma separated) *"
            placeholder="e.g. Python, Docker, React, PostgreSQL"
            value={formData.skills_required}
            onChange={e => setFormData({ ...formData, skills_required: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Role Overview & Summary *
            </label>
            <textarea
              rows={3}
              required
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a general summary of the team and engineering initiatives..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Key Responsibilities *
            </label>
            <textarea
              rows={4}
              required
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={formData.responsibilities}
              onChange={e => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="• Architect and ship clean code...&#10;• Write comprehensive automated tests...&#10;• Collaborate with team in sprint planning..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Candidate Requirements & Qualifications *
            </label>
            <textarea
              rows={3}
              required
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={formData.requirements}
              onChange={e => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="Enrolled in computer science or engineering degree. Strong foundations in algorithms..."
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Publish Internship Opportunity
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
