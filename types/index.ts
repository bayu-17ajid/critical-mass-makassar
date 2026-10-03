export type EventStatus = 'draft' | 'published' | 'live' | 'completed' | 'cancelled';

export type CalculatedEventState = 'UPCOMING' | 'TODAY' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export type LocationType = 'MAIN_START' | 'WAYPOINT' | 'FINISH';

export type AttendeeStatus = 'ATTENDING' | 'ON_THE_WAY' | 'AT_TIKUM' | 'ARRIVED' | 'CANCELLED';

export type TikumStatus = 'ACTIVE' | 'CANCELLED';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role?: 'user' | 'admin';
  bike_type?: string | null;
  is_anonymous?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CriticalMassEvent {
  id: string;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // ISO
  finish_time: string; // ISO
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface RundownItem {
  id: string;
  time: string; // e.g. "17:30"
  title: string;
  description?: string;
  order: number;
}

export interface EventLocation {
  id: string;
  event_id: string;
  type: LocationType;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  meeting_time: string | null;
  created_at: string;
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface EventRoute {
  id: string;
  event_id: string;
  name: string;
  geojson: GeoJsonLineString | { type: string; geometry?: GeoJsonLineString; [key: string]: unknown };
  distance_meters: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: AttendeeStatus;
  is_anonymous?: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface MeetingPoint {
  id: string;
  event_id: string;
  creator_id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  meeting_time: string;
  status: TikumStatus;
  created_at: string;
  updated_at: string;
  member_count?: number;
  creator_profile?: Profile;
  is_joined?: boolean;
}

export interface MeetingPointMember {
  id: string;
  meeting_point_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface LiveLocation {
  id: string;
  event_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  speed_mps: number | null;
  heading: number | null;
  recorded_at: string;
  status?: AttendeeStatus;
  display_name?: string;
  avatar_url?: string | null;
  is_anonymous?: boolean;
  is_stale?: boolean;
}

export interface LiveBroadcastPayload {
  rider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  status: AttendeeStatus;
  display_name: string;
  avatar_url: string | null;
  is_anonymous: boolean;
}

export interface EventStatistics {
  attending_count: number;
  tikum_count: number;
  on_the_way_count: number;
  at_tikum_count: number;
  arrived_count: number;
}
