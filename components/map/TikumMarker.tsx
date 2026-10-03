'use client';

import React, { useEffect, useRef } from 'react';
import { MapLibreMap, Marker, Popup } from '@/lib/map/maplibre';
import { MeetingPoint } from '@/types';

export interface TikumMarkerProps {
  map: MapLibreMap | null;
  tikum: MeetingPoint;
  onJoin?: (tikumId: string) => void;
  onSelect?: (tikum: MeetingPoint) => void;
}

export const TikumMarker: React.FC<TikumMarkerProps> = ({
  map,
  tikum,
  onJoin,
  onSelect,
}) => {
  const markerRef = useRef<Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const tikumRef = useRef(tikum);
  const onJoinRef = useRef(onJoin);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    tikumRef.current = tikum;
    onJoinRef.current = onJoin;
    onSelectRef.current = onSelect;
  });

  // 1. Create marker DOM once per (map, tikum.id)
  useEffect(() => {
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'cursor-pointer group flex flex-col items-center';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-[#080d1a] border-2 border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.5)] flex items-center justify-center text-[#a855f7] group-hover:scale-110 transition-transform">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
      <div class="mt-1 px-2 py-0.5 rounded-full bg-[#080d1a]/95 border border-[#a855f7]/50 text-[10px] font-bold text-[#c084fc] shadow-md whitespace-nowrap flex items-center gap-1">
        <span class="tikum-name-text"></span>
        <span class="tikum-count-text text-white bg-[#a855f7]/40 px-1 rounded font-mono">1</span>
      </div>
    `;

    el.onclick = (e) => {
      e.stopPropagation();
      if (markerRef.current) {
        markerRef.current.togglePopup();
      }
    };

    elementRef.current = el;

    const popup = new Popup({ offset: 20, closeButton: true });
    popupRef.current = popup;

    const marker = new Marker({ element: el })
      .setLngLat([tikumRef.current.longitude, tikumRef.current.latitude])
      .setPopup(popup)
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
      elementRef.current = null;
      popupRef.current = null;
    };
  }, [map, tikum.id]);

  // 2. Position updates in place
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([tikum.longitude, tikum.latitude]);
    }
  }, [tikum.latitude, tikum.longitude]);

  // 3. Visual updates in place without destroying DOM
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const nameSpan = el.querySelector<HTMLSpanElement>('.tikum-name-text');
    if (nameSpan && nameSpan.textContent !== tikum.name) {
      nameSpan.textContent = tikum.name;
    }

    const countSpan = el.querySelector<HTMLSpanElement>('.tikum-count-text');
    const countStr = String(tikum.member_count || 1);
    if (countSpan && countSpan.textContent !== countStr) {
      countSpan.textContent = countStr;
    }

    const popupHtml = `
      <div class="text-xs">
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="text-[#a855f7] font-bold uppercase tracking-wider text-[10px]">TIKUM PESERTA</span>
          <span class="text-white bg-[#a855f7]/30 px-1.5 py-0.5 rounded text-[10px] font-bold">${tikum.member_count || 1} Riders</span>
        </div>
        <div class="font-bold text-white text-sm mb-1">${tikum.name}</div>
        <p class="text-[#94a3b8] mb-2 leading-snug">${tikum.description || 'Titik kumpul rombongan pesepeda wilayah.'}</p>
        <div class="text-[11px] font-mono text-[#a855f7] mb-2">Kumpul: ${tikum.meeting_time} WITA</div>
        <button id="btn-tikum-${tikum.id}" class="w-full py-1.5 px-3 rounded-lg text-xs font-bold ${
          tikum.is_joined
            ? 'bg-[#1e2d4d] text-[#94a3b8]'
            : 'bg-[#a855f7] text-white hover:bg-[#9333ea]'
        } transition-colors">
          ${tikum.is_joined ? '✓ Sudah Gabung' : 'Gabung Tikum Ini'}
        </button>
      </div>
    `;

    if (popupRef.current) {
      popupRef.current.setHTML(popupHtml);
      popupRef.current.on('open', () => {
        const btn = document.getElementById(`btn-tikum-${tikum.id}`);
        if (btn && onJoinRef.current) {
          btn.onclick = (e) => {
            e.preventDefault();
            onJoinRef.current?.(tikum.id);
          };
        }
      });
    }
  }, [tikum.name, tikum.member_count, tikum.is_joined, tikum.meeting_time, tikum.description, tikum.id]);

  return null;
};
