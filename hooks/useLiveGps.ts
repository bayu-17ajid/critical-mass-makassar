'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AttendeeStatus } from '@/types';
import { eventService } from '@/lib/supabase/service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UseLiveGpsProps {
  eventId: string;
  userId: string | null;
  displayName?: string;
  isAnonymous?: boolean;
  onLocationUpdate?: (coords: { latitude: number; longitude: number; heading: number | null }) => void;
}

export function useLiveGps({
  eventId,
  userId,
  displayName = 'Rider',
  isAnonymous = false,
  onLocationUpdate,
}: UseLiveGpsProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<AttendeeStatus>('ATTENDING');
  const [lastCoords, setLastCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const lastSentCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Sync latest props into refs for active geolocation callbacks
  const displayNameRef = useRef(displayName);
  const isAnonymousRef = useRef(isAnonymous);
  const userIdRef = useRef(userId);

  useEffect(() => {
    displayNameRef.current = displayName;
    isAnonymousRef.current = isAnonymous;
    userIdRef.current = userId;
  }, [displayName, isAnonymous, userId]);

  // Stop tracking handler (defined first)
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsTracking(false);
    setCurrentStatus('ATTENDING');
    setAccuracyWarning(null);

    const activeId = userIdRef.current || userId;
    if (activeId && eventId) {
      await eventService.stopSharingLocation(eventId, activeId);

      if (isSupabaseConfigured && supabase) {
        const channel = supabase.channel(`event:${eventId}:live`);
        channel.send({
          type: 'broadcast',
          event: 'rider-stop',
          payload: { rider_id: activeId },
        });
      }
    }
  }, [eventId, userId]);

  // Throttled sender: 10s edge-latency architecture with >20m movement filter
  // Optimized for mass riders (1,000-5,000+) to run at zero cost
  const broadcastLocation = useCallback(
    async (coords: GeolocationCoordinates, status: AttendeeStatus) => {
      const activeId = userIdRef.current || userId;
      if (!activeId || !eventId) return;

      const activeDisplayName = isAnonymousRef.current ? 'Rider' : (displayNameRef.current || 'Rider');
      const activeIsAnonymous = isAnonymousRef.current;

      const now = Date.now();
      const timeSinceLastSend = now - lastSentTimeRef.current;
      const minIntervalMs = 10000; // 10 seconds latency for zero-cost scalability

      let isSignificantMove = false;
      if (lastSentCoordsRef.current) {
        const dLat = Math.abs(coords.latitude - lastSentCoordsRef.current.lat);
        const dLng = Math.abs(coords.longitude - lastSentCoordsRef.current.lng);
        // ~22 meters threshold in coordinates
        if (dLat > 0.00020 || dLng > 0.00020) {
          isSignificantMove = true;
        }
      } else {
        isSignificantMove = true;
      }

      // Send if 10s passed, or if rider moved >22m and at least 8s passed, or stationary heartbeat every 20s
      const shouldSend =
        (timeSinceLastSend >= minIntervalMs) ||
        (isSignificantMove && timeSinceLastSend >= 8000) ||
        (timeSinceLastSend >= 20000);

      if (shouldSend) {
        lastSentTimeRef.current = now;
        lastSentCoordsRef.current = { lat: coords.latitude, lng: coords.longitude };

        const payload = {
          eventId,
          userId: activeId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
          speedMps: coords.speed,
          heading: coords.heading,
          status,
          displayName: activeDisplayName,
          isAnonymous: activeIsAnonymous,
        };

        // 1. Post to Edge API endpoint
        fetch('/api/live/riders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(async () => {
          // Fallback to direct client service if network/API route encounters issue
          await eventService.updateLiveLocation({
            event_id: eventId,
            user_id: activeId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy_meters: coords.accuracy,
            speed_mps: coords.speed,
            heading: coords.heading,
            status,
            display_name: activeDisplayName,
            is_anonymous: activeIsAnonymous,
          });
        });

        // 2. Opportunistic WebSocket broadcast if channel is active
        if (isSupabaseConfigured && supabase) {
          const channel = supabase.channel(`event:${eventId}:live`);
          channel.send({
            type: 'broadcast',
            event: 'rider-position',
            payload: {
              rider_id: activeId,
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              speed: coords.speed,
              heading: coords.heading,
              recorded_at: new Date().toISOString(),
              status,
              display_name: activeDisplayName,
              avatar_url: null,
              is_anonymous: activeIsAnonymous,
            },
          });
        }
      }
    },
    [eventId, userId]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Perangkat Anda tidak mendukung GPS / Geolokasi.');
      return;
    }

    const activeId = userIdRef.current || userId;
    if (!activeId) {
      setGpsError('Silakan tentukan nama panggilan Anda terlebih dahulu.');
      return;
    }

    setGpsError(null);
    setAccuracyWarning(null);
    setIsTracking(true);
    setCurrentStatus('ON_THE_WAY');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 4000,
    };

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;

      setLastCoords({ latitude, longitude, accuracy, speed, heading });

      if (accuracy > 40) {
        setAccuracyWarning(
          `Akurasi GPS rendah (±${Math.round(accuracy)}m). Pastikan Anda berada di luar ruangan.`
        );
      } else {
        setAccuracyWarning(null);
      }

      if (onLocationUpdate) {
        onLocationUpdate({ latitude, longitude, heading });
      }

      broadcastLocation(position.coords, 'ON_THE_WAY');
    };

    const errorHandler = (err: GeolocationPositionError) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setGpsError(
            'Izin akses lokasi ditolak. Buka pengaturan browser untuk mengaktifkan izin GPS.'
          );
          stopTracking();
          break;
        case err.POSITION_UNAVAILABLE:
          setGpsError('Sinyal GPS tidak tersedia saat ini. Coba lagi dalam beberapa saat.');
          break;
        case err.TIMEOUT:
          setGpsError('Waktu permintaan sinyal GPS habis (timeout).');
          break;
        default:
          setGpsError('Gagal memperoleh posisi GPS.');
          break;
      }
    };

    const id = navigator.geolocation.watchPosition(successHandler, errorHandler, options);
    watchIdRef.current = id;
  }, [userId, onLocationUpdate, broadcastLocation, stopTracking]);

  const updateStatus = useCallback(
    async (status: AttendeeStatus) => {
      setCurrentStatus(status);
      if (userId && eventId && lastCoords) {
        await eventService.updateLiveLocation({
          event_id: eventId,
          user_id: userId,
          latitude: lastCoords.latitude,
          longitude: lastCoords.longitude,
          accuracy_meters: lastCoords.accuracy,
          speed_mps: lastCoords.speed,
          heading: lastCoords.heading,
          status,
          display_name: displayName,
          is_anonymous: isAnonymous,
        });

        if (isSupabaseConfigured && supabase) {
          const channel = supabase.channel(`event:${eventId}:live`);
          channel.send({
            type: 'broadcast',
            event: 'rider-status-change',
            payload: { rider_id: userId, status },
          });
        }
      }
    },
    [userId, eventId, lastCoords, displayName, isAnonymous]
  );

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    currentStatus,
    lastCoords,
    gpsError,
    accuracyWarning,
    startTracking,
    stopTracking,
    updateStatus,
  };
}
