import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { generateAIPostMortem, generateDynamicSlothCard, generateTrophyArtifact } from './server/ai';
import { BASE_BOON_CARDS, BASE_EARN_CARDS, BASE_GROW_CARDS } from './server/data/cardPool';
import { storage } from './server/storage';
import {
  ActivePhantomCredit,
  CardPayload,
  ExecuteCardResult,
  GameOverResponse,
  GameSessionState,
  HiddenSlothData,
  PlayerAttributes,
  RunTelemetry,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory active game sessions
const activeSessions: Record<string, GameSessionState> = {};

function createNewGameSession(sessionId: string, username: string, isGuest: boolean, gameCount = 1): GameSessionState {
  const state: GameSessionState = {
    sessionId,
    username,
    isGuest,
    credits: 100,
    boonPoints: 0,
    attributes: { mind: 1, body: 1, spirit: 1 },
    hue: 60, // Starts at Yellow (60°)
    entropyDecayRate: 0.9, // Degrees per second baseline
    redAlertSecondsRemaining: 5.0,
    activeCards: [],
    hiddenCards: {},
    activePhantoms: [],
    slothTrapsTriggered: [],
    runStartTime: Date.now(),
    totalRunPlaySeconds: 0,
    isGameOver: false,
    isPaused: false,
    gameCount,
  };
  // Pre-generate active cards immediately so sessions always have valid cards
  drawHandForSession(state);
  activeSessions[sessionId] = state;
  return state;
}

// Helper to assemble a deck with Earn, Grow, Boon, and a deceptive Sloth card (instant execution)
function drawHandForSession(session: GameSessionState): CardPayload[] {
  const { attributes, credits } = session;

  // Filter accessible Earn cards (match prereqs or 1 aspirational)
  const earnPool = BASE_EARN_CARDS.filter(c => {
    if (!c.prerequisites) return true;
    const mindOk = !c.prerequisites.mind || attributes.mind >= c.prerequisites.mind;
    const bodyOk = !c.prerequisites.body || attributes.body >= c.prerequisites.body;
    const spiritOk = !c.prerequisites.spirit || attributes.spirit >= c.prerequisites.spirit;
    return mindOk && bodyOk && spiritOk;
  });
  const earnSample = earnPool.sort(() => 0.5 - Math.random()).slice(0, 2);

  // Filter Grow cards
  const growPool = BASE_GROW_CARDS.filter(c => {
    if (!c.prerequisites) return true;
    const mindOk = !c.prerequisites.mind || attributes.mind >= c.prerequisites.mind;
    const bodyOk = !c.prerequisites.body || attributes.body >= c.prerequisites.body;
    const spiritOk = !c.prerequisites.spirit || attributes.spirit >= c.prerequisites.spirit;
    return mindOk && bodyOk && spiritOk;
  });
  const growSample = growPool.sort(() => 0.5 - Math.random()).slice(0, 2);

  // Filter Boon cards
  const boonSample = BASE_BOON_CARDS.sort(() => 0.5 - Math.random()).slice(0, 2);

  // Instant deceptive Sloth card (with background generative buffer refill)
  const { card: slothCard, hidden: slothHidden } = generateDynamicSlothCard
    ? (generateDynamicSlothCard as any)(credits, attributes.mind)
    : { card: null, hidden: null };

  if (slothCard && slothHidden) {
    session.hiddenCards[slothCard.id] = slothHidden;
  }

  // Combine and shuffle
  const slothList = slothCard ? [slothCard] : [];
  const fullHand = [...earnSample, ...growSample, ...boonSample, ...slothList].sort(() => 0.5 - Math.random());
  session.activeCards = fullHand;
  return fullHand;
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Session initialization / resume
app.get('/api/session', (req, res) => {
  const querySessionId = req.query.sessionId as string;
  const queryUsername = req.query.username as string;

  let sessionId = querySessionId;
  let isGuest = true;
  let username = 'Guest';

  if (queryUsername && queryUsername.trim()) {
    username = queryUsername.trim();
    isGuest = false;
  }

  if (!sessionId || !activeSessions[sessionId]) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    createNewGameSession(sessionId, username, isGuest);
  }

  const pacing = storage.checkPacing(username);
  const session = activeSessions[sessionId];

  res.json({
    sessionId,
    username: session.username,
    isGuest: session.isGuest,
    firstRunFinished: session.gameCount > 1,
    pacing,
    gameState: {
      credits: session.credits,
      boonPoints: session.boonPoints,
      attributes: session.attributes,
      hue: session.hue,
      activeCards: session.activeCards,
      isGameOver: session.isGameOver,
      isPaused: session.isPaused,
      redAlertSecondsRemaining: session.redAlertSecondsRemaining,
      activePhantoms: session.activePhantoms,
    },
  });
});

// Authentication / Account Registration (Account Conversion)
app.post('/api/auth/register', (req, res) => {
  const { username, sessionId } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  const cleanName = username.trim();
  const existing = storage.getUser(cleanName);
  if (existing) {
    return res.status(409).json({ error: 'Username already registered. Please choose another unique name.' });
  }

  const user = storage.registerUser(cleanName);

  // Link active session to newly created account
  if (sessionId && activeSessions[sessionId]) {
    activeSessions[sessionId].username = cleanName;
    activeSessions[sessionId].isGuest = false;
  }

  const pacing = storage.checkPacing(cleanName);
  res.json({ success: true, user, pacing });
});

// Authentication / Login with existing username
app.post('/api/auth/login', (req, res) => {
  const { username, sessionId } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  const cleanName = username.trim();
  let user = storage.getUser(cleanName);
  if (!user) {
    // Automatically register if not present for seamless onboarding
    user = storage.registerUser(cleanName);
  }

  if (sessionId && activeSessions[sessionId]) {
    activeSessions[sessionId].username = cleanName;
    activeSessions[sessionId].isGuest = false;
  }

  const pacing = storage.checkPacing(cleanName);
  res.json({ success: true, user, pacing });
});

// Playtime heartbeat (Server-side Anti-Sloth Pacing enforcement)
app.post('/api/playtime/heartbeat', (req, res) => {
  const { sessionId, username, secondsElapsed, isPlaying } = req.body;
  const cleanUser = username || 'Guest';

  // Only log if the user was actively playing
  let pacing = storage.checkPacing(cleanUser);
  if (isPlaying && secondsElapsed > 0) {
    pacing = storage.recordPlaytime(cleanUser, secondsElapsed);
  }

  // Update session elapsed time
  if (sessionId && activeSessions[sessionId]) {
    const session = activeSessions[sessionId];
    session.totalRunPlaySeconds += secondsElapsed;

    // Process phantom credit timeouts
    const now = Date.now();
    const expiredPhantoms = session.activePhantoms.filter(p => p.expiresAt <= now);
    if (expiredPhantoms.length > 0) {
      for (const ep of expiredPhantoms) {
        session.credits = Math.max(0, session.credits - ep.amount);
      }
      session.activePhantoms = session.activePhantoms.filter(p => p.expiresAt > now);
    }
  }

  res.json({ pacing });
});

// Start a new game run
app.post('/api/game/new', async (req, res) => {
  const { sessionId, username, isGuest } = req.body;
  const cleanUser = username || 'Guest';

  const pacing = storage.checkPacing(cleanUser);
  if (pacing.isLockedOut) {
    return res.status(403).json({
      error: 'Playtime lockout active. Take a mindful break.',
      pacing,
    });
  }

  const previousSession = sessionId ? activeSessions[sessionId] : null;
  const gameCount = previousSession ? previousSession.gameCount + 1 : 1;

  // If user is guest and already finished their first game, they MUST register
  if (isGuest && gameCount > 1) {
    return res.status(403).json({
      error: 'Guest session expired. Please create a unique username to continue your altruistic journey.',
      requiresRegistration: true,
    });
  }

  const targetSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const session = createNewGameSession(targetSessionId, cleanUser, isGuest, gameCount);

  // Draw initial hand of cards
  const cards = drawHandForSession(session);

  res.json({
    sessionId: targetSessionId,
    gameState: {
      credits: session.credits,
      boonPoints: session.boonPoints,
      attributes: session.attributes,
      hue: session.hue,
      activeCards: cards,
      isGameOver: false,
      isPaused: false,
      redAlertSecondsRemaining: 5.0,
      activePhantoms: [],
    },
    pacing,
  });
});

// Draw a fresh hand of cards
app.get('/api/cards/draw', (req, res) => {
  const sessionId = req.query.sessionId as string;
  let session = sessionId ? activeSessions[sessionId] : null;
  if (!session) {
    const fallbackId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    session = createNewGameSession(fallbackId, 'Guest', true);
  }

  const cards = drawHandForSession(session);
  res.json({ cards });
});

// Execute a card choice
app.post('/api/cards/execute', async (req, res) => {
  const { sessionId, cardId } = req.body;
  let session = sessionId ? activeSessions[sessionId] : null;
  if (!session) {
    // Auto-heal session if server restarted or session was wiped
    const fallbackId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    session = createNewGameSession(fallbackId, 'Guest', true);
  }

  if (session.isGameOver) {
    return res.status(400).json({ error: 'Game is already over.' });
  }

  let card = session.activeCards.find(c => c.id === cardId);
  if (!card) {
    // Fallback search across all known pools in case of hand desynchronization
    const allPool = [...BASE_EARN_CARDS, ...BASE_GROW_CARDS, ...BASE_BOON_CARDS];
    const foundCard = allPool.find(c => c.id === cardId);
    if (foundCard) {
      card = foundCard;
    } else {
      return res.status(400).json({
        error: 'Selected card is not available in current hand.',
        activeCards: session.activeCards,
      });
    }
  }

  // Check upfront cost
  if (session.credits < card.cost) {
    return res.status(400).json({ error: 'Insufficient credits to perform this action.' });
  }

  // Check prerequisites
  if (card.prerequisites) {
    const { mind = 0, body = 0, spirit = 0 } = card.prerequisites;
    if (session.attributes.mind < mind || session.attributes.body < body || session.attributes.spirit < spirit) {
      return res.status(400).json({ error: 'Prerequisites not met for this card.' });
    }
  }

  // Deduct cost
  session.credits -= card.cost;

  // Check if phantom credits were used (Phantom fraud detection)
  const now = Date.now();
  const totalPhantom = session.activePhantoms.reduce((sum, p) => sum + p.amount, 0);
  const trueCredits = Math.max(0, session.credits - totalPhantom);

  // Check if this was a disguised Sloth trap!
  const hiddenData = session.hiddenCards[card.id];
  let executeResult: ExecuteCardResult;

  if (hiddenData && hiddenData.isSloth && hiddenData.penalty) {
    const { penalty } = hiddenData;
    session.slothTrapsTriggered.push(penalty.archetype);

    // Initial illusory payout / phantom surge
    const phantomAmount = penalty.phantomCredits || 300;
    const phantomDuration = penalty.phantomDurationSec || 7;

    session.credits += phantomAmount;
    session.activePhantoms.push({
      id: `phantom_${Date.now()}`,
      amount: phantomAmount,
      expiresAt: now + phantomDuration * 1000,
      sourceTitle: card.title,
    });

    // Hidden Sloth Penalties:
    // 1. Entropy acceleration
    session.entropyDecayRate = Math.min(3.5, session.entropyDecayRate * penalty.entropyRateMultiplier);
    // 2. Entropy immediate red spike
    session.hue = Math.max(0, session.hue - penalty.entropySpike);
    // 3. Attribute degradation
    if (penalty.attributeDrop) {
      const { pillar, amount } = penalty.attributeDrop;
      session.attributes[pillar] = Math.max(1, session.attributes[pillar] - amount);
    }

    executeResult = {
      success: true,
      type: 'sloth_trap',
      message: `Surge received: +${phantomAmount} credits! But an ominous crimson haze grips your conscience...`,
      creditsDelta: phantomAmount - card.cost,
      boonPointsDelta: 0,
      attributeChanges: penalty.attributeDrop ? { [penalty.attributeDrop.pillar]: session.attributes[penalty.attributeDrop.pillar] } : undefined,
      hueDelta: -penalty.entropySpike,
      newGameState: {
        credits: session.credits,
        boonPoints: session.boonPoints,
        attributes: session.attributes,
        hue: session.hue,
        activeCards: [],
        activePhantoms: session.activePhantoms,
      },
    };
  } else {
    // Legitimate Card execution:
    // Check phantom spending resolution:
    // "If a player spends phantom credits on a Boon or Grow action before they expire,
    // the transaction is marked as defaulted: the purchase is revoked, the attribute/Boon gain is canceled,
    // and entropy spikes immediately as a consequence of the fraud."
    const isFundedByPhantom = card.cost > trueCredits;

    if (isFundedByPhantom && (card.category === 'boon' || card.category === 'grow')) {
      // Default Fraud triggered!
      session.hue = Math.max(0, session.hue - 30); // Spike entropy
      session.entropyDecayRate = Math.min(4.0, session.entropyDecayRate * 1.3);

      executeResult = {
        success: false,
        type: 'phantom_default',
        message: 'TRANSACTION DEFAULT: Hollow counterfeit credits detected! The purchase was revoked and external entropy spiked violently.',
        creditsDelta: -card.cost,
        boonPointsDelta: 0,
        hueDelta: -30,
        newGameState: {
          credits: session.credits,
          boonPoints: session.boonPoints,
          attributes: session.attributes,
          hue: session.hue,
          activeCards: [],
          activePhantoms: session.activePhantoms,
        },
      };
    } else {
      let creditsDelta = -card.cost;
      let boonPointsDelta = 0;
      let hueDelta = 0;

      if (card.category === 'earn') {
        // Boosted by Mind (+15% per Mind level above 1)
        const mindMultiplier = 1 + (session.attributes.mind - 1) * 0.18;
        const yieldAmount = Math.round((card.creditYield || 50) * mindMultiplier);
        session.credits += yieldAmount;
        creditsDelta += yieldAmount;
      } else if (card.category === 'grow') {
        if (card.targetPillar) {
          session.attributes[card.targetPillar] += 1;
        }
      } else if (card.category === 'boon') {
        // Boosted by Spirit (+25% score multiplier, +20% hue recovery per Spirit level above 1)
        const spiritMultiplier = 1 + (session.attributes.spirit - 1) * 0.25;
        const hueMultiplier = 1 + (session.attributes.spirit - 1) * 0.2;

        boonPointsDelta = Math.round((card.boonPoints || 100) * spiritMultiplier);
        hueDelta = Math.round((card.hueRecovery || 20) * hueMultiplier);

        session.boonPoints += boonPointsDelta;
        session.hue = Math.min(120, session.hue + hueDelta);
        // Boons also restore red alert buffer
        session.redAlertSecondsRemaining = 5.0;
      }

      executeResult = {
        success: true,
        type: 'success',
        message: card.category === 'boon'
          ? `Boon enacted! +${boonPointsDelta} Boon Points, World Hue +${hueDelta}°.`
          : card.category === 'grow'
          ? `Self-Actualization upgraded! ${card.targetPillar ? card.targetPillar.toUpperCase() : 'Attribute'} level is now ${card.targetPillar ? session.attributes[card.targetPillar] : 2}.`
          : `Labor completed: +${creditsDelta} net credits generated.`,
        creditsDelta,
        boonPointsDelta,
        hueDelta,
        newGameState: {
          credits: session.credits,
          boonPoints: session.boonPoints,
          attributes: session.attributes,
          hue: session.hue,
          activeCards: [],
          activePhantoms: session.activePhantoms,
        },
      };
    }
  }

  // Draw fresh cards for next turn
  const freshCards = drawHandForSession(session);
  executeResult.newGameState.activeCards = freshCards;

  res.json(executeResult);
});

// Update entropy / client tick synchronization
app.post('/api/game/tick', (req, res) => {
  const { sessionId, deltaSeconds } = req.body;
  const session = activeSessions[sessionId];
  if (!session || session.isGameOver || session.isPaused) {
    return res.json({ success: false });
  }

  const dt = Math.min(deltaSeconds || 1.0, 3.0);

  // Body slows baseline entropy acceleration (decay rate is reduced by 18% per body level above 1)
  const bodyDampener = Math.pow(0.82, session.attributes.body - 1);
  const effectiveDecayRate = session.entropyDecayRate * bodyDampener;

  // Slowly shift hue toward 0° (Crimson Red)
  session.hue = Math.max(0, session.hue - effectiveDecayRate * dt);

  // Red Alert condition:
  // "If the border reaches 100% pure Red and remains uncorrected for 5 continuous seconds, the run terminates immediately in a Game Over."
  let isGameOverNow = false;
  if (session.hue <= 0.05) {
    session.hue = 0;
    session.redAlertSecondsRemaining = Math.max(0, session.redAlertSecondsRemaining - dt);
    if (session.redAlertSecondsRemaining <= 0) {
      session.isGameOver = true;
      isGameOverNow = true;
    }
  } else {
    // Recover red alert timer back to 5.0s when hue > 0°
    session.redAlertSecondsRemaining = Math.min(5.0, session.redAlertSecondsRemaining + dt * 0.5);
  }

  res.json({
    hue: session.hue,
    redAlertSecondsRemaining: session.redAlertSecondsRemaining,
    isGameOver: isGameOverNow,
  });
});

// Game Over & Telemetry processing (Post-Mortem & Trophy Pipeline)
app.post('/api/game/over', async (req, res) => {
  const { sessionId } = req.body;
  const session = activeSessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  session.isGameOver = true;

  const telemetry: RunTelemetry = {
    runId: `run_${Date.now()}`,
    username: session.username,
    isGuest: session.isGuest,
    durationSeconds: session.totalRunPlaySeconds || Math.round((Date.now() - session.runStartTime) / 1000),
    credits: session.credits,
    boonPoints: session.boonPoints,
    mind: session.attributes.mind,
    body: session.attributes.body,
    spirit: session.attributes.spirit,
    slothTrapsTriggered: session.slothTrapsTriggered,
    entropyAtEnd: session.hue,
    date: new Date().toISOString().split('T')[0],
  };

  // Generate AI Post-Mortem & Coaching (Gemini Flash)
  const postMortem = await generateAIPostMortem(telemetry);

  // Check Top-10 Leaderboard ranking
  const { isTop10, rank } = storage.isTop10Score(telemetry.boonPoints);

  // Guest Top-10 Exception:
  // "If a guest's first run achieves a Top-10 score on the global leaderboard,
  // the game must pause on the game-over screen and require username registration immediately
  // to mint their trophy and save their score to the leaderboard."
  const requiresRegistration = session.isGuest && (isTop10 || session.gameCount >= 1);

  let trophy = undefined;

  // If score qualifies for Top 10 and player has a registered username, mint trophy artifact!
  if (isTop10 && !session.isGuest) {
    trophy = await generateTrophyArtifact(rank, session.username, telemetry.boonPoints, postMortem.archetypeName);

    storage.addRun(session.username, telemetry, trophy);
    storage.insertLeaderboardEntry({
      id: `lead_${Date.now()}`,
      username: session.username,
      score: telemetry.boonPoints,
      runDurationSeconds: telemetry.durationSeconds,
      date: telemetry.date,
      trophyImageUrl: trophy.imageUrl,
      behaviorArchetype: postMortem.archetypeName,
      boonCount: Math.floor(telemetry.boonPoints / 120),
      mind: telemetry.mind,
      body: telemetry.body,
      spirit: telemetry.spirit,
    });
  } else if (!session.isGuest) {
    storage.addRun(session.username, telemetry);
  }

  const response: GameOverResponse = {
    isTop10,
    rank: isTop10 ? rank : undefined,
    postMortem,
    trophy,
    requiresRegistration,
    telemetry,
  };

  res.json(response);
});

// Finalize Guest Top 10 registration and mint trophy
app.post('/api/game/claim-guest-trophy', async (req, res) => {
  const { sessionId, username, telemetry, postMortem } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Valid username required.' });
  }

  const cleanName = username.trim();
  storage.registerUser(cleanName);

  if (sessionId && activeSessions[sessionId]) {
    activeSessions[sessionId].username = cleanName;
    activeSessions[sessionId].isGuest = false;
  }

  const { isTop10, rank } = storage.isTop10Score(telemetry.boonPoints);
  let trophy = undefined;

  if (isTop10) {
    trophy = await generateTrophyArtifact(rank, cleanName, telemetry.boonPoints, postMortem?.archetypeName || 'The Ascendant Benefactor');

    storage.insertLeaderboardEntry({
      id: `lead_${Date.now()}`,
      username: cleanName,
      score: telemetry.boonPoints,
      runDurationSeconds: telemetry.durationSeconds,
      date: telemetry.date,
      trophyImageUrl: trophy.imageUrl,
      behaviorArchetype: postMortem?.archetypeName,
      boonCount: Math.floor(telemetry.boonPoints / 120),
      mind: telemetry.mind,
      body: telemetry.body,
      spirit: telemetry.spirit,
    });
  }

  storage.addRun(cleanName, { ...telemetry, username: cleanName, isGuest: false }, trophy);

  res.json({ success: true, username: cleanName, trophy });
});

// Global Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = storage.getLeaderboard();
  res.json({ leaderboard });
});

// Public User Profile & Trophy Case
app.get('/api/profile/:username', (req, res) => {
  const { username } = req.params;
  const user = storage.getUser(username);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  res.json({
    username: user.username,
    createdAt: user.createdAt,
    runsCount: user.runsCount,
    trophies: user.trophies,
    runs: user.runs.slice(0, 15),
  });
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & SERVER START
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BoonFest full-stack server running on port ${PORT}`);
  });
}

startServer();
