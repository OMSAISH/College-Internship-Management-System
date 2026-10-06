import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, KeyRound, Smartphone, Laptop,
  Lock, RefreshCw, AlertTriangle, CheckCircle2, Copy, Download,
  Trash2, LogOut, History, Shield, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { UserSession, SecurityEvent, TwoFactorSetupData } from '../../types';

export const SecuritySettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useNotifications();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA state
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // Regenerate recovery codes
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenCodesModalOpen, setRegenCodesModalOpen] = useState(false);

  // Disable 2FA
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Security events state
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await api.getSecurityEvents(25);
      setEvents(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchEvents();
  }, []);

  // --- Password Handlers ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast({ type: 'error', title: 'Invalid Password', message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Mismatch', message: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast({ type: 'success', title: 'Password Changed', message: 'Your password was updated and other sessions revoked.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSessions();
      fetchEvents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message || 'Could not change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- 2FA Handlers ---
  const handleStart2FASetup = async () => {
    setSetupLoading(true);
    try {
      const data = await api.setup2fa();
      setSetupData(data);
      setVerificationCode('');
      setRecoveryCodes(null);
      setSetupModalOpen(true);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Setup Error', message: err.message || 'Could not initiate 2FA setup.' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    try {
      const res = await api.verifyAndEnable2fa(verificationCode);
      setRecoveryCodes(res.recovery_codes);
      await refreshUser();
      showToast({ type: 'success', title: '2FA Enabled!', message: 'Two-factor authentication is now active.' });
      fetchEvents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Invalid Code', message: err.message || 'Verification code was incorrect.' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    setRegenLoading(true);
    try {
      const res = await api.regenerateRecoveryCodes();
      setRecoveryCodes(res.recovery_codes);
      setRegenCodesModalOpen(true);
      showToast({ type: 'success', title: 'Codes Regenerated', message: '10 new recovery codes generated.' });
      fetchEvents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Could not regenerate codes.' });
    } finally {
      setRegenLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableLoading(true);
    try {
      await api.disable2fa(disablePassword);
      await refreshUser();
      setDisableModalOpen(false);
      setDisablePassword('');
      showToast({ type: 'info', title: '2FA Disabled', message: 'Two-factor authentication has been turned off.' });
      fetchEvents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Incorrect password.' });
    } finally {
      setDisableLoading(false);
    }
  };

  // --- Session Handlers ---
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeSession(sessionId);
      showToast({ type: 'success', title: 'Session Revoked', message: 'Device session has been terminated.' });
      fetchSessions();
      fetchEvents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Could not revoke session.' });
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Are you sure you want to sign out of all devices? You will remain signed in on this device.')) return;
    try {
      await api.revokeAllSessions();
      showToast({ type: 'success', title: 'All Devices Signed Out', message: 'Active sessions have been revoked.' });
      fetchSessions();
      fetchEvents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Could not revoke sessions.' });
    }
  };

  const copyCodesToClipboard = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    showToast({ type: 'success', title: 'Copied', message: 'Recovery codes copied to clipboard.' });
  };

  const downloadCodesFile = (codes: string[]) => {
    const text = `SANJIVANI UNIVERSITY CIMS - 2FA BACKUP RECOVERY CODES\nAccount: ${user?.email}\nGenerated: ${new Date().toISOString()}\n\nEach code can be used ONCE to access your account if you lose your authenticator app:\n\n` + codes.map((c, i) => `${i + 1}. ${c}`).join('\n') + `\n\nStore these codes in a secure, confidential place.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanjivani_cims_recovery_codes_${user?.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          Security & Account Protection
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your credentials, Two-Factor Authentication (TOTP), active device sessions, and audit history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Two-Factor Authentication */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication (2FA)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Standards-compliant RFC 6238 TOTP
                </p>
              </div>
            </div>
            {user?.two_factor_enabled ? (
              <Badge variant="success" size="md">Enabled ✓</Badge>
            ) : (
              <Badge variant="warning" size="md">Disabled</Badge>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Protect your institutional account against unauthorized access. When enabled, signing in requires your password and a 6-digit verification code from Google Authenticator, Microsoft Authenticator, or Authy.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            {!user?.two_factor_enabled ? (
              <Button
                onClick={handleStart2FASetup}
                isLoading={setupLoading}
                className="w-full sm:w-auto"
              >
                Enable Two-Factor Authentication
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleRegenerateRecoveryCodes}
                  isLoading={regenLoading}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Regenerate Recovery Codes
                </Button>
                {user.role !== 'ADMIN' && (
                  <Button
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => setDisableModalOpen(true)}
                  >
                    Disable 2FA
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Card 2: Password Management */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Change Password
              </h2>
              <p className="text-[11px] text-slate-400">
                Update account password securely
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
            <Button
              type="submit"
              size="md"
              isLoading={passwordLoading}
              className="w-full mt-1"
            >
              Update Password & Invalidate Other Sessions
            </Button>
          </form>
        </Card>

      </div>

      {/* Card 3: Active Device Sessions */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-slate-500" />
              Active Device Sessions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Devices and browsers currently authenticated to your account
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAllSessions}
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out of All Devices
          </Button>
        </div>

        {sessionsLoading ? (
          <p className="text-xs text-slate-400 py-4">Loading active sessions...</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((sess) => (
              <div key={sess.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sess.device_information || 'Unknown Browser / OS'}
                      </p>
                      {sess.is_current && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      IP: {sess.ip_address || '127.0.0.1'} • Last active: {new Date(sess.last_used_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!sess.is_current && (
                  <button
                    onClick={() => handleRevokeSession(sess.session_id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Terminate this session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Card 4: Recent Security Activity Log */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Security Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of authentication events, password updates, and two-factor actions
          </p>
        </div>

        {eventsLoading ? (
          <p className="text-xs text-slate-400 py-4">Loading security logs...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">IP / Device</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.event_type.includes('SUCCESS') || ev.event_type.includes('ENROLLED') || ev.event_type.includes('VERIFIED')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ev.event_type.includes('FAILED') || ev.event_type.includes('LOCKED')
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {ev.details || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {ev.ip_address || 'Internal'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* --- Modal 1: 2FA Enrollment Wizard --- */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title={!recoveryCodes ? "Configure Two-Factor Authentication" : "2FA Recovery Codes"}
      >
        {!recoveryCodes && setupData ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Scan this QR code using Google Authenticator, Microsoft Authenticator, or Authy on your mobile device:
            </p>

            <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200 w-fit mx-auto shadow-sm">
              <img
                src={setupData.qr_code_data_uri}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Manual Setup Key:
              </p>
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-center tracking-wider text-slate-900 dark:text-white select-all">
                {setupData.secret}
              </div>
            </div>

            <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3 pt-2">
              <Input
                label="Enter 6-Digit Code from Authenticator"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
              />
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={setupLoading}
                disabled={verificationCode.length !== 6}
              >
                Verify & Activate 2FA
              </Button>
            </form>
          </div>
        ) : recoveryCodes ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Store these recovery codes somewhere safe!</p>
                <p className="mt-0.5">
                  Each one-time code can be used to log in if you lose access to your authenticator app. They will not be displayed again.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white text-center">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => copyCodesToClipboard(recoveryCodes)}
                className="flex-1"
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copy Codes
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => downloadCodesFile(recoveryCodes)}
                className="flex-1"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download (.txt)
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setSetupModalOpen(false);
                setRegenCodesModalOpen(false);
              }}
            >
              I Have Stored My Recovery Codes
            </Button>
          </div>
        ) : null}
      </Modal>

      {/* --- Modal 2: Regenerated Recovery Codes --- */}
      <Modal
        isOpen={regenCodesModalOpen}
        onClose={() => setRegenCodesModalOpen(false)}
        title="New Backup Recovery Codes"
      >
        {recoveryCodes && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your previous unused recovery codes have been invalidated. Here are your 10 new one-time recovery codes:
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white text-center">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => copyCodesToClipboard(recoveryCodes)}
                className="flex-1"
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copy Codes
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => downloadCodesFile(recoveryCodes)}
                className="flex-1"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download (.txt)
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => setRegenCodesModalOpen(false)}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* --- Modal 3: Disable 2FA Confirmation --- */}
      <Modal
        isOpen={disableModalOpen}
        onClose={() => setDisableModalOpen(false)}
        title="Disable Two-Factor Authentication"
      >
        <form onSubmit={handleDisable2FA} className="space-y-4">
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Warning: Disabling two-factor authentication will remove an essential security safeguard from your institutional account.
          </p>
          <Input
            label="Confirm Account Password"
            type="password"
            required
            value={disablePassword}
            onChange={e => setDisablePassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button
            type="submit"
            variant="danger"
            size="lg"
            className="w-full"
            isLoading={disableLoading}
          >
            Confirm & Disable 2FA
          </Button>
        </form>
      </Modal>

    </div>
  );
};
