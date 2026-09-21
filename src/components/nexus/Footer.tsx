import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.07] bg-[#08080a] mt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/[0.05]">
          {/* Col 1: System Colophon */}
          <div className="space-y-2">
            <span className="nexus-meta text-zinc-400">ENGINE COLOPHON</span>
            <p className="nexus-headline text-sm text-zinc-200">
              NEXUS V2 ARCHITECTURE
            </p>
            <p className="nexus-body text-xs text-zinc-400">
              Deterministic 5-factor scoring engine with scheduled autonomous LLM synthesis. Built strictly with client-rendered Vite + React 18, Tailwind CSS v4, and static JSON storage.
            </p>
          </div>

          {/* Col 2: Pure Local Privacy Guarantee */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span className="nexus-meta text-zinc-400">ZERO DATA TRANSMISSION</span>
            </div>
            <p className="nexus-body text-xs text-zinc-400">
              All personalization, beat preferences, and reading bookmarks are stored exclusively in your browser&apos;s localStorage. No cookies, no accounts, and no telemetry leave your machine.
            </p>
          </div>

          {/* Col 3: Synthesis & Licensing Disclosure */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span className="nexus-meta text-zinc-400">SYNTHESIS & FAIR USE</span>
            </div>
            <p className="nexus-body text-xs text-zinc-400">
              Dispatches represent machine-synthesized intelligence derived from publicly accessible RSS, arXiv, SEC EDGAR, and open web feeds. Thumbnails licensed under editorial fair use and CC protocols. Original reporting rights reside with credited publishers.
            </p>
          </div>
        </div>

        {/* Bottom line: Authorship and Version */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 nexus-meta text-zinc-500 text-[11px]">
          <div>
            NEXUS ENGINE © {new Date().getFullYear()} · AUTONOMOUS INFORMATION INFRASTRUCTURE
          </div>
          <div>
            STATIC DEPLOYMENT TARGET: NETLIFY
          </div>
        </div>
      </div>
    </footer>
  );
};
