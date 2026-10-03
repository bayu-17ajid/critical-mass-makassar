'use client';

import React, { useEffect, useRef } from 'react';
import { MapLibreMap, Marker, Popup } from '@/lib/map/maplibre';
import { EventLocation } from '@/types';

export interface FinishMarkerProps {
  map: MapLibreMap | null;
  location: EventLocation;
}

export const FinishMarker: React.FC<FinishMarkerProps> = ({ map, location }) => {
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'cursor-pointer group flex flex-col items-center';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-10 h-10 rounded-full bg-[#f43f5e]/30 radar-glow-pink"></span>
        <div class="w-10 h-10 rounded-2xl bg-[#080d1a] border-2 border-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-center justify-center text-[#f43f5e] group-hover:scale-110 transition-transform">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
          </svg>
        </div>
      </div>
      <div class="mt-1 px-2 py-0.5 rounded-full bg-[#080d1a]/90 border border-[#f43f5e]/50 text-[10px] font-bold text-[#f43f5e] uppercase tracking-wider shadow-lg whitespace-nowrap">
        Finish (${location.meeting_time || '20:30'})
      </div>
    `;

    const popup = new Popup({ offset: 25, closeButton: false }).setHTML(`
      <div class="text-xs">
        <div class="flex items-center gap-1.5 text-[#f43f5e] font-bold uppercase tracking-wider mb-1">
          <span class="w-2 h-2 rounded-full bg-[#f43f5e]"></span>
          <span>OFFICIAL FINISH</span>
        </div>
        <div class="font-bold text-white text-sm mb-1">${location.name}</div>
        <p class="text-[#94a3b8] mb-2 leading-snug">${location.description || ''}</p>
        <div class="text-[11px] font-mono text-[#f43f5e]">Perkiraan Tiba: ${location.meeting_time || '20:30'} WITA</div>
      </div>
    `);

    const marker = new Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .setPopup(popup)
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [
    map,
    location.id,
    location.latitude,
    location.longitude,
    location.meeting_time,
    location.name,
    location.description,
  ]);

  return null;
};
