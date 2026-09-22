import { DayDigest, IndexEntry } from './types';

/**
 * Returns today's ISO date string (YYYY-MM-DD).
 */
export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Empty fallback index when no published editions are available yet.
 */
export const PLACEHOLDER_INDEX: IndexEntry[] = [];

/**
 * Constructs a clean, unpopulated DayDigest with zero fabricated dispatches.
 * All columns are empty arrays, triggering the 'SYNTHESIZING · CHECK BACK LATER' state.
 */
export function createEmptyDigest(
  date: string = getTodayISODate(),
  label: string = 'Today'
): DayDigest {
  return {
    date,
    label,
    agentLog: [
      {
        timestamp: '00:00:00',
        module: 'SYSTEM',
        message: 'Engine initialized. Awaiting scheduled daily intelligence synthesis.',
        status: 'ok',
      },
    ],
    beats: {
      'ai-venture': {
        columns: {
          venture: [],
          research: [],
          titans: [],
        },
      },
      'politics': {
        columns: {
          regulatory: [],
          global: [],
          voices: [],
        },
      },
      'markets': {
        columns: {
          macro: [],
          'company-moves': [],
          analysts: [],
        },
      },
      'science': {
        columns: {
          frontier: [],
        },
      },
      'culture': {
        columns: {
          industry: [],
          voices: [],
        },
      },
    },
  };
}

export const PLACEHOLDER_DIGEST: DayDigest = createEmptyDigest();
