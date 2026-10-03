'use client';

import React, { useState } from 'react';
import { MapView } from './MapView';
import { MapLibreMap, Marker } from '@/lib/map/maplibre';
import { MapPin } from 'lucide-react';

export interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLatitude = -5.1477,
  initialLongitude = 119.4327,
  onLocationSelect,
  className = 'h-64 sm:h-80 w-full',
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLatitude,
    lng: initialLongitude,
  });
  const initialCenter = React.useMemo<[number, number]>(
    () => [initialLongitude, initialLatitude],
    [initialLongitude, initialLatitude]
  );
  const markerRef = React.useRef<Marker | null>(null);

  const handleMapReady = (map: MapLibreMap) => {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-[#a855f7] border-2 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;

    const marker = new Marker({ element: el })
      .setLngLat([initialLongitude, initialLatitude])
      .addTo(map);

    markerRef.current = marker;
  };

  const handleMapClick = (clickCoords: [number, number]) => {
    const [lng, lat] = clickCoords;
    setCoords({ lat, lng });
    onLocationSelect(lat, lng);

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-[#1e2d4d]">
        <MapView
          initialCenter={initialCenter}
          initialZoom={13}
          className={className}
          onMapReady={handleMapReady}
          onClickMap={handleMapClick}
        />
        <div className="absolute top-3 left-3 bg-[#080d1a]/90 backdrop-blur-md border border-[#1e2d4d] px-3 py-1.5 rounded-xl text-xs text-[#94a3b8] flex items-center gap-1.5 shadow-lg pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>Ketuk peta untuk menentukan titik kumpul</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs font-mono text-[#64748b] px-1">
        <span>Lat: {coords.lat.toFixed(6)}</span>
        <span>Lng: {coords.lng.toFixed(6)}</span>
      </div>
    </div>
  );
};
