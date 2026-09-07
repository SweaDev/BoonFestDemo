import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AITaskConfig, AITaskId, AIUsageConfig, DevGrantRecord, LeaderboardEntry, PlaytimeStats, RunTelemetry, Trophy, UserSession } from '../src/types';

export const RESTRICTED_USERNAMES = [
  'dev',
  'admin',
  'administrator',
  'demo',
  'boonfest',
  'guest',
  'system',
  'root',
  'moderator',
  'mod',
  'staff',
  'official',
  'support',
  'security',
  'superuser',
  'operator',
  'bot',
  'owner',
  'null',
  'undefined',
];

export function isRestrictedUsername(username: string): boolean {
  if (!username) return true;
  const clean = username.toLowerCase().trim().replace(/^@/, '');
  return RESTRICTED_USERNAMES.includes(clean);
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

interface PlayInterval {
  timestamp: number;
  durationSeconds: number;
}

export interface UserRecord {
  username: string;
  createdAt: number;
  runsCount: number;
  trophies: Trophy[];
  runs: RunTelemetry[];
  lockoutUntil?: number;
  lockoutReason?: '30m_rule' | '24h_cap';
  devGrantedUntil?: number;
  devGrantedBy?: string;
  devGrantedAt?: number;
  passwordHash?: string;
  salt?: string;
  authProvider?: 'local' | 'google';
  email?: string;
  googleId?: string;
  disabled?: boolean;
  disabledAt?: number;
}

interface DBData {
  users: Record<string, UserRecord>;
  playtimeLogs: Record<string, PlayInterval[]>;
  leaderboard: LeaderboardEntry[];
  devConfig?: {
    password?: string;
    updatedAt?: number;
  };
  aiConfig?: AIUsageConfig;
}

export const DEFAULT_AI_CONFIG: AIUsageConfig = {
  globalEnabled: true,
  lastUpdated: Date.now(),
  tasks: {
    sloth_cards: {
      id: 'sloth_cards',
      name: 'Deceptive Sloth Cards',
      description: 'Generates tempting, high-risk lottery & gambling opportunity cards with disguised payouts and latent entropy spikes.',
      enabled: true,
      model: 'gemini-3.1-flash-lite',
      defaultModel: 'gemini-3.1-flash-lite',
      availableModels: ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'],
      systemPrompt: `You are generating an obvious sloth opportunity card for the pro-social game BoonFest.
The sloth archetype MUST be: "{archetype}".

Archetype guidelines:
- "lottery": Fancy charity or grand lotteries (e.g., "Cancer Research Charity Mega-Lottery", "Clean Oceans Gala Lottery"). The title MUST explicitly contain the word "Lottery". Description states buying a lottery ticket hoping for a massive jackpot.
- "gambling": Fancy high-stakes casino, roulette, dice, or sportsbook gambling (e.g., "Neon Oasis VIP Casino Gambling", "Cyber-Roulette Wheel of Fortune Gambling"). The title MUST explicitly contain the word "Gambling". Description states placing a high-stakes gambling wager.

RULES:
1. The title MUST clearly and explicitly contain either "Lottery" or "Gambling". Make it unmistakable.
2. Category MUST be "earn".
3. Reward description must promise big gains (e.g. "Jackpot: Win up to 500 Credits!" or "High-Roller: Win up to 650 Credits!").
4. Cost is between 15 and 35 credits.
5. Output strict JSON matching the schema.`,
      defaultPrompt: `You are generating an obvious sloth opportunity card for the pro-social game BoonFest.
The sloth archetype MUST be: "{archetype}".

Archetype guidelines:
- "lottery": Fancy charity or grand lotteries (e.g., "Cancer Research Charity Mega-Lottery", "Clean Oceans Gala Lottery"). The title MUST explicitly contain the word "Lottery". Description states buying a lottery ticket hoping for a massive jackpot.
- "gambling": Fancy high-stakes casino, roulette, dice, or sportsbook gambling (e.g., "Neon Oasis VIP Casino Gambling", "Cyber-Roulette Wheel of Fortune Gambling"). The title MUST explicitly contain the word "Gambling". Description states placing a high-stakes gambling wager.

RULES:
1. The title MUST clearly and explicitly contain either "Lottery" or "Gambling". Make it unmistakable.
2. Category MUST be "earn".
3. Reward description must promise big gains (e.g. "Jackpot: Win up to 500 Credits!" or "High-Roller: Win up to 650 Credits!").
4. Cost is between 15 and 35 credits.
5. Output strict JSON matching the schema.`,
    },
    post_mortem: {
      id: 'post_mortem',
      name: 'Psychological Post-Mortem Analysis',
      description: 'Evaluates player run telemetry, classifies behavioral archetypes, and generates customized cognitive coaching.',
      enabled: true,
      model: 'gemini-3.8-flash',
      defaultModel: 'gemini-3.8-flash',
      availableModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
      systemPrompt: `Evaluate the completed session of BoonFest, an anti-sloth pro-social game.
Telemetry data:
{telemetry}

Tasks:
1. Provide a sharp, evocative psychological Archetype Name (e.g. "The Dopamine Speculator", "The Ascetic Philanthropist", "The Burnout Capitalist", "The Discerning Steward").
2. Behavioral Analysis: A concise, insightful narrative analyzing their balance of capital accumulation vs self-care vs generosity vs susceptibility to shortcuts.
3. Key strengths (2 bullet items).
4. Vulnerabilities (2 bullet items).
5. Strategic tips (2 to 3 actionable, targeted tips for subsequent runs).`,
      defaultPrompt: `Evaluate the completed session of BoonFest, an anti-sloth pro-social game.
Telemetry data:
{telemetry}

Tasks:
1. Provide a sharp, evocative psychological Archetype Name (e.g. "The Dopamine Speculator", "The Ascetic Philanthropist", "The Burnout Capitalist", "The Discerning Steward").
2. Behavioral Analysis: A concise, insightful narrative analyzing their balance of capital accumulation vs self-care vs generosity vs susceptibility to shortcuts.
3. Key strengths (2 bullet items).
4. Vulnerabilities (2 bullet items).
5. Strategic tips (2 to 3 actionable, targeted tips for subsequent runs).`,
    },
    trophy_art: {
      id: 'trophy_art',
      name: 'Leaderboard Trophy Artifact Artwork',
      description: 'Generates high-resolution esports trophy medal emblems for top 10 leaderboard performers.',
      enabled: true,
      model: 'gemini-3.1-flash-lite-image',
      defaultModel: 'gemini-3.1-flash-lite-image',
      availableModels: ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'],
      systemPrompt: `A prestigious, flashy vector-style golden esports trophy medal emblem for game "BoonFest". 
Rank #{rank} in Global Altruism Leaderboard. 
Theme: Emerald green glowing laurels, polished gold star shield, geometric wings, crystal prism center, clean dark background, hyper-detailed minimalist digital badge.`,
      defaultPrompt: `A prestigious, flashy vector-style golden esports trophy medal emblem for game "BoonFest". 
Rank #{rank} in Global Altruism Leaderboard. 
Theme: Emerald green glowing laurels, polished gold star shield, geometric wings, crystal prism center, clean dark background, hyper-detailed minimalist digital badge.`,
    },
  },
};

const DB_FILE_PATH = path.join(process.cwd(), 'data-store.json');

// Initial seed leaderboard showcasing diverse altruistic champions
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lead_1',
    username: 'GaiaSteward',
    score: 3450,
    runDurationSeconds: 275,
    date: '2026-09-02',
    behaviorArchetype: 'The Planetary Architect',
    boonCount: 7,
    mind: 4,
    body: 3,
    spirit: 5,
  },
  {
    id: 'lead_2',
    username: 'CivicHarmonist',
    score: 2890,
    runDurationSeconds: 260,
    date: '2026-09-03',
    behaviorArchetype: 'The Luminous Benefactor',
    boonCount: 6,
    mind: 3,
    body: 4,
    spirit: 4,
  },
  {
    id: 'lead_3',
    username: 'PranaFlow',
    score: 2420,
    runDurationSeconds: 245,
    date: '2026-09-04',
    behaviorArchetype: 'The Serene Ascetic',
    boonCount: 5,
    mind: 3,
    body: 5,
    spirit: 3,
  },
  {
    id: 'lead_4',
    username: 'MicrogridPioneer',
    score: 1980,
    runDurationSeconds: 220,
    date: '2026-09-04',
    behaviorArchetype: 'The Systems Engineer',
    boonCount: 4,
    mind: 5,
    body: 2,
    spirit: 3,
  },
  {
    id: 'lead_5',
    username: 'HeirloomKeeper',
    score: 1650,
    runDurationSeconds: 200,
    date: '2026-09-05',
    behaviorArchetype: 'The Regenerative Farmer',
    boonCount: 4,
    mind: 2,
    body: 3,
    spirit: 4,
  },
  {
    id: 'lead_6',
    username: 'AuraRestorer',
    score: 1420,
    runDurationSeconds: 190,
    date: '2026-09-05',
    behaviorArchetype: 'The Empathic Healer',
    boonCount: 3,
    mind: 3,
    body: 3,
    spirit: 4,
  },
  {
    id: 'lead_7',
    username: 'SolarCommune',
    score: 1180,
    runDurationSeconds: 175,
    date: '2026-09-05',
    behaviorArchetype: 'The Cooperative Anchor',
    boonCount: 3,
    mind: 4,
    body: 2,
    spirit: 2,
  },
  {
    id: 'lead_8',
    username: 'CleanWaters',
    score: 960,
    runDurationSeconds: 160,
    date: '2026-09-06',
    behaviorArchetype: 'The Watershed Sentinel',
    boonCount: 2,
    mind: 2,
    body: 3,
    spirit: 3,
  },
  {
    id: 'lead_9',
    username: 'UrbanCanopy',
    score: 840,
    runDurationSeconds: 145,
    date: '2026-09-06',
    behaviorArchetype: 'The Canopy Guardian',
    boonCount: 2,
    mind: 3,
    body: 2,
    spirit: 2,
  },
  {
    id: 'lead_10',
    username: 'KindredSpirit',
    score: 720,
    runDurationSeconds: 130,
    date: '2026-09-06',
    behaviorArchetype: 'The Mindful Novice',
    boonCount: 2,
    mind: 2,
    body: 2,
    spirit: 2,
  },
];

class StorageManager {
  private data: DBData;

  constructor() {
    this.data = this.loadData();
    this.cleanDevEntriesFromLeaderboard();
  }

  public cleanDevEntriesFromLeaderboard(): void {
    if (!this.data || !this.data.leaderboard) return;
    const beforeLength = this.data.leaderboard.length;
    this.data.leaderboard = this.data.leaderboard.filter(entry => {
      const clean = (entry.username || '').toLowerCase().trim().replace(/^@/, '');
      if (clean === 'dev') return false;
      const user = this.data.users[clean];
      if (user && user.devGrantedUntil && user.devGrantedUntil > Date.now()) return false;
      return true;
    });

    // If removing dev entries brought the leaderboard below 10, backfill from INITIAL_LEADERBOARD
    if (this.data.leaderboard.length < 10) {
      for (const seed of INITIAL_LEADERBOARD) {
        if (!this.data.leaderboard.some(e => e.id === seed.id) && this.data.leaderboard.length < 10) {
          this.data.leaderboard.push(seed);
        }
      }
    }

    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.persist();
  }

  private loadData(): DBData {
    let parsed: DBData = {
      users: {},
      playtimeLogs: {},
      leaderboard: [...INITIAL_LEADERBOARD],
      devConfig: {},
    };

    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        parsed = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read data store file, initializing fresh store:', err);
    }

    if (!parsed.users) parsed.users = {};
    if (!parsed.playtimeLogs) parsed.playtimeLogs = {};
    if (!parsed.leaderboard) parsed.leaderboard = [...INITIAL_LEADERBOARD];
    if (!parsed.devConfig) parsed.devConfig = {};

    // Ensure dev entries are removed on load
    parsed.leaderboard = parsed.leaderboard.filter(entry => {
      const clean = (entry.username || '').toLowerCase().trim().replace(/^@/, '');
      return clean !== 'dev';
    });

    if (parsed.leaderboard.length < 10) {
      for (const seed of INITIAL_LEADERBOARD) {
        if (!parsed.leaderboard.some(e => e.id === seed.id) && parsed.leaderboard.length < 10) {
          parsed.leaderboard.push(seed);
        }
      }
    }

    // Ensure the default Main Dev user exists
    if (!parsed.users['dev']) {
      parsed.users['dev'] = {
        username: 'dev',
        createdAt: Date.now(),
        runsCount: 0,
        trophies: [],
        runs: [],
      };
    }

    // Ensure the default Guest user record exists for persistent pacing & lockout tracking
    if (!parsed.users['guest']) {
      parsed.users['guest'] = {
        username: 'Guest',
        createdAt: Date.now(),
        runsCount: 0,
        trophies: [],
        runs: [],
      };
    }

    // Ensure dev account user record exists
    if (!parsed.users['dev']) {
      parsed.users['dev'] = {
        username: 'dev',
        createdAt: Date.now(),
        runsCount: 0,
        trophies: [],
        runs: [],
        authProvider: 'local',
      };
    }

    // Ensure the 5 demo user accounts exist: demouser1 through demouser5 with password "${username}!"
    const DEMO_USERS = ['demouser1', 'demouser2', 'demouser3', 'demouser4', 'demouser5'];
    for (const demoName of DEMO_USERS) {
      const password = `${demoName}!`;
      const existing = parsed.users[demoName];
      const needsPasswordUpdate =
        !existing ||
        !existing.passwordHash ||
        !existing.salt ||
        !verifyPassword(password, existing.passwordHash, existing.salt);

      if (!existing) {
        const hashed = hashPassword(password);
        parsed.users[demoName] = {
          username: demoName,
          createdAt: Date.now(),
          runsCount: 0,
          trophies: [],
          runs: [],
          passwordHash: hashed.hash,
          salt: hashed.salt,
          authProvider: 'local',
        };
      } else if (needsPasswordUpdate) {
        const hashed = hashPassword(password);
        existing.username = demoName;
        existing.passwordHash = hashed.hash;
        existing.salt = hashed.salt;
        existing.authProvider = 'local';
      }
    }

    // Ensure AI usage configuration exists
    if (!parsed.aiConfig) {
      parsed.aiConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
    } else {
      if (!parsed.aiConfig.tasks) {
        parsed.aiConfig.tasks = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG.tasks));
      }
      for (const [key, defaultTask] of Object.entries(DEFAULT_AI_CONFIG.tasks)) {
        if (!parsed.aiConfig.tasks[key as AITaskId]) {
          parsed.aiConfig.tasks[key as AITaskId] = JSON.parse(JSON.stringify(defaultTask));
        }
      }
    }

    return parsed;
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write data store file:', err);
    }
  }

  public getUser(username: string): UserRecord | null {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    return this.data.users[clean] || this.data.users[username.toLowerCase()] || null;
  }

  public getUserByGoogleId(googleId: string): UserRecord | null {
    if (!googleId) return null;
    for (const u of Object.values(this.data.users)) {
      if (u.googleId === googleId) return u;
    }
    return null;
  }

  public getUserByEmail(email: string): UserRecord | null {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    for (const u of Object.values(this.data.users)) {
      if (u.email && u.email.toLowerCase().trim() === clean) return u;
    }
    return null;
  }

  public registerUser(
    username: string,
    options?: {
      password?: string;
      authProvider?: 'local' | 'google';
      email?: string;
      googleId?: string;
    }
  ): UserRecord {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    const key = clean;

    let passwordHash: string | undefined;
    let salt: string | undefined;

    if (options?.password) {
      const hashed = hashPassword(options.password);
      passwordHash = hashed.hash;
      salt = hashed.salt;
    }

    if (this.data.users[key]) {
      const existing = this.data.users[key];
      if (passwordHash && !existing.passwordHash) {
        existing.passwordHash = passwordHash;
        existing.salt = salt;
      }
      if (options?.email && !existing.email) existing.email = options.email;
      if (options?.googleId && !existing.googleId) existing.googleId = options.googleId;
      if (options?.authProvider) existing.authProvider = options.authProvider;
      this.persist();
      return existing;
    }

    const user: UserRecord = {
      username: username.trim(),
      createdAt: Date.now(),
      runsCount: 0,
      trophies: [],
      runs: [],
      passwordHash,
      salt,
      authProvider: options?.authProvider || (options?.googleId ? 'google' : 'local'),
      email: options?.email,
      googleId: options?.googleId,
    };
    this.data.users[key] = user;
    this.persist();
    return user;
  }

  public verifyUserPassword(user: UserRecord, passwordInput?: string): boolean {
    if (!passwordInput) return false;
    if (user.username.toLowerCase() === 'dev') {
      return this.verifyDevPassword(passwordInput);
    }
    if (!user.passwordHash || !user.salt) {
      return false;
    }
    return verifyPassword(passwordInput, user.passwordHash, user.salt);
  }

  public setUserPassword(username: string, newPassword: string): boolean {
    const user = this.getUser(username);
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.persist();
    return true;
  }

  public addRun(username: string, run: RunTelemetry, trophy?: Trophy) {
    const key = (username || '').toLowerCase().trim().replace(/^@/, '');
    if (!this.data.users[key]) {
      this.registerUser(username);
    }
    const user = this.data.users[key];
    user.runsCount += 1;
    user.runs.unshift(run);
    if (trophy) {
      user.trophies.unshift(trophy);
    }
    this.persist();
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return this.data.leaderboard
      .filter(entry => {
        const clean = (entry.username || '').toLowerCase().trim().replace(/^@/, '');
        if (clean === 'dev') return false;
        const user = this.data.users[clean];
        if (user && user.devGrantedUntil && user.devGrantedUntil > Date.now()) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  public isTop10Score(score: number): { isTop10: boolean; rank: number } {
    const sorted = this.getLeaderboard();
    if (sorted.length < 10) {
      const rank = sorted.filter(entry => entry.score > score).length + 1;
      return { isTop10: true, rank };
    }
    const minTop10 = sorted[sorted.length - 1].score;
    if (score > minTop10) {
      const rank = sorted.filter(entry => entry.score > score).length + 1;
      return { isTop10: true, rank };
    }
    return { isTop10: false, rank: 0 };
  }

  public insertLeaderboardEntry(entry: LeaderboardEntry) {
    const clean = (entry.username || '').toLowerCase().trim().replace(/^@/, '');
    if (clean === 'dev') {
      console.log(`[Storage] Dev score excluded from global leaderboard for @${entry.username}`);
      return;
    }
    const user = this.data.users[clean];
    if (user && user.devGrantedUntil && user.devGrantedUntil > Date.now()) {
      console.log(`[Storage] Temporary dev score excluded from global leaderboard for @${entry.username}`);
      return;
    }

    this.data.leaderboard.push(entry);
    this.data.leaderboard = this.data.leaderboard.filter(e => {
      const c = (e.username || '').toLowerCase().trim().replace(/^@/, '');
      if (c === 'dev') return false;
      const u = this.data.users[c];
      if (u && u.devGrantedUntil && u.devGrantedUntil > Date.now()) return false;
      return true;
    });
    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.data.leaderboard = this.data.leaderboard.slice(0, 20); // keep top 20 non-dev
    this.persist();
  }

  // Dev System & Authorization
  public isUserDev(username: string): { isDev: boolean; isMainDev: boolean; isTemporaryDev: boolean; devGrantedUntil?: number } {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    if (clean === 'dev') {
      return { isDev: true, isMainDev: true, isTemporaryDev: false };
    }
    const user = this.data.users[clean];
    if (user && user.devGrantedUntil && user.devGrantedUntil > Date.now()) {
      return { isDev: true, isMainDev: false, isTemporaryDev: true, devGrantedUntil: user.devGrantedUntil };
    }
    return { isDev: false, isMainDev: false, isTemporaryDev: false };
  }

  public getDevPassword(): string | undefined {
    return this.data.devConfig?.password;
  }

  public setDevPassword(password: string): void {
    if (!this.data.devConfig) {
      this.data.devConfig = {};
    }
    this.data.devConfig.password = password ? password.trim() : undefined;
    this.data.devConfig.updatedAt = Date.now();
    this.persist();
  }

  public verifyDevPassword(input?: string): boolean {
    const pass = this.getDevPassword();
    if (!pass) return true; // No password set yet: open dev access
    return pass === (input || '').trim();
  }

  public grantDevStatus(targetUsername: string, durationSeconds: number, grantedBy: string = 'dev'): { success: boolean; expiresAt: number } {
    const clean = targetUsername.toLowerCase().trim();
    if (!this.data.users[clean]) {
      this.registerUser(targetUsername);
    }
    const now = Date.now();
    const expiresAt = now + Math.max(60, durationSeconds) * 1000;
    const user = this.data.users[clean];
    user.devGrantedUntil = expiresAt;
    user.devGrantedBy = grantedBy;
    user.devGrantedAt = now;
    // Clear any active lockout for this user
    user.lockoutUntil = undefined;
    user.lockoutReason = undefined;
    this.persist();
    return { success: true, expiresAt };
  }

  public revokeDevStatus(targetUsername: string): boolean {
    const clean = targetUsername.toLowerCase().trim();
    const user = this.data.users[clean];
    if (user) {
      delete user.devGrantedUntil;
      delete user.devGrantedBy;
      delete user.devGrantedAt;
      this.persist();
      return true;
    }
    return false;
  }

  public getDevGrants(): DevGrantRecord[] {
    const now = Date.now();
    const grants: DevGrantRecord[] = [];
    for (const user of Object.values(this.data.users)) {
      if (user.devGrantedUntil && user.devGrantedUntil > now) {
        grants.push({
          username: user.username,
          grantedAt: user.devGrantedAt || now,
          expiresAt: user.devGrantedUntil,
          grantedBy: user.devGrantedBy || 'dev',
          remainingSeconds: Math.max(0, Math.ceil((user.devGrantedUntil - now) / 1000)),
        });
      }
    }
    return grants.sort((a, b) => b.expiresAt - a.expiresAt);
  }

  public getAllRegisteredUsers(): string[] {
    return Object.values(this.data.users)
      .map(u => u.username)
      .filter(name => (name || '').toLowerCase().trim().replace(/^@/, '') !== 'dev');
  }

  // Dev User Management: Enable or Disable a user
  public setUserDisabled(username: string, disabled: boolean): boolean {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    if (clean === 'dev') {
      return false; // Permanent Dev account cannot be disabled
    }
    const user = this.getUser(clean);
    if (!user) return false;
    user.disabled = disabled;
    if (disabled) {
      user.disabledAt = Date.now();
    } else {
      delete user.disabledAt;
    }
    this.persist();
    return true;
  }

  // Dev User Management: Reset user password
  public resetUserPassword(username: string, newPassword: string): boolean {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    if (clean === 'dev') {
      this.setDevPassword(newPassword);
      return true;
    }
    const user = this.getUser(clean);
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    this.persist();
    return true;
  }

  // Dev User Management: Reset time restrictions (clears active rolling logs & explicit lockouts)
  public resetUserTimeRestrictions(username: string): boolean {
    const clean = (username || '').toLowerCase().trim().replace(/^@/, '');
    const user = this.getUser(clean);
    if (user) {
      delete user.lockoutUntil;
      delete user.lockoutReason;
    }

    if (clean === 'guest') {
      delete this.data.playtimeLogs['Guest'];
      delete this.data.playtimeLogs['guest'];
    } else {
      delete this.data.playtimeLogs[clean];
      if (user && user.username) {
        delete this.data.playtimeLogs[user.username];
      }
    }

    this.persist();
    return true;
  }

  // Dev User Management: Get list of all users with status, pacing, and statistics
  public getUsersManagementList(): Array<{
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
  }> {
    const usersList = Object.values(this.data.users);
    return usersList.map(user => {
      const clean = (user.username || '').toLowerCase().trim().replace(/^@/, '');
      const pacing = this.checkPacing(user.username);
      const devInfo = this.isUserDev(clean);
      return {
        username: user.username,
        createdAt: user.createdAt || Date.now(),
        authProvider: user.authProvider || 'local',
        disabled: Boolean(user.disabled),
        disabledAt: user.disabledAt,
        runsCount: user.runsCount || 0,
        trophiesCount: (user.trophies || []).length,
        isDev: devInfo.isDev,
        isMainDev: devInfo.isMainDev,
        isTemporaryDev: devInfo.isTemporaryDev,
        pacing,
      };
    }).sort((a, b) => {
      if (a.username.toLowerCase() === 'dev') return -1;
      if (b.username.toLowerCase() === 'dev') return 1;
      if (a.username.toLowerCase() === 'guest') return -1;
      if (b.username.toLowerCase() === 'guest') return 1;
      return a.username.localeCompare(b.username);
    });
  }

  // Anti-Sloth Pacing Engine:
  // - 30-Minute Rolling Rule: Max 5 cumulative minutes (300s) active play. Once reached, locks for 25 continuous minutes.
  // - 24-Hour Daily Cap: Max 25 cumulative minutes (1500s) active play in rolling 24h.
  // Dev user and temporarily granted dev users have zero restrictions!
  public checkPacing(userId: string): PlaytimeStats {
    const now = Date.now();
    const cleanUserId = (userId || 'guest').trim().replace(/^@/, '');
    const isGuest = cleanUserId.toLowerCase() === 'guest';
    const devInfo = this.isUserDev(cleanUserId);

    // Dev users and granted dev status holders bypass all time restrictions
    if (devInfo.isDev) {
      return {
        activeSecondsIn30m: 0,
        activeSecondsIn24h: 0,
        isLockedOut: false,
        lockoutRemainingSeconds: 0,
        isDev: true,
        isMainDev: devInfo.isMainDev,
        isTemporaryDev: devInfo.isTemporaryDev,
        devGrantedUntil: devInfo.devGrantedUntil,
        devGrantedRemainingSeconds: devInfo.devGrantedUntil ? Math.max(0, Math.ceil((devInfo.devGrantedUntil - now) / 1000)) : undefined,
      };
    }

    const normalizedKey = isGuest ? 'guest' : cleanUserId.toLowerCase();
    let user = this.data.users[normalizedKey];
    if (!user && isGuest) {
      user = this.data.users['guest'] = {
        username: 'Guest',
        createdAt: Date.now(),
        runsCount: 0,
        trophies: [],
        runs: [],
      };
    }

    // Check active explicit lockout
    if (user && user.lockoutUntil && user.lockoutUntil > now) {
      const remainingSec = Math.ceil((user.lockoutUntil - now) / 1000);
      return {
        activeSecondsIn30m: 300,
        activeSecondsIn24h: 1500,
        isLockedOut: true,
        lockoutReason: user.lockoutReason || '30m_rule',
        lockoutRemainingSeconds: remainingSec,
        nextPlayAvailableAt: user.lockoutUntil,
        isDev: false,
      };
    }

    // Retrieve logs - for guest, merge both 'Guest' and 'guest' keys to preserve all guest history
    let logs: Array<{ timestamp: number; durationSeconds: number }> = [];
    if (isGuest) {
      const g1 = this.data.playtimeLogs['Guest'] || [];
      const g2 = this.data.playtimeLogs['guest'] || [];
      const seen = new Set<number>();
      logs = [...g1, ...g2].filter(l => {
        if (seen.has(l.timestamp)) return false;
        seen.add(l.timestamp);
        return true;
      });
      this.data.playtimeLogs['Guest'] = logs;
      this.data.playtimeLogs['guest'] = logs;
    } else {
      logs = this.data.playtimeLogs[cleanUserId] || this.data.playtimeLogs[normalizedKey] || [];
    }

    const window30m = now - 30 * 60 * 1000;
    const window24h = now - 24 * 60 * 60 * 1000;

    let activeSecondsIn30m = 0;
    let activeSecondsIn24h = 0;

    for (const log of logs) {
      if (log.timestamp >= window30m) {
        activeSecondsIn30m += log.durationSeconds;
      }
      if (log.timestamp >= window24h) {
        activeSecondsIn24h += log.durationSeconds;
      }
    }

    // 24-hour cap check (25 minutes = 1500s)
    if (activeSecondsIn24h >= 1500) {
      const oldestIn24h = logs.find(l => l.timestamp >= window24h);
      const clearAt = oldestIn24h ? oldestIn24h.timestamp + 24 * 60 * 60 * 1000 : now + 60 * 60 * 1000;
      const lockoutRemainingSeconds = Math.max(60, Math.ceil((clearAt - now) / 1000));
      return {
        activeSecondsIn30m,
        activeSecondsIn24h,
        isLockedOut: true,
        lockoutReason: '24h_cap',
        lockoutRemainingSeconds,
        nextPlayAvailableAt: clearAt,
        isDev: false,
      };
    }

    // 30-minute rule check (5 minutes = 300s)
    if (activeSecondsIn30m >= 300) {
      // 25 continuous minutes lockout (1500s)
      const lockoutDurationMs = 25 * 60 * 1000;
      const lockoutUntil = now + lockoutDurationMs;
      if (user) {
        user.lockoutUntil = lockoutUntil;
        user.lockoutReason = '30m_rule';
        this.persist();
      }
      return {
        activeSecondsIn30m,
        activeSecondsIn24h,
        isLockedOut: true,
        lockoutReason: '30m_rule',
        lockoutRemainingSeconds: 25 * 60,
        nextPlayAvailableAt: lockoutUntil,
        isDev: false,
      };
    }

    return {
      activeSecondsIn30m,
      activeSecondsIn24h,
      isLockedOut: false,
      lockoutRemainingSeconds: 0,
      isDev: false,
    };
  }

  public recordPlaytime(userId: string, seconds: number): PlaytimeStats {
    const cleanUserId = (userId || 'guest').trim().replace(/^@/, '');
    const isGuest = cleanUserId.toLowerCase() === 'guest';
    const devInfo = this.isUserDev(cleanUserId);
    if (devInfo.isDev) {
      return this.checkPacing(cleanUserId);
    }

    const now = Date.now();
    const storeKey = isGuest ? 'Guest' : cleanUserId;

    if (!this.data.playtimeLogs[storeKey]) {
      this.data.playtimeLogs[storeKey] = [];
    }

    // Clean logs older than 24 hours to prevent memory bloat
    const cutoff24h = now - 24 * 60 * 60 * 1000;
    this.data.playtimeLogs[storeKey] = this.data.playtimeLogs[storeKey].filter(l => l.timestamp >= cutoff24h);

    this.data.playtimeLogs[storeKey].push({
      timestamp: now,
      durationSeconds: Math.min(seconds, 30), // rate-limit single ping
    });

    if (isGuest) {
      this.data.playtimeLogs['guest'] = this.data.playtimeLogs['Guest'];
    }

    const pacing = this.checkPacing(storeKey);
    this.persist();
    return pacing;
  }

  public getAIConfig(): AIUsageConfig {
    if (!this.data.aiConfig) {
      this.data.aiConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
      this.persist();
    }
    return this.data.aiConfig;
  }

  public updateAIConfig(updates: Partial<AIUsageConfig>): AIUsageConfig {
    if (!this.data.aiConfig) {
      this.data.aiConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
    }
    if (typeof updates.globalEnabled === 'boolean') {
      this.data.aiConfig.globalEnabled = updates.globalEnabled;
    }
    if (updates.tasks) {
      for (const [taskId, taskUpdates] of Object.entries(updates.tasks)) {
        const key = taskId as AITaskId;
        if (this.data.aiConfig.tasks[key]) {
          this.data.aiConfig.tasks[key] = {
            ...this.data.aiConfig.tasks[key],
            ...taskUpdates,
          };
        }
      }
    }
    this.data.aiConfig.lastUpdated = Date.now();
    this.persist();
    return this.data.aiConfig;
  }

  public updateAITask(taskId: AITaskId, updates: Partial<AITaskConfig>): AIUsageConfig {
    if (!this.data.aiConfig) {
      this.data.aiConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
    }
    if (this.data.aiConfig.tasks[taskId]) {
      this.data.aiConfig.tasks[taskId] = {
        ...this.data.aiConfig.tasks[taskId],
        ...updates,
      };
      this.data.aiConfig.lastUpdated = Date.now();
      this.persist();
    }
    return this.data.aiConfig;
  }

  public resetAITask(taskId?: AITaskId): AIUsageConfig {
    if (!this.data.aiConfig) {
      this.data.aiConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
    }
    if (taskId && DEFAULT_AI_CONFIG.tasks[taskId]) {
      this.data.aiConfig.tasks[taskId] = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG.tasks[taskId]));
    } else {
      this.data.aiConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
    }
    this.data.aiConfig.lastUpdated = Date.now();
    this.persist();
    return this.data.aiConfig;
  }
}

export const storage = new StorageManager();
