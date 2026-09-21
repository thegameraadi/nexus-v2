import React, { useMemo } from 'react';
import { IndexEntry } from '../../lib/nexus/types';
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
  // Deduplicate by label, keeping newest first
  const deduplicated = useMemo(() => {
    const seen = new Set<string>();
    const result: IndexEntry[] = [];
    for (const item of entries) {
      const normalizedLabel = item.label.trim().toLowerCase();
      if (!seen.has(normalizedLabel)) {
        seen.add(normalizedLabel);
        result.push(item);
      }
    }
    return result;
  }, [entries]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar select-none">
      <span className="nexus-meta text-zinc-500 shrink-0 mr-1 hidden sm:inline">
        ARCHIVE:
      </span>

      {deduplicated.map((entry) => {
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
