import fs from 'fs';
import path from 'path';
import { LeaderboardEntry, PlaytimeStats, RunTelemetry, Trophy, UserSession } from '../src/types';

interface PlayInterval {
  timestamp: number;
  durationSeconds: number;
}

interface UserRecord {
  username: string;
  createdAt: number;
  runsCount: number;
  trophies: Trophy[];
  runs: RunTelemetry[];
  lockoutUntil?: number;
  lockoutReason?: '30m_rule' | '24h_cap';
}

interface DBData {
  users: Record<string, UserRecord>;
  playtimeLogs: Record<string, PlayInterval[]>;
  leaderboard: LeaderboardEntry[];
}

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
  }

  private loadData(): DBData {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read data store file, initializing fresh store:', err);
    }
    return {
      users: {},
      playtimeLogs: {},
      leaderboard: [...INITIAL_LEADERBOARD],
    };
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write data store file:', err);
    }
  }

  public getUser(username: string): UserRecord | null {
    return this.data.users[username.toLowerCase()] || null;
  }

  public registerUser(username: string): UserRecord {
    const key = username.toLowerCase().trim();
    if (this.data.users[key]) {
      return this.data.users[key];
    }
    const user: UserRecord = {
      username: username.trim(),
      createdAt: Date.now(),
      runsCount: 0,
      trophies: [],
      runs: [],
    };
    this.data.users[key] = user;
    this.persist();
    return user;
  }

  public addRun(username: string, run: RunTelemetry, trophy?: Trophy) {
    const key = username.toLowerCase().trim();
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
    return this.data.leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
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
    this.data.leaderboard.push(entry);
    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.data.leaderboard = this.data.leaderboard.slice(0, 20); // keep top 20
    this.persist();
  }

  // Anti-Sloth Pacing Engine:
  // - 30-Minute Rolling Rule: Max 5 cumulative minutes (300s) active play. Once reached, locks for 25 continuous minutes.
  // - 24-Hour Daily Cap: Max 25 cumulative minutes (1500s) active play in rolling 24h.
  public checkPacing(userId: string): PlaytimeStats {
    const now = Date.now();
    const user = this.data.users[userId.toLowerCase()];

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
      };
    }

    const logs = this.data.playtimeLogs[userId] || [];
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
      };
    }

    return {
      activeSecondsIn30m,
      activeSecondsIn24h,
      isLockedOut: false,
      lockoutRemainingSeconds: 0,
    };
  }

  public recordPlaytime(userId: string, seconds: number): PlaytimeStats {
    const now = Date.now();
    if (!this.data.playtimeLogs[userId]) {
      this.data.playtimeLogs[userId] = [];
    }

    // Clean logs older than 24 hours to prevent memory bloat
    const cutoff24h = now - 24 * 60 * 60 * 1000;
    this.data.playtimeLogs[userId] = this.data.playtimeLogs[userId].filter(l => l.timestamp >= cutoff24h);

    this.data.playtimeLogs[userId].push({
      timestamp: now,
      durationSeconds: Math.min(seconds, 30), // rate-limit single ping
    });

    const pacing = this.checkPacing(userId);
    this.persist();
    return pacing;
  }
}

export const storage = new StorageManager();
