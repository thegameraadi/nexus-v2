import { DayDigest, IndexEntry } from './types';

export const PLACEHOLDER_INDEX: IndexEntry[] = [
  { date: '2026-09-21', label: 'Today' },
  { date: '2026-09-20', label: 'Yesterday' },
  { date: '2026-09-19', label: 'Sep 19' },
  { date: '2026-09-18', label: 'Sep 18' },
  { date: '2026-09-17', label: 'Sep 17' },
  { date: '2026-09-16', label: 'Sep 16' },
  { date: '2026-09-15', label: 'Sep 15' },
];

export const PLACEHOLDER_DIGEST: DayDigest = {
  date: '2026-09-21',
  label: 'Today',
  agentLog: [
    { timestamp: '05:00:02', module: 'SCOUT', message: 'Ingested 142 items from 28 RSS, arXiv, SEC EDGAR, and HN feeds across 5 beats.', status: 'ok' },
    { timestamp: '05:00:14', module: 'RANK', message: 'Deduplicated 37 redundant wire syndications. Scored 105 candidates on authority & novelty.', status: 'ok' },
    { timestamp: '05:00:26', module: 'SYNTH', message: 'Synthesized top 22 candidates via LLM. Token audit: 18,450 tokens. Est cost: $0.0037.', status: 'ok' },
    { timestamp: '05:00:39', module: 'EDITOR', message: 'Enforced column quotas. 12 items promoted to primary briefing edition.', status: 'ok' },
    { timestamp: '05:00:45', module: 'PUBLISH', message: 'Static artifacts generated: public/data/2026-09-21.json and index.json updated.', status: 'ok' }
  ],
  beats: {
    'ai-venture': {
      columns: {
        venture: [
          {
            id: 'aiv-101',
            source: 'TechCrunch / SEC Form D',
            date: '2026-09-21',
            headline: 'Cognitive Foundry Closes $380M Series B for On-Device Agent Chips',
            summary: 'The custom silicon startup unveiled its sub-5W neuromorphic matrix processor designed to execute 30B parameter frontier models entirely offline. Capital will fund initial tape-outs at TSMC 3nm nodes alongside dedicated driver stacks. Enterprise pilots with three major robotics OEMs are scheduled for Q1 2027.',
            tag: 'SERIES-B',
            url: 'https://news.ycombinator.com',
            thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80',
            beat: 'ai-venture',
            column: 'venture',
            scores: { authority: 8.8, corroboration: 8.5, novelty: 9.1, magnitude: 8.9, relevance: 9.4, total: 8.9 }
          },
          {
            id: 'aiv-102',
            source: 'Reuters / PitchBook',
            date: '2026-09-21',
            headline: 'European Sovereign Tech Fund Deploys €1.2B into Decentralized Compute Hubs',
            summary: 'The pan-European sovereign syndicate finalized funding for five zero-carbon data centres across the Nordics. The initiative mandates open-source model weights for all compute recipients and guarantees priority grid balancing through surplus hydro capacity. Commercial operations are slated to commence within 18 months.',
            tag: 'INFRASTRUCTURE',
            url: 'https://www.reuters.com',
            thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=200&q=80',
            beat: 'ai-venture',
            column: 'venture',
            scores: { authority: 9.0, corroboration: 8.7, novelty: 8.0, magnitude: 8.6, relevance: 8.8, total: 8.6 }
          }
        ],
        research: [
          {
            id: 'aiv-201',
            source: 'arXiv / cs.AI',
            date: '2026-09-21',
            headline: 'Recursive Self-Verification Yields Sub-Exponential Scaling in Autonomous Theorem Provers',
            summary: 'Researchers demonstrate an asymmetric verification mechanism that reduces inference hallucination rates below 0.04% across complex algebraic proofs. By separating conjecture drafting from formal lean4 kernel validation, the system exhibits robust test-time compute gains without synthetic data collapse. Open checkpoints and evaluation benchmarks were released simultaneously.',
            tag: 'RECURSIVE-VERIFICATION',
            url: 'https://arxiv.org',
            thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=200&q=80',
            beat: 'ai-venture',
            column: 'research',
            scores: { authority: 9.5, corroboration: 8.9, novelty: 9.6, magnitude: 9.1, relevance: 9.5, total: 9.3 }
          },
          {
            id: 'aiv-202',
            source: 'MIT Technology Review',
            date: '2026-09-21',
            headline: 'Sparse Continuous Memory Networks Decouple Context Length from Memory Footprint',
            summary: 'A new architecture combines state-space filtering with dynamic episodic key-value compaction, demonstrating 4M token context retention with fixed O(1) memory overhead. Benchmark evaluations show negligible latency degradation across long-horizon code refactoring tasks.',
            tag: 'CONTEXT-SCALING',
            url: 'https://www.technologyreview.com',
            thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=200&q=80',
            beat: 'ai-venture',
            column: 'research',
            scores: { authority: 8.7, corroboration: 8.2, novelty: 8.9, magnitude: 8.4, relevance: 8.9, total: 8.6 }
          }
        ],
        titans: [
          {
            id: 'aiv-301',
            source: 'Bloomberg Business',
            date: '2026-09-21',
            headline: 'Hyperscalers Negotiate 10-Gigawatt Direct Nuclear Power Purchase Agreements',
            summary: 'Three leading cloud titans entered joint negotiations with small modular reactor (SMR) consortia to secure dedicated baseload energy contracts through 2035. The agreements represent the largest private atomic utility procurement in history and aim to bypass transmission queue congestion. First reactor deployments are slated for 2028.',
            tag: 'ENERGY-GRID',
            url: 'https://www.bloomberg.com',
            thumbnail: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=200&q=80',
            beat: 'ai-venture',
            column: 'titans',
            scores: { authority: 9.4, corroboration: 9.2, novelty: 8.5, magnitude: 9.6, relevance: 9.2, total: 9.2 }
          }
        ]
      }
    },
    'politics': {
      columns: {
        regulatory: [
          {
            id: 'pol-101',
            source: 'Financial Times / DOJ',
            date: '2026-09-21',
            headline: 'Federal Trade Commission Finalizes Scrutiny Framework for Autonomous Agent Monopolies',
            summary: 'The new regulatory guideline establishes strict audit obligations for proprietary workflow engines that hold exclusive enterprise tool-calling interfaces. Platforms mediating multi-vendor software actions must offer standardized open API execution rails without discriminatory access latency. Enforcement begins following a 90-day public notice window.',
            tag: 'ANTITRUST',
            url: 'https://www.ft.com',
            thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=200&q=80',
            beat: 'politics',
            column: 'regulatory',
            scores: { authority: 9.3, corroboration: 9.1, novelty: 8.4, magnitude: 9.0, relevance: 8.7, total: 8.9 }
          }
        ],
        global: [
          {
            id: 'pol-201',
            source: 'Associated Press',
            date: '2026-09-21',
            headline: 'Tri-Lateral Semiconductor Treaty Establishes Advanced Packaging Safeguards',
            summary: 'Trade ministers from Japan, the Netherlands, and South Korea signed a unified standard regulating high-density 2.5D/3D substrate exports. The accord harmonizes inspection regimes across chiplet interconnect equipment while expediting joint research licenses for domestic academic consortia.',
            tag: 'GLOBAL-TRADE',
            url: 'https://apnews.com',
            thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=200&q=80',
            beat: 'politics',
            column: 'global',
            scores: { authority: 9.1, corroboration: 9.0, novelty: 8.1, magnitude: 8.8, relevance: 8.6, total: 8.7 }
          }
        ],
        voices: [
          {
            id: 'pol-301',
            source: 'Foreign Affairs',
            date: '2026-09-21',
            headline: 'The Post-Algorithmic State: How Computational Sovereignty Replaces Territorial Borders',
            summary: 'A landmark policy essay argues that national economic resilience is increasingly dictated by sovereign model weights and domestic inference capacity rather than geographical boundaries. The authors propose creating multilateral compute reserves to deter coercive computational sanctions.',
            tag: 'COMMENTARY',
            url: 'https://www.foreignaffairs.com',
            thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80',
            beat: 'politics',
            column: 'voices',
            scores: { authority: 8.6, corroboration: 7.9, novelty: 8.7, magnitude: 8.2, relevance: 8.4, total: 8.3 }
          }
        ]
      }
    },
    'markets': {
      columns: {
        macro: [
          {
            id: 'mkt-101',
            source: 'The Wall Street Journal',
            date: '2026-09-21',
            headline: 'Treasury Yields Stabilize as Productivity Gauges Absorb Autonomous Workflow Gains',
            summary: 'Ten-year note yields held steady near 3.92% as central bank economists published revisions crediting automated document reconciliation with a 0.3% non-inflationary output expansion. Bond traders noted muted term-premium volatility despite heavy sovereign auction supply.',
            tag: 'TREASURIES',
            url: 'https://www.wsj.com',
            thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=200&q=80',
            beat: 'markets',
            column: 'macro',
            scores: { authority: 9.2, corroboration: 9.0, novelty: 8.3, magnitude: 8.7, relevance: 8.9, total: 8.8 }
          }
        ],
        'company-moves': [
          {
            id: 'mkt-201',
            source: 'SEC EDGAR / Form 8-K',
            date: '2026-09-21',
            headline: 'Foundry Giant Reorganizes Packaging Division Following $4.2B Capital Expenditure Reallocation',
            summary: 'In an early morning 8-K filing, the manufacturer outlined a strategic pivot toward optical co-packaging lines, converting an older planar node fabrication facility into a hybrid photonics foundry. Margin guidance for fiscal 2027 was reaffirmed within prior target bands.',
            tag: 'CAPEX',
            url: 'https://www.sec.gov/edgar',
            thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=200&q=80',
            beat: 'markets',
            column: 'company-moves',
            scores: { authority: 9.6, corroboration: 9.3, novelty: 8.6, magnitude: 9.2, relevance: 9.0, total: 9.1 }
          }
        ],
        analysts: [
          {
            id: 'mkt-301',
            source: 'Morgan Stanley Research',
            date: '2026-09-21',
            headline: 'Software Valuations Diverge as Per-Seat Pricing Models Give Way to Token Telemetry',
            summary: 'An equity research note tracking 40 enterprise SaaS providers reveals median revenue multiple compression of 18% for seats-only vendors, compared to a 34% multiple expansion for usage-based orchestration APIs. The analysts expect consolidation pressure to peak ahead of year-end procurement cycles.',
            tag: 'EQUITIES',
            url: 'https://www.morganstanley.com',
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80',
            beat: 'markets',
            column: 'analysts',
            scores: { authority: 8.9, corroboration: 8.6, novelty: 8.8, magnitude: 8.5, relevance: 9.1, total: 8.8 }
          }
        ]
      }
    },
    'science': {
      columns: {
        frontier: [
          {
            id: 'sci-101',
            source: 'Nature / CERN',
            date: '2026-09-21',
            headline: 'High-Temperature Superconducting Magnets Surpass 28-Tesla Operational Threshold',
            summary: 'Engineers achieved continuous field stability using rare-earth barium copper oxide tape coils, paving the way for compact magnetic confinement fusion reactors with one-fourth the footprint of conventional tokamaks. Cryogenic thermal management remained within planned design limits during a 48-hour continuous pulse test.',
            tag: 'FUSION-ENERGY',
            url: 'https://www.nature.com',
            thumbnail: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=200&q=80',
            beat: 'science',
            column: 'frontier',
            scores: { authority: 9.7, corroboration: 9.4, novelty: 9.7, magnitude: 9.5, relevance: 9.3, total: 9.5 }
          },
          {
            id: 'sci-102',
            source: 'Science Advances',
            date: '2026-09-21',
            headline: 'Engineered Dehalogenase Enzymes Catalyze Rapid PFAS Degradation in Municipal Sludge',
            summary: 'A computational protein engineering team created an enzymatic cascade capable of severing carbon-fluorine bonds in perfluorinated compounds at ambient room temperatures. Pilot filtration trials degraded 94% of legacy surfactants within six hours without producing toxic halogenated intermediates.',
            tag: 'BIOENGINEERING',
            url: 'https://www.science.org',
            thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=200&q=80',
            beat: 'science',
            column: 'frontier',
            scores: { authority: 9.4, corroboration: 8.8, novelty: 9.5, magnitude: 9.2, relevance: 8.9, total: 9.2 }
          }
        ]
      }
    },
    'culture': {
      columns: {
        industry: [
          {
            id: 'cul-101',
            source: 'Wired',
            date: '2026-09-21',
            headline: 'Independent Game Studios Pivot to Local Model Weights for Procedural Narrative Generation',
            summary: 'A survey of 120 independent developers indicates widespread adoption of quantized 8B-parameter narrative engines running locally on player hardware. The shift enables zero-marginal-cost interactive dialogue while circumventing cloud API rate limits and privacy compliance hurdles.',
            tag: 'GAMING-ECOSYSTEM',
            url: 'https://www.wired.com',
            thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
            beat: 'culture',
            column: 'industry',
            scores: { authority: 8.4, corroboration: 8.1, novelty: 8.6, magnitude: 7.9, relevance: 8.5, total: 8.3 }
          }
        ],
        voices: [
          {
            id: 'cul-201',
            source: 'The Atlantic',
            date: '2026-09-21',
            headline: 'The Paradox of Endless Synthesis: Why Human Curation Remains the Ultimate Scarcity',
            summary: 'In an era of frictionless summarization, deep intellectual discernment and verified provenance emerge as luxury commodities. The essay examines how automated digests function not as replacements for original investigative journalism, but as navigational compasses through informational saturation.',
            tag: 'CRITIQUE',
            url: 'https://www.theatlantic.com',
            thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=200&q=80',
            beat: 'culture',
            column: 'voices',
            scores: { authority: 8.7, corroboration: 8.0, novelty: 8.9, magnitude: 8.1, relevance: 8.7, total: 8.5 }
          }
        ]
      }
    }
  }
};
