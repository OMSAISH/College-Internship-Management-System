import React, { useState, useEffect } from 'react';
import {
  UserCheck, Search, Filter, ShieldCheck, Mail,
  Phone, Building2, RefreshCw, UserX
} from 'lucide-react';
import { api } from '../../services/api';
import { FacultyProfile } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminFacultyPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.listFaculty();
      setFacultyList(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load faculty directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const filtered = facultyList.filter((f) => {
    const name = f.user?.full_name || '';
    const email = f.user?.email || '';
    const dept = f.department || '';
    const empId = f.employee_id || '';
    const q = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q) ||
      empId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Faculty Coordinators & Academic Supervisors
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Departmental placement coordinators, evaluation authorities, and academic liaisons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchFaculty} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="text-xs text-gray-500 font-medium">Total Faculty Coordinators</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{facultyList.length}</div>
          <div className="text-xs text-gray-400 mt-1">Authorized for rubrics & posting</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs text-gray-500 font-medium">Active Coordinators</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {facultyList.filter((f) => f.user?.is_active).length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Current Active Permissions</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-xs text-gray-500 font-medium">Departments Covered</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {new Set(facultyList.map((f) => f.department)).size}
          </div>
          <div className="text-xs text-gray-400 mt-1">Academic Divisions</div>
        </Card>
      </div>

      {/* Search Input */}
      <Card className="p-4">
        <Input
          placeholder="Search by coordinator name, employee ID, department, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </Card>

      {/* Faculty Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading faculty coordinators...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No faculty coordinators found"
              description="No coordinators matched your search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Coordinator</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {f.user ? f.user.first_name[0] + f.user.last_name[0] : 'FC'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {f.user?.full_name}
                          </div>
                          <div className="text-xs text-gray-400">{f.user?.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                      {f.employee_id}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-200">
                      {f.department}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {f.designation}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {f.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" /> {f.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={f.user?.is_active ? 'success' : 'danger'} size="sm">
                        {f.user?.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
