import React from 'react';
import { Plus, Minus, Navigation, Maximize2 } from 'lucide-react';

export interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocateMe?: () => void;
  onToggleFullscreen?: () => void;
  isLocating?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onLocateMe,
  onToggleFullscreen,
  isLocating = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {onLocateMe && (
        <button
          onClick={onLocateMe}
          className={`p-2.5 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-[#1e2d4d] text-white hover:text-[#00f076] hover:border-[#00f076]/40 transition-all shadow-lg active:scale-95 cursor-pointer ${
            isLocating ? 'animate-pulse border-[#00f076] text-[#00f076]' : ''
          }`}
          title="Lokasi Saya"
          aria-label="Lokasi Saya"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'rotate-45' : ''}`} />
        </button>
      )}

      {(onZoomIn || onZoomOut) && (
        <div className="flex flex-col rounded-xl overflow-hidden bg-[#0f172a]/90 backdrop-blur-md border border-[#1e2d4d] shadow-lg">
          {onZoomIn && (
            <button
              onClick={onZoomIn}
              className="p-2.5 text-[#94a3b8] hover:text-white hover:bg-[#141f36] transition-colors border-b border-[#1e2d4d] active:scale-95 cursor-pointer"
              title="Perbesar"
              aria-label="Perbesar"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              className="p-2.5 text-[#94a3b8] hover:text-white hover:bg-[#141f36] transition-colors active:scale-95 cursor-pointer"
              title="Perkecil"
              aria-label="Perkecil"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-[#1e2d4d] text-[#94a3b8] hover:text-white hover:border-[#00f076]/40 transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Layar Penuh"
          aria-label="Layar Penuh"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const MapLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`p-3 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-[#1e2d4d] shadow-lg text-xs space-y-1.5 ${className}`}
    >
      <div className="font-bold text-[10px] tracking-wider text-[#94a3b8] uppercase mb-1">
        Legenda Peta
      </div>
      <div className="flex items-center gap-2 text-white">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00f076] ring-2 ring-[#00f076]/30" />
        <span>Start / Tikum Utama</span>
      </div>
      <div className="flex items-center gap-2 text-white">
        <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] ring-2 ring-[#a855f7]/30" />
        <span>Tikum Peserta</span>
      </div>
      <div className="flex items-center gap-2 text-white">
        <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] ring-2 ring-[#f43f5e]/30" />
        <span>Finish</span>
      </div>
      <div className="flex items-center gap-2 text-white">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00f076] animate-ping" />
        <span>Rider On The Way</span>
      </div>
    </div>
  );
};
