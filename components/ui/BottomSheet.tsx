'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface BottomSheetProps {
  children: React.ReactNode;
  header: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  header,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`fixed inset-x-0 bottom-16 sm:bottom-0 z-30 transition-all duration-300 ease-in-out bg-[#0f172a]/95 backdrop-blur-xl border-t border-[#1e2d4d] rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.6)] ${
        isExpanded ? 'max-h-[82vh]' : 'max-h-24'
      } flex flex-col ${className}`}
    >
      {/* Drag handle / toggle bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-pointer select-none focus:outline-none"
        aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        <div className="w-12 h-1.5 rounded-full bg-[#334b79] mb-1.5" />
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
          {isExpanded ? (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#00f076]" /> Tutup Panel
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#00f076]" /> Lihat Detail Rider
            </>
          )}
        </div>
      </button>

      {/* Header section (always visible) */}
      <div className="px-4 pb-3 border-b border-[#1e2d4d]/60">{header}</div>

      {/* Expandable content area */}
      <div
        className={`px-4 py-3 overflow-y-auto transition-opacity duration-200 ${
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
