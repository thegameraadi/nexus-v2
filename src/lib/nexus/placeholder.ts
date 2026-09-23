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
 *
 * If latestEditionDateStr is provided (e.g. from the archive index), the latest
 * available edition anchors 'Today' for the reader, ensuring readers in timezones
 * behind UTC (e.g. UTC-7 at 18:29 on Sept 22 viewing the 2026-09-23 edition) see
 * exactly 'Today' for the active edition and 'Yesterday' for the preceding edition.
 */
export function getReaderLocalEditionLabel(
  editionDateStr: string,
  latestEditionDateStr?: string
): string {
  try {
    if (!editionDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(editionDateStr)) {
      return editionDateStr || 'Today';
    }

    const now = new Date();
    const utcDateStr = now.toISOString().split('T')[0];
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Determine the reference baseline date for 'Today'.
    // If a latest edition date is provided and is >= localDateStr, it anchors 'Today';
    // otherwise fallback to UTC date (if >= localDateStr) or localDateStr.
    let refDate = latestEditionDateStr && latestEditionDateStr >= localDateStr ? latestEditionDateStr : utcDateStr;
    if (refDate < localDateStr) refDate = localDateStr;

    const [y1, m1, d1] = refDate.split('-').map(Number);
    const [y2, m2, d2] = editionDateStr.split('-').map(Number);
    const refUtc = Date.UTC(y1, m1 - 1, d1);
    const targetUtc = Date.UTC(y2, m2 - 1, d2);
    const diffDays = Math.round((refUtc - targetUtc) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const targetDate = new Date(targetUtc);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[targetDate.getUTCMonth()]} ${targetDate.getUTCDate()}`;
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
