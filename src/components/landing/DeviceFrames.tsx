
import React from 'react';

export const LaptopFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative mx-auto w-full max-w-[900px] ${className}`}>
    <div className="relative rounded-[1.5rem] bg-[#1a1b1e] p-[10px] ring-1 ring-white/10 shadow-2xl">
        <div className="absolute top-0 left-1/2 h-3 w-28 -translate-x-1/2 rounded-b-md bg-[#1a1b1e] border-b border-x border-white/5 z-20"></div>
        {/* Screen container - fixed height, overflow visible for scaled content */}
        <div className="rounded-lg bg-slate-950 border border-white/5 relative z-10 h-[500px] w-full overflow-visible">
            {/* Inner wrapper for proper scaling */}
            <div className="absolute inset-0 overflow-hidden">
                {children}
            </div>
        </div>
    </div>
    <div className="relative mx-auto h-3 w-full max-w-[95%] rounded-b-xl bg-[#25262b] shadow-xl border-t border-black/50"></div>
    <div className="relative mx-auto h-1 w-[120px] rounded-b-xl bg-[#2c2d31]/50 mt-1"></div>
  </div>
);

export const PhoneFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative mx-auto w-[200px] sm:w-[240px] md:w-[260px] ${className}`}>
    <div className="relative rounded-[2.5rem] border-[6px] md:border-[8px] border-[#1a1b1e] bg-[#1a1b1e] shadow-2xl aspect-[9/19.5]">
        <div className="absolute top-0 left-1/2 h-5 md:h-6 w-24 md:w-32 -translate-x-1/2 rounded-b-2xl bg-[#1a1b1e] z-20"></div>
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 border border-white/5 relative z-10 h-full w-full">
            {children}
        </div>
        {/* Buttons */}
        <div className="absolute -right-[8px] md:-right-[10px] top-24 h-12 w-[2px] rounded-r-sm bg-[#2c2d31]"></div>
        <div className="absolute -left-[8px] md:-left-[10px] top-24 h-8 w-[2px] rounded-l-sm bg-[#2c2d31]"></div>
        <div className="absolute -left-[8px] md:-left-[10px] top-36 h-12 w-[2px] rounded-l-sm bg-[#2c2d31]"></div>
    </div>
  </div>
);
