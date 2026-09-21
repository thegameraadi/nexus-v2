import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DigestScoreBreakdown } from '../../lib/nexus/types';

interface ScoreBreakdownProps {
  scores: DigestScoreBreakdown;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scores }) => {
  const metrics = [
    { key: 'authority', label: 'AUTHORITY', value: scores.authority, weight: '25%' },
    { key: 'corroboration', label: 'CORROBORATION', value: scores.corroboration, weight: '20%' },
    { key: 'novelty', label: 'NOVELTY', value: scores.novelty, weight: '20%' },
    { key: 'magnitude', label: 'MAGNITUDE', value: scores.magnitude, weight: '20%' },
    { key: 'relevance', label: 'RELEVANCE', value: scores.relevance, weight: '15%' },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="nexus-meta px-2 py-0.5 rounded border border-white/[0.12] bg-white/[0.03] text-zinc-300 hover:text-zinc-100 hover:border-white/[0.25] transition-colors cursor-pointer flex items-center gap-1 select-none"
          title="Inspect 5-factor scoring engine breakdown"
          aria-label={`Total score ${scores.total.toFixed(1)} out of 10. Click to inspect breakdown.`}
        >
          <span className="text-[10px] text-zinc-500">INDEX</span>
          <span className="font-medium text-zinc-200">{scores.total.toFixed(1)}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="end"
          className="nexus-card w-64 p-3.5 bg-[#0c0c0e] border border-white/[0.12] rounded-xl shadow-2xl z-50 focus:outline-none animate-in fade-in-0 zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.07] mb-2.5">
            <span className="nexus-meta text-zinc-400">RANKING ENGINE</span>
            <span className="nexus-meta text-zinc-200 font-medium">
              COMPOSITE: {scores.total.toFixed(1)}/10
            </span>
          </div>

          {/* Metrics List */}
          <div className="space-y-2">
            {metrics.map((m) => (
              <div key={m.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">{m.label}</span>
                  <span className="text-zinc-200 tabular-nums">
                    {m.value.toFixed(1)} <span className="text-zinc-600">({m.weight})</span>
                  </span>
                </div>
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, m.value * 10))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Popover.Arrow className="fill-[#0c0c0e] stroke-white/[0.12]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
