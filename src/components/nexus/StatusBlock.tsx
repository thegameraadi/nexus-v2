import React, { useState, useEffect } from 'react';

export const StatusBlock: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString(); // e.g. 2026-09-21T07:15:32.123Z
      const timePart = iso.substring(11, 19);
      const datePart = iso.substring(0, 10);
      setTimeStr(`${datePart} · ${timePart} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 text-zinc-400 nexus-meta select-none">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-200"></span>
        </span>
        <span className="text-zinc-300 font-medium">AGENT ACTIVE</span>
      </div>
      <span className="text-zinc-600">/</span>
      <span className="tabular-nums text-zinc-400">{timeStr}</span>
    </div>
  );
};
