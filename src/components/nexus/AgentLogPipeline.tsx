import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { AgentLogEntry } from '../../lib/nexus/types';

interface AgentLogPipelineProps {
  logs: AgentLogEntry[];
}

export const AgentLogPipeline: React.FC<AgentLogPipelineProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Enforce cap: Show only the current run's entries, plus one summary line for earlier runs that day
  const displayedLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // If already properly consolidated (starts with summary line and <= 15 entries), return as is
    if (
      logs[0]?.message?.includes('Earlier runs today') &&
      !logs.slice(1).some((l) => l.message?.includes('Earlier runs today')) &&
      logs.length <= 15
    ) {
      return logs;
    }

    // Locate the start of the latest execution cycle
    // Cycles begin with [SCOUT] "Pipeline active on commit..." or "Initializing ingestion pipeline"
    let latestRunStart = -1;
    for (let i = logs.length - 1; i >= 0; i--) {
      const msg = logs[i]?.message || '';
      const mod = logs[i]?.module || '';
      if (
        mod === 'SCOUT' &&
        (msg.includes('Pipeline active on commit') || msg.includes('Initializing ingestion pipeline'))
      ) {
        latestRunStart = i;
        break;
      }
    }

    if (latestRunStart > 0) {
      // Calculate prior audit count excluding any existing summary headers
      const priorCount = logs
        .slice(0, latestRunStart)
        .filter((l) => !l.message?.includes('Earlier runs today') && !l.message?.includes('prior audit records archived')).length || latestRunStart;

      const firstTimestamp = logs[0]?.timestamp || '00:00:00';
      const summaryLine: AgentLogEntry = {
        timestamp: firstTimestamp,
        module: 'SYSTEM',
        message: `Earlier runs today: ${priorCount} prior audit records archived from previous execution cycles.`,
        status: 'ok',
      };
      return [summaryLine, ...logs.slice(latestRunStart)];
    }

    return logs;
  }, [logs]);

  if (!displayedLogs || displayedLogs.length === 0) return null;

  return (
    <section className="nexus-card overflow-hidden border border-white/[0.08]">
      {/* Header bar / Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-3.5 bg-white/[0.015] hover:bg-white/[0.035] transition-colors flex items-center justify-between cursor-pointer select-none text-left"
        aria-expanded={isExpanded}
        aria-controls="agent-log-content"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="nexus-meta text-zinc-300 font-medium">
            AGENT LOG PIPELINE
          </span>
          <span className="text-zinc-600">/</span>
          <span className="nexus-meta text-zinc-500 text-[11px]">
            {displayedLogs.length} AUDIT {displayedLogs.length === 1 ? 'RECORD' : 'RECORDS'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-xs shrink-0">
          <span className="nexus-meta text-[11px] hidden sm:inline text-zinc-500">
            {isExpanded ? 'COLLAPSE' : 'EXPAND TRACE'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Monospace Log Lines */}
      {isExpanded && (
        <div
          id="agent-log-content"
          className="p-4 sm:p-6 bg-black/40 border-t border-white/[0.06] font-mono text-[12px] leading-relaxed text-zinc-400 space-y-2 max-h-72 overflow-y-auto"
        >
          {displayedLogs.map((log, index) => {
            const statusLabel = log.status.toUpperCase();
            const statusStyle =
              log.status === 'error'
                ? 'text-zinc-100 font-bold underline'
                : log.status === 'warn'
                ? 'text-zinc-300 font-medium'
                : 'text-zinc-400';

            return (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1 border-b border-white/[0.02] last:border-0"
              >
                <span className="text-zinc-500 tabular-nums shrink-0 select-none">
                  {log.timestamp}
                </span>
                <span className="text-zinc-300 font-medium shrink-0 select-none">
                  [{log.module.toUpperCase()}]
                </span>
                <span className="flex-1 text-zinc-400 break-words">
                  {log.message}
                </span>
                <span className={`shrink-0 select-none ${statusStyle}`}>
                  [{statusLabel}]
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
