import React, { useState, useEffect } from 'react';
import {
  Settings, Save, RefreshCw, ShieldCheck, CheckCircle2,
  Calendar, Award, Sliders, ToggleLeft, ToggleRight, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { SystemSettingItem } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { useNotifications } from '../../contexts/NotificationContext';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [settings, setSettings] = useState<SystemSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemSettings();
      setSettings(res);
      const valMap: Record<string, string> = {};
      res.forEach((s) => {
        valMap[s.key] = s.value;
      });
      setEditValues(valMap);
    } catch (err: any) {
      showToast(err.message || 'Failed to load platform settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSetting = async (key: string) => {
    try {
      setSavingKey(key);
      const currentSetting = settings.find((s) => s.key === key);
      await api.updateSystemSetting(key, {
        value: editValues[key] || '',
        description: currentSetting?.description || undefined,
      });
      showToast(`Setting "${key}" updated successfully!`, 'success');
      fetchSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update setting', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institutional Platform Policies & Configuration
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Global governance rules enforcing eligibility thresholds, session calendars, and recruitment rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchSettings} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh Settings
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading platform configuration...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Institutional Academic Session Policy */}
          <Card className="p-5 space-y-4 border-l-4 border-l-indigo-600">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
              <Calendar className="w-5 h-5" />
              <span>Current Academic Session</span>
            </div>
            <p className="text-xs text-gray-500">
              Active university operational cycle attached to student batches and compliance exports.
            </p>
            <div className="space-y-2">
              <Input
                label="Academic Year"
                value={editValues['ACADEMIC_YEAR'] || ''}
                onChange={(e) => handleChange('ACADEMIC_YEAR', e.target.value)}
                placeholder="2025-2026"
              />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={savingKey === 'ACADEMIC_YEAR'}
                  onClick={() => handleSaveSetting('ACADEMIC_YEAR')}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Year
                </Button>
              </div>
            </div>
          </Card>

          {/* Academic GPA Eligibility Threshold */}
          <Card className="p-5 space-y-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
              <Award className="w-5 h-5" />
              <span>Minimum GPA Application Threshold</span>
            </div>
            <p className="text-xs text-gray-500">
              Students falling below this normalized GPA score cannot submit applications for campus opportunities.
            </p>
            <div className="space-y-2">
              <Input
                label="Minimum Grade Point Average (0.0 - 4.0)"
                type="number"
                step="0.1"
                min="0.0"
                max="4.0"
                value={editValues['MIN_GPA_THRESHOLD'] || ''}
                onChange={(e) => handleChange('MIN_GPA_THRESHOLD', e.target.value)}
                placeholder="2.0"
              />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={savingKey === 'MIN_GPA_THRESHOLD'}
                  onClick={() => handleSaveSetting('MIN_GPA_THRESHOLD')}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save GPA Threshold
                </Button>
              </div>
            </div>
          </Card>

          {/* Concurrent Application Cap */}
          <Card className="p-5 space-y-4 border-l-4 border-l-blue-600">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
              <Sliders className="w-5 h-5" />
              <span>Max Active Concurrent Applications</span>
            </div>
            <p className="text-xs text-gray-500">
              Maximum active opportunities a single candidate can apply to simultaneously to prevent spamming.
            </p>
            <div className="space-y-2">
              <Input
                label="Max Applications per Student"
                type="number"
                min="1"
                max="50"
                value={editValues['MAX_ACTIVE_APPLICATIONS_PER_STUDENT'] || ''}
                onChange={(e) => handleChange('MAX_ACTIVE_APPLICATIONS_PER_STUDENT', e.target.value)}
                placeholder="10"
              />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={savingKey === 'MAX_ACTIVE_APPLICATIONS_PER_STUDENT'}
                  onClick={() => handleSaveSetting('MAX_ACTIVE_APPLICATIONS_PER_STUDENT')}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Application Cap
                </Button>
              </div>
            </div>
          </Card>

          {/* Interview Notice Window */}
          <Card className="p-5 space-y-4 border-l-4 border-l-purple-600">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>Interview Advance Notice Requirement</span>
            </div>
            <p className="text-xs text-gray-500">
              Minimum hours required before scheduling or rescheduling candidate interviews.
            </p>
            <div className="space-y-2">
              <Input
                label="Minimum Advance Notice (Hours)"
                type="number"
                min="1"
                max="168"
                value={editValues['INTERVIEW_NOTICE_MIN_HOURS'] || ''}
                onChange={(e) => handleChange('INTERVIEW_NOTICE_MIN_HOURS', e.target.value)}
                placeholder="24"
              />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={savingKey === 'INTERVIEW_NOTICE_MIN_HOURS'}
                  onClick={() => handleSaveSetting('INTERVIEW_NOTICE_MIN_HOURS')}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Notice Window
                </Button>
              </div>
            </div>
          </Card>

          {/* Student Company Ratings Policy */}
          <Card className="p-5 space-y-4 border-l-4 border-l-amber-600 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                  <Award className="w-5 h-5" />
                  <span>Student Enterprise Ratings & Review Transparency</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enables enrolled candidates to submit institutional ratings and qualitative reviews on partner enterprises.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={editValues['ALLOW_STUDENT_COMPANY_RATINGS'] === 'true' ? 'success' : 'default'}
                >
                  {editValues['ALLOW_STUDENT_COMPANY_RATINGS'] === 'true' ? 'Enabled' : 'Disabled'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={savingKey === 'ALLOW_STUDENT_COMPANY_RATINGS'}
                  onClick={() => {
                    const newVal = editValues['ALLOW_STUDENT_COMPANY_RATINGS'] === 'true' ? 'false' : 'true';
                    handleChange('ALLOW_STUDENT_COMPANY_RATINGS', newVal);
                    setTimeout(() => handleSaveSetting('ALLOW_STUDENT_COMPANY_RATINGS'), 50);
                  }}
                >
                  Toggle Policy
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
