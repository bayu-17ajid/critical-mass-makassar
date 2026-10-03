import { CriticalMassEvent, EventLocation, RundownItem, EventRoute, MeetingPoint, EventAttendee, LiveLocation } from '@/types';
import { getNextCriticalMassDate } from '@/lib/event/date';

const nextEventDate = getNextCriticalMassDate();
const nextEventDateIso = nextEventDate.toISOString().split('T')[0];

export const MOCK_EVENT: CriticalMassEvent = {
  id: 'cm-mks-event-01',
  title: 'Critical Mass Makassar',
  description: 'Gerakan pesepeda merayakan kota, mengampanyekan ruang jalan yang aman dan inklusif bagi seluruh pesepeda di Kota Makassar.',
  event_date: nextEventDateIso,
  start_time: new Date(nextEventDate.getFullYear(), nextEventDate.getMonth(), nextEventDate.getDate(), 18, 30).toISOString(),
  finish_time: new Date(nextEventDate.getFullYear(), nextEventDate.getMonth(), nextEventDate.getDate(), 21, 0).toISOString(),
  status: 'published',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

export const MOCK_LOCATIONS: EventLocation[] = [
  {
    id: 'loc-01',
    event_id: 'cm-mks-event-01',
    type: 'MAIN_START',
    name: 'Anjungan Pantai Losari',
    description: 'Titik kumpul utama seluruh pesepeda sebelum konvoi bersama dimulai.',
    latitude: -5.1437,
    longitude: 119.4069,
    meeting_time: '18:30',
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'loc-02',
    event_id: 'cm-mks-event-01',
    type: 'FINISH',
    name: 'Taman Karebosi',
    description: 'Titik akhir rute Critical Mass. Santai bareng, sharing komunitas, dan foto bersama.',
    latitude: -5.1348,
    longitude: 119.4124,
    meeting_time: '20:30',
    created_at: '2026-09-01T00:00:00Z',
  },
];

export const MOCK_RUNDOWN: RundownItem[] = [
  {
    id: 'rd-01',
    time: '17:30',
    title: 'Kumpul di Tikum Peserta',
    description: 'Pesepeda berkumpul di meeting point terdekat wilayah masing-masing untuk konvoi ke Losari.',
    order: 1,
  },
  {
    id: 'rd-02',
    time: '18:30',
    title: 'Start dari Tikum Utama (Anjungan Losari)',
    description: 'Safety briefing, cek lampu sepeda, dan menyatukan seluruh pleton pesepeda.',
    order: 2,
  },
  {
    id: 'rd-03',
    time: '19:00',
    title: 'Rute Critical Mass Ride',
    description: 'Konvoi damai dan tertib menyusuri jalan protokol Kota Makassar.',
    order: 3,
  },
  {
    id: 'rd-04',
    time: '20:30',
    title: 'Finish di Taman Karebosi',
    description: 'Tiba di Lapangan Karebosi, istirahat hidrasi dan interaksi komunitas.',
    order: 4,
  },
  {
    id: 'rd-05',
    time: '21:00',
    title: 'Selesai & Bebas',
    description: 'Penutupan acara, gowes santai kembali ke rumah masing-masing.',
    order: 5,
  },
];

export const MOCK_ROUTE: EventRoute = {
  id: 'route-01',
  event_id: 'cm-mks-event-01',
  name: 'Rute Resmi Critical Mass Makassar (~12.4 km)',
  geojson: {
    type: 'LineString',
    coordinates: [
      [119.4069, -5.1437], // Losari
      [119.4062, -5.1485], // Penghibur
      [119.4112, -5.1520], // Haji Bau
      [119.4185, -5.1550], // Ratulangi
      [119.4320, -5.1510], // Veteran Selatan
      [119.4410, -5.1450], // Pettarani
      [119.4350, -5.1360], // Urip Sumoharjo
      [119.4260, -5.1320], // Bawakaraeng
      [119.4180, -5.1330], // Sudirman
      [119.4124, -5.1348], // Karebosi
    ],
  },
  distance_meters: 12400,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

export const MOCK_TIKUMS: MeetingPoint[] = [
  {
    id: 'tk-01',
    event_id: 'cm-mks-event-01',
    creator_id: 'admin-01',
    name: 'Tikum CPI (Masjid 99 Kubah)',
    description: 'Kumpul di pelataran depan jembatan CPI sebelum meluncur ke Losari.',
    latitude: -5.1550,
    longitude: 119.4020,
    meeting_time: '17:45',
    status: 'ACTIVE',
    member_count: 0,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'tk-02',
    event_id: 'cm-mks-event-01',
    creator_id: 'admin-01',
    name: 'Tikum Hertasning (Depan PLN)',
    description: 'Rombongan pesepeda area Panakkukang & Hertasning.',
    latitude: -5.1630,
    longitude: 119.4450,
    meeting_time: '17:30',
    status: 'ACTIVE',
    member_count: 0,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'tk-03',
    event_id: 'cm-mks-event-01',
    creator_id: 'admin-01',
    name: 'Tikum Boulevard (Mall Panakkukang)',
    description: 'Kumpul di depan trotoar MP Jl. Boulevard.',
    latitude: -5.1520,
    longitude: 119.4440,
    meeting_time: '17:30',
    status: 'ACTIVE',
    member_count: 0,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

export const MOCK_ATTENDEES: EventAttendee[] = [];

export const MOCK_LIVE_LOCATIONS: LiveLocation[] = [];
