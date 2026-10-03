'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapLibreMap, setWorkerUrl, type MapMouseEvent, type ErrorEvent } from '@/lib/map/maplibre';
import { MapControls } from '@/components/ui/MapOverlay';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MapViewProps {
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  className?: string;
  onMapReady?: (map: MapLibreMap) => void;
  onClickMap?: (coords: [number, number]) => void;
  showControls?: boolean;
  children?: React.ReactNode;
}

export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
export const DEFAULT_MAKASSAR_CENTER: [number, number] = [119.4250, -5.1420]; // [lng, lat]
export const DEFAULT_ZOOM = 13;

export const MapView: React.FC<MapViewProps> = ({
  initialCenter = DEFAULT_MAKASSAR_CENTER,
  initialZoom = DEFAULT_ZOOM,
  className = 'w-full h-full min-h-[400px]',
  onMapReady,
  onClickMap,
  showControls = true,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Keep latest callbacks in refs so changing function identities never trigger map recreation
  const onMapReadyRef = useRef(onMapReady);
  const onClickMapRef = useRef(onClickMap);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
    onClickMapRef.current = onClickMap;
  });

  // Keep initial camera settings in refs so parent re-renders never trigger map recreation
  const initialCenterRef = useRef(initialCenter);
  const initialZoomRef = useRef(initialZoom);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // Prevent recreation if map already exists

    let isCancelled = false;
    let map: MapLibreMap | null = null;

    try {
      setWorkerUrl('/maplibre-gl/maplibre-gl-worker.mjs');
      map = new MapLibreMap({
        container: containerRef.current,
        style: OPENFREEMAP_STYLE,
        center: initialCenterRef.current,
        zoom: initialZoomRef.current,
        attributionControl: false,
      });

      map.on('load', () => {
        if (isCancelled || !map) return;
        mapRef.current = map;
        setMapInstance(map);
        setMapLoaded(true);

        if (onMapReadyRef.current) {
          onMapReadyRef.current(map);
        }
      });

      map.on('click', (e: MapMouseEvent) => {
        if (onClickMapRef.current) {
          onClickMapRef.current([e.lngLat.lng, e.lngLat.lat]);
        }
      });

      map.on('error', (e: ErrorEvent) => {
        console.warn('MapLibre notification:', e.error?.message);
      });
    } catch {
      setTimeout(() => {
        if (!isCancelled) {
          setMapError('Map tidak dapat dimuat. Coba refresh atau periksa koneksi internet.');
        }
      }, 0);
    }

    return () => {
      isCancelled = true;
      if (map) {
        map.remove();
        mapRef.current = null;
        setMapInstance(null);
      }
    };
  }, [retryCount]);

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut({ duration: 300 });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { longitude, latitude } = pos.coords;
        if (mapInstance) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true,
          });
        }
      },
      () => {
        setIsLocating(false);
        alert('Gagal mengambil lokasi saat ini');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (mapError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-6 bg-[#0f172a] border border-[#1e2d4d] rounded-2xl text-center ${className}`}
      >
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
        <h4 className="text-white font-bold mb-1">Map Error</h4>
        <p className="text-xs text-[#94a3b8] max-w-sm mb-4">{mapError}</p>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={() => {
            setMapError(null);
            setRetryCount((c) => c + 1);
          }}
        >
          Coba Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#080d1a] ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080d1a]/80 backdrop-blur-sm z-10">
          <div className="w-8 h-8 rounded-full border-2 border-[#00f076] border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-semibold text-[#94a3b8]">Memuat Peta Makassar...</span>
        </div>
      )}

      {showControls && mapLoaded && (
        <div className="absolute top-4 right-4 z-20">
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocateMe={handleLocateMe}
            onToggleFullscreen={handleToggleFullscreen}
            isLocating={isLocating}
          />
        </div>
      )}

      {mapLoaded && mapInstance && children}
    </div>
  );
};
