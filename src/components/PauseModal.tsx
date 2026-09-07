import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  Clock,
  Coins,
  HeartHandshake,
  Brain,
  Activity,
  Flame,
  RotateCcw,
  HelpCircle,
  Settings,
  Shield,
} from 'lucide-react';
import { PlayerAttributes } from '../types';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  hue: number;
  credits: number;
  boonPoints: number;
  attributes: PlayerAttributes;
  runElapsedSeconds: number;
  paceMultiplier: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenRules,
  onOpenSettings,
  hue,
  credits,
  boonPoints,
  attributes,
  runElapsedSeconds,
  paceMultiplier,
}) => {
  if (!isOpen) return null;

  const clampedHue = Math.max(0, Math.min(120, hue));
  const elapsedMinutes = Math.floor(runElapsedSeconds / 60);
  const elapsedSeconds = Math.floor(runElapsedSeconds % 60);

  // Status moniker
  let statusText = 'Equilibrium';
  let statusColor = 'text-[#ffb800] border-[#ffb800]/40 bg-[#ffb800]/10';
  if (clampedHue > 85) {
    statusText = 'Altruistic Flourishing';
    statusColor = 'text-[#00ff95] border-[#00ff95]/40 bg-[#00ff95]/10';
  } else if (clampedHue < 35) {
    statusText = 'Critical Entropy';
    statusColor = 'text-[#ff3b5c] border-[#ff3b5c]/40 bg-[#ff3b5c]/10';
  }

  return (
    <div
      id="pause-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onResume();
        }
      }}
    >
      <div
        id="pause-modal-card"
        className="w-full max-w-lg bg-[#131418] border border-[#2a2d36] rounded-2xl p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.9)] flex flex-col gap-5 text-[#f0f2f5]"
      >
        {/* Header with animated pause glyph */}
        <div className="flex items-center justify-between border-b border-[#22242a] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb800]/15 border border-[#ffb800]/30 flex items-center justify-center text-[#ffb800] shadow-[0_0_16px_rgba(255,184,0,0.2)]">
              <Pause className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-[#f0f2f5]">GAME PAUSED</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#1a1c22] border border-[#22242a] text-[#8a8f98]">
                  Standby
                </span>
              </div>
              <p className="text-xs text-[#8a8f98] mt-0.5">
                Entropy decay, red-alert timers, and pace escalation are safely frozen.
              </p>
            </div>
          </div>
        </div>

        {/* Current State Quick-Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Equilibrium */}
          <div className="bg-[#181a20] border border-[#22242a] rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8f98]">World State</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono font-black text-sm text-[#f0f2f5]">{Math.round(clampedHue)}°</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColor}`}>
                {statusText}
              </span>
            </div>
          </div>

          {/* Credits */}
          <div className="bg-[#181a20] border border-[#22242a] rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8f98] flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#ffb800]" />
              Credits
            </span>
            <span className="font-mono font-black text-sm text-[#ffb800] mt-1">
              {credits.toLocaleString()} Cr
            </span>
          </div>

          {/* Boon Points */}
          <div className="bg-[#181a20] border border-[#22242a] rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ff95] flex items-center gap-1">
              <HeartHandshake className="w-3 h-3 text-[#00ff95]" />
              Boon Points
            </span>
            <span className="font-mono font-black text-sm text-[#00ff95] mt-1">
              {boonPoints.toLocaleString()}
            </span>
          </div>

          {/* Growth Pillars */}
          <div className="bg-[#181a20] border border-[#22242a] rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8f98]">Growth Pillars</span>
            <div className="mt-1 flex items-center gap-2 font-mono text-xs font-bold">
              <span className="text-[#00d4ff]" title="Mind Level">M{attributes.mind}</span>
              <span className="text-[#525866]">•</span>
              <span className="text-[#ffb800]" title="Body Level">B{attributes.body}</span>
              <span className="text-[#525866]">•</span>
              <span className="text-[#a855f7]" title="Spirit Level">S{attributes.spirit}</span>
            </div>
          </div>

          {/* Run Time */}
          <div className="bg-[#181a20] border border-[#22242a] rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8f98] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8a8f98]" />
              Time Elapsed
            </span>
            <span className="font-mono font-black text-sm text-[#f0f2f5] mt-1">
              {elapsedMinutes}m {elapsedSeconds.toString().padStart(2, '0')}s
            </span>
          </div>

          {/* Entropy Pace */}
          <div className="bg-[#181a20] border border-[#22242a] rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8f98]">Current Pace</span>
            <span className="font-mono font-bold text-xs text-[#ffb800] mt-1">
              {paceMultiplier.toFixed(1)}x ({paceMultiplier <= 1.3 ? 'Gentle' : paceMultiplier <= 2.3 ? 'Accelerating' : 'Surging'})
            </span>
          </div>
        </div>

        {/* Primary Action: Resume Game */}
        <button
          id="btn-resume-game-primary"
          onClick={onResume}
          className="w-full py-3.5 px-4 rounded-xl bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_24px_rgba(0,255,149,0.35)] cursor-pointer active:scale-[0.99]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>RESUME GAME</span>
          <span className="ml-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#0c0d10]/20 font-bold">
            [ Space / P ]
          </span>
        </button>

        {/* Secondary Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#22242a]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenRules();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-xs text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Rules Guide</span>
            </button>
            <button
              onClick={() => {
                onOpenSettings();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] text-xs text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to abandon this run and start fresh?')) {
                onRestart();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ff3b5c]/30 bg-[#ff3b5c]/10 hover:bg-[#ff3b5c]/20 text-xs text-[#ff3b5c] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Run</span>
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="text-center text-[11px] text-[#525866]">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] text-[#8a8f98] font-mono">P</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] text-[#8a8f98] font-mono">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#22242a] text-[#8a8f98] font-mono">Esc</kbd> anytime to resume.
        </div>
      </div>
    </div>
  );
};
