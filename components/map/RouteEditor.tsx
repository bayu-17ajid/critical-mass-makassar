'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapView, DEFAULT_MAKASSAR_CENTER } from './MapView';
import { MapLibreMap, Marker } from '@/lib/map/maplibre';
import { Button } from '@/components/ui/Button';
import { Undo, Trash2, Check, Route as RouteIcon } from 'lucide-react';
import { GeoJsonLineString } from '@/types';

export interface RouteEditorProps {
  initialCoordinates?: [number, number][]; // [[lng, lat], ...]
  onSaveRoute: (geojson: GeoJsonLineString, distanceMeters: number) => void;
  className?: string;
}

function calculateLineDistance(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let totalMeters = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }
  return Math.round(totalMeters);
}

export const RouteEditor: React.FC<RouteEditorProps> = ({
  initialCoordinates = [],
  onSaveRoute,
  className = 'h-96 w-full',
}) => {
  const [points, setPoints] = useState<[number, number][]>(initialCoordinates);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapInstance) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    points.forEach((pt, index) => {
      const isFirst = index === 0;
      const isLast = index === points.length - 1 && points.length > 1;

      const el = document.createElement('div');
      el.className = `w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg ${
        isFirst ? 'bg-[#00f076]' : isLast ? 'bg-[#f43f5e]' : 'bg-[#a855f7]'
      }`;
      el.innerText = `${index + 1}`;

      const marker = new Marker({ element: el })
        .setLngLat(pt)
        .addTo(mapInstance);
      markersRef.current.push(marker);
    });

    const sourceId = 'editor-route-source';
    const layerId = 'editor-route-layer';

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: points,
      },
    };

    const existingSource = mapInstance.getSource(sourceId) as { setData: (data: GeoJSON.Feature<GeoJSON.LineString>) => void } | undefined;
    if (existingSource) {
      existingSource.setData(geojson);
    } else {
      mapInstance.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });

      mapInstance.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00f076',
          'line-width': 4,
          'line-dasharray': [2, 1],
        },
      });
    }
  }, [mapInstance, points]);

  const handleMapClick = (coords: [number, number]) => {
    setPoints((prev) => [...prev, coords]);
  };

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
  };

  const distance = calculateLineDistance(points);

  const handleSave = () => {
    const geojson: GeoJsonLineString = {
      type: 'LineString',
      coordinates: points,
    };
    onSaveRoute(geojson, distance);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-[#1e2d4d]">
        <MapView
          initialCenter={DEFAULT_MAKASSAR_CENTER}
          initialZoom={13}
          className={className}
          onMapReady={setMapInstance}
          onClickMap={handleMapClick}
        />
        <div className="absolute top-3 left-3 bg-[#080d1a]/90 backdrop-blur-md border border-[#1e2d4d] px-3 py-1.5 rounded-xl text-xs text-[#94a3b8] flex items-center gap-2 shadow-lg">
          <RouteIcon className="w-4 h-4 text-[#00f076]" />
          <span>Klik peta berurutan untuk membuat garis rute</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0f172a] border border-[#1e2d4d]">
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-white font-bold">{points.length} Titik Waypoint</span>
          <span className="text-[#00f076] font-bold">
            Jarak: {(distance / 1000).toFixed(2)} KM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Undo className="w-3.5 h-3.5" />}
            onClick={handleUndo}
            disabled={points.length === 0}
          >
            Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            onClick={handleClear}
            disabled={points.length === 0}
          >
            Hapus Semua
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Check className="w-3.5 h-3.5" />}
            onClick={handleSave}
            disabled={points.length < 2}
          >
            Simpan Rute
          </Button>
        </div>
      </div>
    </div>
  );
};
