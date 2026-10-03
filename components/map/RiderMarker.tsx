'use client';

import React, { useEffect, useRef } from 'react';
import { MapLibreMap, Marker, Popup } from '@/lib/map/maplibre';
import { LiveLocation } from '@/types';

export interface RiderMarkerProps {
  map: MapLibreMap | null;
  rider: LiveLocation;
  onClickRider?: (rider: LiveLocation) => void;
}

export const RiderMarker: React.FC<RiderMarkerProps> = ({
  map,
  rider,
  onClickRider,
}) => {
  const markerRef = useRef<Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const riderRef = useRef(rider);
  const onClickRiderRef = useRef(onClickRider);

  useEffect(() => {
    riderRef.current = rider;
    onClickRiderRef.current = onClickRider;
  });

  const isStale = Boolean(rider.is_stale);
  const displayName = rider.is_anonymous ? 'Rider' : (rider.display_name || 'Rider');
  const isMoving = rider.status === 'ON_THE_WAY' && !isStale;

  // 1. Lifecycle: Create marker DOM structure ONCE per (map, user_id)
  useEffect(() => {
    if (!map) return;

    const el = document.createElement('div');
    el.className = 'cursor-pointer group flex flex-col items-center transition-opacity duration-300';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="rider-radar absolute w-9 h-9 rounded-full bg-[#00f076]/30 radar-glow hidden"></span>
        <div class="rider-icon-box w-8 h-8 rounded-full bg-[#080d1a] border-2 border-[#1e2d4d] shadow-[0_0_12px_rgba(0,240,118,0.4)] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <svg class="rider-svg w-4 h-4 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
      </div>
      <div class="rider-name mt-0.5 px-1.5 py-0.5 rounded-full bg-[#080d1a]/95 border border-[#1e2d4d] text-[9px] font-bold text-white shadow whitespace-nowrap">
      </div>
    `;

    el.onclick = (e) => {
      e.stopPropagation();
      if (onClickRiderRef.current) onClickRiderRef.current(riderRef.current);
    };

    elementRef.current = el;

    const popup = new Popup({ offset: 15, closeButton: false });
    popupRef.current = popup;

    const marker = new Marker({ element: el })
      .setLngLat([riderRef.current.longitude, riderRef.current.latitude])
      .setPopup(popup)
      .addTo(map);

    // Smooth Gliding Animation: Interpolate 10s GPS coordinates over 1.2s
    const markerWrapper = marker.getElement();
    if (markerWrapper) {
      markerWrapper.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)';
      markerWrapper.style.willChange = 'transform';
    }

    const handleMoveStart = () => {
      if (markerWrapper) markerWrapper.style.transition = 'none';
    };
    const handleMoveEnd = () => {
      if (markerWrapper) markerWrapper.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)';
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    markerRef.current = marker;

    return () => {
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      marker.remove();
      markerRef.current = null;
      elementRef.current = null;
      popupRef.current = null;
    };
  }, [map, rider.user_id]);

  // 2. Position updates: Smooth coordinate movement without destroying DOM
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([rider.longitude, rider.latitude]);
    }
  }, [rider.latitude, rider.longitude]);

  // 3. Visual updates in-place: modify classes & text nodes directly without destroying innerHTML
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (isStale) {
      el.classList.add('opacity-40');
      el.classList.remove('opacity-100');
    } else {
      el.classList.add('opacity-100');
      el.classList.remove('opacity-40');
    }

    const radar = el.querySelector<HTMLSpanElement>('.rider-radar');
    if (radar) {
      if (isMoving) radar.classList.remove('hidden');
      else radar.classList.add('hidden');
    }

    const iconBox = el.querySelector<HTMLDivElement>('.rider-icon-box');
    if (iconBox) {
      if (isMoving) {
        iconBox.classList.add('border-[#00f076]');
        iconBox.classList.remove('border-[#1e2d4d]');
      } else {
        iconBox.classList.add('border-[#1e2d4d]');
        iconBox.classList.remove('border-[#00f076]');
      }
    }

    const svg = el.querySelector<SVGElement>('.rider-svg');
    if (svg) {
      if (isMoving) {
        svg.classList.add('text-[#00f076]');
        svg.classList.remove('text-[#94a3b8]');
      } else {
        svg.classList.add('text-[#94a3b8]');
        svg.classList.remove('text-[#00f076]');
      }
    }

    const nameEl = el.querySelector<HTMLDivElement>('.rider-name');
    if (nameEl && nameEl.textContent !== displayName) {
      nameEl.textContent = displayName;
    }

    const statusBadge =
      rider.status === 'ON_THE_WAY'
        ? '<span class="text-[#00f076] font-bold">ON THE WAY</span>'
        : rider.status === 'AT_TIKUM'
        ? '<span class="text-[#a855f7] font-bold">DI TIKUM</span>'
        : '<span class="text-[#f43f5e] font-bold">ARRIVED</span>';

    if (popupRef.current) {
      popupRef.current.setHTML(`
        <div class="text-xs">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] text-[#94a3b8] uppercase font-mono">Status</span>
            ${statusBadge}
          </div>
          <div class="font-bold text-white text-sm mb-1">${displayName}</div>
          <div class="text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>Kecepatan: ${rider.speed_mps ? (rider.speed_mps * 3.6).toFixed(1) + ' km/h' : '-'}</span>
            <span class="font-mono">Aktif</span>
          </div>
          ${isStale ? '<div class="text-[10px] text-amber-400 mt-1 font-semibold">⚠️ Sinyal GPS tidak aktif (>60s)</div>' : ''}
        </div>
      `);
    }
  }, [rider.status, displayName, rider.speed_mps, isStale, isMoving]);

  return null;
};
