import React from 'react';
import { RundownItem } from '@/types';
import { Clock } from 'lucide-react';

export interface EventTimelineProps {
  items: RundownItem[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ items }) => {
  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-[#00f076] before:via-[#a855f7] before:to-[#f43f5e]">
      {sorted.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Node Indicator */}
          <div className="absolute -left-[30px] top-1 w-6 h-6 rounded-full bg-[#0f172a] border-2 border-[#00f076] flex items-center justify-center text-[#00f076] shadow-[0_0_10px_rgba(0,240,118,0.3)] group-hover:scale-110 transition-transform">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f076]" />
          </div>

          <div className="bg-[#141f36]/80 border border-[#1e2d4d] rounded-xl p-3.5 sm:p-4 hover:border-[#00f076]/40 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00f076] mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{item.time} WITA</span>
            </div>
            <h5 className="font-bold text-white text-sm sm:text-base">{item.title}</h5>
            {item.description && (
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
