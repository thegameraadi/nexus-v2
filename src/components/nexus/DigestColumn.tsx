import React from 'react';
import { DigestItem as DigestItemType } from '../../lib/nexus/types';
import { DigestItem } from './DigestItem';

interface DigestColumnProps {
  columnKey: string;
  beatLabel?: string;
  items: DigestItemType[];
}

export const DigestColumn: React.FC<DigestColumnProps> = ({
  columnKey,
  beatLabel,
  items,
}) => {
  return (
    <div
      id={`column-${columnKey}`}
      className="nexus-card p-4 sm:p-5 flex flex-col gap-4 min-w-0"
    >
      {/* Sticky uppercase eyebrow header */}
      <div className="sticky top-[108px] z-20 py-2 -mt-2 bg-[#08080a]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="nexus-meta text-zinc-200 font-medium tracking-[0.25em] uppercase">
            {columnKey}
          </span>
          {beatLabel && (
            <span className="nexus-meta text-[11px] text-zinc-500 uppercase truncate">
              / {beatLabel}
            </span>
          )}
        </div>
        <span className="nexus-meta text-zinc-500 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04]">
          {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
        </span>
      </div>

      {/* Item list or empty state */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <DigestItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Empty state: pulsing dot + "SYNTHESIZING · CHECK BACK LATER" */
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
            </span>
            <span className="nexus-meta text-zinc-400 font-medium tracking-[0.25em]">
              SYNTHESIZING · CHECK BACK LATER
            </span>
          </div>
          <p className="nexus-meta text-[11px] text-zinc-600 max-w-xs mt-1">
            The autonomous crawler is evaluating incoming dispatches for this column.
          </p>
        </div>
      )}
    </div>
  );
};
