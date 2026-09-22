export type BeatId = 'ai-venture' | 'politics' | 'markets' | 'science' | 'culture';

export interface DigestScoreBreakdown {
  authority: number;      // 0 - 10
  corroboration: number;  // 0 - 10
  novelty: number;        // 0 - 10
  magnitude: number;      // 0 - 10
  relevance: number;      // 0 - 10
  total: number;          // 0 - 10 (weighted composite)
}

export interface DigestItem {
  id: string;
  source: string;
  date: string;            // YYYY-MM-DD
  headline: string;
  summary: string;         // 2-3 sentences
  tag?: string;
  url?: string;            // canonical link; if absent, link to a Google News search built from the headline
  thumbnail?: string;
  beat: BeatId;
  column: string;          // e.g. 'venture' | 'research' | 'titans'
  scores: DigestScoreBreakdown;
}

export interface AgentLogEntry {
  timestamp: string;
  module: string;
  message: string;
  status: 'ok' | 'warn' | 'error';
}

export interface DayDigest {
  date: string;
  label: string;           // 'Today' | 'Yesterday' | 'May 15'
  lastUpdated?: string;    // ISO 8601 timestamp of last synthesis run
  agentLog: AgentLogEntry[];
  beats: Record<string, { columns: Record<string, DigestItem[]> }>;
}

export interface IndexEntry {
  date: string;
  label: string;
}

export interface BeatDefinition {
  id: BeatId;
  label: string;
  description: string;
  columns: string[];
}

export const BEAT_DEFINITIONS: Record<BeatId, BeatDefinition> = {
  'ai-venture': {
    id: 'ai-venture',
    label: 'AI & Venture',
    description: 'Foundational models, research preprints, compute, capital allocation, and lab moves.',
    columns: ['venture', 'research', 'titans']
  },
  'politics': {
    id: 'politics',
    label: 'Politics & Policy',
    description: 'Antitrust, AI governance, global semiconductor treaties, and regulatory filings.',
    columns: ['regulatory', 'global', 'voices']
  },
  'markets': {
    id: 'markets',
    label: 'Markets & Macro',
    description: 'Tech equities, sovereign debt, currency flows, and executive SEC disclosures.',
    columns: ['macro', 'company-moves', 'analysts']
  },
  'science': {
    id: 'science',
    label: 'Frontier Science',
    description: 'Quantum computing, nuclear energy, synthetic biology, and deep astrophysics.',
    columns: ['frontier']
  },
  'culture': {
    id: 'culture',
    label: 'Culture & Industry',
    description: 'Media disruption, open-source labor dynamics, and technological societal shifts.',
    columns: ['industry', 'voices']
  }
};

export interface PresetProfile {
  id: 'investor' | 'builder' | 'policy';
  label: string;
  beats: BeatId[];
  tagline: string;
}

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: 'investor',
    label: 'Investor',
    beats: ['ai-venture', 'markets'],
    tagline: 'Capital flows, earnings disclosures, and macro market momentum'
  },
  {
    id: 'builder',
    label: 'Builder',
    beats: ['ai-venture', 'science'],
    tagline: 'Technical breakthroughs, arXiv papers, and frontier engineering'
  },
  {
    id: 'policy',
    label: 'Policy Watcher',
    beats: ['politics', 'ai-venture'],
    tagline: 'Antitrust, global chip diplomacy, and regulatory enforcement'
  }
];
