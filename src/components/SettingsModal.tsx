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
  Users,
  UserCheck,
  UserX,
  RotateCcw,
  Search,
  CheckCircle2,
  Ban,
  Bot,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DevConfigStatus, DevGrantRecord, PlaytimeStats, ManagedUserRecord } from '../types';
import { GoogleSignInModal } from './GoogleSignInModal';
import { GoogleAuthPayload } from '../lib/googleAuth';
import { DevAISettingsTab } from './DevAISettingsTab';
import { DevCardsManagementTab } from './DevCardsManagementTab';

export const RESTRICTED_USERNAMES_LIST = [
  'dev',
  'admin',
  'administrator',
  'demo',
  'boonfest',
  'guest',
  'system',
  'root',
  'moderator',
  'mod',
  'staff',
  'official',
  'support',
  'security',
  'superuser',
  'operator',
  'bot',
  'owner',
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  isGuest: boolean;
  pacing: PlaytimeStats | null;
  onLogout: () => Promise<void>;
  onLogin: (username: string, password?: string) => Promise<boolean>;
  onRegisterUser?: (username: string, password?: string) => Promise<boolean>;
  onGoogleAuth?: (payload: GoogleAuthPayload) => Promise<boolean>;
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
  onRegisterUser,
  onGoogleAuth,
  onAddToast,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'users' | 'cards' | 'ai' | 'dev_security' | 'dev_grants'>('account');

  // Dev Config & Grants State
  const [devConfig, setDevConfig] = useState<DevConfigStatus | null>(null);
  const [isLoadingDevConfig, setIsLoadingDevConfig] = useState(false);

  // Dev User Management State
  const [managedUsers, setManagedUsers] = useState<ManagedUserRecord[]>([]);
  const [isLoadingManagedUsers, setIsLoadingManagedUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userActionInProgress, setUserActionInProgress] = useState<string | null>(null);

  // User Password Reset State
  const [resettingUser, setResettingUser] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);
  const [isSubmittingResetPassword, setIsSubmittingResetPassword] = useState(false);

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

  // Switch / Login State
  const [switchUsername, setSwitchUsername] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Guest Registration State
  const [registerUsernameInput, setRegisterUsernameInput] = useState('');
  const [registerPasswordInput, setRegisterPasswordInput] = useState('');
  const [registerConfirmPasswordInput, setRegisterConfirmPasswordInput] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [guestAuthMode, setGuestAuthMode] = useState<'login' | 'register'>('login');

  // Google Sign-In Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleModalTitle, setGoogleModalTitle] = useState('Continue with Google');
  const [googleModalAction, setGoogleModalAction] = useState('Sign in with Google');

  // Regular User Change Password State
  const [changeOldPassword, setChangeOldPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showChangePasswordSection, setShowChangePasswordSection] = useState(false);

  const cleanRegisterName = registerUsernameInput.toLowerCase().trim().replace(/^@/, '');
  const isRestrictedEntered = Boolean(cleanRegisterName && RESTRICTED_USERNAMES_LIST.includes(cleanRegisterName));

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = registerUsernameInput.trim();
    if (!clean) {
      onAddToast('warning', 'Please enter a username.');
      return;
    }
    if (clean.length < 3) {
      onAddToast('warning', 'Username must be at least 3 characters long.');
      return;
    }

    if (RESTRICTED_USERNAMES_LIST.includes(clean.toLowerCase().replace(/^@/, ''))) {
      onAddToast('error', `The username '${clean}' is reserved and restricted. Please choose another username.`);
      return;
    }

    if (!registerPasswordInput || registerPasswordInput.length < 6) {
      onAddToast('warning', 'Password is required and must be at least 6 characters.');
      return;
    }

    if (registerPasswordInput !== registerConfirmPasswordInput) {
      onAddToast('error', 'Passwords do not match. Please re-enter.');
      return;
    }

    if (!onRegisterUser) {
      onAddToast('error', 'Registration service unavailable.');
      return;
    }

    setIsRegistering(true);
    try {
      const ok = await onRegisterUser(clean, registerPasswordInput);
      if (ok) {
        setRegisterUsernameInput('');
        setRegisterPasswordInput('');
        setRegisterConfirmPasswordInput('');
        fetchDevConfig();
      }
    } finally {
      setIsRegistering(false);
    }
  };

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
        if (data.users) {
          setManagedUsers(data.users);
        }
      }
    } catch {
      // Non-critical fetch failure
    } finally {
      setIsLoadingDevConfig(false);
    }
  };

  // Fetch managed users list specifically for Users tab
  const fetchManagedUsers = async () => {
    if (!isMainDev) return;
    setIsLoadingManagedUsers(true);
    try {
      const res = await fetch(`/api/dev/users?username=${encodeURIComponent(currentUsername)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setManagedUsers(data.users);
        }
      }
    } catch {
      onAddToast('error', 'Failed to refresh user list.');
    } finally {
      setIsLoadingManagedUsers(false);
    }
  };

  // Dev: Toggle user enable / disable status
  const handleToggleUserStatus = async (targetUsername: string, currentDisabled: boolean) => {
    if (!isMainDev) return;
    const cleanTarget = targetUsername.trim();
    if (cleanTarget.toLowerCase() === 'dev') {
      onAddToast('error', 'Permanent Dev account cannot be disabled.');
      return;
    }

    const nextDisabled = !currentDisabled;
    setUserActionInProgress(cleanTarget);
    try {
      const res = await fetch('/api/dev/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          targetUsername: cleanTarget,
          disabled: nextDisabled,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onAddToast('success', data.message || `User @${cleanTarget} ${nextDisabled ? 'disabled' : 'enabled'}.`);
        if (data.users) {
          setManagedUsers(data.users);
        } else {
          fetchManagedUsers();
        }
      } else {
        onAddToast('error', data.error || 'Failed to update user status.');
      }
    } catch {
      onAddToast('error', 'Network error updating user status.');
    } finally {
      setUserActionInProgress(null);
    }
  };

  // Dev: Reset user password
  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMainDev || !resettingUser) return;
    if (!newResetPassword || newResetPassword.trim().length < 4) {
      onAddToast('warning', 'New password must be at least 4 characters long.');
      return;
    }

    setIsSubmittingResetPassword(true);
    try {
      const res = await fetch('/api/dev/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          targetUsername: resettingUser,
          newPassword: newResetPassword.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onAddToast('success', data.message || `Password reset for @${resettingUser}.`);
        setResettingUser(null);
        setNewResetPassword('');
      } else {
        onAddToast('error', data.error || 'Failed to reset user password.');
      }
    } catch {
      onAddToast('error', 'Network error resetting password.');
    } finally {
      setIsSubmittingResetPassword(false);
    }
  };

  // Dev: Reset user time restrictions & active lockout
  const handleResetTimeRestrictions = async (targetUsername: string) => {
    if (!isMainDev) return;
    const cleanTarget = targetUsername.trim();
    setUserActionInProgress(cleanTarget);
    try {
      const res = await fetch('/api/dev/users/reset-time-restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          targetUsername: cleanTarget,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onAddToast('success', data.message || `Time restrictions reset for @${cleanTarget}.`);
        if (data.users) {
          setManagedUsers(data.users);
        } else {
          fetchManagedUsers();
        }
      } else {
        onAddToast('error', data.error || 'Failed to reset time restrictions.');
      }
    } catch {
      onAddToast('error', 'Network error resetting time restrictions.');
    } finally {
      setUserActionInProgress(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevConfig();
      if (activeTab === 'users' && isMainDev) {
        fetchManagedUsers();
      }
    }
  }, [isOpen, currentUsername, activeTab]);

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

  // Handle login for any account
  const handleQuickLogin = async (userToLogin: string, passwordToUse?: string) => {
    const cleanUser = userToLogin.trim();
    if (!cleanUser) {
      onAddToast('warning', 'Please enter a username.');
      return;
    }

    if (!passwordToUse || !passwordToUse.trim()) {
      onAddToast('warning', 'Password is required to log in.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await onLogin(cleanUser, passwordToUse);
      if (success) {
        setSwitchUsername('');
        setLoginPasswordInput('');
        fetchDevConfig();
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle password update for standard registered users
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeNewPassword || changeNewPassword.length < 6) {
      onAddToast('warning', 'New password must be at least 6 characters long.');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      onAddToast('error', 'New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          currentPassword: changeOldPassword,
          newPassword: changeNewPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAddToast('success', 'Password updated successfully!');
        setChangeOldPassword('');
        setChangeNewPassword('');
        setChangeConfirmPassword('');
        setShowChangePasswordSection(false);
      } else {
        onAddToast('error', data.error || 'Failed to update password.');
      }
    } catch {
      onAddToast('error', 'Error updating password.');
    } finally {
      setIsUpdatingPassword(false);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#0c0d10]/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-[#22242a] bg-[#131418] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden"
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
        <div className="flex border-b border-[#22242a] bg-[#0e0f13] px-4 gap-1.5 sm:gap-2 text-xs font-semibold overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'account'
                ? 'border-[#00ff95] text-[#00ff95]'
                : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Account & Access</span>
          </button>

          {isMainDev && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'users'
                  ? 'border-[#00ff95] text-[#00ff95]'
                  : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
              {managedUsers.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#1c1f26] text-[#8a8f98] font-mono">
                  {managedUsers.length}
                </span>
              )}
            </button>
          )}

          {(isMainDev || isDevUser) && (
            <>
              <button
                onClick={() => setActiveTab('cards')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'cards'
                    ? 'border-[#00ff95] text-[#00ff95]'
                    : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cards</span>
                <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-[#00ff95]/15 text-[#00ff95] font-mono border border-[#00ff95]/30">
                  Pool
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'ai'
                    ? 'border-[#00ff95] text-[#00ff95]'
                    : 'border-transparent text-[#8a8f98] hover:text-[#f0f2f5]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI</span>
                <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-[#00ff95]/15 text-[#00ff95] font-mono border border-[#00ff95]/30">
                  Gemini
                </span>
              </button>
            </>
          )}

          {isMainDev && (
            <>
              <button
                onClick={() => setActiveTab('dev_security')}
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
                className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

                {/* Logout Action (Logged-in users only; guests are already logged out) */}
                {isGuest ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] text-[#8a8f98] text-xs font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8a8f98]"></span>
                    <span>Logged Out</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-settings-logout"
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
                )}
              </div>

              {/* GUEST ACCESS: Dedicated Log In or Register Card (Only shown for guest) */}
              {isGuest && (
                <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22242a] pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-[#f0f2f5] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#00ff95]" />
                        Account Access: Log In or Register
                      </h3>
                      <p className="text-[11px] text-[#8a8f98] mt-0.5">
                        Guest state means you are currently logged out. Log in to an existing account with your password or register a new handle.
                      </p>
                    </div>

                    <div className="flex bg-[#131418] p-1 rounded-lg border border-[#22242a] text-xs font-semibold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setGuestAuthMode('login')}
                        className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                          guestAuthMode === 'login'
                            ? 'bg-[#00ff95] text-[#0c0d10] font-bold shadow'
                            : 'text-[#8a8f98] hover:text-[#f0f2f5]'
                        }`}
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Log In</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuestAuthMode('register')}
                        className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                          guestAuthMode === 'register'
                            ? 'bg-[#00ff95] text-[#0c0d10] font-bold shadow'
                            : 'text-[#8a8f98] hover:text-[#f0f2f5]'
                        }`}
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Register</span>
                      </button>
                    </div>
                  </div>

                  {/* Log In Sub-view */}
                  {guestAuthMode === 'login' && (
                    <div className="space-y-3.5">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (switchUsername.trim()) {
                            handleQuickLogin(switchUsername.trim(), loginPasswordInput);
                          }
                        }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Username <span className="text-[#ff3b5c]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter your username..."
                            value={switchUsername}
                            onChange={(e) => setSwitchUsername(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Password <span className="text-[#ff3b5c]">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showLoginPassword ? 'text' : 'password'}
                              required
                              placeholder="Enter your account password..."
                              value={loginPasswordInput}
                              onChange={(e) => setLoginPasswordInput(e.target.value)}
                              className="w-full pl-3 pr-9 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-2.5 top-2.5 text-[#8a8f98] hover:text-[#f0f2f5] cursor-pointer"
                            >
                              {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isLoggingIn || !switchUsername.trim() || !loginPasswordInput.trim()}
                            className="flex-1 py-2 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-extrabold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{isLoggingIn ? 'Authenticating...' : 'Log In'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={true}
                            title="Sign in with Google is temporarily disabled"
                            className="flex-1 py-2 rounded-lg bg-[#ffffff]/60 text-[#3c4043]/70 text-xs font-bold transition cursor-not-allowed flex items-center justify-center gap-2 shadow opacity-60"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-70">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z" />
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                            </svg>
                            <span>Sign in with Google (Disabled)</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Register Sub-view */}
                  {guestAuthMode === 'register' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                      }}
                      className="space-y-3"
                    >
                      {/* Notice that registration is temporarily disabled */}
                      <div className="p-3 rounded-lg bg-[#ffb800]/10 border border-[#ffb800]/30 text-xs text-[#ffb800] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#ffb800]" />
                        <span>Account registration is temporarily disabled. Please log in with an existing account or continue playing as a Guest.</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                          Choose Username <span className="text-[#ff3b5c]">*</span>
                        </label>
                        <input
                          type="text"
                          disabled={true}
                          placeholder="Registration temporarily disabled..."
                          value={registerUsernameInput}
                          onChange={(e) => setRegisterUsernameInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#8a8f98] font-mono focus:outline-none cursor-not-allowed opacity-60"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Password (min 6 chars) <span className="text-[#ff3b5c]">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              disabled={true}
                              placeholder="Disabled for now..."
                              value={registerPasswordInput}
                              onChange={(e) => setRegisterPasswordInput(e.target.value)}
                              className="w-full pl-3 pr-8 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#8a8f98] font-mono focus:outline-none cursor-not-allowed opacity-60"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Confirm Password <span className="text-[#ff3b5c]">*</span>
                          </label>
                          <input
                            type="password"
                            disabled={true}
                            placeholder="Disabled for now..."
                            value={registerConfirmPasswordInput}
                            onChange={(e) => setRegisterConfirmPasswordInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#8a8f98] font-mono focus:outline-none cursor-not-allowed opacity-60"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={true}
                          title="Registration is temporarily disabled"
                          className="flex-1 py-2 rounded-lg bg-[#00ff95]/50 text-[#0c0d10]/70 text-xs font-extrabold transition cursor-not-allowed opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Register with Password (Disabled)</span>
                        </button>

                        <button
                          type="button"
                          disabled={true}
                          title="Register with Google is temporarily disabled"
                          className="flex-1 py-2 rounded-lg bg-[#ffffff]/60 text-[#3c4043]/70 text-xs font-bold transition cursor-not-allowed flex items-center justify-center gap-2 shadow opacity-50"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-70">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z" />
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                          </svg>
                          <span>Register with Google (Disabled)</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8a8f98]">
                        Registration is temporarily paused and will be finalized soon. Guests enjoy full gameplay with session scoring.
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* LOGGED IN ACCESS (!isGuest): Password change & switch user */}
              {!isGuest && (
                <>
                  {/* Password Management for Logged-In User */}
                  <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#00ff95]/10 flex items-center justify-center text-[#00ff95]">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#f0f2f5]">Security Credentials</h4>
                          <p className="text-[11px] text-[#8a8f98]">
                            Update or set your account password for login protection.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowChangePasswordSection(!showChangePasswordSection)}
                        className="px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-[#f0f2f5] text-xs font-semibold transition cursor-pointer"
                      >
                        {showChangePasswordSection ? 'Cancel' : 'Change Password'}
                      </button>
                    </div>

                    {showChangePasswordSection && (
                      <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2 border-t border-[#22242a]">
                        <div>
                          <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter current password (if set)..."
                            value={changeOldPassword}
                            onChange={(e) => setChangeOldPassword(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              New Password (min 6 chars) <span className="text-[#ff3b5c]">*</span>
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              placeholder="New password..."
                              value={changeNewPassword}
                              onChange={(e) => setChangeNewPassword(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#8a8f98] block mb-1">
                              Confirm New Password <span className="text-[#ff3b5c]">*</span>
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              placeholder="Confirm new password..."
                              value={changeConfirmPassword}
                              onChange={(e) => setChangeConfirmPassword(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={
                              isUpdatingPassword ||
                              changeNewPassword.length < 6 ||
                              changeNewPassword !== changeConfirmPassword
                            }
                            className="px-4 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingPassword ? 'Updating...' : 'Save New Password'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Switch User to another username (with password) */}
                  <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-3">
                    <span className="text-xs font-bold text-[#f0f2f5] block">Switch Account</span>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (switchUsername.trim() && loginPasswordInput.trim()) {
                          handleQuickLogin(switchUsername.trim(), loginPasswordInput);
                        }
                      }}
                      className="space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Username..."
                          value={switchUsername}
                          onChange={(e) => setSwitchUsername(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                        <input
                          type="password"
                          required
                          placeholder="Password..."
                          value={loginPasswordInput}
                          onChange={(e) => setLoginPasswordInput(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={true}
                          title="Switch via Google is temporarily disabled"
                          className="px-3 py-1.5 rounded-lg bg-[#ffffff]/60 text-[#3c4043]/70 text-xs font-bold transition cursor-not-allowed flex items-center gap-1.5 shadow opacity-60"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 opacity-70">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z" />
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                          </svg>
                          <span>Switch via Google (Disabled)</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isLoggingIn || !switchUsername.trim() || !loginPasswordInput.trim()}
                          className="px-4 py-1.5 rounded-lg bg-[#22242a] hover:bg-[#2c3038] text-[#f0f2f5] text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>{isLoggingIn ? 'Switching...' : 'Switch Account'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {/* Policy Explanation */}
              <div className="p-3.5 rounded-xl bg-[#131418] border border-[#22242a]/60 text-xs text-[#8a8f98] space-y-1">
                <span className="text-[#f0f2f5] font-semibold block">Time Restriction Policy</span>
                <p>
                  Time restrictions (the 5-minute per 30m rolling session rule and 25-minute daily ceiling) apply to all standard players to prevent pathological addiction loops. Dev users and users granted temporary dev status are completely exempt from these limits.
                </p>
              </div>
            </div>
          )}

          {/* TAB: Users (Dev User Management) */}
          {activeTab === 'users' && isMainDev && (
            <div className="space-y-4">
              {/* Header & Stats Overview */}
              <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#22242a] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#00ff95]/10 flex items-center justify-center text-[#00ff95]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#f0f2f5]">User Account Management</h4>
                      <p className="text-[11px] text-[#8a8f98]">
                        Enable or disable accounts, reset credentials, and clear time restrictions & lockouts.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={fetchManagedUsers}
                    disabled={isLoadingManagedUsers}
                    title="Refresh user list"
                    className="p-2 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingManagedUsers ? 'animate-spin text-[#00ff95]' : ''}`} />
                  </button>
                </div>

                {/* Search Bar & Summary Badges */}
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search accounts by username..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95]"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#f0f2f5] text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold">
                    <span className="px-2 py-1 rounded bg-[#131418] border border-[#22242a] text-[#8a8f98]">
                      Total: <strong className="text-[#f0f2f5]">{managedUsers.length}</strong>
                    </span>
                    <span className="px-2 py-1 rounded bg-[#00ff95]/10 border border-[#00ff95]/20 text-[#00ff95]">
                      Active: {managedUsers.filter(u => !u.disabled).length}
                    </span>
                    {managedUsers.some(u => u.disabled) && (
                      <span className="px-2 py-1 rounded bg-[#ff3b5c]/10 border border-[#ff3b5c]/20 text-[#ff3b5c]">
                        Disabled: {managedUsers.filter(u => u.disabled).length}
                      </span>
                    )}
                    {managedUsers.some(u => u.pacing?.isLockedOut) && (
                      <span className="px-2 py-1 rounded bg-[#ffb800]/10 border border-[#ffb800]/20 text-[#ffb800]">
                        Locked: {managedUsers.filter(u => u.pacing?.isLockedOut).length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Users List Cards */}
              <div className="space-y-3">
                {managedUsers
                  .filter((u) => u.username.toLowerCase().includes(userSearchQuery.toLowerCase().trim()))
                  .map((user) => {
                    const isDevAccount = user.username.toLowerCase() === 'dev';
                    const isActionLoading = userActionInProgress === user.username;
                    const isResettingThisUser = resettingUser === user.username;

                    return (
                      <div
                        key={user.username}
                        className={`p-4 rounded-xl border transition space-y-3 ${
                          user.disabled
                            ? 'bg-[#140b0e] border-[#ff3b5c]/30'
                            : 'bg-[#0c0d10] border-[#22242a]'
                        }`}
                      >
                        {/* User Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isDevAccount
                                  ? 'bg-[#00ff95]/15 text-[#00ff95]'
                                  : user.isTemporaryDev
                                  ? 'bg-[#ffb800]/15 text-[#ffb800]'
                                  : 'bg-[#1a1c22] text-[#8a8f98]'
                              }`}
                            >
                              {isDevAccount ? (
                                <Crown className="w-4 h-4" />
                              ) : user.isTemporaryDev ? (
                                <Clock className="w-4 h-4" />
                              ) : (
                                <Users className="w-4 h-4" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold font-mono text-[#f0f2f5]">
                                  @{user.username}
                                </span>
                                {isDevAccount && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30 font-bold">
                                    Main Dev
                                  </span>
                                )}
                                {user.isTemporaryDev && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/30 font-bold">
                                    Temp Dev
                                  </span>
                                )}
                                <span className="text-[10px] text-[#555a65] font-mono capitalize">
                                  ({user.authProvider || 'local'})
                                </span>
                              </div>
                              <div className="text-[11px] text-[#8a8f98]">
                                Runs: <span className="text-[#f0f2f5] font-mono">{user.runsCount}</span> · Trophies: <span className="text-[#f0f2f5] font-mono">{user.trophiesCount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {user.disabled ? (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#ff3b5c]/15 text-[#ff3b5c] border border-[#ff3b5c]/30 flex items-center gap-1">
                                <Ban className="w-3 h-3" />
                                DISABLED
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pacing & Time Restriction Status Strip */}
                        {isDevAccount ? (
                          <div className="p-2.5 rounded-lg bg-[#131418] border border-[#22242a] text-[11px] text-[#00ff95] flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Pacing Exempt (Permanent Dev bypasses all session and daily time limits)</span>
                          </div>
                        ) : user.pacing?.isLockedOut ? (
                          <div className="p-2.5 rounded-lg bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 text-[11px] text-[#ff3b5c] flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                <strong>Locked Out:</strong> {user.pacing.lockoutRemainingSeconds}s remaining ({user.pacing.lockoutReason === '24h_cap' ? '24h daily cap (25m) reached' : '30m rolling session rule (5m) reached'})
                              </span>
                            </div>
                            <button
                              onClick={() => handleResetTimeRestrictions(user.username)}
                              disabled={isActionLoading}
                              className="px-2 py-0.5 rounded bg-[#ff3b5c]/25 hover:bg-[#ff3b5c]/40 text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Clear Lockout Now
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-[#131418] border border-[#22242a] text-[11px] text-[#8a8f98] flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#8a8f98]" />
                                <span>30m Window: <strong className="text-[#f0f2f5] font-mono">{Math.round((user.pacing?.activeSecondsIn30m || 0) / 60)}m / 5m</strong></span>
                              </div>
                              <span className="text-[#2c3038]">|</span>
                              <div>
                                <span>24h Cap: <strong className="text-[#f0f2f5] font-mono">{Math.round((user.pacing?.activeSecondsIn24h || 0) / 60)}m / 25m</strong></span>
                              </div>
                            </div>
                            {((user.pacing?.activeSecondsIn30m || 0) > 0 || (user.pacing?.activeSecondsIn24h || 0) > 0) && (
                              <button
                                onClick={() => handleResetTimeRestrictions(user.username)}
                                disabled={isActionLoading}
                                className="text-[10px] text-[#00ff95] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Reset Playtime
                              </button>
                            )}
                          </div>
                        )}

                        {/* Actions Control Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#1c1f26] gap-2 flex-wrap">
                          {/* Enable / Disable Button */}
                          <div>
                            {isDevAccount ? (
                              <button
                                disabled
                                title="Permanent Dev account cannot be disabled"
                                className="px-3 py-1.5 rounded-lg bg-[#16181e] border border-[#22242a] text-[#555a65] text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Dev Protected
                              </button>
                            ) : user.disabled ? (
                              <button
                                onClick={() => handleToggleUserStatus(user.username, true)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg bg-[#00ff95]/15 hover:bg-[#00ff95]/25 border border-[#00ff95]/30 text-[#00ff95] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                {isActionLoading ? 'Enabling...' : 'Enable User'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleUserStatus(user.username, false)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg bg-[#ff3b5c]/10 hover:bg-[#ff3b5c]/20 border border-[#ff3b5c]/25 text-[#ff3b5c] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                {isActionLoading ? 'Disabling...' : 'Disable User'}
                              </button>
                            )}
                          </div>

                          {/* Secondary Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (isResettingThisUser) {
                                  setResettingUser(null);
                                  setNewResetPassword('');
                                } else {
                                  setResettingUser(user.username);
                                  setNewResetPassword(`${user.username}!`);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isResettingThisUser
                                  ? 'bg-[#00ff95]/15 text-[#00ff95] border-[#00ff95]/40'
                                  : 'bg-[#1a1c22] hover:bg-[#252830] text-[#f0f2f5] border-[#22242a]'
                              }`}
                            >
                              <Key className="w-3.5 h-3.5 text-[#00ff95]" />
                              <span>{isResettingThisUser ? 'Close Form' : 'Reset Password'}</span>
                            </button>

                            <button
                              onClick={() => handleResetTimeRestrictions(user.username)}
                              disabled={isActionLoading || isDevAccount}
                              className="px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-[#f0f2f5] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-[#00ff95]" />
                              <span>{isActionLoading ? 'Resetting...' : 'Reset Time Limits'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Password Reset Drawer */}
                        {isResettingThisUser && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-3.5 rounded-xl bg-[#131418] border border-[#00ff95]/30 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#00ff95] flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5" />
                                Reset Password for @{user.username}
                              </span>
                              <button
                                type="button"
                                onClick={() => setResettingUser(null)}
                                className="text-[#8a8f98] hover:text-[#f0f2f5] text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>

                            <form onSubmit={handleResetUserPassword} className="space-y-2.5">
                              <div className="relative">
                                <input
                                  type={showResetPasswordText ? 'text' : 'password'}
                                  value={newResetPassword}
                                  onChange={(e) => setNewResetPassword(e.target.value)}
                                  placeholder="Enter new password (min 4 chars)..."
                                  className="w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#00ff95] pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#f0f2f5] cursor-pointer"
                                >
                                  {showResetPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewResetPassword(`${user.username}!`)}
                                  className="text-[11px] text-[#8a8f98] hover:text-[#00ff95] transition cursor-pointer font-mono underline"
                                >
                                  Use default pattern: "{user.username}!"
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setResettingUser(null)}
                                    className="px-3 py-1.5 rounded-lg bg-[#1a1c22] text-[#8a8f98] hover:text-[#f0f2f5] text-xs font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingResetPassword || !newResetPassword.trim()}
                                    className="px-4 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#00e686] text-black text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                  >
                                    {isSubmittingResetPassword ? 'Saving...' : 'Set Password'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}

                {managedUsers.filter((u) => u.username.toLowerCase().includes(userSearchQuery.toLowerCase().trim())).length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-[#0c0d10] border border-[#22242a] text-[#8a8f98] text-xs">
                    No registered user accounts matching "{userSearchQuery}".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Cards (Card Management: Earn, Grow, Boon, Sloth) */}
          {activeTab === 'cards' && (isMainDev || isDevUser) && (
            <DevCardsManagementTab
              currentUsername={currentUsername}
              onAddToast={onAddToast}
            />
          )}

          {/* TAB: AI (In-Game AI Usage & Model Management) */}
          {activeTab === 'ai' && (isMainDev || isDevUser) && (
            <DevAISettingsTab
              currentUsername={currentUsername}
              onAddToast={onAddToast}
            />
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

      {/* Google Sign-In / Register Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title={googleModalTitle}
        actionText={googleModalAction}
        onGoogleSuccess={async (payload) => {
          if (onGoogleAuth) {
            const success = await onGoogleAuth(payload);
            if (success) {
              fetchDevConfig();
              return true;
            }
          }
          return false;
        }}
      />
    </div>
  );
};
