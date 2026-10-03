'use client';

import React, { useEffect, useRef } from 'react';
import { MapLibreMap, Marker, Popup } from '@/lib/map/maplibre';
import { EventLocation } from '@/types';

export interface StartMarkerProps {
  map: MapLibreMap | null;
  location: EventLocation;
}

export const StartMarker: React.FC<StartMarkerProps> = ({ map, location }) => {
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'cursor-pointer group flex flex-col items-center';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-10 h-10 rounded-full bg-[#00f076]/30 radar-glow"></span>
        <div class="w-10 h-10 rounded-2xl bg-[#080d1a] border-2 border-[#00f076] shadow-[0_0_15px_rgba(0,240,118,0.5)] flex items-center justify-center text-[#00f076] group-hover:scale-110 transition-transform">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
      <div class="mt-1 px-2 py-0.5 rounded-full bg-[#080d1a]/90 border border-[#00f076]/50 text-[10px] font-bold text-[#00f076] uppercase tracking-wider shadow-lg whitespace-nowrap">
        Start (${location.meeting_time || '18:30'})
      </div>
    `;

    const popup = new Popup({ offset: 25, closeButton: false }).setHTML(`
      <div class="text-xs">
        <div class="flex items-center gap-1.5 text-[#00f076] font-bold uppercase tracking-wider mb-1">
          <span class="w-2 h-2 rounded-full bg-[#00f076]"></span>
          <span>START / TIKUM UTAMA</span>
        </div>
        <div class="font-bold text-white text-sm mb-1">${location.name}</div>
        <p class="text-[#94a3b8] mb-2 leading-snug">${location.description || ''}</p>
        <div class="text-[11px] font-mono text-[#00f076]">Kumpul: ${location.meeting_time || '18:30'} WITA</div>
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
