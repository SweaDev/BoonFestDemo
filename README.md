# BoonFest

> **An anti-sloth, pro-social web game balancing capital accumulation, self-cultivation, and societal welfare through generative altruism.**

---

## 🌟 Overview

**BoonFest** challenges players to resist deceptive short-cuts and predatory economic traps while navigating the delicate tri-fold balance between personal capital, self-mastery, and civic altruism.

As you navigate real-time economic turns, entropy steadily degrades your societal environment—visualized dynamically by your world's **Ecosystem Hue** (shifting from verdant green towards catastrophic crimson red). Only by cultivating your core attributes and funneling personal wealth into pro-social **Boon** projects can you stabilize the world, conquer entropy, and achieve enduring legacy.

---

## 🎮 Gameplay Details & Mechanics

### 1. The Three Pillars of Self-Cultivation
Your attributes dictate your capacity for honest productivity, physical resilience, and altruistic impact:

| Pillar | Symbol | Primary Function | Strategic Value |
| :--- | :---: | :--- | :--- |
| **Mind** | 🧠 | **Labor Efficiency** | Multiplies net Credit yields from honest **Earn** cards. Higher Mind unlocks high-tier intellectual and architectural contracts. |
| **Body** | ⚡ | **Entropy Dampening** | Bolsters physical and operational endurance, reducing the passive decay rate of your Ecosystem Hue. |
| **Spirit** | 🕊️ | **Altruistic Resonance** | Amplifies **Boon Points** earned from civic philanthropy and substantially increases Hue restoration. |

---

### 2. Action Card Categories
Each turn, a curated hand of action cards is drawn into an interactive 3D perspective carousel:

* 💼 **Earn Cards (Green / Emerald)**
  * Honest civic productivity, ethical labor, and constructive trade.
  * Generates permanent credits scaled by your **Mind** score.
  * Free or low upfront cost.

* 📚 **Grow Cards (Blue / Indigo)**
  * Self-cultivation, education, resilience training, and meditative discipline.
  * Consumes credits to permanently increase your **Mind**, **Body**, or **Spirit** attributes.
  * Unlocks higher-tier professional opportunities and defensive fortitude.

* 🏛️ **Boon Cards (Purple / Gold)**
  * Pro-social philanthropy: Debt jubilee funds, public renewable infrastructure, open clinics, mutual aid networks, and sanctuary reserves.
  * Sacrifices personal capital to generate **Boon Points** (the primary metric of game victory and leaderboard ranking) while rolling back entropy and restoring the **Ecosystem Hue** back toward verdant green.

* 🃏 **Deceptive Sloth Traps (Hidden Masquerade)**
  * Disguised seamlessly as extraordinarily lucrative Earn or Grow cards (e.g., flash leverage schemes, high-yield scratch cards, instant euphoria mist).
  * **The Trap**: Awards short-lived **Phantom Credits** that vanish after a few seconds, while triggering immediate **Entropy Spikes**, permanently accelerated decay rates, and attribute damage.
  * Dynamically synthesized at runtime using **Gemini AI** or drawn from curated procedural templates.

---

### 3. The Entropy & Hue Dynamic
* **Hue Spectrum**: Ranging from **120° (Verdant Green)** down to **0° (Crimson Red)**.
* **Passive Decay**: Society decays naturally over time; higher **Body** attributes slow this rate.
* **Red Alert Threshold**: When Hue drops to **0°**, a critical 5-second countdown initiates. If you fail to enact an altruistic Boon card or counter entropy before the timer reaches zero, the run terminates in **Ecosystem Collapse**.

---

### 4. Generative AI & Deep Post-Mortem
* **Dynamic Trap Synthesis**: Powered server-side by Google Gemini Flash to generate contextual deceptive cards adapted to your current wealth and attribute tier.
* **Cognitive Behavioral Post-Mortem**: At game over, Gemini evaluates full run telemetry (spending habits, temptation resistance, attribute focus, and altruism ratio) to output:
  * A bespoke **Behavioral Archetype** (e.g., *The Hyper-Leveraged Speculator*, *The Ascetic Altruist*, *The Civic Architect*).
  * In-depth psychological analysis of decisions.
  * Strategic recommendations for subsequent runs.
* **Procedural Fallback**: If an API key is not present, robust procedural engines supply offline templates, ensuring uninterrupted gameplay.

---

### 5. Ethical Design & Well-Being Engine
* **Playtime Safeguards**: Built-in 30-minute rolling session caps and 24-hour limits ensure healthy, non-addictive play patterns.
* **Full Keyboard Accessibility**:
  * `←` / `→` or `A` / `D`: Browse carousel cards.
  * `Space` or `Enter`: Enact focused card.
  * `M`: Toggle procedural audio effects.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons.
* **Backend**: Node.js, Express, tsx, esbuild.
* **Audio**: Procedural Web Audio API sound synthesis (zero external audio asset dependencies).
* **AI Integration**: `@google/genai` (Google Gemini API with server-side proxying).

---

## 🚀 Installation & Local Setup

### Prerequisites
* **Node.js**: Version `18.x` or `20.x`+ installed.
* **npm**: Version `9.x`+ installed.
* *(Optional)* **Google Gemini API Key**: For live AI trap generation and personalized behavioral post-mortems.

---

### Step 1: Clone or Extract the Repository
```bash
git clone <repository-url>
cd boonfest
```

---

### Step 2: Install Dependencies
Install all required client and server dependencies:
```bash
npm install
```

---

### Step 3: Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key (optional for local offline play):
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

> **Note**: If `GEMINI_API_KEY` is omitted, BoonFest automatically engages its curated procedural card generator and local post-mortem logic with zero downtime.

---

### Step 4: Run the Development Server
Start the unified full-stack development server:
```bash
npm run dev
```

* The application will boot at: **`http://localhost:3000`**
* Express serves the backend API routes (`/api/*`) while Vite provides fast development asset serving.

---

## 📦 Production Build & Deployment

### Build the Application
Compile the frontend static bundle and create the self-contained backend bundle:
```bash
npm run build
```
This performs:
1. `vite build`: Generates optimized client bundles into `dist/`.
2. `esbuild server.ts`: Bundles the Express backend into `dist/server.cjs`.

### Start in Production Mode
```bash
npm start
```
The server will start listening on port `3000` (or the port defined by your container environment).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Boots the Express server with Vite middleware in development mode via `tsx`. |
| `npm run build` | Compiles frontend assets and bundles `server.ts` into `dist/server.cjs`. |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`). |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |
| `npm run clean` | Cleans build artifacts (`dist/`). |

---

## 🏆 Scoring & High Scores

* **Boon Points**: The primary measure of your societal legacy.
* **Top 10 Hall of Fame**: Enduring runs with high Boon point yields qualify for the global leaderboard and unlock celebratory digital trophies.
