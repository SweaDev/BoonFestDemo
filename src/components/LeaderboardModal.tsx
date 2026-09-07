import React, { useState, useEffect } from 'react';
import { Trophy, X, Medal, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  onClose: () => void;
  onSelectUser: (username: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose, onSelectUser }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0c0d10]/95 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl my-6 rounded-2xl border border-[#22242a] bg-[#131418] p-5 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-[#f0f2f5] flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22242a] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff95]/10 border border-[#00ff95]/30 flex items-center justify-center text-[#00ff95]">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-[#f0f2f5]">Global Altruism Leaderboard</h2>
              <span className="text-xs text-[#8a8f98]">
                Top 10 Stewards ranked exclusively by generative Boon Points
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              className="p-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="h-44 flex items-center justify-center text-xs text-[#525866] font-mono">
            Synchronizing global altruism records...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-[#525866] text-xs font-mono">No records available.</div>
        ) : (
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {entries.map((entry, index) => {
              const rank = index + 1;
              let rankStyle = 'bg-[#1a1c22] text-[#8a8f98] border-[#22242a]';
              if (rank === 1) rankStyle = 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/40 shadow-[0_0_12px_rgba(255,184,0,0.25)]';
              if (rank === 2) rankStyle = 'bg-[#f0f2f5]/15 text-[#f0f2f5] border-[#f0f2f5]/30';
              if (rank === 3) rankStyle = 'bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30';

              return (
                <div
                  key={entry.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-[#0c0d10] border border-[#22242a] hover:border-[#00ff95]/40 flex items-center justify-between gap-4 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs border ${rankStyle}`}>
                      #{rank}
                    </span>

                    {/* Trophy Avatar if available */}
                    {entry.trophyImageUrl ? (
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#00ff95]/30 shrink-0 bg-[#131418]">
                        <img
                          src={entry.trophyImageUrl}
                          alt="Trophy"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#131418] border border-[#22242a] flex items-center justify-center text-[#525866] shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                    )}

                    {/* User & Archetype */}
                    <div>
                      <button
                        onClick={() => onSelectUser(entry.username)}
                        className="font-bold text-xs sm:text-sm text-[#f0f2f5] hover:text-[#00ff95] transition flex items-center gap-1.5 cursor-pointer text-left"
                      >
                        <span>@{entry.username}</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </button>
                      <span className="text-[10px] text-[#8a8f98] block mt-0.5">
                        {entry.behaviorArchetype || 'The Altruistic Steward'}
                      </span>
                    </div>
                  </div>

                  {/* Score & Duration */}
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm sm:text-base text-[#00ff95] block">
                      {entry.score.toLocaleString()} Pts
                    </span>
                    <span className="text-[10px] text-[#525866] font-mono">
                      {Math.floor(entry.runDurationSeconds / 60)}m {Math.floor(entry.runDurationSeconds % 60)}s • {entry.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
