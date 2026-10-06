import React, { useState, useEffect } from 'react';
import {
  Award, Search, Filter, Star, Eye, Archive,
  RefreshCw, CheckCircle, TrendingUp, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { Evaluation, HiringRecommendation } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

const RUBRIC_CRITERIA = [
  { key: 'technical_score', label: 'Technical Proficiency' },
  { key: 'communication_score', label: 'Communication Skills' },
  { key: 'problem_solving_score', label: 'Problem Solving' },
  { key: 'teamwork_score', label: 'Teamwork & Collaboration' },
  { key: 'punctuality_score', label: 'Punctuality & Deadlines' },
  { key: 'responsibility_score', label: 'Accountability & Ownership' },
  { key: 'learning_ability_score', label: 'Adaptability & Learning' },
] as const;

export const AdminEvaluationsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('ALL');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [viewingEval, setViewingEval] = useState<Evaluation | null>(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await api.listEvaluations({ include_archived: includeArchived });
      setEvaluations(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load evaluations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [includeArchived]);

  const handleArchiveToggle = async (id: number) => {
    try {
      await api.archiveEvaluation(id);
      showToast('Evaluation archive state toggled', 'success');
      fetchEvaluations();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive evaluation', 'error');
    }
  };

  const filtered = evaluations.filter((ev) => {
    const sName = ev.student_name || '';
    const comp = ev.company_name || '';
    const title = ev.internship_title || '';
    const matchesSearch =
      sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRec =
      recommendationFilter === 'ALL' || ev.hiring_recommendation === recommendationFilter;

    return matchesSearch && matchesRec;
  });

  const total = evaluations.length;
  const avgScore = total
    ? (evaluations.reduce((a, b) => a + b.overall_score, 0) / total).toFixed(2)
    : '0.00';
  const endorsed = evaluations.filter(
    (e) =>
      e.hiring_recommendation === HiringRecommendation.STRONGLY_RECOMMEND ||
      e.hiring_recommendation === HiringRecommendation.RECOMMEND
  ).length;

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Performance Rubrics & Evaluations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Centrally audit faculty and corporate supervisor rubrics across all 7 ABET/accreditation criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchEvaluations} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="text-xs text-gray-500 font-medium">Completed Rubric Evaluations</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{total}</div>
          <div className="text-xs text-gray-400 mt-1">Recorded in institutional ledger</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-gray-500 font-medium">Institutional Rubric Average</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{avgScore} / 5.0</div>
          <div className="text-xs text-gray-400 mt-1">Weighted across all 7 criteria</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-xs text-gray-500 font-medium">Positive Endorsement Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {total ? Math.round((endorsed / total) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-400 mt-1">{endorsed} of {total} candidates endorsed</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search candidate, company, or role..."
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

          <div className="flex items-center justify-end">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show Archived Evaluations
            </label>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading evaluation records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No evaluations found"
              description="No evaluation records matched your search parameters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Internship & Enterprise</th>
                  <th className="px-4 py-3">Evaluator</th>
                  <th className="px-4 py-3">Overall Score</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((ev) => (
                  <tr
                    key={ev.id}
                    className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${
                      ev.is_archived ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {ev.student_name || `Student #${ev.student_id}`}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-gray-200">{ev.internship_title}</div>
                      <div className="text-xs text-gray-400">{ev.company_name}</div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {ev.evaluator_name || 'Academic Coordinator'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {ev.overall_score.toFixed(1)} / 5.0
                      </div>
                    </td>

                    <td className="px-4 py-3">{getRecommendationBadge(ev.hiring_recommendation)}</td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingEval(ev)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Dossier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveToggle(ev.id)}
                          leftIcon={<Archive className="w-3.5 h-3.5" />}
                        >
                          {ev.is_archived ? 'Restore' : 'Archive'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* VIEW DOSSIER MODAL */}
      {viewingEval && (
        <Modal
          isOpen={!!viewingEval}
          onClose={() => setViewingEval(null)}
          title={`Accreditation Performance Dossier: ${viewingEval.student_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {viewingEval.student_name}
                </h3>
                <p className="text-xs text-gray-500">
                  {viewingEval.internship_title} at {viewingEval.company_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Evaluated by: {viewingEval.evaluator_name || 'Academic Coordinator'} on{' '}
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

            {/* Criteria breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Criteria Evaluation Rubric
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RUBRIC_CRITERIA.map((crit) => {
                  const val = viewingEval[crit.key as keyof Evaluation] as number;
                  return (
                    <div
                      key={crit.key}
                      className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {crit.label}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {val} / 5
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="space-y-3 text-xs">
              {viewingEval.strengths && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Noted Candidate Strengths:
                  </span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{viewingEval.strengths}</p>
                </div>
              )}

              {viewingEval.areas_for_improvement && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    Growth & Development Recommendations:
                  </span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {viewingEval.areas_for_improvement}
                  </p>
                </div>
              )}

              {viewingEval.comments && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    General Evaluator Remarks:
                  </span>
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
