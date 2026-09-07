export type CardCategory = 'earn' | 'grow' | 'boon';
export type Pillar = 'mind' | 'body' | 'spirit';

export interface CardPrerequisites {
  mind?: number;
  body?: number;
  spirit?: number;
}

// The card sent to the client (strictly sanitized of sloth markers!)
export interface CardPayload {
  id: string;
  title: string;
  category: CardCategory;
  tier: number;
  cost: number;
  rewardDescription: string;
  description: string;
  flavor: string;
  iconName: string;
  prerequisites?: CardPrerequisites;
  targetPillar?: Pillar; // for grow cards
  creditYield?: number;  // for earn cards
  boonPoints?: number;   // for boon cards
  hueRecovery?: number;  // for boon cards
}

export type SlothArchetype = 'lottery' | 'gambling';

export interface SlothPenalty {
  archetype: SlothArchetype;
  entropySpike: number;            // immediate red shift
  entropyRateMultiplier: number;   // sustained decay acceleration
  attributeDrop?: {
    pillar: Pillar;
    amount: number;
  };
  phantomCredits?: number;         // initial credit surge
  phantomDurationSec?: number;     // disappears after 5-10s
  initialCreditsGiven?: number;
}

export interface HiddenSlothData {
  isSloth: boolean;
  penalty?: SlothPenalty;
}

export interface PlayerAttributes {
  mind: number;   // Boosts earn yields
  body: number;   // Slows entropy decay
  spirit: number; // Boosts boon points and hue recovery
}

export interface PlaytimeStats {
  activeSecondsIn30m: number;
  activeSecondsIn24h: number;
  isLockedOut: boolean;
  lockoutReason?: '30m_rule' | '24h_cap';
  lockoutRemainingSeconds: number;
  nextPlayAvailableAt?: number;
  isDev?: boolean;
  isMainDev?: boolean;
  isTemporaryDev?: boolean;
  devGrantedUntil?: number;
  devGrantedRemainingSeconds?: number;
}

export interface DevGrantRecord {
  username: string;
  grantedAt: number;
  expiresAt: number;
  grantedBy: string;
  remainingSeconds: number;
}

export interface ManagedUserRecord {
  username: string;
  createdAt: number;
  authProvider?: string;
  disabled: boolean;
  disabledAt?: number;
  runsCount: number;
  trophiesCount: number;
  isDev: boolean;
  isMainDev: boolean;
  isTemporaryDev: boolean;
  pacing: PlaytimeStats;
}

export interface DevConfigStatus {
  isMainDev: boolean;
  hasPassword: boolean;
  activeGrants: DevGrantRecord[];
  registeredUsers: string[];
  users?: ManagedUserRecord[];
}

export interface ActivePhantomCredit {
  id: string;
  amount: number;
  expiresAt: number;
  sourceTitle: string;
}

export interface GameSessionState {
  sessionId: string;
  username: string;
  isGuest: boolean;
  credits: number;
  boonPoints: number;
  attributes: PlayerAttributes;
  hue: number; // 0 to 120
  entropyDecayRate: number; // degrees per second
  effectiveDecayRate?: number; // after Body dampener
  slothRateMultiplier?: number;
  paceMultiplier?: number;
  redAlertSecondsRemaining: number; // 8.0 to 0.0
  activeCards: CardPayload[];
  hiddenCards: Record<string, HiddenSlothData>;
  activePhantoms: ActivePhantomCredit[];
  slothTrapsTriggered: string[];
  runStartTime: number;
  totalRunPlaySeconds: number;
  isGameOver: boolean;
  isPaused: boolean;
  gameCount: number;
}

export interface UserSession {
  username: string;
  isGuest: boolean;
  firstRunFinished: boolean;
  createdAt: number;
  isDev?: boolean;
  isMainDev?: boolean;
  isTemporaryDev?: boolean;
  devGrantedUntil?: number;
  authProvider?: 'local' | 'google';
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    username: string;
    authProvider?: 'local' | 'google';
    email?: string;
  };
  pacing?: PlaytimeStats;
  devStatus?: {
    isDev: boolean;
    isMainDev: boolean;
    isTemporaryDev: boolean;
  };
  error?: string;
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  rank?: number;
  score: number;
  date: string;
  imageUrl: string;
  badgeType: 'top10_elite' | 'first_boon' | 'equilibrium_master' | 'altruist_grandmaster' | 'mind_sage';
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  runDurationSeconds: number;
  date: string;
  trophyImageUrl?: string;
  behaviorArchetype?: string;
  boonCount: number;
  mind: number;
  body: number;
  spirit: number;
}

export interface RunTelemetry {
  runId: string;
  username: string;
  isGuest: boolean;
  durationSeconds: number;
  credits: number;
  boonPoints: number;
  mind: number;
  body: number;
  spirit: number;
  slothTrapsTriggered: string[];
  entropyAtEnd: number;
  date: string;
}

export interface AIPostMortem {
  archetypeName: string;
  behavioralAnalysis: string;
  keyStrengths: string[];
  vulnerabilities: string[];
  strategicTips: string[];
  generatedByAI?: boolean;
}

export type AITaskId = 'sloth_cards' | 'post_mortem' | 'trophy_art';

export interface AITaskConfig {
  id: AITaskId;
  name: string;
  description: string;
  enabled: boolean;
  model: string;
  defaultModel: string;
  availableModels: string[];
  systemPrompt: string;
  defaultPrompt: string;
  temperature?: number;
}

export interface AIUsageConfig {
  globalEnabled: boolean;
  tasks: {
    sloth_cards: AITaskConfig;
    post_mortem: AITaskConfig;
    trophy_art: AITaskConfig;
  };
  lastUpdated?: number;
}

export interface GameOverResponse {
  isTop10: boolean;
  rank?: number;
  postMortem: AIPostMortem;
  trophy?: Trophy;
  requiresRegistration: boolean;
  telemetry: RunTelemetry;
  isDev?: boolean;
}

export interface ExecuteCardResult {
  success: boolean;
  message: string;
  type: 'success' | 'sloth_trap' | 'phantom_default' | 'error';
  creditsDelta: number;
  boonPointsDelta: number;
  attributeChanges?: Partial<PlayerAttributes>;
  hueDelta: number;
  newGameState: {
    credits: number;
    boonPoints: number;
    attributes: PlayerAttributes;
    hue: number;
    activeCards: CardPayload[];
    activePhantoms: ActivePhantomCredit[];
    entropyDecayRate?: number;
    effectiveDecayRate?: number;
    paceMultiplier?: number;
  };
}
