import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Sparkles, Leaf, Activity, TrendingUp, Building2, Flame } from 'lucide-react';

export type SocietyStatus = 'critical' | 'struggling' | 'thriving';

export interface ActionImpact {
  id: number;
  category: 'boon' | 'grow' | 'earn' | 'sloth_trap' | 'phantom_default';
  label: string;
  timestamp: number;
}

interface SocietyBackgroundProps {
  hue: number;
  decayRate: number;
  boonPoints: number;
  lastAction: ActionImpact | null;
}

// Curated high-resolution imagery for each societal state
const SOCIETY_PRESETS = {
  critical: {
    title: 'Critical Collapse',
    subtitle: 'High Entropy · Decaying Megacity under Red Distress Alert',
    primaryColor: '#ff3b5c',
    glowColor: 'rgba(255, 59, 92, 0.4)',
    accentClass: 'text-[#ff3b5c] border-[#ff3b5c]/40 bg-[#ff3b5c]/10',
    imgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    fallbackSeed: 'https://picsum.photos/seed/boonfest-critical/1920/1080',
  },
  struggling: {
    title: 'Struggling Society',
    subtitle: 'Endeavoring Equilibrium · Heavy Industrial Labor & Reconstruction',
    primaryColor: '#ffb800',
    glowColor: 'rgba(255, 184, 0, 0.35)',
    accentClass: 'text-[#ffb800] border-[#ffb800]/40 bg-[#ffb800]/10',
    imgUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80',
    fallbackSeed: 'https://picsum.photos/seed/boonfest-struggling/1920/1080',
  },
  thriving: {
    title: 'Thriving Altruism',
    subtitle: 'Harmonic Solarpunk · Flourishing Communal Bio-City',
    primaryColor: '#00ff95',
    glowColor: 'rgba(0, 255, 149, 0.35)',
    accentClass: 'text-[#00ff95] border-[#00ff95]/40 bg-[#00ff95]/10',
    imgUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1920&q=80',
    fallbackSeed: 'https://picsum.photos/seed/boonfest-thriving/1920/1080',
  },
};

export const SocietyBackground: React.FC<SocietyBackgroundProps> = ({
  hue,
  decayRate,
  boonPoints,
  lastAction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [actionPulse, setActionPulse] = useState<ActionImpact | null>(null);
  const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});

  // Determine society tier from hue
  const societyTier: SocietyStatus = useMemo(() => {
    if (hue <= 35) return 'critical';
    if (hue <= 75) return 'struggling';
    return 'thriving';
  }, [hue]);

  const preset = SOCIETY_PRESETS[societyTier];

  // Opacities for smooth 3-way crossfade
  const criticalOpacity = Math.max(0, Math.min(1, (38 - hue) / 20));
  const thrivingOpacity = Math.max(0, Math.min(1, (hue - 65) / 25));
  const strugglingOpacity = Math.max(0, 1 - criticalOpacity - thrivingOpacity);

  // Trigger visual action pulse whenever lastAction changes
  useEffect(() => {
    if (lastAction) {
      setActionPulse(lastAction);
      const timer = setTimeout(() => {
        setActionPulse(null);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // Ambient animated particles (embers for critical, dust for struggling, spores for thriving)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hue: number;
      life: number;
      maxLife: number;
    }

    const particleCount = 45;
    const particles: Particle[] = [];

    const createParticle = (isBurst = false, burstColorHue?: number): Particle => {
      const pTier = societyTier;
      let pColorHue = 150; // green default
      let vy = -0.4 - Math.random() * 0.8; // default upward

      if (pTier === 'critical') {
        pColorHue = 350 + Math.random() * 20; // crimson
        vy = 0.5 + Math.random() * 1.2; // falling embers
      } else if (pTier === 'struggling') {
        pColorHue = 35 + Math.random() * 25; // amber
        vy = -0.2 - Math.random() * 0.6; // slow rising industrial dust
      } else {
        pColorHue = 135 + Math.random() * 35; // emerald/gold spores
        vy = -0.6 - Math.random() * 1.0; // buoyant flourishing spores
      }

      if (isBurst && burstColorHue !== undefined) {
        pColorHue = burstColorHue;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        return {
          x: width / 2 + (Math.random() - 0.5) * 80,
          y: height / 2 + (Math.random() - 0.5) * 80,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 3.5,
          alpha: 0.85,
          hue: pColorHue,
          life: 0,
          maxLife: 60 + Math.random() * 40,
        };
      }

      return {
        x: Math.random() * width,
        y: pTier === 'critical' ? -10 : height + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.15 + Math.random() * 0.45,
        hue: pColorHue,
        life: 0,
        maxLife: 150 + Math.random() * 120,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      const p = createParticle();
      p.y = Math.random() * height; // initial distribution
      particles.push(p);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * Math.sin(progress * Math.PI);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${Math.max(0, currentAlpha)})`;
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 50%, 0.8)`;
        ctx.fill();

        if (p.life >= p.maxLife || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
          particles[i] = createParticle();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [societyTier]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* 1. Pre-generated Layer: Critical Dystopian City */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center"
        style={{
          opacity: criticalOpacity * 0.45,
          backgroundImage: `url(${imgErrors.critical ? SOCIETY_PRESETS.critical.fallbackSeed : SOCIETY_PRESETS.critical.imgUrl})`,
          filter: 'contrast(125%) brightness(65%) saturate(160%)',
        }}
      >
        <img
          src={imgErrors.critical ? SOCIETY_PRESETS.critical.fallbackSeed : SOCIETY_PRESETS.critical.imgUrl}
          alt="Critical Society"
          referrerPolicy="no-referrer"
          className="hidden"
          onError={() => setImgErrors((prev) => ({ ...prev, critical: true }))}
        />
      </div>

      {/* 2. Pre-generated Layer: Struggling Industrial Twilight City */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center"
        style={{
          opacity: strugglingOpacity * 0.4,
          backgroundImage: `url(${imgErrors.struggling ? SOCIETY_PRESETS.struggling.fallbackSeed : SOCIETY_PRESETS.struggling.imgUrl})`,
          filter: 'contrast(115%) brightness(60%) saturate(120%)',
        }}
      >
        <img
          src={imgErrors.struggling ? SOCIETY_PRESETS.struggling.fallbackSeed : SOCIETY_PRESETS.struggling.imgUrl}
          alt="Struggling Society"
          referrerPolicy="no-referrer"
          className="hidden"
          onError={() => setImgErrors((prev) => ({ ...prev, struggling: true }))}
        />
      </div>

      {/* 3. Pre-generated Layer: Thriving Solarpunk Bio-City */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center"
        style={{
          opacity: thrivingOpacity * 0.45,
          backgroundImage: `url(${imgErrors.thriving ? SOCIETY_PRESETS.thriving.fallbackSeed : SOCIETY_PRESETS.thriving.imgUrl})`,
          filter: 'contrast(120%) brightness(70%) saturate(140%)',
        }}
      >
        <img
          src={imgErrors.thriving ? SOCIETY_PRESETS.thriving.fallbackSeed : SOCIETY_PRESETS.thriving.imgUrl}
          alt="Thriving Society"
          referrerPolicy="no-referrer"
          className="hidden"
          onError={() => setImgErrors((prev) => ({ ...prev, thriving: true }))}
        />
      </div>

      {/* 4. Atmospheric Gradient Vignette (protects card legibility & passes WCAG AA contrast) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/75 to-[#0c0d10]/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#0c0d10]/50 to-[#0c0d10]/90" />

      {/* 5. Responsive Skyline Vector Silhouettes matching society status */}
      <div className="absolute bottom-0 left-0 right-0 h-44 opacity-25 flex items-end justify-between overflow-hidden">
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          className="w-full h-full text-current transition-colors duration-700"
          style={{ color: preset.primaryColor }}
        >
          {societyTier === 'critical' && (
            /* Jagged, broken spires, warning antennas */
            <path
              d="M0,200 L0,140 L40,140 L60,80 L80,140 L120,130 L150,50 L160,50 L170,140 L220,150 L250,70 L260,20 L270,70 L300,160 L380,140 L410,40 L440,160 L500,170 L540,60 L560,180 L620,130 L660,30 L690,140 L760,150 L800,75 L840,170 L900,120 L940,45 L970,160 L1040,130 L1080,70 L1120,160 L1200,140 L1200,200 Z"
              fill="currentColor"
            />
          )}
          {societyTier === 'struggling' && (
            /* Industrial skyline with cranes and blocky scaffolds */
            <path
              d="M0,200 L0,150 L50,150 L70,110 L100,110 L120,70 L170,70 L180,140 L220,140 L240,90 L280,90 L300,50 L340,50 L360,130 L420,130 L450,80 L490,80 L510,140 L580,140 L610,65 L660,65 L680,135 L740,135 L770,85 L820,85 L840,145 L900,145 L930,60 L980,60 L1010,130 L1080,130 L1120,95 L1160,150 L1200,150 L1200,200 Z"
              fill="currentColor"
            />
          )}
          {societyTier === 'thriving' && (
            /* Flowing curved bio-domes, terraces, solarpunk spires */
            <path
              d="M0,200 L0,160 Q40,130 80,160 Q130,90 180,160 L210,120 Q250,40 290,120 L320,150 Q380,80 440,150 L470,110 Q520,30 570,110 L610,145 Q670,75 730,145 L760,105 Q810,35 860,105 L900,140 Q960,70 1020,140 L1060,115 Q1110,50 1160,115 L1200,150 L1200,200 Z"
              fill="currentColor"
            />
          )}
        </svg>
      </div>

      {/* 6. Dynamic Action Reflection Ripples */}
      <AnimatePresence>
        {actionPulse && (
          <motion.div
            key={actionPulse.id}
            initial={{ opacity: 0.85, scale: 0.7 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            {actionPulse.category === 'boon' && (
              <div className="w-[85vw] h-[85vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle,_rgba(0,255,149,0.35)_0%,_rgba(0,255,149,0.1)_45%,_transparent_75%)] shadow-[0_0_120px_rgba(0,255,149,0.5)]" />
            )}
            {actionPulse.category === 'grow' && (
              <div className="w-[85vw] h-[85vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.35)_0%,_rgba(0,212,255,0.1)_45%,_transparent_75%)] shadow-[0_0_120px_rgba(0,212,255,0.5)]" />
            )}
            {actionPulse.category === 'earn' && (
              <div className="w-[85vw] h-[85vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle,_rgba(255,184,0,0.35)_0%,_rgba(255,184,0,0.1)_45%,_transparent_75%)] shadow-[0_0_120px_rgba(255,184,0,0.4)]" />
            )}
            {(actionPulse.category === 'sloth_trap' || actionPulse.category === 'phantom_default') && (
              <div className="w-[95vw] h-[95vw] max-w-[1000px] max-h-[1000px] rounded-full bg-[radial-gradient(circle,_rgba(255,59,92,0.45)_0%,_rgba(255,59,92,0.15)_50%,_transparent_80%)] shadow-[0_0_140px_rgba(255,59,92,0.6)]" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Action Flash / Horizon Burst Light */}
      <AnimatePresence>
        {actionPulse && (
          <motion.div
            key={`burst_${actionPulse.id}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor:
                actionPulse.category === 'boon'
                  ? 'rgba(0, 255, 149, 0.08)'
                  : actionPulse.category === 'grow'
                  ? 'rgba(0, 212, 255, 0.08)'
                  : actionPulse.category === 'earn'
                  ? 'rgba(255, 184, 0, 0.08)'
                  : 'rgba(255, 59, 92, 0.14)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 8. Ambient Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-60" />

      {/* 9. Subdued Society Status Pill (Displays society status directly in background) */}
      <div className="absolute top-16 right-4 sm:right-6 pointer-events-none flex flex-col items-end gap-1 opacity-75 hover:opacity-100 transition-opacity">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md shadow-lg ${preset.accentClass}`}>
          {societyTier === 'critical' && <Flame className="w-3 h-3 animate-pulse text-[#ff3b5c]" />}
          {societyTier === 'struggling' && <Building2 className="w-3 h-3 text-[#ffb800]" />}
          {societyTier === 'thriving' && <Leaf className="w-3 h-3 text-[#00ff95]" />}
          <span>{preset.title}</span>
        </div>
        <span className="text-[9px] font-mono text-[#8a8f98] text-right hidden sm:block">
          {preset.subtitle}
        </span>
      </div>

      {/* 10. Action Reflection Floating Feedback in Background */}
      <AnimatePresence>
        {actionPulse && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0c0d10]/85 border border-[#22242a] text-xs shadow-2xl backdrop-blur-md"
          >
            {actionPulse.category === 'boon' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#00ff95]" />
                <span className="font-bold text-[#00ff95]">Society Restored:</span>
                <span className="text-[#f0f2f5]">{actionPulse.label}</span>
              </>
            )}
            {actionPulse.category === 'grow' && (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span className="font-bold text-[#00d4ff]">Infrastructure Expanded:</span>
                <span className="text-[#f0f2f5]">{actionPulse.label}</span>
              </>
            )}
            {actionPulse.category === 'earn' && (
              <>
                <Activity className="w-3.5 h-3.5 text-[#ffb800]" />
                <span className="font-bold text-[#ffb800]">Commerce Stimulated:</span>
                <span className="text-[#f0f2f5]">{actionPulse.label}</span>
              </>
            )}
            {(actionPulse.category === 'sloth_trap' || actionPulse.category === 'phantom_default') && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff3b5c] animate-pulse" />
                <span className="font-bold text-[#ff3b5c]">Entropy Shockwave:</span>
                <span className="text-[#f0f2f5]">{actionPulse.label}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
