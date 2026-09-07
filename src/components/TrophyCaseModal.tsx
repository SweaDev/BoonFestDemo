import React, { useState, useEffect } from 'react';
import {
  Trophy as TrophyIcon,
  X,
  Award,
  Calendar,
  Clock,
  HeartHandshake,
  User,
  ExternalLink,
  Check,
  LogIn,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Trophy, RunTelemetry } from '../types';

interface TrophyCaseModalProps {
  username: string;
  isGuest: boolean;
  onClose: () => void;
  onSwitchUser: (username: string) => Promise<boolean>;
}

interface UserProfileData {
  username: string;
  createdAt: number;
  runsCount: number;
  trophies: Trophy[];
  runs: RunTelemetry[];
}

export const TrophyCaseModal: React.FC<TrophyCaseModalProps> = ({
  username,
  isGuest,
  onClose,
  onSwitchUser,
}) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchUsernameInput, setSwitchUsernameInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!isGuest && username) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [username, isGuest]);

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/?user=${encodeURIComponent(username)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSwitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchUsernameInput.trim()) return;
    const ok = await onSwitchUser(switchUsernameInput.trim());
    if (ok) {
      setShowSwitchForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0c0d10]/95 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl my-6 rounded-2xl border border-[#22242a] bg-[#131418] p-5 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-[#f0f2f5] flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22242a] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb800]/10 border border-[#ffb800]/30 flex items-center justify-center text-[#ffb800]">
              <TrophyIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-sans text-[#f0f2f5]">
                  {isGuest ? 'Guest Session' : `@${username}'s Profile`}
                </h2>
                {!isGuest && (
                  <button
                    onClick={handleCopyProfileLink}
                    className="p-1 rounded-md bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] transition cursor-pointer"
                    title="Copy shareable profile link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00ff95]" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <span className="text-xs text-[#8a8f98]">
                {isGuest ? 'Play your first run to unlock permanent account registration' : 'Permanent Trophy Case & Altruism Telemetry'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSwitchForm(!showSwitchForm)}
              className="px-2.5 py-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-xs font-semibold text-[#f0f2f5] transition cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-[#00ff95]" />
              <span>Switch User</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Switch Account inline drawer */}
        {showSwitchForm && (
          <form onSubmit={handleSwitchSubmit} className="p-3.5 rounded-xl bg-[#0c0d10] border border-[#22242a] flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Enter existing or new username..."
              value={switchUsernameInput}
              onChange={(e) => setSwitchUsernameInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#131418] border border-[#22242a] text-xs text-[#f0f2f5] font-mono focus:outline-none focus:border-[#ffb800]"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-extrabold transition cursor-pointer"
            >
              Load Account
            </button>
          </form>
        )}

        {/* Career Stats */}
        {!isGuest && profile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a]">
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold block">Total Runs</span>
              <span className="text-lg font-bold font-mono text-[#f0f2f5]">{profile.runsCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a]">
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold block">Trophies Minted</span>
              <span className="text-lg font-bold font-mono text-[#ffb800]">{profile.trophies?.length || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a]">
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold block">Peak Boon Score</span>
              <span className="text-lg font-bold font-mono text-[#00ff95]">
                {Math.max(0, ...(profile.runs?.map((r) => r.boonPoints) || [0])).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a]">
              <span className="text-[9px] uppercase tracking-wider text-[#8a8f98] font-bold block">Steward Since</span>
              <span className="text-xs font-mono text-[#f0f2f5] mt-1 block">
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Permanent Trophy Case Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#ffb800] flex items-center gap-2">
              <Award className="w-3.5 h-3.5" />
              <span>Permanent Trophy Case</span>
            </h3>
            <span className="text-xs text-[#8a8f98] font-mono">
              {profile?.trophies?.length || 0} Awards
            </span>
          </div>

          {loading ? (
            <div className="h-28 flex items-center justify-center text-xs text-[#525866] font-mono">
              Loading Trophy Vault...
            </div>
          ) : isGuest ? (
            <div className="p-5 rounded-xl bg-[#0c0d10] border border-[#22242a] text-center">
              <p className="text-xs text-[#f0f2f5] font-medium">
                You are currently playing in guest trial mode.
              </p>
              <p className="text-[11px] text-[#8a8f98] mt-1">
                Conclude your first run or qualify in the Top 10 to register your unique username and claim your Trophy Case.
              </p>
            </div>
          ) : profile?.trophies && profile.trophies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {profile.trophies.map((trophy) => (
                <div
                  key={trophy.id}
                  className="rounded-xl border border-[#00ff95]/30 bg-[#0c0d10] p-3.5 flex flex-col items-center text-center shadow-lg"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden mb-2.5 border border-[#00ff95]/40 bg-[#131418] flex items-center justify-center">
                    <img
                      src={trophy.imageUrl}
                      alt={trophy.title}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[#ffb800] font-bold uppercase">
                    Rank #{trophy.rank || 'Elite'}
                  </span>
                  <h4 className="text-xs font-bold text-[#f0f2f5] mt-0.5">{trophy.title}</h4>
                  <p className="text-[10px] text-[#8a8f98] mt-1 leading-tight line-clamp-2">
                    {trophy.description}
                  </p>
                  <span className="text-[9px] text-[#525866] font-mono mt-1.5">{trophy.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#0c0d10] border border-dashed border-[#22242a] text-center flex flex-col items-center">
              <TrophyIcon className="w-8 h-8 text-[#525866] mb-1.5" />
              <p className="text-xs font-semibold text-[#f0f2f5]">No Top-10 Trophies Minted Yet</p>
              <p className="text-[11px] text-[#8a8f98] mt-1 max-w-sm">
                Rank among the Top 10 on the Global Leaderboard in any run to automatically mint your high-status vector artifact.
              </p>
            </div>
          )}
        </div>

        {/* Recent Run History */}
        {!isGuest && profile?.runs && profile.runs.length > 0 && (
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8a8f98] mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Run History</span>
            </h3>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {profile.runs.map((run) => (
                <div
                  key={run.runId}
                  className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#22242a] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#00ff95]">{run.boonPoints.toLocaleString()} Pts</span>
                    <span className="text-[#525866]">•</span>
                    <span className="text-[#8a8f98]">{Math.floor(run.durationSeconds / 60)}m {Math.floor(run.durationSeconds % 60)}s</span>
                    <span className="text-[#525866]">•</span>
                    <span className="text-[#8a8f98]">Pillars: M{run.mind} B{run.body} S{run.spirit}</span>
                  </div>
                  <span className="text-[#525866] text-[10px]">{run.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
