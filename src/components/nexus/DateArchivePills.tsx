import React, { useMemo } from 'react';
import { IndexEntry } from '../../lib/nexus/types';
import { getReaderLocalEditionLabel } from '../../lib/nexus/placeholder';
import { SavedPill } from './SavedPill';

interface DateArchivePillsProps {
  entries: IndexEntry[];
  selectedDate: string;
  isSavedActive: boolean;
  onSelectDate: (date: string) => void;
  savedCount: number;
  onToggleSaved: () => void;
}

export const DateArchivePills: React.FC<DateArchivePillsProps> = ({
  entries,
  selectedDate,
  isSavedActive,
  onSelectDate,
  savedCount,
  onToggleSaved,
}) => {
  // Compute labels dynamically in reader's local context and deduplicate strictly by edition date
  const computedEntries = useMemo(() => {
    const latestDate = entries && entries.length > 0 ? entries[0]?.date : selectedDate;

    if (!entries || entries.length === 0) {
      // Zero editions in index.json: provide a clean current edition pill
      const localLabel = getReaderLocalEditionLabel(selectedDate, latestDate);
      return [{ date: selectedDate, label: localLabel }];
    }

    const seenDates = new Set<string>();
    const result: IndexEntry[] = [];

    for (const item of entries) {
      if (!item || !item.date) continue;

      // Recompute label strictly in reader's local context
      const localLabel = getReaderLocalEditionLabel(item.date, latestDate);

      // De-duplicate AFTER reader-local label recomputation, keyed on the edition date, not the label string
      if (!seenDates.has(item.date)) {
        seenDates.add(item.date);
        result.push({
          date: item.date,
          label: localLabel,
        });
      }
    }

    const fallbackLabel = getReaderLocalEditionLabel(selectedDate, latestDate);
    return result.length > 0 ? result : [{ date: selectedDate, label: fallbackLabel }];
  }, [entries, selectedDate]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar select-none">
      <span className="nexus-meta text-zinc-500 shrink-0 mr-1 hidden sm:inline">
        ARCHIVE:
      </span>

      {computedEntries.map((entry) => {
        const isCurrent = !isSavedActive && entry.date === selectedDate;
        return (
          <button
            key={entry.date}
            onClick={() => onSelectDate(entry.date)}
            className={`nexus-meta px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
              isCurrent
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-medium'
                : 'bg-white/[0.025] border-white/[0.07] text-zinc-400 hover:text-zinc-100 hover:border-white/[0.2]'
            }`}
          >
            {entry.label.toUpperCase()}
          </button>
        );
      })}

      <div className="h-4 w-px bg-white/[0.1] shrink-0 mx-1" />

      <SavedPill
        isActive={isSavedActive}
        count={savedCount}
        onToggle={onToggleSaved}
      />
    </div>
  );
};
