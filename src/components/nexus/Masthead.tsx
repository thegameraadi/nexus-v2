import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Clock } from 'lucide-react';
import { StatusBlock } from './StatusBlock';
import { getRelativeTimeString } from '../../lib/nexus/placeholder';

interface MastheadProps {
  activeEditionLabel: string;
  onOpenBeatPicker: () => void;
  selectedBeatsCount: number;
  lastUpdated?: string;
}

export const Masthead: React.FC<MastheadProps> = ({
  activeEditionLabel,
  onOpenBeatPicker,
  selectedBeatsCount,
  lastUpdated,
}) => {
  const [relativeTime, setRelativeTime] = useState<string>(() =>
    getRelativeTimeString(lastUpdated)
  );

  // Refresh relative time every 30 seconds
  useEffect(() => {
    setRelativeTime(getRelativeTimeString(lastUpdated));
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTimeString(lastUpdated));
    }, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const localFormattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <header className="border-b border-white/[0.07] bg-[#08080a]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top meta ticker bar */}
        <div className="py-2 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-2">
          {/* StatusBlock keeps UTC clock as deliberate identity choice */}
          <StatusBlock />

          <div className="flex items-center gap-3 nexus-meta text-zinc-500">
            <span className="text-zinc-400">EDITION: {activeEditionLabel.toUpperCase()}</span>

            {lastUpdated && (
              <>
                <span className="text-zinc-700">|</span>
                <span
                  className="flex items-center gap-1 text-zinc-400"
                  title={`Last synchronized: ${localFormattedTime} (Reader Local Time)`}
                >
                  <Clock className="w-3 h-3 text-zinc-500 inline-block" />
                  <span>LAST UPDATED {relativeTime}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Primary Masthead */}
        <div className="py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="nexus-wordmark text-3xl sm:text-4xl md:text-5xl text-zinc-100 leading-none">
              NEXUS
            </h1>
            <p className="mt-2 nexus-meta text-zinc-400">
              AGENTIC NEWS SYNTHESIS ENGINE
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBeatPicker}
              className="nexus-card nexus-card-hover px-3.5 py-2 flex items-center gap-2 nexus-meta text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Configure beats & personalization"
              aria-label="Configure beats"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>BEATS ({selectedBeatsCount})</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
