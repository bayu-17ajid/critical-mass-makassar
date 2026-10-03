import React from 'react';
import { LocationType } from '@/types';
import { MapPin, Navigation, Clock } from 'lucide-react';

export interface LocationCardProps {
  type: LocationType;
  name: string;
  description?: string | null;
  time?: string | null;
  latitude: number;
  longitude: number;
  onViewOnMap?: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  type,
  name,
  description,
  time,
  latitude,
  longitude,
  onViewOnMap,
}) => {
  const isStart = type === 'MAIN_START';
  const isFinish = type === 'FINISH';

  const badgeColor = isStart
    ? 'text-[#00f076] bg-[#00f076]/10 border-[#00f076]/30'
    : isFinish
    ? 'text-[#f43f5e] bg-[#f43f5e]/10 border-[#f43f5e]/30'
    : 'text-[#38bdf8] bg-[#06b6d4]/10 border-[#06b6d4]/30';

  const title = isStart
    ? 'Start / Tikum Utama'
    : isFinish
    ? 'Official Finish'
    : 'Waypoint';

  return (
    <div className="bg-[#0f172a]/90 border border-[#1e2d4d] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#00f076]/30 transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeColor}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStart ? 'bg-[#00f076]' : isFinish ? 'bg-[#f43f5e]' : 'bg-[#38bdf8]'
              }`}
            />
            {title}
          </span>
          {time && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#94a3b8]">
              <Clock className="w-3.5 h-3.5" />
              <span>{time} WITA</span>
            </div>
          )}
        </div>

        <h4 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-1.5">
          <MapPin className={`w-4 h-4 shrink-0 ${isStart ? 'text-[#00f076]' : 'text-[#f43f5e]'}`} />
          <span>{name}</span>
        </h4>
        {description && (
          <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#1e2d4d] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#64748b]">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
        <button
          onClick={onViewOnMap}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00f076] hover:text-[#00d366] transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Lihat di Maps</span>
        </button>
      </div>
    </div>
  );
};
