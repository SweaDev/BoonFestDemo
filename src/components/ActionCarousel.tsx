import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { CardPayload, PlayerAttributes } from '../types';
import { CardItem } from './CardItem';
import { sounds } from '../lib/sound';

interface ActionCarouselProps {
  cards: CardPayload[];
  focusedIndex: number;
  playerCredits: number;
  playerAttributes: PlayerAttributes;
  onFocusCard: (index: number) => void;
  onExecuteCard: (card: CardPayload) => void;
  isExecuting: boolean;
}

export const ActionCarousel: React.FC<ActionCarouselProps> = ({
  cards,
  focusedIndex,
  playerCredits,
  playerAttributes,
  onFocusCard,
  onExecuteCard,
  isExecuting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation: Left/Right arrows, Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if an input field is focused (e.g. registration modal)
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextIdx = Math.max(0, focusedIndex - 1);
        onFocusCard(nextIdx);
        sounds.playCardBrowse();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = Math.min(cards.length - 1, focusedIndex + 1);
        onFocusCard(nextIdx);
        sounds.playCardBrowse();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (cards[focusedIndex] && !isExecuting) {
          onExecuteCard(cards[focusedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, cards, isExecuting, onFocusCard, onExecuteCard]);

  // Smoothly center the focused card in the horizontal container
  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.children[focusedIndex] as HTMLElement;
      if (activeElement) {
        const container = containerRef.current;
        const offsetLeft = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, offsetLeft), behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  // Mouse wheel horizontal scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    if (containerRef.current) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        containerRef.current.scrollLeft += e.deltaX;
      } else {
        containerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handlePrev = () => {
    const nextIdx = Math.max(0, focusedIndex - 1);
    onFocusCard(nextIdx);
    sounds.playCardBrowse();
  };

  const handleNext = () => {
    const nextIdx = Math.min(cards.length - 1, focusedIndex + 1);
    onFocusCard(nextIdx);
    sounds.playCardBrowse();
  };

  const currentFocusedCard = cards[focusedIndex];

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-2 sm:py-3">
      {/* Action Carousel Navigation Controls */}
      <div className="w-full flex items-center justify-between px-4 mb-1 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={focusedIndex <= 0}
            className="p-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] disabled:opacity-30 disabled:cursor-not-allowed text-[#f0f2f5] transition cursor-pointer"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={focusedIndex >= cards.length - 1}
            className="p-1.5 rounded-lg border border-[#22242a] bg-[#1a1c22] hover:bg-[#252830] disabled:opacity-30 disabled:cursor-not-allowed text-[#f0f2f5] transition cursor-pointer"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[#8a8f98] font-semibold ml-1.5">
            Card {focusedIndex + 1} of {cards.length}
          </span>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131418] border border-[#22242a] text-[10px] text-[#8a8f98]">
          <span className="font-mono bg-[#1a1c22] border border-[#2c2f38] px-1 py-0.2 rounded text-[#f0f2f5]">←</span>
          <span className="font-mono bg-[#1a1c22] border border-[#2c2f38] px-1 py-0.2 rounded text-[#f0f2f5]">→</span>
          <span>Browse</span>
          <span className="text-[#525866]">•</span>
          <span className="font-mono bg-[#1a1c22] border border-[#2c2f38] px-1.5 py-0.2 rounded text-[#f0f2f5]">Space</span>
          <span>Enact</span>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="w-full flex items-center gap-4 overflow-x-auto py-5 px-6 no-scrollbar scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {cards.map((card, idx) => (
          <div key={card.id} className="snap-center">
            <CardItem
              card={card}
              isFocused={idx === focusedIndex}
              playerCredits={playerCredits}
              playerAttributes={playerAttributes}
              onSelect={() => onExecuteCard(card)}
              onHover={() => {
                if (focusedIndex !== idx) {
                  onFocusCard(idx);
                  sounds.playCardBrowse();
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Quick Enact Bar for active card */}
      {currentFocusedCard && (
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={() => onExecuteCard(currentFocusedCard)}
            disabled={isExecuting || playerCredits < currentFocusedCard.cost}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00ff95] hover:bg-[#33ffaa] text-[#0c0d10] font-extrabold text-xs shadow-[0_0_20px_rgba(0,255,149,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0c0d10]" />
            <span>Enact Selected: "{currentFocusedCard.title}"</span>
            <span className="font-mono opacity-80 font-bold">({currentFocusedCard.cost === 0 ? 'Free' : `${currentFocusedCard.cost} Cr`})</span>
          </button>
        </div>
      )}
    </div>
  );
};
