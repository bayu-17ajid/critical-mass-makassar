'use client';

import React, { useEffect, useRef } from 'react';
import { Map as MapLibreMap } from 'maplibre-gl';
import { EventRoute } from '@/types';

export interface RouteLayerProps {
  map: MapLibreMap | null;
  route: EventRoute | null;
  fitBounds?: boolean;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({
  map,
  route,
  fitBounds = true,
}) => {
  const hasFitBoundsRef = useRef(false);

  useEffect(() => {
    if (!map || !route || !route.geojson) return;

    const sourceId = 'critical-mass-route-source';
    const glowLayerId = 'critical-mass-route-glow';
    const mainLayerId = 'critical-mass-route-main';

    const geo = route.geojson as {
      coordinates?: [number, number][];
      geometry?: { coordinates?: [number, number][] };
    };

    const coords = geo.coordinates || geo.geometry?.coordinates || [];
    if (!coords || coords.length === 0) return;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    };

    // If source already exists, just update data to prevent layer flickering
    const existingSource = map.getSource(sourceId) as { setData: (data: GeoJSON.Feature<GeoJSON.LineString>) => void } | undefined;
    if (existingSource) {
      existingSource.setData(geojsonData);
      return;
    }

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojsonData,
    });

    // Add soft glow layer
    if (!map.getLayer(glowLayerId)) {
      map.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00f076',
          'line-width': 10,
          'line-opacity': 0.35,
          'line-blur': 4,
        },
      });
    }

    // Add sharp vibrant main layer
    if (!map.getLayer(mainLayerId)) {
      map.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00f076',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });
    }

    // Fit map bounds once on load
    if (fitBounds && !hasFitBoundsRef.current && coords.length > 1) {
      hasFitBoundsRef.current = true;
      let minLng = coords[0][0];
      let maxLng = coords[0][0];
      let minLat = coords[0][1];
      let maxLat = coords[0][1];

      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 1000,
        }
      );
    }
  }, [map, route, fitBounds]);

  return null;
};
