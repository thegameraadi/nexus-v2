import React, { useState, useEffect } from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { DigestItem as DigestItemType } from '../../lib/nexus/types';
import { isItemSaved, toggleSaveItem, SAVED_CHANGE_EVENT } from '../../lib/nexus/storage';
import { ScoreBreakdown } from './ScoreBreakdown';

interface DigestItemProps {
  item: DigestItemType;
}

export const DigestItem: React.FC<DigestItemProps> = ({ item }) => {
  const [saved, setSaved] = useState<boolean>(() => isItemSaved(item.id));

  // Keep saved state synchronized if storage changes locally or from other tabs
  useEffect(() => {
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string; isSaved: boolean }>;
      if (customEvent.detail && customEvent.detail.itemId === item.id) {
        setSaved(customEvent.detail.isSaved);
      }
    };

    const handleStorageChange = () => {
      setSaved(isItemSaved(item.id));
    };

    window.addEventListener(SAVED_CHANGE_EVENT, handleLocalChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(SAVED_CHANGE_EVENT, handleLocalChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [item.id]);

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleSaveItem(item);
    setSaved(newState);
  };

  // Canonical link or Google News search fallback built from headline
  const resolvedUrl =
    item.url && item.url.trim().length > 0
      ? item.url
      : `https://news.google.com/search?q=${encodeURIComponent(item.headline)}`;

  return (
    <article className="group relative p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.035] hover:border-white/[0.1] transition-all flex flex-col justify-between gap-3">
      <div>
        {/* Metadata row: Source, Date, Tag chip, Score breakdown pill, Bookmark toggle */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="nexus-meta text-zinc-400 truncate max-w-[180px]">
              {item.source.toUpperCase()}
            </span>
            <span className="text-zinc-600 text-[10px]">·</span>
            <span className="nexus-meta text-zinc-500 shrink-0">
              {item.date}
            </span>
            {item.tag && (
              <span className="nexus-meta text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                #{item.tag.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 5-factor scoring engine pill */}
            <ScoreBreakdown scores={item.scores} />

            {/* Bookmark button */}
            <button
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded hover:bg-white/[0.08] transition-colors cursor-pointer ${
                saved ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={saved ? 'Remove bookmark' : 'Bookmark story'}
              aria-label={saved ? 'Remove bookmark' : 'Bookmark story'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-zinc-100' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content: Headline and Thumbnail */}
        <div className="flex gap-3 items-start">
          {item.thumbnail && (
            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.08]">
              <img
                src={item.thumbnail}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover nexus-img"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="nexus-headline group-hover:text-white transition-colors">
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-baseline gap-1.5 focus:outline-none focus:underline"
              >
                <span>{item.headline}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500 inline-block opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            </h3>

            <p className="nexus-body mt-2 leading-relaxed">
              {item.summary}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};
