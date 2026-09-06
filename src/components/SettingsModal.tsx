import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  LogOut,
  LogIn,
  Trash2,
  UserPlus,
  Crown,
  Clock,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DevConfigStatus, DevGrantRecord, PlaytimeStats } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  isGuest: boolean;
  pacing: PlaytimeStats | null;
  onLogout: () => Promise<void>;
  onLogin: (username: string, password?: string) => Promise<boolean>;
  onAddToast: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  isGuest,
  pacing,
  onLogout,
  onLogin,
  onAddToast,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'dev_security' | 'dev_grants'>('account');

  // Dev Config & Grants State
  const [devConfig, setDevConfig] = useState<DevConfigStatus | null>(null);
  const [isLoadingDevConfig, setIsLoadingDevConfig] = useState(false);

  // Dev Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Grant Dev Status Form State
  const [targetUsername, setTargetUsername] = useState('');
  const [durationValue, setDurationValue] = useState<number>(24);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days' | 'minutes'>('hours');
  const [isGranting, setIsGranting] = useState(false);

  // Switch / Dev Login State
  const [switchUsername, setSwitchUsername] = useState('');
  const [devLoginPassword, setDevLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [requiresDevPassword, setRequiresDevPassword] = useState(false);

  const isMainDev = currentUsername.toLowerCase() === 'dev';
  const isDevUser = Boolean(pacing?.isDev || isMainDev);
  const isTemporaryDev = Boolean(pacing?.isTemporaryDev);

  // Fetch Dev Config when modal opens or user changes
  const fetchDevConfig = async () => {
    setIsLoadingDevConfig(true);
    try {
      const res = await fetch(`/api/dev/status?username=${encodeURIComponent(currentUsername)}`);
      if (res.ok) {
        const data: DevConfigStatus = await res.json();
        setDevConfig(data);
      }
    } catch {
      // Non-critical fetch failure
    } finally {
      setIsLoadingDevConfig(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevConfig();
      if (isMainDev && activeTab === 'account') {
        // keep account tab or dev tab
      }
    }
  }, [isOpen, currentUsername]);

  if (!isOpen) return null;

  // Handle Save / Clear Dev Password
  const handleSaveDevPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword.length < 4) {
      onAddToast('warning', 'Password should be at least 4 characters for security.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      onAddToast('error', 'New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/dev/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          newPassword: newPassword.trim(),
          currentPassword: currentPasswordInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAddToast('success', data.message);
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPasswordInput('');
        fetchDevConfig();
      } else {
        onAddToast('error', data.error || 'Failed to update dev password.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error updating password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Remove Password (open dev mode)
  const handleRemoveDevPassword = async () => {
    if (!window.confirm('Are you sure you want to remove the Dev password? Dev access will be open without password.')) {
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/dev/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          newPassword: '',
          currentPassword: currentPasswordInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAddToast('info', 'Dev password cleared. Open dev login restored.');
        setCurrentPasswordInput('');
        fetchDevConfig();
      } else {
        onAddToast('error', data.error || 'Failed to clear password.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Grant Temporary Dev Status
  const handleGrantDevStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      onAddToast('warning', 'Please enter a target username.');
      return;
    }

    setIsGranting(true);
    try {
      const res = await fetch('/api/dev/grant-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          targetUsername: targetUsername.trim(),
          durationValue,
          durationUnit,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAddToast('success', data.message);
        setTargetUsername('');
        fetchDevConfig();
      } else {
        onAddToast('error', data.error || 'Failed to grant dev status.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error granting dev status.');
    } finally {
      setIsGranting(false);
    }
  };

  // Handle Revoke Dev Status
  const handleRevokeDevStatus = async (usernameToRevoke: string) => {
    try {
      const res = await fetch('/api/dev/revoke-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          targetUsername: usernameToRevoke,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAddToast('info', data.message);
        fetchDevConfig();
      } else {
        onAddToast('error', data.error || 'Failed to revoke dev status.');
      }
    } catch (err) {
      onAddToast('error', (err as Error).message || 'Server error.');
    }
  };

  // Handle direct login or quick dev login
  const handleQuickLogin = async (userToLogin: string, passwordToUse?: string) => {
    setIsLoggingIn(true);
    try {
      const success = await onLogin(userToLogin, passwordToUse);
      if (success) {
        setSwitchUsername('');
        setDevLoginPassword('');
        setRequiresDevPassword(false);
        fetchDevConfig();
      } else if (userToLogin.toLowerCase() === 'dev') {
        setRequiresDevPassword(true);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const formatRemainingDuration = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h remaining`;
    if (h > 0) return `${h}h ${m}m remaining`;
    return `${m}m remaining`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0c0d10]/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-[#22242a] bg-[#131418] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#22242a] bg-[#0c0d10]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#22242a] flex items-center justify-center text-[#00ff95]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f0f2f5] flex items-center gap-2">
                Settings & Session Management
                {isMainDev && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30">
                    Main Dev
                  </span>
                )}
                {isTemporaryDev && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/30">
                    Temp Dev
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#8a8f98]">Manage your identity, dev permissions, and account security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#22242a] bg-[#0e0f13] px-4 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'border-[#00ff95] text-[#00ff95]'
                : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Account & Access</span>
          </button>

          {isMainDev && (
            <>
              <button
                onClick={() => setActiveTab('dev_security')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dev_security'
                    ? 'border-[#00ff95] text-[#00ff95]'
                    : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Dev Security / Password</span>
                {devConfig?.hasPassword ? (
                  <Lock className="w-3 h-3 text-[#00ff95]" />
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffb800]/20 text-[#ffb800]">Unset</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('dev_grants')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dev_grants'
                    ? 'border-[#00ff95] text-[#00ff95]'
                    : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Grant Dev Status</span>
                {devConfig?.activeGrants && devConfig.activeGrants.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#00ff95]/20 text-[#00ff95] font-mono">
                    {devConfig.activeGrants.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* TAB 1: Account & Access */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              {/* Current Identity Card */}
              <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8a8f98] block mb-1">
                    Current Active Session
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-[#f0f2f5]">
                      {isGuest ? 'Guest User' : `@${currentUsername}`}
                    </span>
                    {isMainDev && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#00ff95]/20 text-[#00ff95] border border-[#00ff95]/30">
                        <Crown className="w-3 h-3" /> Permanent Dev
                      </span>
                    )}
                    {isTemporaryDev && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#ffb800]/20 text-[#ffb800] border border-[#ffb800]/30">
                        <Clock className="w-3 h-3" /> Temp Dev Status
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-xs text-[#8a8f98]">
                    {isDevUser ? (
                      <span className="text-[#00ff95] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Time restrictions waived: Zero 30-minute rolling limits or 24-hour caps.
                      </span>
                    ) : (
                      <span>
                        Subject to Anti-Sloth Pacing: 5 min play per 30m window, 25 min daily cap.
                      </span>
                    )}
                    {isTemporaryDev && pacing?.devGrantedRemainingSeconds && (
                      <div className="text-[11px] text-[#ffb800] font-mono mt-0.5">
                        Dev grant expires in: {formatRemainingDuration(pacing.devGrantedRemainingSeconds)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout Action */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await onLogout();
                      fetchDevConfig();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#ff3b5c]/15 hover:bg-[#ff3b5c]/25 border border-[#ff3b5c]/30 text-[#ff3b5c] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>

              {/* Dev User Shortcut / Login */}
              {!isMainDev && (
                <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#f0f2f5] flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#00ff95]" />
                        Developer Access
                      </h4>
                      <p className="text-[11px] text-[#8a8f98] mt-0.5">
                        Switch to the <code className="text-[#00ff95]">dev</code> account to test with zero time restrictions.
                      </p>
                    </div>

                    {!requiresDevPassword && (
                      <button
                        onClick={() => handleQuickLogin('dev')}
                        disabled={isLoggingIn}
                        className="px-3 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-extrabold transition cursor-pointer flex items-center gap-1"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isLoggingIn ? 'Logging In...' : 'Log In as Dev'}</span>
                      </button>
                    )}
                  </div>

                  {requiresDevPassword && (
                    <div className="p-3 rounded-lg bg-[#131418] border border-[#ffb800]/40 space-y-2">
                      <span className="text-xs font-semibold text-[#ffb800] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Dev Password Configured
                      </span>
                      <p className="text-[11px] text-[#8a8f98]">
                        The Dev user has set a security password. Enter it below to unlock dev mode.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Enter Dev Password..."
                          value={devLoginPassword}
                          onChange={(e) => setDevLoginPassword(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                        <button
                          onClick={() => handleQuickLogin('dev', devLoginPassword)}
                          disabled={isLoggingIn}
                          className="px-3.5 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-extrabold transition cursor-pointer"
                        >
                          Authenticate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Switch User to another username */}
              <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-2.5">
                <span className="text-xs font-bold text-[#f0f2f5] block">Switch Account / Log In As Another User</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter username (e.g. Alice, Bob, dev)..."
                    value={switchUsername}
                    onChange={(e) => setSwitchUsername(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                  />
                  <button
                    onClick={() => {
                      if (switchUsername.trim()) {
                        handleQuickLogin(switchUsername.trim());
                      }
                    }}
                    disabled={isLoggingIn || !switchUsername.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#22242a] hover:bg-[#2c3038] text-[#f0f2f5] text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </button>
                </div>
              </div>

              {/* Policy Explanation */}
              <div className="p-3.5 rounded-xl bg-[#131418] border border-[#22242a]/60 text-xs text-[#8a8f98] space-y-1">
                <span className="text-[#f0f2f5] font-semibold block">Time Restriction Policy</span>
                <p>
                  Time restrictions (the 5-minute per 30m rolling session rule and 25-minute daily ceiling) apply to all standard players to prevent pathological addiction loops. Dev users and users granted temporary dev status are completely exempt from these limits.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Dev Security / Password Configuration (Main Dev Only) */}
          {activeTab === 'dev_security' && isMainDev && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00ff95]/10 flex items-center justify-center text-[#00ff95]">
                      {devConfig?.hasPassword ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-[#ffb800]" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#f0f2f5]">Production Dev Password</h4>
                      <p className="text-[11px] text-[#8a8f98]">
                        {devConfig?.hasPassword
                          ? 'Password is active. Logging in as "dev" requires this password.'
                          : 'No password set. Open dev access is currently allowed.'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      devConfig?.hasPassword
                        ? 'bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30'
                        : 'bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/30'
                    }`}
                  >
                    {devConfig?.hasPassword ? 'PROTECTED' : 'OPEN ACCESS'}
                  </span>
                </div>

                <form onSubmit={handleSaveDevPassword} className="space-y-3 pt-2">
                  {devConfig?.hasPassword && (
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Current Dev Password (Required to change)
                      </label>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Enter current password..."
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        New Dev Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordText ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Set new dev password..."
                          className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#f0f2f5]"
                        >
                          {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password..."
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {devConfig?.hasPassword ? (
                      <button
                        type="button"
                        onClick={handleRemoveDevPassword}
                        disabled={isSavingPassword}
                        className="px-3 py-1.5 rounded-lg border border-[#ff3b5c]/30 text-[#ff3b5c] hover:bg-[#ff3b5c]/10 text-xs font-bold transition cursor-pointer"
                      >
                        Remove Password (Open Access)
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#525866]">
                        Leaving password empty keeps dev access password-free.
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingPassword || !newPassword}
                      className="px-4 py-2 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-extrabold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingPassword ? 'Saving...' : 'Save Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-3.5 rounded-xl bg-[#131418] border border-[#22242a] text-xs text-[#8a8f98]">
                <span className="text-[#f0f2f5] font-semibold block mb-0.5">Production Deployment Note</span>
                As requested, the Dev user can set this password at any time from settings before deploying to production. Once set, unauthorized users cannot log into <code className="text-[#00ff95]">dev</code>.
              </div>
            </div>
          )}

          {/* TAB 3: Grant Dev Status Temporarily (Main Dev Only) */}
          {activeTab === 'dev_grants' && isMainDev && (
            <div className="space-y-4">
              {/* Grant Form */}
              <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#f0f2f5] flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#00ff95]" />
                    Grant Temporary Dev Status to User
                  </h4>
                  <p className="text-[11px] text-[#8a8f98] mt-0.5">
                    Grant another user temporary dev privileges (unrestricted playtime) for a designated number of days, hours, or minutes.
                  </p>
                </div>

                <form onSubmit={handleGrantDevStatus} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">Target Username</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter username to grant dev status..."
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                      />
                      {devConfig?.registeredUsers && devConfig.registeredUsers.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) setTargetUsername(e.target.value);
                          }}
                          className="px-2 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#8a8f98] focus:outline-none focus:border-[#00ff95]"
                        >
                          <option value="">Registered Users...</option>
                          {devConfig.registeredUsers.map((u) => (
                            <option key={u} value={u}>
                              @{u}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">Duration Amount</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={durationValue}
                        onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">Time Unit</label>
                      <select
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] focus:outline-none focus:border-[#00ff95]"
                      >
                        <option value="hours">Hours (e.g. 24 hours)</option>
                        <option value="days">Days (e.g. 7 days)</option>
                        <option value="minutes">Minutes (testing)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preset Duration Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#525866] mr-1">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationValue(1);
                        setDurationUnit('hours');
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#1a1c22] border border-[#22242a] hover:border-[#00ff95]/50 text-[11px] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                    >
                      1 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationValue(24);
                        setDurationUnit('hours');
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#1a1c22] border border-[#22242a] hover:border-[#00ff95]/50 text-[11px] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                    >
                      24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationValue(3);
                        setDurationUnit('days');
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#1a1c22] border border-[#22242a] hover:border-[#00ff95]/50 text-[11px] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                    >
                      3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationValue(7);
                        setDurationUnit('days');
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#1a1c22] border border-[#22242a] hover:border-[#00ff95]/50 text-[11px] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationValue(30);
                        setDurationUnit('days');
                      }}
                      className="px-2 py-0.5 rounded-md bg-[#1a1c22] border border-[#22242a] hover:border-[#00ff95]/50 text-[11px] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                    >
                      30 Days
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isGranting || !targetUsername.trim()}
                      className="px-4 py-2 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-extrabold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isGranting ? 'Granting...' : `Grant Dev Status (${durationValue} ${durationUnit})`}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Dev Grants List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#f0f2f5]">Active Temporary Dev Grants</h4>
                  <button
                    onClick={fetchDevConfig}
                    className="p-1 rounded text-[#8a8f98] hover:text-[#f0f2f5] transition"
                    title="Refresh grants"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {devConfig?.activeGrants && devConfig.activeGrants.length > 0 ? (
                  <div className="space-y-2">
                    {devConfig.activeGrants.map((grant) => (
                      <div
                        key={grant.username}
                        className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a] flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#f0f2f5] font-mono">@{grant.username}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/30">
                              {formatRemainingDuration(grant.remainingSeconds)}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#525866] block mt-0.5">
                            Expires: {new Date(grant.expiresAt).toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRevokeDevStatus(grant.username)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ff3b5c]/30 text-[#ff3b5c] hover:bg-[#ff3b5c]/10 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] text-center text-xs text-[#525866]">
                    No temporary dev grants currently active.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#22242a] bg-[#0c0d10]/80 flex items-center justify-between">
          <div className="text-[11px] text-[#525866]">
            {isMainDev ? 'Logged in as Main Dev: Root administration access.' : 'Boonfest Anti-Sloth Pacing System.'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-xs font-bold text-[#f0f2f5] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
