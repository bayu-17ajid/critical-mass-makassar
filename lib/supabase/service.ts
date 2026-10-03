import { supabase, isSupabaseConfigured } from './client';
import {
  CriticalMassEvent,
  EventLocation,
  RundownItem,
  EventRoute,
  MeetingPoint,
  EventAttendee,
  LiveLocation,
  AttendeeStatus,
} from '@/types';
import {
  MOCK_EVENT,
  MOCK_LOCATIONS,
  MOCK_RUNDOWN,
  MOCK_ROUTE,
  MOCK_TIKUMS,
  MOCK_ATTENDEES,
  MOCK_LIVE_LOCATIONS,
} from './mock-data';

// Local storage state keys for fallback demo mode
const STORAGE_KEYS = {
  ATTENDEES: 'cm_mks_attendees',
  TIKUMS: 'cm_mks_tikums',
  TIKUM_MEMBERS: 'cm_mks_tikum_members',
  LIVE_LOCATIONS: 'cm_mks_live_locations',
  RUNDOWN: 'cm_mks_rundown',
  LOCATIONS: 'cm_mks_locations',
};

function getLocalState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalState<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export const eventService = {
  /**
   * Fetches latest active/published event
   */
  async getLatestEvent(): Promise<CriticalMassEvent> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['published', 'live'])
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as CriticalMassEvent;
      }
    }
    return MOCK_EVENT;
  },

  /**
   * Fetches official locations (Start, Finish, Waypoints)
   */
  async getEventLocations(eventId: string): Promise<EventLocation[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('event_locations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as EventLocation[];
      }
    }
    return getLocalState<EventLocation[]>(STORAGE_KEYS.LOCATIONS, MOCK_LOCATIONS);
  },

  /**
   * Updates an event location (Start, Finish)
   */
  async updateEventLocation(locationId: string, updates: Partial<EventLocation>): Promise<EventLocation> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('event_locations')
        .update(updates)
        .eq('id', locationId)
        .select()
        .single();
      if (!error && data) return data as EventLocation;
    }

    const locations = getLocalState<EventLocation[]>(STORAGE_KEYS.LOCATIONS, MOCK_LOCATIONS);
    const index = locations.findIndex((l) => l.id === locationId);
    if (index >= 0) {
      locations[index] = { ...locations[index], ...updates };
      setLocalState(STORAGE_KEYS.LOCATIONS, locations);
      return locations[index];
    }
    const newLoc: EventLocation = {
      id: locationId,
      event_id: 'cm-mks-event-01',
      type: 'MAIN_START',
      name: updates.name || 'Lokasi',
      description: updates.description || null,
      latitude: updates.latitude || -5.1437,
      longitude: updates.longitude || 119.4069,
      meeting_time: updates.meeting_time || '18:30',
      created_at: new Date().toISOString(),
      ...updates,
    };
    locations.push(newLoc);
    setLocalState(STORAGE_KEYS.LOCATIONS, locations);
    return newLoc;
  },

  /**
   * Fetches event rundown items
   */
  async getEventRundown(eventId: string): Promise<RundownItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('event_rundowns')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as RundownItem[];
      }
    }
    return getLocalState<RundownItem[]>(STORAGE_KEYS.RUNDOWN, MOCK_RUNDOWN);
  },

  /**
   * Creates or updates a rundown item
   */
  async saveRundownItem(item: {
    event_id: string;
    id?: string;
    time: string;
    title: string;
    description?: string;
    order?: number;
  }): Promise<RundownItem> {
    if (isSupabaseConfigured && supabase) {
      const payload = {
        event_id: item.event_id,
        time: item.time,
        title: item.title,
        description: item.description,
        display_order: item.order,
      };
      if (item.id) {
        const { data, error } = await supabase
          .from('event_rundowns')
          .update(payload)
          .eq('id', item.id)
          .select()
          .single();
        if (!error && data) return data as RundownItem;
      } else {
        const { data, error } = await supabase
          .from('event_rundowns')
          .insert(payload)
          .select()
          .single();
        if (!error && data) return data as RundownItem;
      }
    }

    const list = getLocalState<RundownItem[]>(STORAGE_KEYS.RUNDOWN, MOCK_RUNDOWN);
    if (item.id) {
      const index = list.findIndex((r) => r.id === item.id);
      if (index >= 0) {
        list[index] = {
          ...list[index],
          ...item,
          order: item.order ?? list[index].order,
        };
        setLocalState(STORAGE_KEYS.RUNDOWN, list);
        return list[index];
      }
    }

    const newItem: RundownItem = {
      id: item.id || `rundown-${Date.now()}`,
      time: item.time,
      title: item.title,
      description: item.description || undefined,
      order: item.order ?? (list.length + 1),
    };
    list.push(newItem);
    list.sort((a, b) => a.order - b.order);
    setLocalState(STORAGE_KEYS.RUNDOWN, list);
    return newItem;
  },

  /**
   * Deletes a rundown item
   */
  async deleteRundownItem(itemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('event_rundowns').delete().eq('id', itemId);
    }
    const list = getLocalState<RundownItem[]>(STORAGE_KEYS.RUNDOWN, MOCK_RUNDOWN);
    const filtered = list.filter((r) => r.id !== itemId);
    setLocalState(STORAGE_KEYS.RUNDOWN, filtered);
    return true;
  },

  /**
   * Fetches official cycling route
   */
  async getEventRoute(eventId: string): Promise<EventRoute | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('event_routes')
        .select('*')
        .eq('event_id', eventId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as EventRoute;
      }
    }
    return MOCK_ROUTE;
  },

  /**
   * Fetches attendees for an event
   */
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length === 0) return [];
        const userIds = data.map((a: any) => a.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        const profMap = new Map((profs || []).map((p: any) => [p.id, p]));
        return data.map((item: any) => ({
          ...item,
          profile: profMap.get(item.user_id) || {
            id: item.user_id,
            username: item.is_anonymous ? 'anonymous' : 'rider',
            display_name: item.is_anonymous ? 'Rider' : 'Rider Makassar',
            avatar_url: null,
            created_at: item.created_at,
            updated_at: item.updated_at,
          },
        })) as EventAttendee[];
      }

      if (isSupabaseConfigured) {
        return [];
      }
    }
    return getLocalState<EventAttendee[]>(STORAGE_KEYS.ATTENDEES, MOCK_ATTENDEES);
  },

  /**
   * Registers attendance for user
   */
  async attendEvent(eventId: string, userId: string, isAnonymous = false): Promise<EventAttendee> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('event_attendees')
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status: 'ATTENDING',
            is_anonymous: isAnonymous,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,user_id' }
        )
        .select()
        .single();

      if (!error && data) {
        return data as EventAttendee;
      }
    }

    // Local state fallback
    const list = getLocalState<EventAttendee[]>(STORAGE_KEYS.ATTENDEES, MOCK_ATTENDEES);
    const existingIndex = list.findIndex((a) => a.user_id === userId);
    const newAttendee: EventAttendee = {
      id: existingIndex >= 0 ? list[existingIndex].id : `att-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      status: 'ATTENDING',
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        id: userId,
        username: 'you',
        display_name: isAnonymous ? 'Rider' : 'Saya (Rider)',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    if (existingIndex >= 0) {
      list[existingIndex] = newAttendee;
    } else {
      list.push(newAttendee);
    }
    setLocalState(STORAGE_KEYS.ATTENDEES, list);
    return newAttendee;
  },

  /**
   * Cancels attendance for user
   */
  async cancelAttendance(eventId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      return !error;
    }

    const list = getLocalState<EventAttendee[]>(STORAGE_KEYS.ATTENDEES, MOCK_ATTENDEES);
    const updated = list.filter((a) => a.user_id !== userId);
    setLocalState(STORAGE_KEYS.ATTENDEES, updated);
    return true;
  },

  /**
   * Fetches meeting points (Tikums)
   */
  async getTikums(eventId: string, currentUserId?: string): Promise<MeetingPoint[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('meeting_points')
        .select('*, members:meeting_point_members(user_id)')
        .eq('event_id', eventId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (!error && data) {
        interface RawTikumRow extends MeetingPoint {
          members?: { user_id: string }[];
        }
        const rows = data as unknown as RawTikumRow[];
        return rows.map((item) => ({
          ...item,
          member_count: item.members?.length || 0,
          is_joined: currentUserId ? Boolean(item.members?.some((m) => m.user_id === currentUserId)) : false,
        })) as MeetingPoint[];
      }

      if (isSupabaseConfigured) {
        return [];
      }
    }

    const tikums = getLocalState<MeetingPoint[]>(STORAGE_KEYS.TIKUMS, MOCK_TIKUMS);
    const members = getLocalState<{ tikum_id: string; user_id: string }[]>(
      STORAGE_KEYS.TIKUM_MEMBERS,
      []
    );

    return tikums.map((t) => {
      const tMembers = members.filter((m) => m.tikum_id === t.id);
      return {
        ...t,
        member_count: tMembers.length,
        is_joined: currentUserId ? members.some((m) => m.tikum_id === t.id && m.user_id === currentUserId) : false,
      };
    });
  },

  /**
   * Creates a community meeting point (Tikum)
   */
  async createTikum(tikum: {
    event_id: string;
    creator_id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    meeting_time: string;
  }): Promise<MeetingPoint> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('meeting_points')
        .insert({
          event_id: tikum.event_id,
          creator_id: tikum.creator_id,
          name: tikum.name,
          description: tikum.description,
          latitude: tikum.latitude,
          longitude: tikum.longitude,
          meeting_time: tikum.meeting_time,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (!error && data) {
        return data as MeetingPoint;
      }
    }

    const list = getLocalState<MeetingPoint[]>(STORAGE_KEYS.TIKUMS, MOCK_TIKUMS);
    const newTikum: MeetingPoint = {
      id: `tikum-${Date.now()}`,
      ...tikum,
      status: 'ACTIVE',
      member_count: 1,
      is_joined: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newTikum);
    setLocalState(STORAGE_KEYS.TIKUMS, list);

    // Auto join creator
    const members = getLocalState<{ tikum_id: string; user_id: string }[]>(
      STORAGE_KEYS.TIKUM_MEMBERS,
      []
    );
    members.push({ tikum_id: newTikum.id, user_id: tikum.creator_id });
    setLocalState(STORAGE_KEYS.TIKUM_MEMBERS, members);

    return newTikum;
  },

  /**
   * Join a Tikum
   */
  async joinTikum(meetingPointId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('meeting_point_members')
        .insert({
          meeting_point_id: meetingPointId,
          user_id: userId,
        });
      return !error;
    }

    const members = getLocalState<{ tikum_id: string; user_id: string }[]>(
      STORAGE_KEYS.TIKUM_MEMBERS,
      []
    );
    if (!members.some((m) => m.tikum_id === meetingPointId && m.user_id === userId)) {
      members.push({ tikum_id: meetingPointId, user_id: userId });
      setLocalState(STORAGE_KEYS.TIKUM_MEMBERS, members);
    }
    return true;
  },

  /**
   * Leave a Tikum
   */
  async leaveTikum(meetingPointId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('meeting_point_members')
        .delete()
        .eq('meeting_point_id', meetingPointId)
        .eq('user_id', userId);
      return !error;
    }

    const members = getLocalState<{ tikum_id: string; user_id: string }[]>(
      STORAGE_KEYS.TIKUM_MEMBERS,
      []
    );
    const updated = members.filter((m) => !(m.tikum_id === meetingPointId && m.user_id === userId));
    setLocalState(STORAGE_KEYS.TIKUM_MEMBERS, updated);
    return true;
  },

  /**
   * Deletes a Tikum (Admin)
   */
  async deleteTikum(tikumId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('meeting_points').delete().eq('id', tikumId);
    }
    const list = getLocalState<MeetingPoint[]>(STORAGE_KEYS.TIKUMS, MOCK_TIKUMS);
    const filtered = list.filter((t) => t.id !== tikumId);
    setLocalState(STORAGE_KEYS.TIKUMS, filtered);
    return true;
  },

  /**
   * Fetches active live locations (filters out older than stale threshold, e.g. 60 seconds)
   */
  async getActiveLiveLocations(eventId: string): Promise<LiveLocation[]> {
    if (isSupabaseConfigured && supabase) {
      // Get recent locations from last 5 minutes
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('live_locations')
        .select('*')
        .eq('event_id', eventId)
        .gte('recorded_at', fiveMinsAgo);

      if (!error && data) {
        return data as unknown as LiveLocation[];
      }

      if (isSupabaseConfigured) {
        return [];
      }
    }

    return getLocalState<LiveLocation[]>(STORAGE_KEYS.LIVE_LOCATIONS, MOCK_LIVE_LOCATIONS);
  },

  /**
   * Updates or inserts user's current live location and attendee status
   */
  async updateLiveLocation(location: {
    event_id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    accuracy_meters: number | null;
    speed_mps: number | null;
    heading: number | null;
    status?: AttendeeStatus;
    display_name?: string;
    is_anonymous?: boolean;
  }): Promise<void> {
    const recordedAt = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      // Upsert live_locations
      await supabase.from('live_locations').upsert(
        {
          event_id: location.event_id,
          user_id: location.user_id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy_meters: location.accuracy_meters,
          speed_mps: location.speed_mps,
          heading: location.heading,
          recorded_at: recordedAt,
        },
        { onConflict: 'event_id,user_id' }
      );

      // Update attendee status
      if (location.status) {
        await supabase
          .from('event_attendees')
          .update({ status: location.status, updated_at: recordedAt })
          .eq('event_id', location.event_id)
          .eq('user_id', location.user_id);
      }
      return;
    }

    // Local fallback
    const locations = getLocalState<LiveLocation[]>(STORAGE_KEYS.LIVE_LOCATIONS, MOCK_LIVE_LOCATIONS);
    const existingIndex = locations.findIndex((l) => l.user_id === location.user_id);
    const item: LiveLocation = {
      id: existingIndex >= 0 ? locations[existingIndex].id : `live-${Date.now()}`,
      event_id: location.event_id,
      user_id: location.user_id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy_meters: location.accuracy_meters,
      speed_mps: location.speed_mps,
      heading: location.heading,
      recorded_at: recordedAt,
      status: location.status || 'ON_THE_WAY',
      display_name: location.is_anonymous ? 'Rider' : (location.display_name || 'Rider'),
      avatar_url: null,
      is_anonymous: location.is_anonymous,
    };

    if (existingIndex >= 0) {
      locations[existingIndex] = item;
    } else {
      locations.push(item);
    }
    setLocalState(STORAGE_KEYS.LIVE_LOCATIONS, locations);
  },

  /**
   * Stops sharing location: deletes live_locations row and sets attendee status back to ATTENDING
   */
  async stopSharingLocation(eventId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('live_locations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      await supabase
        .from('event_attendees')
        .update({ status: 'ATTENDING', updated_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', userId);
      return;
    }

    const locations = getLocalState<LiveLocation[]>(STORAGE_KEYS.LIVE_LOCATIONS, MOCK_LIVE_LOCATIONS);
    const filtered = locations.filter((l) => l.user_id !== userId);
    setLocalState(STORAGE_KEYS.LIVE_LOCATIONS, filtered);
  },
};
