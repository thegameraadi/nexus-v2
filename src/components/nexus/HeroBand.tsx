import React from 'react';

export const HeroBand: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="w-full h-[130px] border-y border-white/[0.07] bg-[#0c0c0e] relative overflow-hidden select-none"
    >
      {/* Monochrome earth-from-orbit / city-lights-from-space imagery (self-contained local asset) */}
      <img
        src="/hero-earth.jpg"
        alt=""
        className="w-full h-full object-cover object-[center_35%] nexus-img opacity-45 pointer-events-none"
      />

      {/* Subtle vignette edges & gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-transparent to-[#08080a] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#08080a]/50 via-transparent to-[#08080a]/75 pointer-events-none" />
    </div>
  );
};
