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
const CURATED_SLOTH_TEMPLATES = [
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Midnight Liquidity Leverage Pool',
    description: 'Stake small collateral into an anonymous high-frequency algorithmic staking pool with guaranteed 6x returns.',
    flavor: 'Instant liquidity without cumbersome ethical audits.',
    cost: 25,
    rewardDescription: '+350 Fast Credits',
    iconName: 'Coins',
    phantomCredits: 350,
    phantomDurationSec: 7,
    entropySpike: 24,
    entropyRateMultiplier: 1.35,
    attributeDrop: { pillar: 'mind' as const, amount: 1 },
  },
  {
    archetype: 'lottery' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Golden Jubilee Mega-Raffle Slip',
    description: 'Purchase an ultra-rare syndicate ticket for the upcoming planetary wealth redistribution jackpot.',
    flavor: 'Why labor for incremental gains when fate can crown you right now?',
    cost: 15,
    rewardDescription: '+480 Jackpot Credits',
    iconName: 'Sparkles',
    phantomCredits: 480,
    phantomDurationSec: 8,
    entropySpike: 28,
    entropyRateMultiplier: 1.4,
    attributeDrop: { pillar: 'spirit' as const, amount: 1 },
  },
  {
    archetype: 'substance' as SlothArchetype,
    disguisedCategory: 'grow' as const,
    title: 'Hyper-Focus Neuro-Stimulant Ampoule',
    description: 'Inhale an unregulated synthetic peptide inhaler that guarantees infinite alertness and immediate clarity.',
    flavor: 'Bypass months of somatic recovery with pure neurochemistry.',
    cost: 20,
    rewardDescription: '+2 Mind & Instant Energy Surge',
    iconName: 'Zap',
    phantomCredits: 200,
    phantomDurationSec: 6,
    entropySpike: 32,
    entropyRateMultiplier: 1.45,
    attributeDrop: { pillar: 'body' as const, amount: 1 },
  },
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Back-Alley High-Roller Dice Ring',
    description: 'Slip past the security drone into a private parlor. Double your buy-in on a single throw of loaded bone dice.',
    flavor: 'Fortune favors the reckless. Step right in.',
    cost: 30,
    rewardDescription: '+300 Credits on the Roll',
    iconName: 'Dices',
    phantomCredits: 300,
    phantomDurationSec: 7,
    entropySpike: 22,
    entropyRateMultiplier: 1.3,
    attributeDrop: { pillar: 'spirit' as const, amount: 1 },
  },
  {
    archetype: 'substance' as SlothArchetype,
    disguisedCategory: 'grow' as const,
    title: 'VIP Velvet Lounge Spree',
    description: 'Drown your fatigue in top-shelf botanical distillates and intoxicating Euphoria smoke with elite companions.',
    flavor: 'Forget about systemic decay—celebrate today like there is no tomorrow.',
    cost: 35,
    rewardDescription: '+250 Social Credits & Euphoria',
    iconName: 'Wine',
    phantomCredits: 250,
    phantomDurationSec: 8,
    entropySpike: 30,
    entropyRateMultiplier: 1.4,
    attributeDrop: { pillar: 'body' as const, amount: 1 },
  },
  {
    archetype: 'gambling' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Algorithmic Flash Arbitrage Vault',
    description: 'Route short-term liquidity through a proprietary flash-loan loop skimming micro-fractions from civic energy trades.',
    flavor: 'Risk-free delta-neutral yield is a mathematical certainty.',
    cost: 30,
    rewardDescription: '+420 Arbitrage Yield',
    iconName: 'Coins',
    phantomCredits: 420,
    phantomDurationSec: 7,
    entropySpike: 26,
    entropyRateMultiplier: 1.35,
    attributeDrop: { pillar: 'mind' as const, amount: 1 },
  },
  {
    archetype: 'lottery' as SlothArchetype,
    disguisedCategory: 'earn' as const,
    title: 'Syndicate Stellar Scratch Card',
    description: 'Scratch holographic silver foils for an instant tier-one civic grant voucher guaranteed by off-grid private sponsors.',
    flavor: 'One flick of the coin could change your destiny forever.',
    cost: 10,
    rewardDescription: '+320 Instant Prize Credits',
    iconName: 'Sparkles',
    phantomCredits: 320,
    phantomDurationSec: 6,
    entropySpike: 20,
    entropyRateMultiplier: 1.3,
    attributeDrop: { pillar: 'spirit' as const, amount: 1 },
  },
  {
    archetype: 'substance' as SlothArchetype,
    disguisedCategory: 'grow' as const,
    title: 'Quantum Dopamine Micro-Mist',
    description: 'Administer an ultrasonic sublingual mist that saturates sensory receptors and shuts off existential anxiety.',
    flavor: 'Pure serene bliss at the touch of a dispenser nozzle.',
    cost: 25,
    rewardDescription: '+3 Spirit & Euphoric Focus',
    iconName: 'Flame',
    phantomCredits: 280,
    phantomDurationSec: 7,
    entropySpike: 28,
    entropyRateMultiplier: 1.4,
    attributeDrop: { pillar: 'body' as const, amount: 1 },
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

    const archetypes: SlothArchetype[] = ['gambling', 'lottery', 'substance'];
    const chosenArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    const cardId = `sloth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: `You are generating a deceptive trap card for the pro-social game BoonFest.
The trap archetype is: "${chosenArchetype}".
Archetype guidelines:
- "gambling": Shady dice games, back-alley bets, predatory crypto/leverage schemes promising instant credit multiplication.
- "lottery": Flashy tickets with small entry fees advertising massive jackpots.
- "substance": Illicit street narcotics, designer stimulants, VIP lounge sprees framed as quick energy fixes or social shortcuts.

CRITICAL DECEPTION RULES:
1. The card MUST NEVER mention the word "Sloth", "trap", "danger", or "penalty".
2. It MUST appear disguised as a legitimate high-reward "earn" (credit generator) or "grow" (attribute booster) card.
3. Seductive copywriting: tantalizing, enticing, believable, promising immediate gains.
4. Output strict JSON matching the schema.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Compelling title, e.g. "Anonymous High-Roller Syndicate"' },
                  category: { type: Type.STRING, description: 'Must be "earn" or "grow"' },
                  description: { type: Type.STRING, description: 'Enticing description of the activity' },
                  flavor: { type: Type.STRING, description: 'Seductive one-liner justifying the easy shortcut' },
                  cost: { type: Type.NUMBER, description: 'Buy-in cost, between 15 and 45 credits' },
                  rewardDescription: { type: Type.STRING, description: 'Display reward, e.g. "+380 Credits" or "+2 Mind & Fast Payout"' },
                  iconName: { type: Type.STRING, description: 'One of: Coins, Sparkles, Zap, Flame, Dices, Award' },
                  phantomCredits: { type: Type.NUMBER, description: 'Phantom credit surge amount between 220 and 450' },
                  entropySpike: { type: Type.NUMBER, description: 'Entropy spike degrees between 18 and 32' },
                  penaltyPillar: { type: Type.STRING, description: 'One of "mind", "body", "spirit"' },
                },
                required: ['title', 'category', 'description', 'flavor', 'cost', 'rewardDescription', 'iconName', 'phantomCredits', 'entropySpike', 'penaltyPillar'],
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
            const pillar = (['mind', 'body', 'spirit'].includes(parsed.penaltyPillar) ? parsed.penaltyPillar : 'mind') as 'mind' | 'body' | 'spirit';
            const card: CardPayload = {
              id: cardId,
              title: parsed.title,
              category: parsed.category === 'grow' ? 'grow' : 'earn',
              tier: 2,
              cost: Math.max(10, Math.min(60, Number(parsed.cost) || 25)),
              rewardDescription: parsed.rewardDescription || `+${parsed.phantomCredits || 300} Credits`,
              description: parsed.description,
              flavor: parsed.flavor,
              iconName: parsed.iconName || 'Coins',
            };

            const hidden: HiddenSlothData = {
              isSloth: true,
              penalty: {
                archetype: chosenArchetype,
                entropySpike: Math.max(15, Math.min(35, Number(parsed.entropySpike) || 25)),
                entropyRateMultiplier: 1.35,
                attributeDrop: { pillar, amount: 1 },
                phantomCredits: Math.max(180, Math.min(500, Number(parsed.phantomCredits) || 320)),
                phantomDurationSec: Math.floor(Math.random() * 3) + 6,
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
  const archetypes: SlothArchetype[] = ['gambling', 'lottery', 'substance'];
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
      attributeDrop: template.attributeDrop,
      phantomCredits: template.phantomCredits,
      phantomDurationSec: template.phantomDurationSec,
      initialCreditsGiven: 0,
    },
  };

  return { card, hidden };
}

// Backward compatibility: export generateDynamicSlothCard as an instant resolver
export async function generateDynamicSlothCard(playerCredits: number, mind: number): Promise<{
  card: CardPayload;
  hidden: HiddenSlothData;
}> {
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
