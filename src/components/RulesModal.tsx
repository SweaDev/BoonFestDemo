import React from 'react';
import { X, ShieldAlert, HeartHandshake, Brain, Activity, Flame, Coins, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0c0d10]/95 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl my-6 rounded-2xl border border-[#22242a] bg-[#131418] p-5 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-[#f0f2f5] flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22242a] pb-3.5">
          <div>
            <h2 className="text-lg font-extrabold font-sans text-[#f0f2f5]">BoonFest Codex & Philosophy</h2>
            <p className="text-xs text-[#8a8f98] mt-0.5">
              An anti-sloth, pro-social philosophy balancing capital, self-growth, and altruism.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a1c22] border border-[#22242a] hover:bg-[#252830] text-[#8a8f98] hover:text-[#f0f2f5] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs text-[#8a8f98] leading-relaxed max-h-[480px] overflow-y-auto pr-2">
          {/* Section 1: The Four Pillars */}
          <div>
            <h3 className="text-xs font-bold text-[#ffb800] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Four Pillars</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a]">
                <div className="flex items-center gap-2 text-[#ffb800] font-bold mb-1">
                  <Coins className="w-4 h-4" />
                  <span>1. Earn (Capital Generation)</span>
                </div>
                <p className="text-[11px] text-[#8a8f98]">
                  Labor and enterprises that generate credits. Higher tiers require prerequisite levels in Mind and Body. Yields are amplified by your Mind attribute.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#22242a]">
                <div className="flex items-center gap-2 text-[#00d4ff] font-bold mb-1">
                  <Brain className="w-4 h-4" />
                  <span>2. Grow (Self-Actualization)</span>
                </div>
                <p className="text-[11px] text-[#8a8f98]">
                  Invest in Mind (+Earn yield), Body (slows baseline entropy acceleration), and Spirit (+Boon score multiplier & hue recovery).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#00ff95]/30">
                <div className="flex items-center gap-2 text-[#00ff95] font-bold mb-1">
                  <HeartHandshake className="w-4 h-4" />
                  <span>3. Boon (Generosity & World Care)</span>
                </div>
                <p className="text-[11px] text-[#8a8f98]">
                  Fund external societal solutions (clean water, microgrids, seed vaults). This is the <strong className="text-[#00ff95]">exclusive</strong> method to earn Boon Points and restore world equilibrium toward Green (120°).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0d10] border border-[#ff3b5c]/30">
                <div className="flex items-center gap-2 text-[#ff3b5c] font-bold mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>4. Sloth (Lottery & Gambling Traps)</span>
                </div>
                <p className="text-[11px] text-[#8a8f98] leading-relaxed">
                  Sloth opportunities are obvious speculative lures (<strong className="text-[#ff9900]">Lotteries</strong> & <strong className="text-[#ff3b5c]">Gambling</strong>):
                </p>
                <ul className="mt-1 space-y-1 text-[11px] text-[#8a8f98] list-disc list-inside">
                  <li><strong className="text-[#ff9900]">Lottery:</strong> Advertises giant jackpots (e.g. "Cancer Research Lottery"), but pays less than 10% of the time and only in small amounts. When you lose, entropy spikes because collective wealth was squandered instead of being used for good deeds.</li>
                  <li><strong className="text-[#ff3b5c]">Gambling:</strong> Seldom pays and only in small amounts. Gambling causes higher entropy spikes than lottery, accelerating societal decay.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: The Hue Shift System */}
          <div className="p-3.5 rounded-xl bg-[#0c0d10] border border-[#22242a]">
            <h3 className="text-xs font-bold text-[#f0f2f5] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ff3b5c] via-[#ffb800] to-[#00ff95]" />
              <span>Dynamic Balance Engine: The Hue Shift System</span>
            </h3>
            <p className="text-[11px] text-[#8a8f98] leading-relaxed mb-2">
              The full-screen border glow visualizes the world's survival state along an HSL spectrum:
            </p>
            <ul className="space-y-1 text-[11px] text-[#8a8f98] list-disc list-inside">
              <li><strong className="text-[#ffb800]">Starting State:</strong> Glowing Yellow (60°).</li>
              <li><strong className="text-[#00ff95]">Positive Altruism:</strong> Executing Boons shifts the glow toward Emerald Green (120°).</li>
              <li><strong className="text-[#ff3b5c]">Systemic Entropy:</strong> Over time, unaddressed societal needs accumulate at an accelerating rate, pulling the hue toward crimson (0°).</li>
              <li><strong className="text-[#ff3b5c]">Game Over:</strong> If the border reaches 100% pure Red (0°) and remains uncorrected for <strong>5 continuous seconds</strong>, the run terminates immediately in a Game Over.</li>
            </ul>
          </div>

          {/* Section 3: Anti-Sloth Pacing */}
          <div className="p-3.5 rounded-xl bg-[#0c0d10] border border-[#ffb800]/30">
            <h3 className="text-xs font-bold text-[#ffb800] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Strict Anti-Sloth Real-World Pacing</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-[#8a8f98]">
              <li>
                <strong className="text-[#ffb800]">The 30-Minute Rolling Rule:</strong> You may actively play for a maximum of <strong>5 cumulative minutes</strong> within any 30-minute rolling window. Once 5 minutes are reached, the game locks into an unplayable, paused cooldown state for <strong>25 continuous minutes</strong>.
              </li>
              <li>
                <strong className="text-[#ffb800]">The 24-Hour Daily Cap:</strong> A maximum of <strong>25 cumulative minutes</strong> of active play is allowed in any 24-hour cycle.
              </li>
              <li>
                <strong className="text-[#ffb800]">Server Enforcement:</strong> Timers are verified on the server to prevent clock tampering.
              </li>
              <li>
                <strong className="text-[#00ff95]">Developer Exemption:</strong> The Dev user (<code className="text-[#00ff95]">@dev</code>) and users granted temporary dev status are completely exempt from all time restrictions. The Main Dev can grant other accounts temporary dev privileges from Settings.
              </li>
            </ul>
          </div>

          {/* Section 4: Controls */}
          <div className="p-3.5 rounded-xl bg-[#0c0d10] border border-[#22242a]">
            <h3 className="text-xs font-bold text-[#f0f2f5] uppercase tracking-wider mb-2">
              Carousel & Keyboard Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div><strong className="text-[#f0f2f5]">Browse Carousel:</strong> Mouse wheel, swipe, or <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">←</kbd> <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">→</kbd> keys</div>
              <div><strong className="text-[#f0f2f5]">Enact Card:</strong> Click, tap, or press <kbd className="px-2 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">Space</kbd> or <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">Enter</kbd></div>
              <div><strong className="text-[#00ff95]">Pause / Resume:</strong> Click <strong className="text-[#00ff95]">Pause</strong> in header or press <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">P</kbd> or <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">Esc</kbd></div>
              <div><strong className="text-[#00ff95]">Resume while Paused:</strong> Press <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">Space</kbd>, <kbd className="px-1.5 py-0.2 rounded bg-[#1a1c22] border border-[#2c2f38] font-mono text-[#f0f2f5]">P</kbd>, or click Resume</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#22242a]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] text-xs font-black transition cursor-pointer"
          >
            Understood
          </button>
        </div>
      </motion.div>
    </div>
  );
};
