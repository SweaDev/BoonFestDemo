import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CardPayload,
  ExecuteCardResult,
  GameOverResponse,
  PlayerAttributes,
  PlaytimeStats,
  ActivePhantomCredit,
  Trophy,
} from './types';
import { HeaderBar } from './components/HeaderBar';
import { ActionCarousel } from './components/ActionCarousel';
import { HueGlowBorder } from './components/HueGlowBorder';
import { CooldownLockoutModal } from './components/CooldownLockoutModal';
import { GameOverModal } from './components/GameOverModal';
import { TrophyCaseModal } from './components/TrophyCaseModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { SocietyBackground, ActionImpact } from './components/SocietyBackground';
import { sounds } from './lib/sound';
import { Sparkles, HeartHandshake, Shield, AlertTriangle } from 'lucide-react';

export default function App() {
  // Session & User State
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('boonfest_session_id') || '';
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('boonfest_username') || 'Guest';
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return !localStorage.getItem('boonfest_username');
  });

  // Gameplay State
  const [credits, setCredits] = useState(100);
  const [boonPoints, setBoonPoints] = useState(0);
  const [attributes, setAttributes] = useState<PlayerAttributes>({ mind: 1, body: 1, spirit: 1 });
  const [hue, setHue] = useState(95);
  const [redAlertSecondsRemaining, setRedAlertSecondsRemaining] = useState(8.0);
  const [decayRate, setDecayRate] = useState(0.18);
  const [effectiveDecayRate, setEffectiveDecayRate] = useState(0.18);
  const [paceMultiplier, setPaceMultiplier] = useState(1.0);
  const [runElapsedSeconds, setRunElapsedSeconds] = useState(0);
  const [activeCards, setActiveCards] = useState<CardPayload[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [activePhantoms, setActivePhantoms] = useState<ActivePhantomCredit[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastActionImpact, setLastActionImpact] = useState<ActionImpact | null>(null);

  // Anti-Sloth Pacing State
  const [playtimeStats, setPlaytimeStats] = useState<PlaytimeStats>({
    activeSecondsIn30m: 0,
    activeSecondsIn24h: 0,
    isLockedOut: false,
    lockoutRemainingSeconds: 0,
  });

  // Modals & UI Controls
  const [showProfile, setShowProfile] = useState(false);
  const [profileTargetUser, setProfileTargetUser] = useState(username);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameOverData, setGameOverData] = useState<GameOverResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  // Refs for tracking in intervals
  const isLockedOutRef = useRef(playtimeStats.isLockedOut);
  isLockedOutRef.current = playtimeStats.isLockedOut;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize Session
  const initSession = useCallback(async () => {
    try {
      const storedSess = localStorage.getItem('boonfest_session_id');
      const storedUser = localStorage.getItem('boonfest_username');
      const query = new URLSearchParams(window.location.search);
      const viewUser = query.get('user');

      if (viewUser) {
        setProfileTargetUser(viewUser);
        setShowProfile(true);
      }

      const url = `/api/session?sessionId=${encodeURIComponent(storedSess || '')}&username=${encodeURIComponent(
        storedUser || ''
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        localStorage.setItem('boonfest_session_id', data.sessionId);
        setUsername(data.username);
        setIsGuest(data.isGuest);
        setPlaytimeStats(data.pacing);

        if (data.gameState) {
          setCredits(data.gameState.credits);
          setBoonPoints(data.gameState.boonPoints);
          setAttributes(data.gameState.attributes);
          setHue(data.gameState.hue);
          setActivePhantoms(data.gameState.activePhantoms || []);
          setRedAlertSecondsRemaining(data.gameState.redAlertSecondsRemaining ?? 8.0);
          if (data.gameState.entropyDecayRate !== undefined) setDecayRate(data.gameState.entropyDecayRate);
          if (data.gameState.effectiveDecayRate !== undefined) setEffectiveDecayRate(data.gameState.effectiveDecayRate);
          if (data.gameState.paceMultiplier !== undefined) setPaceMultiplier(data.gameState.paceMultiplier);

          if (data.gameState.activeCards && data.gameState.activeCards.length > 0) {
            setActiveCards(data.gameState.activeCards);
          } else {
            // Draw cards
            drawCards(data.sessionId);
          }
        }
      }
    } catch (err) {
      console.error('Session initialization failed:', err);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Draw fresh cards helper
  const drawCards = async (currentSessionId: string) => {
    try {
      const res = await fetch(`/api/cards/draw?sessionId=${encodeURIComponent(currentSessionId)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCards(data.cards);
        setFocusedIndex(0);
      }
    } catch (err) {
      console.error('Failed to draw cards:', err);
    }
  };

  // 1-second Entropy Tick synchronization
  useEffect(() => {
    if (isGameOver || playtimeStats.isLockedOut) return;

    const tickInterval = setInterval(async () => {
      if (!sessionId || isGameOverRef.current || isLockedOutRef.current) return;

      try {
        const res = await fetch('/api/game/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, deltaSeconds: 1.0 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hue !== undefined) {
            setHue(data.hue);
            setRedAlertSecondsRemaining(data.redAlertSecondsRemaining);
            if (data.entropyDecayRate !== undefined) setDecayRate(data.entropyDecayRate);
            if (data.effectiveDecayRate !== undefined) setEffectiveDecayRate(data.effectiveDecayRate);
            if (data.paceMultiplier !== undefined) setPaceMultiplier(data.paceMultiplier);
            if (data.runElapsedSeconds !== undefined) setRunElapsedSeconds(data.runElapsedSeconds);

            // Warning sound if near red collapse
            if (data.hue <= 2 && data.redAlertSecondsRemaining <= 4.0) {
              sounds.playRedAlertWarning();
            }

            if (data.isGameOver && !isGameOverRef.current) {
              triggerGameOver();
            }
          }
        }
      } catch {}
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [sessionId, isGameOver, playtimeStats.isLockedOut]);

  // 5-second Playtime Heartbeat (Authoritative Server-side Anti-Sloth Pacing)
  useEffect(() => {
    const heartbeatInterval = setInterval(async () => {
      const isPlaying = !isGameOverRef.current && !isLockedOutRef.current;
      try {
        const res = await fetch('/api/playtime/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            username,
            secondsElapsed: isPlaying ? 5 : 0,
            isPlaying,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pacing) {
            setPlaytimeStats(data.pacing);
          }
        }
      } catch {}
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, [sessionId, username]);

  // Trigger Game Over handler
  const triggerGameOver = async () => {
    setIsGameOver(true);
    sounds.playSlothDissonance();

    try {
      const res = await fetch('/api/game/over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data: GameOverResponse = await res.json();
        setGameOverData(data);
      }
    } catch (err) {
      console.error('Failed to resolve Game Over:', err);
    }
  };

  // Execute Card action
  const handleExecuteCard = async (card: CardPayload) => {
    if (isExecuting || isGameOver || playtimeStats.isLockedOut) return;
    setIsExecuting(true);

    try {
      const res = await fetch('/api/cards/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, cardId: card.id }),
      });

      if (res.ok) {
        const result: ExecuteCardResult = await res.json();

        // Update local game state
        setCredits(result.newGameState.credits);
        setBoonPoints(result.newGameState.boonPoints);
        setAttributes(result.newGameState.attributes);
        setHue(result.newGameState.hue);
        setActiveCards(result.newGameState.activeCards);
        setActivePhantoms(result.newGameState.activePhantoms || []);
        if (result.newGameState.entropyDecayRate !== undefined) setDecayRate(result.newGameState.entropyDecayRate);
        if (result.newGameState.effectiveDecayRate !== undefined) setEffectiveDecayRate(result.newGameState.effectiveDecayRate);
        if (result.newGameState.paceMultiplier !== undefined) setPaceMultiplier(result.newGameState.paceMultiplier);
        setFocusedIndex(0);

        // Set action impact for background reflection
        const category = result.type === 'sloth_trap'
          ? 'sloth_trap'
          : result.type === 'phantom_default'
          ? 'phantom_default'
          : card.category;

        setLastActionImpact({
          id: Date.now(),
          category,
          label: card.title,
          timestamp: Date.now(),
        });

        // Sound cues & notifications
        if (result.type === 'sloth_trap') {
          sounds.playSlothDissonance();
          addToast('sloth_trap', result.message);
        } else if (result.type === 'phantom_default') {
          sounds.playSlothDissonance();
          addToast('phantom_default', result.message);
        } else {
          if (card.category === 'boon') {
            sounds.playBoonGranted();
          } else if (card.category === 'grow') {
            sounds.playGrowUpgrade();
          } else {
            sounds.playEarnSuccess();
          }
          addToast('success', result.message);
        }
      } else {
        const err = await res.json();
        if (err.activeCards && err.activeCards.length > 0) {
          setActiveCards(err.activeCards);
          setFocusedIndex(0);
        }
        addToast('error', err.error || 'Execution failed.');
      }
    } catch (err) {
      addToast('error', 'Network error executing action.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Start New Run
  const handleStartNewRun = async () => {
    try {
      const res = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, username, isGuest }),
      });

      if (res.ok) {
        const data = await res.json();
        setCredits(data.gameState.credits);
        setBoonPoints(data.gameState.boonPoints);
        setAttributes(data.gameState.attributes);
        setHue(data.gameState.hue);
        setActiveCards(data.gameState.activeCards);
        setActivePhantoms([]);
        setRedAlertSecondsRemaining(data.gameState.redAlertSecondsRemaining ?? 8.0);
        setDecayRate(data.gameState.entropyDecayRate ?? 0.18);
        setEffectiveDecayRate(data.gameState.effectiveDecayRate ?? 0.18);
        setPaceMultiplier(data.gameState.paceMultiplier ?? 1.0);
        setRunElapsedSeconds(0);
        setIsGameOver(false);
        setGameOverData(null);
        setFocusedIndex(0);
        addToast('info', 'New run started! Balance capital, self-growth, and societal welfare.');
      } else {
        const err = await res.json();
        if (err.requiresRegistration) {
          setShowProfile(true);
        }
        addToast('error', err.error || 'Cannot start run.');
      }
    } catch {
      addToast('error', 'Network failure starting run.');
    }
  };

  // Register account (Account Conversion)
  const handleRegisterAccount = async (newUsername: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsername(data.user.username);
        setIsGuest(false);
        localStorage.setItem('boonfest_username', data.user.username);
        addToast('success', `Welcome @${data.user.username}! Your permanent profile is active.`);
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed.');
      }
    } catch (err: unknown) {
      addToast('error', (err as Error)?.message || 'Registration failed.');
      return false;
    }
  };

  // Claim guest Top 10 trophy & register
  const handleClaimGuestTrophy = async (newUsername: string): Promise<Trophy | undefined> => {
    if (!gameOverData) return undefined;
    try {
      const res = await fetch('/api/game/claim-guest-trophy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          username: newUsername,
          telemetry: gameOverData.telemetry,
          postMortem: gameOverData.postMortem,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
        setIsGuest(false);
        localStorage.setItem('boonfest_username', data.username);
        addToast('success', `Trophy minted for @${data.username}! Saved to the Global Leaderboard.`);
        return data.trophy;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to claim trophy.');
      }
    } catch (err: unknown) {
      addToast('error', (err as Error)?.message || 'Failed to claim trophy.');
      return undefined;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsername('Guest');
        setIsGuest(true);
        localStorage.removeItem('boonfest_username');
        if (data.pacing) {
          setPlaytimeStats(data.pacing);
        }
        addToast('info', 'Logged out successfully. You are now playing as Guest.');
      }
    } catch {
      addToast('error', 'Logout request failed.');
    }
  };

  // Login handler supporting password for dev user
  const handleLogin = async (targetUser: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password, sessionId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsername(data.user.username);
        setIsGuest(data.user.username.toLowerCase() === 'guest');
        setPlaytimeStats(data.pacing);
        localStorage.setItem('boonfest_username', data.user.username);
        addToast('success', `Logged in as @${data.user.username}.`);
        return true;
      } else {
        addToast('error', data.error || 'Login failed.');
        return false;
      }
    } catch {
      addToast('error', 'Login error.');
      return false;
    }
  };

  // Switch or Login existing user
  const handleSwitchUser = async (targetUser: string): Promise<boolean> => {
    return handleLogin(targetUser);
  };

  const clampedHue = Math.max(0, Math.min(120, hue));

  return (
    <div className="relative min-h-screen w-full bg-[#0c0d10] text-[#f0f2f5] flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Dynamic Pre-Generated Society Background (Critical / Struggling / Thriving) with Action Reflections */}
      <SocietyBackground
        hue={hue}
        decayRate={effectiveDecayRate}
        boonPoints={boonPoints}
        lastAction={lastActionImpact}
      />

      {/* Full-Screen Dynamic Hue Glow Border */}
      <HueGlowBorder hue={hue} redAlertSecondsRemaining={redAlertSecondsRemaining} />

      {/* Top Header Bar */}
      <HeaderBar
        username={username}
        isGuest={isGuest}
        credits={credits}
        boonPoints={boonPoints}
        attributes={attributes}
        hue={hue}
        playtimeStats={playtimeStats}
        activePhantoms={activePhantoms}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sounds.toggleMute())}
        onOpenProfile={() => {
          setProfileTargetUser(username);
          setShowProfile(true);
        }}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenRules={() => setShowRules(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 z-10">
        {/* World Equilibrium Core HUD */}
        <div className="flex flex-col items-center text-center mb-2">
          <div className="relative flex items-center justify-center mb-1">
            {/* Ambient Radial Core */}
            <div
              className="w-20 h-20 rounded-full transition-all duration-500 flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, hsla(${clampedHue}, 85%, 50%, 0.22) 0%, transparent 70%)`,
                boxShadow: `0 0 30px hsla(${clampedHue}, 85%, 50%, 0.3)`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-500 shadow-md border border-white/20"
                style={{
                  backgroundColor: `hsl(${clampedHue}, 85%, 45%)`,
                }}
              >
                {clampedHue > 80 ? (
                  <HeartHandshake className="w-4 h-4 text-[#0c0d10]" />
                ) : clampedHue < 35 ? (
                  <AlertTriangle className="w-4 h-4 text-[#0c0d10] animate-pulse" />
                ) : (
                  <Shield className="w-4 h-4 text-[#0c0d10]" />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8f98]">
              World Survival State
            </span>
            <span
              className="font-mono text-xs font-black px-2 py-0.5 rounded-md border"
              style={{
                color: `hsl(${clampedHue}, 90%, 65%)`,
                borderColor: `hsla(${clampedHue}, 90%, 55%, 0.4)`,
                backgroundColor: `#131418`,
              }}
            >
              {Math.round(clampedHue)}° / 120° HSL
            </span>

            {/* Dynamic Progressive Pace Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold transition-colors ${
                paceMultiplier <= 1.3
                  ? 'border-[#00ff95]/40 bg-[#00ff95]/10 text-[#00ff95]'
                  : paceMultiplier <= 2.3
                  ? 'border-[#ffb800]/40 bg-[#ffb800]/10 text-[#ffb800]'
                  : 'border-[#ff3b5c]/50 bg-[#ff3b5c]/15 text-[#ff3b5c] animate-pulse'
              }`}
              title="Entropy Pace: Begins calm & gentle at 1.0x (0.18°/s) and accelerates progressively as time passes. Upgrade Body to dampen effective decay by 18% per level."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>
                Pace {paceMultiplier.toFixed(1)}x ({paceMultiplier <= 1.3 ? 'Gentle' : paceMultiplier <= 2.3 ? 'Accelerating' : 'Surging'})
              </span>
              <span className="opacity-75 text-[10px]">
                (-{effectiveDecayRate.toFixed(2)}°/s)
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#525866] max-w-sm mt-1">
            Starts slow and speeds up over time. Enact societal Boons to recover toward 120° emerald flourishing.
          </span>
        </div>

        {/* Action Carousel of choices */}
        <ActionCarousel
          cards={activeCards}
          focusedIndex={focusedIndex}
          playerCredits={credits}
          playerAttributes={attributes}
          onFocusCard={(idx) => setFocusedIndex(idx)}
          onExecuteCard={handleExecuteCard}
          isExecuting={isExecuting}
        />
      </main>

      {/* Bottom Status & Guidance Footer */}
      <footer className="w-full border-t border-[#22242a] bg-[#151619]/95 py-2 px-4 text-center z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8a8f98]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#ffb800]" />
            <span>
              Pro-Social Tip: Discern genuine mutual aid from predatory get-rich traps and substance shortcuts.
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[#525866] font-mono text-[10px]">
            <span>Mind Lvl {attributes.mind} (+{ (attributes.mind - 1) * 18 }% Yield)</span>
            <span>•</span>
            <span>Body Lvl {attributes.body} (Entropy Dampened)</span>
            <span>•</span>
            <span>Spirit Lvl {attributes.spirit} (+{ (attributes.spirit - 1) * 25 }% Boon Pts)</span>
          </div>
        </div>
      </footer>

      {/* Strict Anti-Sloth Pacing Modal (Lockout screen) */}
      {playtimeStats.isLockedOut && (
        <CooldownLockoutModal
          remainingSeconds={playtimeStats.lockoutRemainingSeconds}
          reason={playtimeStats.lockoutReason}
          username={username}
          isGuest={isGuest}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
          onCheckStatus={async () => {
            const res = await fetch(`/api/playtime/heartbeat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, username, secondsElapsed: 0, isPlaying: false }),
            });
            if (res.ok) {
              const data = await res.json();
              setPlaytimeStats(data.pacing);
            }
          }}
        />
      )}

      {/* Game Over Screen */}
      {isGameOver && gameOverData && (
        <GameOverModal
          gameOverData={gameOverData}
          currentUsername={username}
          isGuest={isGuest}
          onStartNewRun={handleStartNewRun}
          onRegisterAccount={handleRegisterAccount}
          onClaimGuestTrophy={handleClaimGuestTrophy}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenProfile={() => {
            setProfileTargetUser(username);
            setShowProfile(true);
          }}
          onOpenRules={() => setShowRules(true)}
          onToggleMute={() => setIsMuted(sounds.toggleMute())}
          isMuted={isMuted}
        />
      )}

      {/* User Profile & Permanent Trophy Case Modal */}
      {showProfile && (
        <TrophyCaseModal
          username={profileTargetUser}
          isGuest={isGuest && profileTargetUser === username}
          onClose={() => setShowProfile(false)}
          onSwitchUser={handleSwitchUser}
        />
      )}

      {/* Global Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          onSelectUser={(u) => {
            setProfileTargetUser(u);
            setShowLeaderboard(false);
            setShowProfile(true);
          }}
        />
      )}

      {/* Game Rules / Codex Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Settings & Dev Management Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUsername={username}
        isGuest={isGuest}
        pacing={playtimeStats}
        onLogout={handleLogout}
        onLogin={handleLogin}
        onAddToast={addToast}
      />

      {/* Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
