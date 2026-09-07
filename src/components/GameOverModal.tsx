import React, { useState } from 'react';
import {
  Trophy as TrophyIcon,
  Download,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  UserPlus,
  Compass,
  AlertTriangle,
  Lightbulb,
  LogOut,
  Settings,
  BookOpen,
  Award,
  Volume2,
  VolumeX,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { GameOverResponse, Trophy } from '../types';
import { sounds } from '../lib/sound';

interface GameOverModalProps {
  gameOverData: GameOverResponse;
  currentUsername: string;
  isGuest: boolean;
  onStartNewRun: () => void;
  onRegisterAccount: (username: string) => Promise<boolean>;
  onClaimGuestTrophy: (username: string) => Promise<Trophy | undefined>;
  onLogout?: () => Promise<void> | void;
  onOpenSettings?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenProfile?: () => void;
  onOpenRules?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameOverData,
  currentUsername,
  isGuest,
  onStartNewRun,
  onRegisterAccount,
  onClaimGuestTrophy,
  onLogout,
  onOpenSettings,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenRules,
  onToggleMute,
  isMuted = false,
}) => {
  const { isTop10, rank, postMortem, trophy: initialTrophy, requiresRegistration, telemetry } = gameOverData;
  const [trophy, setTrophy] = useState<Trophy | undefined>(initialTrophy);
  const [usernameInput, setUsernameInput] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRegisteredNow, setIsRegisteredNow] = useState(!isGuest);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    if (isLoggingOut || !onLogout) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
      setIsRegisteredNow(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRegisterAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || usernameInput.trim().length < 3) {
      setUserError('Username must be at least 3 characters.');
      return;
    }
    setIsSubmittingUser(true);
    setUserError(null);

    try {
      if (isTop10) {
        const mintedTrophy = await onClaimGuestTrophy(usernameInput.trim());
        if (mintedTrophy) {
          setTrophy(mintedTrophy);
          sounds.playTrophyFanfare();
        }
      } else {
        const ok = await onRegisterAccount(usernameInput.trim());
        if (!ok) throw new Error('Registration failed');
      }
      setIsRegisteredNow(true);
    } catch (err: unknown) {
      setUserError((err as Error)?.message || 'Failed to register username.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCopyShare = () => {
    const text = `🏆 I scored ${telemetry.boonPoints.toLocaleString()} Boon Points in BoonFest! Ranked ${
      isTop10 ? `#${rank}` : 'Top Tier'
    } on the Global Altruism Leaderboard as "${postMortem.archetypeName}".\nBalance capital, self-growth, and societal welfare without digital addiction!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTrophy = () => {
    if (!trophy?.imageUrl) return;
    const link = document.createElement('a');
    link.href = trophy.imageUrl;
    link.download = `BoonFest_Trophy_Rank${trophy.rank || 'Elite'}_${currentUsername || 'Champion'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0d10]/95 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl my-6 rounded-2xl border border-[#22242a] bg-[#131418] p-5 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-[#f0f2f5] flex flex-col gap-5"
      >
        {/* Top Standard Controls & Session Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#22242a] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff3b5c] animate-pulse" />
            <span className="text-[#8a8f98]">Active Session:</span>
            <span className="font-mono font-bold text-[#f0f2f5] flex items-center gap-1.5">
              {isGuest ? 'Guest User' : `@${currentUsername}`}
              {currentUsername.toLowerCase() === 'dev' && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/30">
                  DEV
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {onOpenRules && (
              <button
                onClick={onOpenRules}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] text-[11px] font-medium transition cursor-pointer"
                title="View Game Codex & Rules"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#ffb800]" />
                <span className="hidden sm:inline">Rules</span>
              </button>
            )}

            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] text-[11px] font-medium transition cursor-pointer"
                title="View Global Leaderboard"
              >
                <TrophyIcon className="w-3.5 h-3.5 text-[#00ff95]" />
                <span className="hidden sm:inline">Leaderboard</span>
              </button>
            )}

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] text-[11px] font-medium transition cursor-pointer"
                title="View Trophy Case"
              >
                <Award className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span className="hidden sm:inline">Trophies</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] text-[11px] font-medium transition cursor-pointer"
                title="Settings & Dev Security"
              >
                <Settings className="w-3.5 h-3.5 text-[#8a8f98]" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ff3b5c]/15 border border-[#ff3b5c]/30 hover:bg-[#ff3b5c]/25 text-[#ff3b5c] text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                title="Log out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Header: Collapse State & Top-10 Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22242a] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#ff3b5c]/15 text-[#ff3b5c] border border-[#ff3b5c]/40">
                Systemic Entropy Collapse
              </span>
              <span className="text-[11px] text-[#8a8f98] font-mono">
                Duration: {Math.floor(telemetry.durationSeconds / 60)}m {Math.floor(telemetry.durationSeconds % 60)}s
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans text-[#f0f2f5]">
              Game Over
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-[#0c0d10] border border-[#22242a] px-3.5 py-2 rounded-xl">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold block">
                Final Boon Points
              </span>
              <span className="text-xl font-black font-mono text-[#00ff95]">
                {telemetry.boonPoints.toLocaleString()}
              </span>
            </div>
            <div className="border-l border-[#22242a] pl-4">
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold block">
                Credits Remaining
              </span>
              <span className="text-lg font-bold font-mono text-[#ffb800]">
                {telemetry.credits.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Guest Top 10 Immediate Registration Exception */}
        {requiresRegistration && !isRegisteredNow && (
          <div className="rounded-xl border border-[#ffb800]/50 bg-[#ffb800]/10 p-4 shadow-[0_0_20px_rgba(255,184,0,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#ffb800]/20 border border-[#ffb800]/40 flex items-center justify-center text-[#ffb800] shrink-0">
                <TrophyIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#ffb800]">
                  {isTop10
                    ? `🏆 Top-10 Global Leaderboard Score (Rank #${rank})!`
                    : 'First Run Completed! Convert to a Permanent Profile'}
                </h3>
                <p className="text-xs text-[#8a8f98] mt-1 leading-relaxed">
                  {isTop10
                    ? 'Your score qualifies for the permanent Global Altruism Leaderboard! Choose your unique username now to mint your flashy Trophy emblem and save your prestige.'
                    : 'To adhere to the Anti-Sloth lifecycle rules, subsequent runs require registering a unique username to access the permanent Trophy Case and historical telemetry.'}
                </p>

                <form onSubmit={handleRegisterAndClaim} className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Choose unique username..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-[#0c0d10] border border-[#22242a] text-[#f0f2f5] text-xs focus:outline-none focus:border-[#ffb800] font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#ffb800] hover:bg-[#ffd000] text-[#0c0d10] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isSubmittingUser ? 'Minting Trophy...' : 'Register & Save Score'}</span>
                  </button>
                </form>
                {userError && (
                  <p className="text-xs text-[#ff3b5c] mt-2 font-medium">{userError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Minted Trophy Showcase (if Top 10) */}
        {trophy && (
          <div className="rounded-xl border border-[#00ff95]/40 bg-[#0c0d10] p-4 flex flex-col sm:flex-row items-center gap-5 shadow-[0_0_25px_rgba(0,255,149,0.15)]">
            <div className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-[#00ff95]/60 shadow-lg bg-[#131418] flex items-center justify-center">
              <img
                src={trophy.imageUrl}
                alt={trophy.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-[#0c0d10]/90 text-[10px] font-mono font-bold text-[#ffb800] border border-[#22242a]">
                #{trophy.rank}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff95]/15 text-[#00ff95] border border-[#00ff95]/40">
                  Minted Trophy Artifact
                </span>
                <span className="text-xs font-mono text-[#8a8f98]">{trophy.date}</span>
              </div>
              <h3 className="text-base font-bold text-[#f0f2f5]">{trophy.title}</h3>
              <p className="text-xs text-[#8a8f98] mt-1 leading-relaxed">{trophy.description}</p>

              {/* Social Share & Download tools */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <button
                  onClick={handleDownloadTrophy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-[#f0f2f5] text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Emblem</span>
                </button>
                <button
                  onClick={handleCopyShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Share Achievement'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generative AI Post-Mortem & Coaching (Gemini Flash) */}
        <div className="rounded-xl border border-[#22242a] bg-[#0c0d10] p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-4 h-4 text-[#ffb800]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#ffb800]">
              AI Behavioral Post-Mortem & Coaching
            </h3>
          </div>

          <div className="mb-3">
            <span className="text-[11px] text-[#8a8f98] font-semibold block mb-0.5">Diagnosed Behavioral Archetype:</span>
            <span className="text-base font-bold text-[#00ff95] font-sans">
              "{postMortem.archetypeName}"
            </span>
            <p className="text-xs text-[#8a8f98] mt-1 leading-relaxed bg-[#131418] p-3 rounded-lg border border-[#22242a]">
              {postMortem.behavioralAnalysis}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
            {/* Strengths */}
            <div className="p-3 rounded-lg bg-[#131418] border border-[#22242a]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ff95] block mb-1">
                Key Strengths
              </span>
              <ul className="text-xs text-[#8a8f98] space-y-1 list-disc list-inside">
                {postMortem.keyStrengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Vulnerabilities */}
            <div className="p-3 rounded-lg bg-[#131418] border border-[#22242a]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff3b5c] block mb-1">
                Sloth Traps & Blind Spots
              </span>
              <ul className="text-xs text-[#8a8f98] space-y-1 list-disc list-inside">
                {postMortem.vulnerabilities.map((vul, i) => (
                  <li key={i}>{vul}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Strategic Tips */}
          <div className="p-3 rounded-lg bg-[#131418] border border-[#00d4ff]/30">
            <div className="flex items-center gap-1.5 text-[#00d4ff] text-xs font-bold uppercase tracking-wider mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Coaching Tips for Next Run</span>
            </div>
            <ul className="text-xs text-[#8a8f98] space-y-1">
              {postMortem.strategicTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#00d4ff] font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#22242a]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-xs text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00ff95]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied summary!' : 'Copy run summary'}</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-xs text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff3b5c]/10 hover:bg-[#ff3b5c]/20 border border-[#ff3b5c]/30 text-xs text-[#ff3b5c] transition cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
              </button>
            )}
          </div>

          <button
            disabled={requiresRegistration && !isRegisteredNow}
            onClick={onStartNewRun}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00ff95] text-[#0c0d10] hover:bg-[#33ffaa] font-black text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,149,0.3)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Subsequent Run</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
