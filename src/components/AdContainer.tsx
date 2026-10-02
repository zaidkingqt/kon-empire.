import React from 'react';

export interface AdContainerProps {
  slot: 'top-leaderboard' | 'sidebar' | 'in-content';
  className?: string;
}

export const AdContainer: React.FC<AdContainerProps> = ({ slot, className = '' }) => {
  if (slot === 'top-leaderboard') {
    return (
      <aside
        aria-label="Advertisement"
        className={`w-full max-w-5xl mx-auto my-4 min-h-[90px] flex flex-col items-center justify-center rounded-lg border border-forge-border/40 bg-forge-surface/30 p-2 text-center text-xs text-forge-textMuted ${className}`}
      >
        <div className="flex items-center gap-2 mb-1 opacity-60">
          <span className="uppercase tracking-widest text-[10px] font-mono">Ad Space</span>
          <span>•</span>
          <span className="text-[10px]">728 × 90 Responsive Banner</span>
          <span>•</span>
          <span className="text-[10px]">Privacy Safe</span>
        </div>
        <div className="w-full max-w-[728px] h-[60px] border border-dashed border-forge-border/60 rounded flex items-center justify-center bg-black/20 text-forge-textMuted/60 font-mono text-xs">
          Developer Tools & Cloud Sponsors (Google AdSense / Mediavine Ready)
        </div>
      </aside>
    );
  }

  if (slot === 'sidebar') {
    return (
      <aside
        aria-label="Advertisement"
        className={`w-full max-w-[300px] min-h-[250px] flex flex-col items-center justify-center rounded-lg border border-forge-border/40 bg-forge-surface/30 p-3 text-center text-xs text-forge-textMuted ${className}`}
      >
        <div className="flex items-center gap-1.5 mb-2 opacity-60">
          <span className="uppercase tracking-widest text-[10px] font-mono">Ad Space</span>
          <span>•</span>
          <span className="text-[10px]">300 × 250</span>
        </div>
        <div className="w-full h-[200px] border border-dashed border-forge-border/60 rounded flex items-center justify-center bg-black/20 text-forge-textMuted/60 font-mono text-xs p-4">
          Tech & Hosting Sponsorship Slot
        </div>
      </aside>
    );
  }

  // in-content
  return (
    <aside
      aria-label="Advertisement"
      className={`w-full max-w-4xl mx-auto my-8 min-h-[90px] flex flex-col items-center justify-center rounded-lg border border-forge-border/40 bg-forge-surface/30 p-3 text-center text-xs text-forge-textMuted ${className}`}
    >
      <div className="flex items-center gap-2 mb-1.5 opacity-60">
        <span className="uppercase tracking-widest text-[10px] font-mono">Sponsored</span>
        <span>•</span>
        <span className="text-[10px]">Non-Intrusive Placement</span>
      </div>
      <div className="w-full max-w-[728px] h-[65px] border border-dashed border-forge-border/60 rounded flex items-center justify-center bg-black/20 text-forge-textMuted/60 font-mono text-xs">
        VectorForge is 100% Free & Open-Web Supported
      </div>
    </aside>
  );
};
