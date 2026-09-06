import React from 'react';
import {
  Hammer,
  Code,
  Sprout,
  Bike,
  Cpu,
  Briefcase,
  Compass,
  Brain,
  Activity,
  HeartHandshake,
  Sparkles,
  Shield,
  Flame,
  Leaf,
  Stethoscope,
  Droplets,
  Sun,
  Trees,
  Scale,
  Coins,
  Zap,
  Dices,
  Wine,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { CardPayload, PlayerAttributes } from '../types';

interface CardItemProps {
  card: CardPayload;
  isFocused: boolean;
  playerCredits: number;
  playerAttributes: PlayerAttributes;
  onSelect: () => void;
  onHover: () => void;
}

// Icon mapping dictionary
const ICON_MAP: Record<string, React.ElementType> = {
  Hammer,
  Code,
  Sprout,
  Bike,
  Cpu,
  Briefcase,
  Compass,
  Brain,
  Activity,
  HeartHandshake,
  Sparkles,
  Shield,
  Flame,
  Leaf,
  Stethoscope,
  Droplets,
  Sun,
  Trees,
  Scale,
  Coins,
  Zap,
  Dices,
  Wine,
};

export const CardItem: React.FC<CardItemProps> = ({
  card,
  isFocused,
  playerCredits,
  playerAttributes,
  onSelect,
  onHover,
}) => {
  const IconComponent = ICON_MAP[card.iconName] || Sparkles;

  // Check prerequisites
  const hasPrereqs = !card.prerequisites || (
    (!card.prerequisites.mind || playerAttributes.mind >= card.prerequisites.mind) &&
    (!card.prerequisites.body || playerAttributes.body >= card.prerequisites.body) &&
    (!card.prerequisites.spirit || playerAttributes.spirit >= card.prerequisites.spirit)
  );

  const canAfford = playerCredits >= card.cost;
  const isExecutable = hasPrereqs && canAfford;

  // Visual archetype styling based on category
  let categoryTheme = {
    badge: 'bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/30',
    border: 'border-[#22242a] hover:border-[#ffb800]/50',
    iconBg: 'bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/25',
    accent: 'text-[#ffb800]',
    pill: 'Earn • Capital',
  };

  if (card.category === 'grow') {
    categoryTheme = {
      badge: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30',
      border: 'border-[#22242a] hover:border-[#00d4ff]/50',
      iconBg: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/25',
      accent: 'text-[#00d4ff]',
      pill: 'Grow • Actualize',
    };
  } else if (card.category === 'boon') {
    categoryTheme = {
      badge: 'bg-[#00ff95]/10 text-[#00ff95] border-[#00ff95]/40',
      border: 'border-[#22242a] hover:border-[#00ff95]/60',
      iconBg: 'bg-[#00ff95]/10 text-[#00ff95] border-[#00ff95]/30',
      accent: 'text-[#00ff95]',
      pill: 'Boon • Altruism',
    };
  }

  return (
    <div
      onClick={() => {
        if (isExecutable) onSelect();
      }}
      onMouseEnter={onHover}
      className={`relative w-[280px] sm:w-[310px] shrink-0 select-none rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ease-out cursor-pointer ${
        isFocused
          ? 'scale-105 shadow-[0_16px_40px_rgba(0,0,0,0.85)] -translate-y-2 z-20 ' +
            (card.category === 'boon'
              ? 'border-[#00ff95] bg-[#151619] ring-1 ring-[#00ff95]/50 shadow-[0_0_30px_rgba(0,255,149,0.22)]'
              : card.category === 'grow'
              ? 'border-[#00d4ff] bg-[#151619] ring-1 ring-[#00d4ff]/50 shadow-[0_0_30px_rgba(0,212,255,0.22)]'
              : 'border-[#ffb800] bg-[#151619] ring-1 ring-[#ffb800]/50 shadow-[0_0_30px_rgba(255,184,0,0.22)]')
          : 'scale-95 opacity-85 hover:opacity-100 bg-[#131418] ' + categoryTheme.border
      } ${!isExecutable ? 'grayscale-[35%] opacity-55 cursor-not-allowed' : ''}`}
      style={{
        minHeight: '370px',
      }}
    >
      {/* Top Bar: Category Pill & Tier */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${categoryTheme.badge}`}>
            {categoryTheme.pill}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#8a8f98] font-bold">
            Tier {card.tier}
          </span>
        </div>

        {/* Artwork & Icon header */}
        <div className="flex items-center gap-3 mb-2.5">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center p-2.5 shrink-0 border ${categoryTheme.iconBg}`}>
            <IconComponent className="w-full h-full" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#f0f2f5] leading-snug tracking-tight font-sans">
              {card.title}
            </h3>
            <span className="text-xs font-mono font-semibold text-[#00ff95] block mt-0.5">
              {card.rewardDescription}
            </span>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="text-xs text-[#8a8f98] leading-relaxed mb-2.5">
          {card.description}
        </p>

        {/* Thematic Flavor Quote */}
        <div className="border-l-2 border-[#22242a] pl-2 py-0.5 mb-2.5">
          <p className="text-[11px] italic text-[#525866] leading-tight">
            "{card.flavor}"
          </p>
        </div>
      </div>

      {/* Footer: Cost & Prerequisite Checks */}
      <div className="pt-2.5 border-t border-[#22242a] flex flex-col gap-2">
        {/* Prerequisites notice if any */}
        {card.prerequisites && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#8a8f98]">
            <span className="font-semibold text-[#525866]">Prereqs:</span>
            {card.prerequisites.mind && (
              <span className={`px-1.5 py-0.2 rounded font-mono ${playerAttributes.mind >= card.prerequisites.mind ? 'text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/30' : 'text-[#ff3b5c] bg-[#ff3b5c]/10 border border-[#ff3b5c]/30'}`}>
                Mind {card.prerequisites.mind}
              </span>
            )}
            {card.prerequisites.body && (
              <span className={`px-1.5 py-0.2 rounded font-mono ${playerAttributes.body >= card.prerequisites.body ? 'text-[#ffb800] bg-[#ffb800]/10 border border-[#ffb800]/30' : 'text-[#ff3b5c] bg-[#ff3b5c]/10 border border-[#ff3b5c]/30'}`}>
                Body {card.prerequisites.body}
              </span>
            )}
            {card.prerequisites.spirit && (
              <span className={`px-1.5 py-0.2 rounded font-mono ${playerAttributes.spirit >= card.prerequisites.spirit ? 'text-[#a855f7] bg-[#a855f7]/10 border border-[#a855f7]/30' : 'text-[#ff3b5c] bg-[#ff3b5c]/10 border border-[#ff3b5c]/30'}`}>
                Spirit {card.prerequisites.spirit}
              </span>
            )}
          </div>
        )}

        {/* Cost & Execution CTA */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5">
            <Coins className={`w-3.5 h-3.5 ${canAfford ? 'text-[#ffb800]' : 'text-[#ff3b5c]'}`} />
            <span className="text-xs font-mono font-bold text-[#f0f2f5]">
              {card.cost === 0 ? 'Free' : `${card.cost} Cr`}
            </span>
          </div>

          <button
            disabled={!isExecutable}
            onClick={(e) => {
              e.stopPropagation();
              if (isExecutable) onSelect();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isExecutable
                ? 'bg-[#1a1c22] border border-[#22242a] text-[#525866] cursor-not-allowed'
                : isFocused
                ? (card.category === 'boon'
                    ? 'bg-[#00ff95] text-[#0c0d10] hover:bg-[#33ffaa] font-black shadow-[0_0_16px_rgba(0,255,149,0.35)]'
                    : card.category === 'grow'
                    ? 'bg-[#00d4ff] text-[#0c0d10] hover:bg-[#38bdf8] font-black shadow-[0_0_16px_rgba(0,212,255,0.35)]'
                    : 'bg-[#ffb800] text-[#0c0d10] hover:bg-[#ffd000] font-black shadow-[0_0_16px_rgba(255,184,0,0.35)]')
                : 'bg-[#1a1c22] border border-[#22242a] text-[#f0f2f5] hover:bg-[#252830]'
            }`}
          >
            {!hasPrereqs ? (
              <>
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </>
            ) : !canAfford ? (
              <span>Need {card.cost - playerCredits} Cr</span>
            ) : (
              <>
                <span>Enact</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
