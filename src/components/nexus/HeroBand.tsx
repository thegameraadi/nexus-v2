import React from 'react';

export const HeroBand: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="w-full h-[130px] border-y border-white/[0.07] bg-[#0c0c0e] relative overflow-hidden select-none"
    >
      {/* Abstract computational / architectural grid texture */}
      <div className="absolute inset-0 nexus-img opacity-40 mix-blend-screen pointer-events-none">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 130"
        >
          <defs>
            <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#27272a" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#71717a" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#52525b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0.1" />
            </linearGradient>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="1200" height="130" fill="url(#hero-grid)" />
          {/* Subtle topological structural contours */}
          <path
            d="M0,95 Q300,30 600,75 T1200,45 L1200,130 L0,130 Z"
            fill="url(#hero-grad)"
          />
          <path
            d="M0,110 Q450,60 850,90 T1200,80"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.2"
          />
          <path
            d="M0,70 Q350,110 750,40 T1200,65"
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="0.9"
            strokeDasharray="4,6"
          />
        </svg>
      </div>

      {/* Subtle vignette edges */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-transparent to-[#08080a] pointer-events-none" />
    </div>
  );
};
