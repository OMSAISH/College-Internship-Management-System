import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Search, Filter, RefreshCw, Eye,
  Clock, User, Laptop, Globe, CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminAuditLogsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.listAuditLogs({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        limit: 100,
      });
      setLogs(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) return <Badge variant="info">{action}</Badge>;
    if (action.includes('DEACTIVATE') || action.includes('REJECT')) return <Badge variant="danger">{action}</Badge>;
    if (action.includes('APPROVE') || action.includes('ACTIVATE') || action.includes('ACCEPT'))
      return <Badge variant="success">{action}</Badge>;
    if (action.includes('SUBMIT') || action.includes('CREATE')) return <Badge variant="brand">{action}</Badge>;
    return <Badge variant="default">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Security & Audit Trail
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Immutable system event ledger tracking authentication, status mutations, administrative approvals, and account authorizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchLogs} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: '', label: 'All Audited Actions' },
              { value: 'LOGIN', label: 'LOGIN (Authentication)' },
              { value: 'CREATE_APPLICATION', label: 'CREATE_APPLICATION' },
              { value: 'UPDATE_APPLICATION_STATUS', label: 'UPDATE_APPLICATION_STATUS' },
              { value: 'APPROVE_INTERNSHIP', label: 'APPROVE_INTERNSHIP' },
              { value: 'REJECT_INTERNSHIP', label: 'REJECT_INTERNSHIP' },
              { value: 'SUBMIT_EVALUATION', label: 'SUBMIT_EVALUATION' },
              { value: 'ACCOUNT_DEACTIVATED', label: 'ACCOUNT_DEACTIVATED' },
              { value: 'ACCOUNT_ACTIVATED', label: 'ACCOUNT_ACTIVATED' },
              { value: 'UPDATE_SYSTEM_SETTING', label: 'UPDATE_SYSTEM_SETTING' },
            ]}
          />

          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Target Entities' },
              { value: 'USER', label: 'USER' },
              { value: 'APPLICATION', label: 'APPLICATION' },
              { value: 'INTERNSHIP', label: 'INTERNSHIP' },
              { value: 'COMPANY', label: 'COMPANY' },
              { value: 'EVALUATION', label: 'EVALUATION' },
              { value: 'INTERVIEW', label: 'INTERVIEW' },
              { value: 'SYSTEM_SETTING', label: 'SYSTEM_SETTING' },
            ]}
          />

          <div className="flex items-center justify-end">
            <span className="text-xs text-gray-400">
              Showing {logs.length} most recent recorded events
            </span>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading security ledger...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No audit events found"
              description="No security events match the current filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Event Action</th>
                  <th className="px-4 py-3">Entity Reference</th>
                  <th className="px-4 py-3">Initiated By</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Mutation Details</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">{getActionBadge(log.action)}</td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>

                    <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400">
                      {log.user_id ? `User #${log.user_id}` : 'Anonymous / System'}
                    </td>

                    <td className="px-4 py-3 text-gray-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs truncate font-sans">
                      {log.details || 'System event'}
                    </td>

                    <td className="px-4 py-3 text-right font-sans">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* INSPECT EVENT MODAL */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Security Audit Event #${selectedLog.id}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500">Action:</span>
                <div>{getActionBadge(selectedLog.action)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500">Timestamp:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {new Date(selectedLog.created_at).toISOString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500">Entity:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {selectedLog.entity_type} {selectedLog.entity_id ? `(ID: ${selectedLog.entity_id})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500">User ID:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {selectedLog.user_id || 'System / Unauthenticated'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500">IP Address:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {selectedLog.ip_address || '127.0.0.1'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Audited Event Description
              </h4>
              <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200">
                {selectedLog.details || 'No additional event details provided.'}
              </p>
            </div>

            {selectedLog.user_agent && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">User Agent</h4>
                <p className="p-2.5 bg-gray-50 dark:bg-gray-800 font-mono text-[11px] rounded-lg text-gray-500 truncate">
                  {selectedLog.user_agent}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
