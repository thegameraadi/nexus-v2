import React from 'react';
import { Bookmark } from 'lucide-react';

interface SavedPillProps {
  isActive: boolean;
  count: number;
  onToggle: () => void;
}

export const SavedPill: React.FC<SavedPillProps> = ({
  isActive,
  count,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`nexus-meta px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
        isActive
          ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-medium'
          : 'bg-white/[0.025] border-white/[0.07] text-zinc-400 hover:text-zinc-100 hover:border-white/[0.2]'
      }`}
      aria-label={`Toggle saved items view. ${count} saved.`}
    >
      <Bookmark
        className={`w-3 h-3 ${
          isActive ? 'text-zinc-950 fill-zinc-950' : count > 0 ? 'text-zinc-300 fill-zinc-300' : 'text-zinc-500'
        }`}
      />
      <span>SAVED{count > 0 ? ` (${count})` : ''}</span>
    </button>
  );
};
