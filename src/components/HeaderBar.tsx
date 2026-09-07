import React from 'react';
import {
  Coins,
  HeartHandshake,
  Brain,
  Activity,
  Flame,
  Volume2,
  VolumeX,
  Trophy as TrophyIcon,
  BarChart3,
  HelpCircle,
  Clock,
  User,
  AlertCircle,
  Settings,
  LogOut,
  Crown,
  ShieldCheck,
  Pause,
  Play,
} from 'lucide-react';
import { ActivePhantomCredit, PlayerAttributes, PlaytimeStats } from '../types';

interface HeaderBarProps {
  username: string;
  isGuest: boolean;
  credits: number;
  boonPoints: number;
  attributes: PlayerAttributes;
  hue: number;
  playtimeStats: PlaytimeStats;
  activePhantoms: ActivePhantomCredit[];
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  username,
  isGuest,
  credits,
  boonPoints,
  attributes,
  hue,
  playtimeStats,
  activePhantoms,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenRules,
  onOpenSettings,
  onLogout,
}) => {
  const clampedHue = Math.max(0, Math.min(120, hue));

  // Determine world state moniker
  let stateMoniker = 'Equilibrium';
  let stateBg = 'text-[#ffb800] border-[#ffb800]/30 bg-[#ffb800]/10';
  if (clampedHue > 85) {
    stateMoniker = 'Altruistic Flourishing';
    stateBg = 'text-[#00ff95] border-[#00ff95]/40 bg-[#00ff95]/10';
  } else if (clampedHue < 35) {
    stateMoniker = 'Critical Entropy';
    stateBg = 'text-[#ff3b5c] border-[#ff3b5c]/50 bg-[#ff3b5c]/10 animate-pulse';
  }

  // Playtime formatting (seconds -> M:SS)
  const activeSecIn30m = playtimeStats.activeSecondsIn30m || 0;
  const minutes30m = Math.floor(activeSecIn30m / 60);
  const seconds30m = Math.floor(activeSecIn30m % 60);
  const isNearingLockout = activeSecIn30m >= 240; // over 4 minutes

  const hasPhantoms = activePhantoms.length > 0;
  const totalPhantom = activePhantoms.reduce((sum, p) => sum + p.amount, 0);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#22242a] bg-[#151619]/95 backdrop-blur-md px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & World Equilibrium Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#ffd000] via-[#00ff95] to-[#00ff95] bg-clip-text text-transparent font-sans">
              BoonFest
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] text-[#8a8f98]">
              Anti-Sloth
            </span>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${stateBg}`}>
            <span
              className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: clampedHue > 85 ? '#00ff95' : clampedHue < 35 ? '#ff3b5c' : '#ffb800' }}
            />
            <span>{stateMoniker}</span>
            <span className="text-[10px] opacity-75 font-mono">({Math.round(clampedHue)}°)</span>
          </div>
        </div>

        {/* Core Resources: Credits & Boon Points */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Credits */}
          <div className="flex items-center gap-2 bg-[#131418] border border-[#22242a] px-2.5 py-1 rounded-lg shadow-inner">
            <Coins className="w-3.5 h-3.5 text-[#ffb800]" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold leading-none">
                Credits
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold font-mono text-[#ffb800]">
                  {credits.toLocaleString()}
                </span>
                {hasPhantoms && (
                  <span
                    title={`Includes ${totalPhantom} ephemeral credits pending resolution`}
                    className="flex items-center text-[9px] text-[#ffb800] font-medium px-1 py-0.2 rounded bg-[#ffb800]/10 border border-[#ffb800]/40"
                  >
                    <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                    +{totalPhantom}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boon Points (Core Altruism Metric) */}
          <div className="flex items-center gap-2 bg-[#131418] border border-[#00ff95]/40 px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(0,255,149,0.08)]">
            <HeartHandshake className="w-3.5 h-3.5 text-[#00ff95]" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[#00ff95]/90 font-bold leading-none">
                Boon Points
              </span>
              <span className="text-sm font-extrabold font-mono text-[#00ff95]">
                {boonPoints.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pillars of Growth (Mind, Body, Spirit) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#131418] border border-[#22242a] px-2 py-1 rounded-lg">
            {/* Mind */}
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] hover:border-[#00d4ff]/40 transition"
              title={`Mind Lvl ${attributes.mind}: +${(attributes.mind - 1) * 18}% yield on all Earn activities.`}
            >
              <Brain className="w-3 h-3 text-[#00d4ff]" />
              <span className="text-[11px] font-mono font-bold text-[#00d4ff]">M{attributes.mind}</span>
            </div>
            {/* Body */}
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] hover:border-[#ffb800]/40 transition"
              title={`Body Lvl ${attributes.body}: Slows entropy decay by ${Math.round((1 - Math.pow(0.82, attributes.body - 1)) * 100)}%.`}
            >
              <Activity className="w-3 h-3 text-[#ffb800]" />
              <span className="text-[11px] font-mono font-bold text-[#ffb800]">B{attributes.body}</span>
            </div>
            {/* Spirit */}
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] hover:border-[#a855f7]/40 transition"
              title={`Spirit Lvl ${attributes.spirit}: +${(attributes.spirit - 1) * 25}% Boon Points & +${(attributes.spirit - 1) * 20}% Hue restoration.`}
            >
              <Flame className="w-3 h-3 text-[#a855f7]" />
              <span className="text-[11px] font-mono font-bold text-[#a855f7]">S{attributes.spirit}</span>
            </div>
          </div>
        </div>

        {/* Right Tools & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Anti-Sloth Rolling Pacing Counter OR Dev Unrestricted Badge */}
          {playtimeStats.isDev || username.toLowerCase() === 'dev' ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono font-bold ${
                playtimeStats.isTemporaryDev
                  ? 'border-[#ffb800]/50 bg-[#ffb800]/10 text-[#ffb800]'
                  : 'border-[#00ff95]/50 bg-[#00ff95]/10 text-[#00ff95]'
              }`}
              title={
                playtimeStats.isTemporaryDev
                  ? `Temporary Dev status granted: Zero time restrictions. Expires in ${
                      playtimeStats.devGrantedRemainingSeconds
                        ? Math.ceil(playtimeStats.devGrantedRemainingSeconds / 3600) + 'h'
                        : 'active duration'
                    }.`
                  : 'Main Dev Account: Zero time restrictions. Anti-Sloth limits do not apply to dev users.'
              }
            >
              <Crown className="w-3 h-3 text-current" />
              <span>DEV</span>
              <span className="text-[10px] opacity-80">
                {playtimeStats.isTemporaryDev && playtimeStats.devGrantedRemainingSeconds
                  ? `${Math.max(1, Math.ceil(playtimeStats.devGrantedRemainingSeconds / 3600))}h`
                  : '∞'}
              </span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono ${
                isNearingLockout
                  ? 'border-[#ffb800]/60 bg-[#ffb800]/10 text-[#ffb800] animate-pulse'
                  : 'border-[#22242a] bg-[#131418] text-[#f0f2f5]'
              }`}
              title="Anti-Sloth 30-Minute Rolling Rule: Max 5 cumulative active minutes allowed per 30 minutes to safeguard your real-world vitality."
            >
              <Clock className="w-3 h-3 text-[#8a8f98]" />
              <span className="font-bold">
                {minutes30m}:{seconds30m.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[#525866]">/ 5m</span>
            </div>
          )}

          {/* Profile / Trophy Case */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-[#f0f2f5] transition text-xs font-medium cursor-pointer"
            title="View Profile & Trophy Case"
          >
            <TrophyIcon className="w-3.5 h-3.5 text-[#ffb800]" />
            <span className="hidden sm:inline max-w-[85px] truncate">
              {isGuest ? 'Guest' : `@${username}`}
            </span>
          </button>

          {/* Settings & Dev Management Modal */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            title="Settings, Dev Controls & Session"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Global Leaderboard */}
          <button
            onClick={onOpenLeaderboard}
            className="p-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            title="Global Altruism Leaderboard"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>

          {/* Rules Guide */}
          <button
            onClick={onOpenRules}
            className="p-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            title="Game Philosophy & Rules"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Direct Log Out Button (Active when logged in as non-guest) */}
          {!isGuest && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg border border-[#ff3b5c]/30 bg-[#ff3b5c]/10 hover:bg-[#ff3b5c]/25 text-[#ff3b5c] transition cursor-pointer"
              title="Log Out (Switch to Guest session)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Pause / Resume Toggle Button */}
          <button
            id="btn-header-pause-toggle"
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
              isPaused
                ? 'border-[#00ff95]/60 bg-[#00ff95]/15 text-[#00ff95] hover:bg-[#00ff95]/25 shadow-[0_0_12px_rgba(0,255,149,0.25)] animate-pulse'
                : 'border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-[#f0f2f5]'
            }`}
            title={isPaused ? 'Resume Game (P or Space)' : 'Pause Game (P or Space)'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#525866]" /> : <Volume2 className="w-3.5 h-3.5 text-[#00ff95]" />}
          </button>
        </div>
      </div>
    </header>
  );
};
