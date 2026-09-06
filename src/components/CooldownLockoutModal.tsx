import React, { useState, useEffect } from 'react';
import { ShieldAlert, Sun, Coffee, Eye, Wind, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CooldownLockoutModalProps {
  remainingSeconds: number;
  reason?: '30m_rule' | '24h_cap';
  onCheckStatus: () => void;
}

const MINDFUL_QUOTES = [
  '“Rest is not idleness; it is the fertile soil from which true creativity and altruism bloom.”',
  '“Digital stamina without physical anchoring is an illusion. Step outside and touch the soil.”',
  '“The most profound boons you can give today are not in code, but to the people standing right beside you.”',
  '“Anti-sloth is not relentless hustle—it is the disciplined rhythm of focused effort followed by deep recovery.”',
  '“A mind constantly stimulated by quick dopamine loops loses the capacity for generational foresight.”',
];

export const CooldownLockoutModal: React.FC<CooldownLockoutModalProps> = ({
  remainingSeconds,
  reason,
  onCheckStatus,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MINDFUL_QUOTES.length);
    }, 12000);
    return () => clearInterval(quoteTimer);
  }, []);

  // Simple 4-4-4 breathing cycle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const cycle = () => {
      setBreathPhase('Inhale');
      timer = setTimeout(() => {
        setBreathPhase('Hold');
        timer = setTimeout(() => {
          setBreathPhase('Exhale');
          timer = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };
    cycle();
    return () => clearTimeout(timer);
  }, []);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0d10]/95 backdrop-blur-xl select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl border border-[#22242a] bg-[#131418] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col items-center text-center"
      >
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-xl bg-[#ffb800]/10 border border-[#ffb800]/30 flex items-center justify-center mb-3 text-[#ffb800]">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Title & Badge */}
        <div className="mb-2">
          <span className="px-3 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#ffb800]/10 text-[#ffb800] border border-[#ffb800]/30">
            {reason === '24h_cap' ? '24-Hour Rolling Cap Reached' : 'Anti-Sloth 25-Minute Cooldown'}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#f0f2f5] mb-2 font-sans">
          Mindful Recovery in Progress
        </h2>

        <p className="text-xs text-[#8a8f98] max-w-md mb-5 leading-relaxed">
          {reason === '24h_cap'
            ? 'You have reached your 25-minute cumulative daily limit. The engine enforces rest to prevent compulsive digital fatigue.'
            : 'You have actively played for 5 cumulative minutes within this 30-minute window. True sustainability requires disciplined real-world presence.'}
        </p>

        {/* Countdown Timer */}
        <div className="w-full max-w-sm rounded-xl bg-[#0c0d10] border border-[#22242a] p-4 mb-5 shadow-inner">
          <span className="text-[10px] uppercase tracking-widest text-[#525866] font-bold block mb-1">
            Gameplay Unlocks In
          </span>
          <div className="font-mono text-3xl sm:text-4xl font-black text-[#ffb800] tracking-tight">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] text-[#525866] block mt-1">
            Validated strictly by server-side authoritative clock
          </span>
        </div>

        {/* Mindful Breathing Pacer */}
        <div className="flex flex-col items-center gap-1.5 mb-5">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <motion.div
              animate={{
                scale: breathPhase === 'Inhale' ? 1.25 : breathPhase === 'Hold' ? 1.25 : 0.85,
                opacity: breathPhase === 'Inhale' ? 0.9 : breathPhase === 'Hold' ? 1 : 0.4,
              }}
              transition={{ duration: 4, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-[#00ff95]/15 border border-[#00ff95]/40"
            />
            <Wind className="w-5 h-5 text-[#00ff95] z-10" />
          </div>
          <span className="text-[11px] font-bold text-[#00ff95] tracking-wider uppercase">
            {breathPhase} (Mindful Breathing)
          </span>
        </div>

        {/* Anti-Sloth Philosophy Quote */}
        <div className="w-full max-w-md rounded-lg bg-[#0c0d10] border border-[#22242a] p-3.5 mb-5">
          <p className="text-xs italic text-[#8a8f98] leading-relaxed">
            {MINDFUL_QUOTES[quoteIndex]}
          </p>
        </div>

        {/* Real-world suggestions */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-md mb-5 text-left">
          <div className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#22242a] flex items-start gap-2">
            <Sun className="w-3.5 h-3.5 text-[#ffb800] shrink-0 mt-0.5" />
            <span className="text-[10px] text-[#8a8f98]">Drink a glass of water and stretch.</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#22242a] flex items-start gap-2">
            <Eye className="w-3.5 h-3.5 text-[#00d4ff] shrink-0 mt-0.5" />
            <span className="text-[10px] text-[#8a8f98]">Look out a window at a distant horizon.</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#22242a] flex items-start gap-2">
            <Coffee className="w-3.5 h-3.5 text-[#ff3b5c] shrink-0 mt-0.5" />
            <span className="text-[10px] text-[#8a8f98]">Send an encouraging note to a friend.</span>
          </div>
        </div>

        {/* Check Status CTA */}
        <button
          onClick={onCheckStatus}
          className="px-5 py-2 rounded-lg bg-[#1a1c22] hover:bg-[#252830] border border-[#22242a] text-[#f0f2f5] text-xs font-bold transition cursor-pointer"
        >
          Check Lockout Status
        </button>
      </motion.div>
    </div>
  );
};
