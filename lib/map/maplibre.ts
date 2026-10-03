import {
  Map as MapLibreMap,
  Marker,
  Popup,
  setWorkerUrl,
  type MapMouseEvent,
  type ErrorEvent,
} from 'maplibre-gl';

// Configure the worker URL to load from self-hosted public assets
// This fixes "Worker failed to load. Check that the worker URL is correct" in Next.js bundlers.
if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre-gl/maplibre-gl-worker.mjs');
}

export {
  MapLibreMap,
  MapLibreMap as Map,
  Marker,
  Popup,
  setWorkerUrl,
  type MapMouseEvent,
  type ErrorEvent,
};
