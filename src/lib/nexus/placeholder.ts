import { DayDigest, IndexEntry } from './types';

/**
 * Returns today's ISO date string (YYYY-MM-DD).
 */
export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Evaluates edition labels ('Today', 'Yesterday', 'MMM D') strictly in the
 * reader's local browser timezone, preventing UTC-rollover date skew.
 */
export function getReaderLocalEditionLabel(editionDateStr: string): string {
  try {
    if (!editionDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(editionDateStr)) {
      return editionDateStr || 'Today';
    }

    const now = new Date();
    // Reader's local today at midnight
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Target edition date at midnight
    const [year, month, day] = editionDateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);

    const diffMs = localToday.getTime() - targetDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[targetDate.getMonth()]} ${targetDate.getDate()}`;
  } catch {
    return editionDateStr;
  }
}

/**
 * Formats an ISO timestamp into a reader-local relative time string (e.g. '14M AGO', '2H AGO').
 */
export function getRelativeTimeString(isoTimestamp?: string): string {
  if (!isoTimestamp) return 'RECENTLY';
  try {
    const updated = new Date(isoTimestamp).getTime();
    const now = Date.now();
    const diffSeconds = Math.max(0, Math.floor((now - updated) / 1000));

    if (diffSeconds < 60) return 'JUST NOW';
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    return `${days}D AGO`;
  } catch {
    return 'RECENTLY';
  }
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
    lastUpdated: new Date().toISOString(),
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
