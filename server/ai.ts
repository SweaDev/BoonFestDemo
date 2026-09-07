import { GoogleGenAI, Type } from '@google/genai';
import { AIPostMortem, CardPayload, HiddenSlothData, RunTelemetry, SlothArchetype, Trophy } from '../src/types';

// Server-side lazy initialization with mandatory aistudio-build user agent
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helpers for resilient API calls
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fallback curated Sloth traps if AI is unavailable or rate-limited
// Limited strictly to obvious Lottery and Gambling opportunities
const CURATED_SLOTH_TEMPLATES = [
  // 1. Lotteries (Fancy charity / grand names, obvious lottery, high promises, consumes credits)
  {
    archetype: 'lottery' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Cancer Research Charity Mega-Lottery',
    description: 'Purchase an official charity lottery ticket. Advertises a grand 500-credit prize ostensibly supporting oncology research. Lotteries rarely pay (<10% chance), and lost capital increases societal entropy.',
    flavor: 'A noble cause and a one-in-a-million chance at instant untold wealth.',
    cost: 20,
    rewardDescription: 'Jackpot: Win up to 500 Credits!',
    iconName: 'Sparkles',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 16,
    entropyRateMultiplier: 1.18,
  },
  {
    archetype: 'lottery' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: "Children's Hospital Hope Grand Lottery",
    description: 'Buy into the pediatric foundation charity lottery ticket draw promising an enormous jackpot payout. Rarely pays (<10% chance in small amounts); squandered money increases entropy.',
    flavor: 'Why toil when benevolence could be rewarded with instant fortune?',
    cost: 15,
    rewardDescription: 'Jackpot: Win up to 450 Credits!',
    iconName: 'Sparkles',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 16,
    entropyRateMultiplier: 1.18,
  },
  {
    archetype: 'lottery' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Planetary Wildlife Preservation Lottery',
    description: 'Enter the global biosphere conservation lottery drawing with a glittering top capital jackpot. Rarely pays, and lost capital directly spikes world entropy.',
    flavor: 'Save the species and secure your financial freedom on a single ticket.',
    cost: 25,
    rewardDescription: 'Jackpot: Win up to 600 Credits!',
    iconName: 'Sparkles',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 16,
    entropyRateMultiplier: 1.18,
  },
  {
    archetype: 'lottery' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Clean Oceans Gala Super-Lottery',
    description: 'Purchase a ticket for the oceanic restoration charity sweepstakes advertising an astronomical capital bounty. Seldom pays; lost funds increase societal entropy.',
    flavor: 'The seas need help, and you deserve a fast fortune.',
    cost: 20,
    rewardDescription: 'Jackpot: Win up to 520 Credits!',
    iconName: 'Sparkles',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 16,
    entropyRateMultiplier: 1.18,
  },

  // 2. Gambling (Fancy high-stakes names, obvious gambling, consumes credits, heavy entropy)
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Neon Oasis VIP Casino Gambling',
    description: 'Step onto the glittering casino floor and place high-stakes bets on the private VIP tables. Gambling seldom pays and only in small amounts, spiking far more entropy than lottery.',
    flavor: 'The house offers instant glory to those daring enough to roll.',
    cost: 30,
    rewardDescription: 'High-Roller: Win up to 650 Credits!',
    iconName: 'Dices',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 28,
    entropyRateMultiplier: 1.35,
  },
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Cyber-Roulette Wheel of Fortune Gambling',
    description: 'Gamble your capital on the spinning quantum roulette wheel promising massive multiplied returns. High-risk gambling seldom pays, and losses accelerate entropy collapse rapidly.',
    flavor: 'Put everything on red and let the wheel decide your economic fate.',
    cost: 25,
    rewardDescription: '35:1 Payout: Win up to 700 Credits!',
    iconName: 'Dices',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 28,
    entropyRateMultiplier: 1.35,
  },
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Underground High-Roller Dice Gambling',
    description: 'Wager in the back-alley dragon dice pit where fortunes allegedly flip on every roll of the loaded bones. Seldom pays, driving steep entropy spikes across society.',
    flavor: 'Double down. Fortune favors the bold, or so they claim.',
    cost: 35,
    rewardDescription: 'High-Stakes: Win up to 800 Credits!',
    iconName: 'Dices',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 28,
    entropyRateMultiplier: 1.35,
  },
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Metropolitan Derby Thoroughbred Sportsbook Gambling',
    description: 'Place high-risk parlay gambling wagers on the cyber-thoroughbred racing circuit for an advertised multi-fold payout. Seldom pays, consuming capital and fueling entropy.',
    flavor: 'The odds are tempting, and the finish line is seconds away.',
    cost: 30,
    rewardDescription: 'Trifecta: Win up to 600 Credits!',
    iconName: 'Dices',
    phantomCredits: 0,
    phantomDurationSec: 0,
    entropySpike: 28,
    entropyRateMultiplier: 1.35,
  },
];

// In-memory pre-generated Sloth card buffer for 0ms instantaneous hand draws
const slothCardBuffer: Array<{ card: CardPayload; hidden: HiddenSlothData }> = [];
let isRefillingSlothBuffer = false;

// Background worker to asynchronously refill the buffer without blocking turns
export async function refillSlothBuffer() {
  if (isRefillingSlothBuffer || slothCardBuffer.length >= 3) return;
  isRefillingSlothBuffer = true;

  try {
    const ai = getAI();
    if (!ai) return;

    const archetypes: SlothArchetype[] = ['lottery', 'gambling'];
    const chosenArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    const cardId = `sloth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: `You are generating an obvious sloth opportunity card for the pro-social game BoonFest.
The sloth archetype MUST be: "${chosenArchetype}".

Archetype guidelines:
- "lottery": Fancy charity or grand lotteries (e.g., "Cancer Research Charity Mega-Lottery", "Clean Oceans Gala Lottery"). The title MUST explicitly contain the word "Lottery". Description states buying a lottery ticket hoping for a massive jackpot.
- "gambling": Fancy high-stakes casino, roulette, dice, or sportsbook gambling (e.g., "Neon Oasis VIP Casino Gambling", "Cyber-Roulette Wheel of Fortune Gambling"). The title MUST explicitly contain the word "Gambling". Description states placing a high-stakes gambling wager.

RULES:
1. The title MUST clearly and explicitly contain either "Lottery" or "Gambling". Make it unmistakable.
2. Category MUST be "earn".
3. Reward description must promise big gains (e.g. "Jackpot: Win up to 500 Credits!" or "High-Roller: Win up to 650 Credits!").
4. Cost is between 15 and 35 credits.
5. Output strict JSON matching the schema.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Title explicitly containing Lottery or Gambling' },
                  category: { type: Type.STRING, description: 'Must be "earn"' },
                  description: { type: Type.STRING, description: 'Description of the lottery or gambling opportunity' },
                  flavor: { type: Type.STRING, description: 'Seductive one-liner justifying the lottery or gamble' },
                  cost: { type: Type.NUMBER, description: 'Buy-in cost, between 15 and 35 credits' },
                  rewardDescription: { type: Type.STRING, description: 'Promised big gain, e.g. "Jackpot: Win up to 500 Credits!"' },
                  iconName: { type: Type.STRING, description: 'One of: Sparkles, Dices, Coins' },
                },
                required: ['title', 'category', 'description', 'flavor', 'cost', 'rewardDescription', 'iconName'],
              },
            },
          }),
          3000
        );

        const rawText = response.text || '';
        const cleaned = cleanJsonString(rawText);
        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          if (parsed.title && parsed.cost) {
            const isLottery = chosenArchetype === 'lottery';
            const card: CardPayload = {
              id: cardId,
              title: parsed.title,
              category: 'earn',
              tier: 2,
              cost: Math.max(15, Math.min(40, Number(parsed.cost) || (isLottery ? 20 : 30))),
              rewardDescription: parsed.rewardDescription || (isLottery ? 'Jackpot: Win up to 500 Credits!' : 'High-Roller: Win up to 650 Credits!'),
              description: parsed.description,
              flavor: parsed.flavor,
              iconName: isLottery ? 'Sparkles' : 'Dices',
            };

            const hidden: HiddenSlothData = {
              isSloth: true,
              penalty: {
                archetype: chosenArchetype,
                entropySpike: isLottery ? 16 : 28,
                entropyRateMultiplier: isLottery ? 1.18 : 1.35,
                phantomCredits: 0,
                phantomDurationSec: 0,
                initialCreditsGiven: 0,
              },
            };

            slothCardBuffer.push({ card, hidden });
            break;
          }
        }
      } catch {
        // try next candidate model
      }
    }
  } catch {
    // Ignore background errors
  } finally {
    isRefillingSlothBuffer = false;
  }
}

// Always returns in 0ms so that card drawing and "Enact" never block or stall
export function getInstantSlothCard(playerCredits: number, mind: number): {
  card: CardPayload;
  hidden: HiddenSlothData;
} {
  // Trigger non-blocking background refill if buffer is low
  if (slothCardBuffer.length < 2) {
    refillSlothBuffer().catch(() => {});
  }

  // If buffer has an AI card ready, pop and return immediately
  if (slothCardBuffer.length > 0) {
    const item = slothCardBuffer.shift()!;
    item.card.id = `sloth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return item;
  }

  // Instant curated procedural card
  const archetypes: SlothArchetype[] = ['lottery', 'gambling'];
  const chosenArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  const matching = CURATED_SLOTH_TEMPLATES.filter(t => t.archetype === chosenArchetype);
  const template = matching.length > 0 ? matching[Math.floor(Math.random() * matching.length)] : CURATED_SLOTH_TEMPLATES[0];
  const cardId = `sloth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const card: CardPayload = {
    id: cardId,
    title: template.title,
    category: template.disguisedCategory,
    tier: 2,
    cost: template.cost,
    rewardDescription: template.rewardDescription,
    description: template.description,
    flavor: template.flavor,
    iconName: template.iconName,
  };

  const hidden: HiddenSlothData = {
    isSloth: true,
    penalty: {
      archetype: template.archetype,
      entropySpike: template.entropySpike,
      entropyRateMultiplier: template.entropyRateMultiplier,
      phantomCredits: 0,
      phantomDurationSec: 0,
      initialCreditsGiven: 0,
    },
  };

  return { card, hidden };
}

// Export generateDynamicSlothCard as an instant synchronous resolver
export function generateDynamicSlothCard(playerCredits: number, mind: number): {
  card: CardPayload;
  hidden: HiddenSlothData;
} {
  return getInstantSlothCard(playerCredits, mind);
}

export async function generateAIPostMortem(telemetry: RunTelemetry): Promise<AIPostMortem> {
  const ai = getAI();
  if (ai) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: `Evaluate the completed session of BoonFest, an anti-sloth pro-social game.
Telemetry data:
- Player: ${telemetry.username} (Duration: ${Math.round(telemetry.durationSeconds)}s)
- Final Credits: ${telemetry.credits}
- Boon Points (Altruism): ${telemetry.boonPoints}
- Growth Pillars: Mind Level ${telemetry.mind}, Body Level ${telemetry.body}, Spirit Level ${telemetry.spirit}
- Deceptive Sloth Traps Fallen For: ${telemetry.slothTrapsTriggered.length > 0 ? telemetry.slothTrapsTriggered.join(', ') : 'None! Exceptional discernment.'}
- Ending Entropy State: ${Math.round(telemetry.entropyAtEnd)}° (0° is red collapse, 120° is green flourishing)

Tasks:
1. Provide a sharp, evocative psychological Archetype Name (e.g. "The Dopamine Speculator", "The Ascetic Philanthropist", "The Burnout Capitalist", "The Discerning Steward").
2. Behavioral Analysis: A concise, insightful narrative analyzing their balance of capital accumulation vs self-care vs generosity vs susceptibility to shortcuts.
3. Key strengths (2 bullet items).
4. Vulnerabilities (2 bullet items).
5. Strategic tips (2 to 3 actionable, targeted tips for subsequent runs).`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  archetypeName: { type: Type.STRING },
                  behavioralAnalysis: { type: Type.STRING },
                  keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  strategicTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['archetypeName', 'behavioralAnalysis', 'keyStrengths', 'vulnerabilities', 'strategicTips'],
              },
            },
          }),
          5000
        );

        const rawText = response.text || '';
        const cleaned = cleanJsonString(rawText);
        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          if (parsed.archetypeName && parsed.behavioralAnalysis) {
            return parsed as AIPostMortem;
          }
        }
      } catch {
        if (i < candidateModels.length - 1) {
          await sleep(350);
          continue;
        }
      }
    }
    console.log('Notice: Gemini service currently under high demand; deployed deterministic behavioral coaching.');
  }

  // Deterministic high-quality fallback coaching
  const traps = telemetry.slothTrapsTriggered.length;
  let archetypeName = 'The Balanced Altruist';
  let analysis = 'You maintained a steady equilibrium between generating capital, personal self-actualization, and funding community boons.';

  if (traps >= 2) {
    archetypeName = 'The Dopamine Speculator';
    analysis = `You fell victim to ${traps} deceptive shortcuts (gambling, illicit stimulants, or raffles). The siren call of quick phantom capital induced systemic default and accelerated crimson entropy.`;
  } else if (telemetry.boonPoints < 200 && telemetry.credits > 250) {
    archetypeName = 'The Anxious Hoarder';
    analysis = 'You accumulated credits aggressively but hesitated to release capital into societal boons. Without active generative altruism, world entropy inevitably pulled the hue into terminal red.';
  } else if (telemetry.body === 1 && telemetry.durationSeconds > 90) {
    archetypeName = 'The Fragile Visionary';
    analysis = 'You focused on intellectual and financial expansion while neglecting bodily somatic recovery. As world entropy accelerated, you had no physical buffer to slow the red decay.';
  } else if (telemetry.boonPoints > 800) {
    archetypeName = 'The Luminous Benefactor';
    analysis = 'Your dedication to societal restoration generated immense boon points, pulling the world repeatedly into emerald green flourishing. True mastery of pro-social economics.';
  }

  return {
    archetypeName,
    behavioralAnalysis: analysis,
    keyStrengths: [
      telemetry.boonPoints > 0 ? `Converted capital into ${telemetry.boonPoints} points of lasting social impact.` : 'Explored baseline economic cycles.',
      telemetry.mind > 1 || telemetry.body > 1 || telemetry.spirit > 1 ? 'Invested in core personal growth pillars.' : 'Completed a focused introductory run.',
    ],
    vulnerabilities: [
      traps > 0 ? `Succumbed to ${traps} deceptive sloth trap(s) with phantom credit surges.` : 'World entropy steadily outpaced credit generation.',
      telemetry.body <= 1 ? 'Body pillar was underdeveloped, leaving entropy acceleration unmitigated.' : 'Did not reserve enough liquidity for high-tier boons.',
    ],
    strategicTips: [
      'Upgrade the Body pillar early: each level significantly dampens baseline entropy acceleration.',
      'Scrutinize high-yield shortcuts: if an opportunity sounds too effortless (gambling, unverified stimulants, raffles), it is a deceptive sloth trap.',
      'Spend credits on Boons before the hue dips below 30° to maintain a comfortable green safety margin.',
    ],
  };
}

export async function generateTrophyArtifact(
  rank: number,
  username: string,
  score: number,
  archetype: string
): Promise<Trophy> {
  const trophyId = `trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let imageUrl = '';

  const ai = getAI();
  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                text: `A prestigious, flashy vector-style golden esports trophy medal emblem for game "BoonFest". 
Rank #${rank} in Global Altruism Leaderboard. 
Theme: Emerald green glowing laurels, polished gold star shield, geometric wings, crystal prism center, clean dark background, hyper-detailed minimalist digital badge.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        }),
        5000
      );

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch {
      // Gracefully fall back to vector SVG medal badge
    }
  }

  // If image generation was not available or failed, generate a bespoke high-status SVG badge data URL
  if (!imageUrl) {
    const goldColor = rank === 1 ? '#F59E0B' : rank <= 3 ? '#EAB308' : '#10B981';
    const accentColor = rank === 1 ? '#FEF08A' : rank <= 3 ? '#FDE047' : '#6EE7B7';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#064E3B" stop-opacity="0.9"/>
          <stop offset="60%" stop-color="#022C22" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#02140F" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentColor}"/>
          <stop offset="50%" stop-color="${goldColor}"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="400" height="400" rx="36" fill="url(#bgGlow)"/>
      <circle cx="200" cy="200" r="160" fill="none" stroke="url(#goldGrad)" stroke-width="3" opacity="0.4"/>
      <circle cx="200" cy="200" r="145" fill="none" stroke="${goldColor}" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>
      
      <!-- Outer Shield Wings -->
      <path d="M120 170 C100 130 110 80 150 90 C160 120 170 150 175 180 Z" fill="url(#goldGrad)" opacity="0.8"/>
      <path d="M280 170 C300 130 290 80 250 90 C240 120 230 150 225 180 Z" fill="url(#goldGrad)" opacity="0.8"/>
      
      <!-- Central Heraldic Emblem -->
      <polygon points="200,95 270,140 270,230 200,285 130,230 130,140" fill="#064E3B" stroke="url(#goldGrad)" stroke-width="6" filter="url(#glow)"/>
      
      <!-- Star & Rank -->
      <path d="M200 125 L212 158 L248 158 L219 179 L230 212 L200 192 L170 212 L181 179 L152 158 L188 158 Z" fill="url(#goldGrad)" />
      
      <text x="200" y="255" text-anchor="middle" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="800" font-size="28" fill="#ECFDF5" letter-spacing="2">TOP ${rank}</text>
      <text x="200" y="325" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="700" font-size="16" fill="${goldColor}">BOONFEST ELITE</text>
      <text x="200" y="350" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="500" font-size="12" fill="#9CA3AF">${score.toLocaleString()} PTS • @${username}</text>
    </svg>`;
    imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  return {
    id: trophyId,
    title: `Elite Leaderboard Rank #${rank}`,
    description: `Awarded to @${username} for achieving ${score.toLocaleString()} Boon Points with archetype "${archetype}".`,
    rank,
    score,
    date: new Date().toISOString().split('T')[0],
    imageUrl,
    badgeType: 'top10_elite',
  };
}
