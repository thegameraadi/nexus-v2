import React, { useMemo } from 'react';
import { BeatId, BEAT_DEFINITIONS, DayDigest, DigestItem as DigestItemType } from '../../lib/nexus/types';
import { DigestColumn } from './DigestColumn';
import { DigestItem } from './DigestItem';

interface DigestGridProps {
  digest: DayDigest;
  selectedBeats: BeatId[];
  isSavedViewActive: boolean;
  savedItems: DigestItemType[];
}

export const DigestGrid: React.FC<DigestGridProps> = ({
  digest,
  selectedBeats,
  isSavedViewActive,
  savedItems,
}) => {
  // Collect all columns that should be rendered based on selected beats
  const activeColumns = useMemo(() => {
    const cols: { beatId: BeatId; beatLabel: string; columnKey: string; items: DigestItemType[] }[] = [];

    for (const beatId of selectedBeats) {
      const beatDef = BEAT_DEFINITIONS[beatId];
      const beatData = digest.beats?.[beatId];
      const beatCols = beatDef?.columns || [];

      for (const colKey of beatCols) {
        const items = beatData?.columns?.[colKey] || [];
        cols.push({
          beatId,
          beatLabel: beatDef?.label || beatId,
          columnKey: colKey,
          items,
        });
      }
    }
    return cols;
  }, [digest, selectedBeats]);

  // Handle mobile anchor smooth scroll
  const handleScrollToColumn = (colKey: string) => {
    const el = document.getElementById(`column-${colKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isSavedViewActive) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <span className="nexus-meta text-zinc-500">CLIENT-SIDE STORAGE</span>
            <h2 className="nexus-headline text-xl text-zinc-100 mt-0.5">
              Bookmarked Dispatches ({savedItems.length})
            </h2>
          </div>
          <span className="nexus-meta text-zinc-400">
            SAVED LOCALLY IN LOCALSTORAGE
          </span>
        </div>

        {savedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.map((item) => (
              <DigestItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="nexus-card py-16 px-6 text-center max-w-lg mx-auto">
            <span className="nexus-meta text-zinc-400 tracking-[0.25em] block mb-2">
              NO BOOKMARKS RECORDED
            </span>
            <p className="nexus-body text-zinc-400">
              Dispatches you bookmark via the ribbon icon are persisted exclusively on this device.
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Mobile horizontally scrollable column jump pill row */}
      {activeColumns.length > 1 && (
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar border-b border-white/[0.04]">
          <span className="nexus-meta text-zinc-600 text-[11px] shrink-0 mr-1">
            JUMP:
          </span>
          {activeColumns.map((col) => (
            <button
              key={`${col.beatId}-${col.columnKey}`}
              onClick={() => handleScrollToColumn(col.columnKey)}
              className="nexus-meta text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] shrink-0 cursor-pointer"
            >
              {col.columnKey.toUpperCase()} ({col.items.length})
            </button>
          ))}
        </div>
      )}

      {/* Primary Grid: 3 columns wide on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {activeColumns.map((col) => (
          <DigestColumn
            key={`${col.beatId}-${col.columnKey}`}
            columnKey={col.columnKey}
            beatLabel={col.beatLabel}
            items={col.items}
          />
        ))}
      </div>
    </section>
  );
};
