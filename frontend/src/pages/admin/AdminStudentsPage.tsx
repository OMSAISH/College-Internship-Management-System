import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, ShieldAlert, CheckCircle,
  Eye, UserX, UserCheck, RefreshCw, FileText, Download,
  ExternalLink, GraduationCap, Award
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentProfile, PlacementStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminStudentsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [placementFilter, setPlacementFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [statusTogglingId, setStatusTogglingId] = useState<number | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.listStudents({
        search: searchTerm || undefined,
        department: departmentFilter || undefined,
        placement_status: placementFilter || undefined,
      });
      setStudents(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load students directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [departmentFilter, placementFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleToggleAccountStatus = async (student: StudentProfile) => {
    if (!student.user) return;
    const isCurrentlyActive = student.user.is_active;
    const actionLabel = isCurrentlyActive ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} the account of ${student.user.full_name}?`)) {
      return;
    }

    try {
      setStatusTogglingId(student.user_id);
      if (isCurrentlyActive) {
        await api.deactivateStudent(student.user_id);
        showToast(`Student account for ${student.user.full_name} deactivated.`, 'success');
      } else {
        await api.activateStudent(student.user_id);
        showToast(`Student account for ${student.user.full_name} reactivated.`, 'success');
      }
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || `Failed to ${actionLabel} account`, 'error');
    } finally {
      setStatusTogglingId(null);
    }
  };

  // KPI calculations
  const total = students.length;
  const placedCount = students.filter((s) => s.placement_status === PlacementStatus.PLACED).length;
  const avgGpa = total ? (students.reduce((acc, s) => acc + s.gpa, 0) / total).toFixed(2) : '0.00';
  const inactiveCount = students.filter((s) => s.user && !s.user.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Student Roster
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage student verification, profile completeness, placement status, and account authorizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchStudents} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => api.downloadPlacementsCsv()}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Student CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="text-xs text-gray-500 font-medium">Total Registered</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{total}</div>
          <div className="text-xs text-gray-400 mt-1">Undergraduate Candidates</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-gray-500 font-medium">Successfully Placed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{placedCount}</div>
          <div className="text-xs text-gray-400 mt-1">
            {total ? Math.round((placedCount / total) * 100) : 0}% Conversion Rate
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-xs text-gray-500 font-medium">Cohort Average GPA</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{avgGpa} / 4.0</div>
          <div className="text-xs text-gray-400 mt-1">Normalized Grade Point Avg</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="text-xs text-gray-500 font-medium">Deactivated Accounts</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{inactiveCount}</div>
          <div className="text-xs text-gray-400 mt-1">Restricted or Inactive</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by student name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              { value: 'Computer Science', label: 'Computer Science' },
              { value: 'Data Science', label: 'Data Science' },
              { value: 'Software Engineering', label: 'Software Engineering' },
              { value: 'Information Technology', label: 'Information Technology' },
              { value: 'Cybersecurity', label: 'Cybersecurity' },
              { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
            ]}
          />

          <Select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            options={[
              { value: '', label: 'All Placement Statuses' },
              { value: PlacementStatus.SEEKING, label: 'Seeking' },
              { value: PlacementStatus.PLACED, label: 'Placed' },
              { value: PlacementStatus.NOT_INTERESTED, label: 'Not Interested' },
            ]}
          />
        </form>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading student records...
          </div>
        ) : students.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No students found"
              description="No candidates matched your search criteria or filter selections."
              action={
                <Button variant="outline" onClick={() => { setSearchTerm(''); setDepartmentFilter(''); setPlacementFilter(''); }}>
                  Reset Filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student Info</th>
                  <th className="px-4 py-3">Department & Batch</th>
                  <th className="px-4 py-3">GPA</th>
                  <th className="px-4 py-3">Profile Completion</th>
                  <th className="px-4 py-3">Placement</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {st.user ? st.user.first_name[0] + st.user.last_name[0] : 'ST'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {st.user ? st.user.full_name : 'Student'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {st.student_id_number} • {st.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                        {st.department}
                      </div>
                      <div className="text-[11px] text-gray-400">Class of {st.batch_year}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        {st.gpa.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{st.completion_percentage ?? 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              (st.completion_percentage ?? 0) >= 80
                                ? 'bg-emerald-500'
                                : (st.completion_percentage ?? 0) >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${st.completion_percentage ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          st.placement_status === PlacementStatus.PLACED
                            ? 'success'
                            : st.placement_status === PlacementStatus.SEEKING
                            ? 'info'
                            : 'default'
                        }
                        size="sm"
                      >
                        {st.placement_status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={st.user?.is_active ? 'success' : 'danger'}
                        size="sm"
                      >
                        {st.user?.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(st)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Dossier
                        </Button>
                        <Button
                          variant={st.user?.is_active ? 'danger' : 'primary'}
                          size="sm"
                          isLoading={statusTogglingId === st.user_id}
                          onClick={() => handleToggleAccountStatus(st)}
                          leftIcon={
                            st.user?.is_active ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {st.user?.is_active ? 'Deactivate' : 'Activate'}
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

      {/* STUDENT PROFILE DOSSIER MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Candidate Academic Dossier: ${selectedStudent.user?.full_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {selectedStudent.user?.full_name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedStudent.student_id_number} • {selectedStudent.user?.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Department: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedStudent.department}</span> • Batch of {selectedStudent.batch_year}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {selectedStudent.gpa.toFixed(2)}
                </div>
                <div className="text-[10px] uppercase font-bold text-gray-400">GPA / 4.00</div>
              </div>
            </div>

            {selectedStudent.about && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Professional Bio
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {selectedStudent.about}
                </p>
              </div>
            )}

            {/* Skills */}
            {selectedStudent.skills && selectedStudent.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Technical Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Link */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Official Resume
              </h4>
              {selectedStudent.resume_url ? (
                <a
                  href={selectedStudent.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <FileText className="w-4 h-4" /> View Verified Student Resume (PDF)
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-gray-400">No resume uploaded yet.</span>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
