import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface HueGlowBorderProps {
  hue: number; // 0 to 120
  redAlertSecondsRemaining: number;
}

export const HueGlowBorder: React.FC<HueGlowBorderProps> = ({ hue, redAlertSecondsRemaining }) => {
  const clampedHue = Math.max(0, Math.min(120, hue));
  const isRedAlert = clampedHue <= 2 && redAlertSecondsRemaining < 5.0;

  // HSL color string
  const primaryColor = `hsl(${clampedHue}, 88%, 52%)`;
  const subtleGlow = `hsla(${clampedHue}, 90%, 55%, ${isRedAlert ? '0.45' : '0.22'})`;

  return (
    <>
      {/* Dynamic Ambient Full-Screen Border Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-40 transition-colors duration-500"
        style={{
          boxShadow: `inset 0 0 ${isRedAlert ? '60px' : '28px'} ${subtleGlow}, inset 0 0 1px ${primaryColor}`,
        }}
      />

      {/* Top Edge Spectrum Indicator Line */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 h-[3px] overflow-hidden bg-[#151619]">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${(clampedHue / 120) * 100}%`,
            backgroundColor: primaryColor,
            boxShadow: `0 0 14px ${primaryColor}`,
          }}
        />
      </div>

      {/* Critical Red Alert Warning Banner */}
      {isRedAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-xl bg-[#151619]/95 border border-[#ff3b5c]/70 text-[#f0f2f5] shadow-[0_0_30px_rgba(255,59,92,0.4)] backdrop-blur-md"
        >
          <AlertTriangle className="w-4 h-4 text-[#ff3b5c] animate-pulse" />
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#ff3b5c]">Systemic Collapse Imminent:</span>
            <span className="font-mono text-xs font-black text-white">
              {Math.max(0, redAlertSecondsRemaining).toFixed(1)}s
            </span>
          </div>
          <span className="text-[11px] text-[#8a8f98] pl-1.5 border-l border-[#22242a]">Enact a Boon immediately!</span>
        </motion.div>
      )}
    </>
  );
};
