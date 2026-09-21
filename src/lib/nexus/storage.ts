import { BeatId, DigestItem } from './types';

const BEATS_KEY = 'nexus-beats';
const SAVED_PREFIX = 'nexus-saved-';

export const SAVED_CHANGE_EVENT = 'nexus-saved-change';
export const BEATS_CHANGE_EVENT = 'nexus-beats-change';

/**
 * Returns user-selected beats from localStorage.
 * Returns null if the user has never set their beats (first-time visitor trigger).
 */
export function getStoredBeats(): BeatId[] | null {
  try {
    const raw = localStorage.getItem(BEATS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as BeatId[];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists selected beats to localStorage and dispatches a local event.
 */
export function storeBeats(beats: BeatId[]): void {
  try {
    localStorage.setItem(BEATS_KEY, JSON.stringify(beats));
    window.dispatchEvent(new CustomEvent(BEATS_CHANGE_EVENT, { detail: beats }));
  } catch (err) {
    console.error('Failed to store beats in localStorage', err);
  }
}

/**
 * Checks whether an item is bookmarked.
 */
export function isItemSaved(id: string): boolean {
  try {
    return localStorage.getItem(`${SAVED_PREFIX}${id}`) !== null;
  } catch {
    return false;
  }
}

/**
 * Toggles the saved state of an item.
 * Stores the full DigestItem object so cross-date saved views can render anytime.
 * Dispatches a custom event for live multi-component and cross-tab update.
 */
export function toggleSaveItem(item: DigestItem): boolean {
  try {
    const key = `${SAVED_PREFIX}${item.id}`;
    const wasSaved = localStorage.getItem(key) !== null;
    if (wasSaved) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(item));
    }
    // Dispatch local custom event for current window
    window.dispatchEvent(
      new CustomEvent(SAVED_CHANGE_EVENT, {
        detail: { itemId: item.id, isSaved: !wasSaved }
      })
    );
    return !wasSaved;
  } catch (err) {
    console.error('Failed to toggle saved item in localStorage', err);
    return false;
  }
}

/**
 * Returns all currently bookmarked items from localStorage.
 */
export function getAllSavedItems(): DigestItem[] {
  const items: DigestItem[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVED_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.id) {
              items.push(parsed);
            }
          } catch {
            // Ignore malformed entries
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to read saved items from localStorage', err);
  }
  // Sort newest first
  return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/**
 * Returns the total count of bookmarked items.
 */
export function getSavedCount(): number {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVED_PREFIX)) {
        count++;
      }
    }
  } catch {
    // Ignore error
  }
  return count;
}
