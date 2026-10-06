import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Plus,
  Star,
  CheckCircle,
  AlertCircle,
  Archive,
  RefreshCw,
  Filter,
  Eye,
  FileText,
  UserCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { Evaluation, Application, HiringRecommendation } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

const RUBRIC_CRITERIA = [
  { key: 'technical_score', label: 'Technical Proficiency', desc: 'Domain knowledge, code/work quality, tool mastery' },
  { key: 'communication_score', label: 'Communication Skills', desc: 'Clarity, promptness, documentation, active listening' },
  { key: 'problem_solving_score', label: 'Problem Solving & Critical Thinking', desc: 'Analytical approach, initiative, creative solutions' },
  { key: 'teamwork_score', label: 'Teamwork & Collaboration', desc: 'Receptiveness to feedback, cross-functional synergy' },
  { key: 'punctuality_score', label: 'Punctuality & Attendance', desc: 'Adherence to deadlines, meeting presence, dependability' },
  { key: 'responsibility_score', label: 'Accountability & Ownership', desc: 'Ownership of deliverables, ethical conduct, reliability' },
  { key: 'learning_ability_score', label: 'Adaptability & Learning Agility', desc: 'Speed of grasping new concepts, willingness to learn' },
] as const;

export const FacultyEvaluationsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('ALL');
  const [includeArchived, setIncludeArchived] = useState(false);

  // New Evaluation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [scores, setScores] = useState({
    technical_score: 4,
    communication_score: 4,
    problem_solving_score: 4,
    teamwork_score: 4,
    punctuality_score: 5,
    responsibility_score: 4,
    learning_ability_score: 4,
  });
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<HiringRecommendation>(HiringRecommendation.RECOMMEND);

  // Detail Modal
  const [viewingEval, setViewingEval] = useState<Evaluation | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evalRes, appRes] = await Promise.all([
        api.listEvaluations({ include_archived: includeArchived }),
        api.listApplications({ status_filter: 'accepted' }),
      ]);
      setEvaluations(evalRes);
      setApplications(appRes);
    } catch (err: any) {
      showToast(err.message || 'Failed to load evaluations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [includeArchived]);

  // Compute live average score in modal
  const computedAverage = (
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  ).toFixed(2);

  const handleScoreChange = (key: keyof typeof scores, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      showToast('Please select a student application to evaluate.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.submitEvaluation({
        application_id: Number(selectedAppId),
        ...scores,
        strengths,
        areas_for_improvement: areasForImprovement,
        comments,
        hiring_recommendation: recommendation,
      });

      showToast('Evaluation submitted successfully!', 'success');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit evaluation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedAppId('');
    setScores({
      technical_score: 4,
      communication_score: 4,
      problem_solving_score: 4,
      teamwork_score: 4,
      punctuality_score: 5,
      responsibility_score: 4,
      learning_ability_score: 4,
    });
    setStrengths('');
    setAreasForImprovement('');
    setComments('');
    setRecommendation(HiringRecommendation.RECOMMEND);
  };

  const handleArchiveToggle = async (id: number) => {
    try {
      await api.archiveEvaluation(id);
      showToast('Evaluation archive state toggled', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive evaluation', 'error');
    }
  };

  const filteredEvaluations = evaluations.filter((ev) => {
    const studentName = ev.student_name || '';
    const internshipTitle = ev.internship_title || '';
    const company = ev.company_name || '';
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internshipTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRec =
      recommendationFilter === 'ALL' || ev.hiring_recommendation === recommendationFilter;

    return matchesSearch && matchesRec;
  });

  // Analytics KPIs
  const totalEvals = evaluations.length;
  const avgOverall = totalEvals
    ? (evaluations.reduce((acc, e) => acc + e.overall_score, 0) / totalEvals).toFixed(2)
    : '0.00';
  const highlyRecommendedCount = evaluations.filter(
    (e) =>
      e.hiring_recommendation === HiringRecommendation.STRONGLY_RECOMMEND ||
      e.hiring_recommendation === HiringRecommendation.RECOMMEND
  ).length;
  const recommendationRate = totalEvals ? Math.round((highlyRecommendedCount / totalEvals) * 100) : 0;

  const getRecommendationBadge = (rec: HiringRecommendation) => {
    switch (rec) {
      case HiringRecommendation.STRONGLY_RECOMMEND:
        return <Badge variant="success">Strongly Recommend</Badge>;
      case HiringRecommendation.RECOMMEND:
        return <Badge variant="info">Recommend</Badge>;
      case HiringRecommendation.NEUTRAL:
        return <Badge variant="warning">Neutral</Badge>;
      case HiringRecommendation.DO_NOT_RECOMMEND:
        return <Badge variant="danger">Do Not Recommend</Badge>;
      default:
        return <Badge variant="default">{rec}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Performance Evaluations & Rubrics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Conduct standardized institutional evaluations across 7 core professional competencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Conduct Evaluation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-indigo-600">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalEvals}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Evaluations</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-600">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgOverall} / 5.0</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Average Rubric Score</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-600">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{recommendationRate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Positive Endorsement Rate</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-amber-600">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">7 Criteria</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Standard Accreditation Rubric</div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search student, role, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />

          <Select
            value={recommendationFilter}
            onChange={(e) => setRecommendationFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Recommendations' },
              { value: HiringRecommendation.STRONGLY_RECOMMEND, label: 'Strongly Recommend' },
              { value: HiringRecommendation.RECOMMEND, label: 'Recommend' },
              { value: HiringRecommendation.NEUTRAL, label: 'Neutral' },
              { value: HiringRecommendation.DO_NOT_RECOMMEND, label: 'Do Not Recommend' },
            ]}
          />

          <div className="flex items-center justify-between md:justify-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show Archived
            </label>
          </div>
        </div>
      </Card>

      {/* Evaluations List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading evaluations...
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No evaluations found"
            description="No student evaluations match your current filter parameters or none have been submitted yet."
            action={
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Conduct First Evaluation
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvaluations.map((ev) => (
            <Card
              key={ev.id}
              className={`p-5 transition-shadow hover:shadow-md ${
                ev.is_archived ? 'opacity-60 bg-gray-50 dark:bg-gray-800/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {ev.student_name ? ev.student_name.slice(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {ev.student_name || `Student #${ev.student_id}`}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ev.internship_title} • {ev.company_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {ev.overall_score.toFixed(1)} / 5.0
                  </div>
                </div>
              </div>

              {/* Rubric Radar Preview (Mini Bars) */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-1">
                    <span>Technical</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{ev.technical_score}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${(ev.technical_score / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-1">
                    <span>Problem Solving</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{ev.problem_solving_score}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${(ev.problem_solving_score / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-1">
                    <span>Communication</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{ev.communication_score}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${(ev.communication_score / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-1">
                    <span>Teamwork</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{ev.teamwork_score}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${(ev.teamwork_score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths & Recommendation */}
              <div className="mt-4 flex items-center justify-between">
                <div>{getRecommendationBadge(ev.hiring_recommendation)}</div>
                <div className="text-xs text-gray-400">
                  Evaluated by: {ev.evaluator_name || 'Faculty Member'}
                </div>
              </div>

              {ev.strengths && (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg line-clamp-2">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strength: </span>
                  {ev.strengths}
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(ev.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveToggle(ev.id)}
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                  >
                    {ev.is_archived ? 'Unarchive' : 'Archive'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingEval(ev)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Rubric
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE EVALUATION MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Institutional Performance Rubric Evaluation"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Select Placed / Active Candidate <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">-- Choose an application --</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.student_name} — {app.internship_title} ({app.company_name})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Evaluations are registered against accepted internship placements.
            </p>
          </div>

          {/* 7-Criteria Rubric Scoring Grid */}
          <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Accreditation Competency Criteria (1 = Deficient, 5 = Exemplary)
              </h4>
              <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-bold rounded-lg text-sm flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Live Average: {computedAverage} / 5.0
              </div>
            </div>

            <div className="space-y-3">
              {RUBRIC_CRITERIA.map((criterion) => {
                const currentScore = scores[criterion.key as keyof typeof scores];
                return (
                  <div
                    key={criterion.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60"
                  >
                    <div>
                      <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">
                        {criterion.label}
                      </div>
                      <div className="text-xs text-gray-400">{criterion.desc}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleScoreChange(criterion.key as keyof typeof scores, rating)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            currentScore === rating
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Demonstrated Key Strengths
              </label>
              <textarea
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="e.g. Exceptional algorithmic problem solving and proactive communication during sprints..."
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Areas for Development / Growth
              </label>
              <textarea
                rows={3}
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                placeholder="e.g. Expand test coverage depth and deepen familiarity with automated CI/CD pipelines..."
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              General Evaluation Comments
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Official feedback notes recorded in institutional transcript..."
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Final Recommendation / Endorsement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: HiringRecommendation.STRONGLY_RECOMMEND, label: 'Strongly Recommend', color: 'border-emerald-500 text-emerald-600' },
                { val: HiringRecommendation.RECOMMEND, label: 'Recommend', color: 'border-blue-500 text-blue-600' },
                { val: HiringRecommendation.NEUTRAL, label: 'Neutral', color: 'border-amber-500 text-amber-600' },
                { val: HiringRecommendation.DO_NOT_RECOMMEND, label: 'Do Not Recommend', color: 'border-red-500 text-red-600' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setRecommendation(opt.val)}
                  className={`p-2.5 text-xs font-semibold rounded-lg border-2 text-center transition-all ${
                    recommendation === opt.val
                      ? `${opt.color} bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm`
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Submit Official Evaluation
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW RUBRIC DETAILS MODAL */}
      {viewingEval && (
        <Modal
          isOpen={!!viewingEval}
          onClose={() => setViewingEval(null)}
          title={`Official Evaluation Dossier: ${viewingEval.student_name || 'Student'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {viewingEval.student_name}
                </h3>
                <p className="text-xs text-gray-500">
                  {viewingEval.internship_title} at {viewingEval.company_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Evaluator: {viewingEval.evaluator_name || 'Institutional Coordinator'} •{' '}
                  {new Date(viewingEval.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="text-center bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {viewingEval.overall_score.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Overall / 5.0</div>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                Detailed Rubric Scoring Breakdown
              </h4>
              <div className="space-y-2">
                {RUBRIC_CRITERIA.map((criterion) => {
                  const val = viewingEval[criterion.key as keyof Evaluation] as number;
                  return (
                    <div
                      key={criterion.key}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-xs text-gray-900 dark:text-white">
                          {criterion.label}
                        </div>
                        <div className="text-[11px] text-gray-400">{criterion.desc}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          {val}
                        </span>
                        <span className="text-xs text-gray-400">/ 5</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Qualitative */}
            <div className="space-y-3 text-xs">
              {viewingEval.strengths && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Key Strengths: </span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{viewingEval.strengths}</p>
                </div>
              )}

              {viewingEval.areas_for_improvement && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                  <span className="font-bold text-amber-700 dark:text-amber-400">Areas for Growth: </span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{viewingEval.areas_for_improvement}</p>
                </div>
              )}

              {viewingEval.comments && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Official Remarks: </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">{viewingEval.comments}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>{getRecommendationBadge(viewingEval.hiring_recommendation)}</div>
              <Button variant="outline" onClick={() => setViewingEval(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
