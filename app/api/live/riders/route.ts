import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/lib/supabase/service';
import { LiveLocation } from '@/types';

// Edge CDN Caching: 10s fresh cache, 5s stale-while-revalidate
// This allows 10,000+ concurrent riders to fetch live locations with near-zero database load.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || 'cm-mks-event-01';

    const riders: LiveLocation[] = await eventService.getActiveLiveLocations(eventId);

    const response = NextResponse.json({
      riders,
      count: riders.length,
      timestamp: Date.now(),
    });

    // Vercel Edge CDN Header: Cache for 10 seconds across all edge nodes
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=5, max-age=5'
    );

    return response;
  } catch (error) {
    console.error('API /api/live/riders GET error:', error);
    return NextResponse.json({ riders: [], count: 0, error: 'Failed to fetch riders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      userId,
      latitude,
      longitude,
      accuracyMeters,
      speedMps,
      heading,
      status,
      displayName,
      isAnonymous,
    } = body;

    if (!eventId || !userId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Invalid location payload' }, { status: 400 });
    }

    await eventService.updateLiveLocation({
      event_id: eventId,
      user_id: userId,
      latitude,
      longitude,
      accuracy_meters: accuracyMeters ?? null,
      speed_mps: speedMps ?? null,
      heading: heading ?? null,
      status: status || 'ON_THE_WAY',
      display_name: displayName,
      is_anonymous: Boolean(isAnonymous),
    });

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error('API /api/live/riders POST error:', error);
    return NextResponse.json({ error: 'Failed to update live location' }, { status: 500 });
  }
}
