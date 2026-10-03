'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveLocation } from '@/types';
import { eventService } from '@/lib/supabase/service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UseRealtimeRidersProps {
  eventId: string;
}

export function useRealtimeRiders({ eventId }: UseRealtimeRidersProps) {
  const [riders, setRiders] = useState<LiveLocation[]>([]);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [loading, setLoading] = useState(true);
  const ridersRef = useRef<LiveLocation[]>([]);

  // Keep ref synchronized
  useEffect(() => {
    ridersRef.current = riders;
  }, [riders]);

  // Helper to merge newly fetched list with current state smoothly
  const mergeRiders = useCallback((freshList: LiveLocation[]) => {
    setRiders((prev) => {
      const map = new Map<string, LiveLocation>();
      prev.forEach((r) => map.set(r.user_id, r));

      const now = Date.now();
      freshList.forEach((fresh) => {
        const existing = map.get(fresh.user_id);
        const freshAge = (now - new Date(fresh.recorded_at).getTime()) / 1000;
        const freshWithStale: LiveLocation = {
          ...fresh,
          is_stale: freshAge > 60,
        };

        if (!existing) {
          map.set(fresh.user_id, freshWithStale);
        } else {
          const existingTime = new Date(existing.recorded_at).getTime();
          const freshTime = new Date(fresh.recorded_at).getTime();
          if (freshTime >= existingTime) {
            map.set(fresh.user_id, freshWithStale);
          }
        }
      });

      // Retain riders seen in fresh list or active within the last 60 seconds
      const freshUserIds = new Set(freshList.map((r) => r.user_id));
      const result: LiveLocation[] = [];
      map.forEach((r) => {
        const ageSecs = (now - new Date(r.recorded_at).getTime()) / 1000;
        if (freshUserIds.has(r.user_id) || ageSecs < 60) {
          result.push(r);
        }
      });

      return result;
    });
  }, []);

  const fetchEdgeRiders = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/riders?eventId=${encodeURIComponent(eventId)}`, {
        cache: 'default', // Leverages Vercel Edge CDN cache headers (s-maxage=10)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.riders)) {
          mergeRiders(data.riders);
          setConnectionState('connected');
          return data.riders;
        }
      }
    } catch {
      // Fallback directly to eventService if fetch fails
      const fallbackData = await eventService.getActiveLiveLocations(eventId);
      mergeRiders(fallbackData);
      return fallbackData;
    }
    return [];
  }, [eventId, mergeRiders]);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        setLoading(true);
        await fetchEdgeRiders();
      } catch (err) {
        console.error('Failed to load initial live riders:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();

    // 10s Edge-Cached Smart Polling
    // Edge CDN caches responses for 10s so 1,000+ riders query the edge network,
    // keeping Supabase DB hits to only 1 query per 10s ($0 cost!).
    const jitter = Math.floor(Math.random() * 2000); // 0-2s jitter
    const pollInterval = setInterval(() => {
      if (mounted) {
        fetchEdgeRiders();
      }
    }, 10000 + jitter);

    // Setup Supabase Realtime channel as an optional opportunistic fast-path
    let channel: RealtimeChannel | null = null;
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      channel = client.channel(`event:${eventId}:live`, {
        config: {
          broadcast: { self: false },
        },
      });

      channel
        .on('broadcast', { event: 'rider-position' }, ({ payload }) => {
          if (!mounted) return;
          setRiders((prev) => {
            const index = prev.findIndex((r) => r.user_id === payload.rider_id);
            const updatedRider: LiveLocation = {
              id: index >= 0 ? prev[index].id : `live-${payload.rider_id}`,
              event_id: eventId,
              user_id: payload.rider_id,
              latitude: payload.latitude,
              longitude: payload.longitude,
              accuracy_meters: payload.accuracy,
              speed_mps: payload.speed,
              heading: payload.heading,
              recorded_at: payload.recorded_at,
              status: payload.status,
              display_name: payload.display_name,
              avatar_url: payload.avatar_url,
              is_anonymous: payload.is_anonymous,
              is_stale: false,
            };

            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedRider;
              return copy;
            }
            return [...prev, updatedRider];
          });
        })
        .on('broadcast', { event: 'rider-stop' }, ({ payload }) => {
          if (!mounted) return;
          setRiders((prev) => prev.filter((r) => r.user_id !== payload.rider_id));
        })
        .on('broadcast', { event: 'rider-status-change' }, ({ payload }) => {
          if (!mounted) return;
          setRiders((prev) =>
            prev.map((r) =>
              r.user_id === payload.rider_id ? { ...r, status: payload.status } : r
            )
          );
        })
        .subscribe((status) => {
          if (!mounted) return;
          if (status === 'SUBSCRIBED') {
            setConnectionState('connected');
          }
          // Note: even if WebSocket reaches 200 connection quota on Supabase Free Tier,
          // the app continues seamlessly via Edge CDN polling with zero user-facing disruption.
        });
    }

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId, fetchEdgeRiders]);

  // Periodic stale check (every 10s)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRiders((prev) =>
        prev.map((r) => {
          const ageSecs = (now - new Date(r.recorded_at).getTime()) / 1000;
          return {
            ...r,
            is_stale: ageSecs > 60,
          };
        })
      );
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return {
    riders,
    loading,
    connectionState,
    refreshRiders: fetchEdgeRiders,
  };
}
