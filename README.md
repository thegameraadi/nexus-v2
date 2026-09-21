# NEXUS v2 — Agentic Daily News Briefing

> Standalone, client-rendered news briefing web application with deterministic multi-factor scoring and scheduled autonomous synthesis. Built from scratch with Vite, React 18, TypeScript, Tailwind CSS v4, and static JSON data.

---

## Non-Negotiable Constraints & Architecture

1. **Zero Database / Pure Client-Side Privacy**:
   - No Supabase, no Firebase, no cloud database service of any kind.
   - All reader personalization (selected beats, bookmarks, reading list) is stored strictly in `localStorage` (`nexus-beats`, `nexus-saved-<id>`).
   - Zero telemetry, zero analytics cookies, and zero user data ever leaves the browser.
2. **Static JSON Delivery**:
   - The React SPA reads purely from static JSON files committed under `/public/data/`:
     - `/public/data/index.json` (last 7 `{ date, label }` entries)
     - `/public/data/YYYY-MM-DD.json` (full `DayDigest` for that date)
   - Fallback bundled placeholder data prevents blank screens if network or static files are unavailable.
3. **Monochrome Design System**:
   - **Background**: `#08080a`, flat, no gradient.
   - **Card Fill**: `rgba(255,255,255,0.025)`, border: `1px solid rgba(255,255,255,0.07)`, radius: `16px` (`rounded-2xl`).
   - **Card Backdrop**: `backdrop-filter: blur(12px) saturate(0%)`.
   - **Wordmark**: `DM Mono`, font-weight `100`, `0.4em` letter-spacing, uppercase (`N E X U S`).
   - **Meta**: `DM Mono`, `12px` minimum, `0.2em` letter-spacing, `zinc-400` / `zinc-500`.
   - **Content**: `Inter`, `15px` medium `zinc-100` headlines, `13px` `zinc-400` body.
   - **Imagery**: `grayscale(100%)`, reduced brightness.
   - **Grain**: Fixed inline SVG `feTurbulence` at 3% opacity (`pointer-events-none`).
   - **Contrast**: Full WCAG AA compliance verified across all typography against `#08080a`.

---

## 5-Factor Ranking Engine

Each dispatch is ranked across 5 distinct dimensions (0 to 10):
- **Authority (25%)**: Source pedigree, verified peer review, regulatory filing authenticity (e.g. arXiv, SEC EDGAR, Nature).
- **Corroboration (20%)**: Cross-source clustering and frequency of confirmation across distinct wire syndications.
- **Novelty (20%)**: Technical breakthrough signals, algorithmic firsts, and non-derivative reporting.
- **Magnitude (20%)**: Scope of impact (capital volume, sovereign action, compute scale, legislative mandates).
- **Relevance (15%)**: Signal-to-noise ratio and strategic applicability to frontier technology and policy.

$$\text{Total Score} = 0.25 \times \text{Auth} + 0.20 \times \text{Corr} + 0.20 \times \text{Nov} + 0.20 \times \text{Mag} + 0.15 \times \text{Rel}$$

---

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Build production static bundle
npm run build
```

---

## Running the Pipeline Locally

The content pipeline lives in `scripts/pipeline.mjs` and executes five functions in order: `scout` -> `rank` -> `synth` -> `editor` -> `publish`.

```bash
# Run with optional LLM API key (Gemini) and Reddit credentials
export GEMINI_API_KEY="your-gemini-api-key"
export REDDIT_CLIENT_ID="your-reddit-app-id"
export REDDIT_CLIENT_SECRET="your-reddit-secret"

node scripts/pipeline.mjs
```

> **Note**: If run without API keys, the pipeline automatically activates its **deterministic algorithmic synthesis engine**, extracting core analytical claims, formatting 2-3 sentence summaries, computing multi-factor scores, and outputting valid JSON offline with $0.00 cost.

---

## How to Add a New RSS Source

Open `scripts/sources.json` and locate the target beat. Add an entry to the `rss` array:

```json
{
  "name": "Custom Source Name",
  "url": "https://example.com/feed.xml",
  "defaultColumn": "venture",
  "authority": 9.0
}
```

- `name`: Displayed source attribution badge in the UI.
- `url`: Public RSS/Atom feed endpoint.
- `defaultColumn`: Destination column within the beat (e.g. `venture`, `research`, `titans`, `regulatory`, `macro`, etc.).
- `authority`: Baseline authority score (0 to 10) for the ranking engine.

---

## How to Add a New Beat

1. **Update `scripts/sources.json`**:
   Add the new beat key and define its columns and sources:
   ```json
   "energy": {
     "columns": ["grid", "nuclear", "storage"],
     "rss": [
       { "name": "Clean Energy Wire", "url": "https://example.com/rss", "defaultColumn": "grid", "authority": 8.8 }
     ]
   }
   ```

2. **Update TypeScript Types in `src/lib/nexus/types.ts`**:
   - Extend `BeatId`:
     ```typescript
     export type BeatId = 'ai-venture' | 'politics' | 'markets' | 'science' | 'culture' | 'energy';
     ```
   - Add definition to `BEAT_DEFINITIONS`:
     ```typescript
     'energy': {
       id: 'energy',
       label: 'Energy & Grid',
       description: 'Next-generation baseload power, grid topology, and storage systems.',
       columns: ['grid', 'nuclear', 'storage']
     }
     ```

3. Rebuild with `npm run build`. The frontend and `BeatPicker` will automatically incorporate the new beat.

---

## Connecting to Netlify (Deployment)

1. Push your repository to GitHub (`main` branch).
2. Log into the [Netlify Dashboard](https://app.netlify.com/).
3. Click **"Add new site"** -> **"Import an existing project"** -> **GitHub**.
4. Select your `nexus-v2` repository.
5. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **Deploy nexus-v2**.
7. In your GitHub repository settings, go to **Secrets and variables** -> **Actions** and add:
   - `GEMINI_API_KEY` (optional, for LLM synthesis)
   - `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` (optional, for Reddit ingestion)

Whenever the scheduled GitHub Action runs at `05:00 UTC`, it commits the newly synthesized JSON under `/public/data/` directly to `main`. Netlify detects the push and auto-deploys a fresh static build within seconds.
