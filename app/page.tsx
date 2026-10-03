'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { eventService } from '@/lib/supabase/service';
import { getNextCriticalMassDate, formatIndonesianDate } from '@/lib/event/date';
import {
  CriticalMassEvent,
  EventLocation,
  MeetingPoint,
  EventAttendee,
} from '@/types';
import { Countdown } from '@/components/ui/Countdown';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LocationCard } from '@/components/ui/LocationCard';
import { MapView } from '@/components/map/MapView';
import { StartMarker } from '@/components/map/StartMarker';
import { FinishMarker } from '@/components/map/FinishMarker';
import { TikumMarker } from '@/components/map/TikumMarker';
import { Map as MapLibreMap } from '@/lib/map/maplibre';
import {
  Bike,
  Users,
  MapPin,
  Radio,
  ArrowRight,
  CheckCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

const MAKASSAR_CENTER_COORDS: [number, number] = [119.4250, -5.1420];

export default function HomePage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [event, setEvent] = useState<CriticalMassEvent | null>(null);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [tikums, setTikums] = useState<MeetingPoint[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [attendingLoading, setAttendingLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  // Dynamic next event date (Last Friday)
  const nextFriday = React.useMemo(() => getNextCriticalMassDate(), []);

  useEffect(() => {
    async function loadData() {
      const ev = await eventService.getLatestEvent();
      setEvent(ev);

      const [locs, tks, atts] = await Promise.all([
        eventService.getEventLocations(ev.id),
        eventService.getTikums(ev.id, user?.id),
        eventService.getEventAttendees(ev.id),
      ]);

      setLocations(locs);
      setTikums(tks);
      setAttendees(atts);

      if (user) {
        setIsAttending(atts.some((a) => a.user_id === user.id));
      }
    }

    loadData();
  }, [user]);

  const handleAttendToggle = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!event) return;

    setAttendingLoading(true);
    try {
      if (isAttending) {
        await eventService.cancelAttendance(event.id, user.id);
        setIsAttending(false);
        setAttendees((prev) => prev.filter((a) => a.user_id !== user.id));
      } else {
        const newAtt = await eventService.attendEvent(event.id, user.id, false);
        setIsAttending(true);
        setAttendees((prev) => [...prev, newAtt]);
      }
    } catch (err) {
      console.error('Failed to toggle attendance:', err);
    } finally {
      setAttendingLoading(false);
    }
  };

  const startLoc = locations.find((l) => l.type === 'MAIN_START') || locations[0];
  const finishLoc = locations.find((l) => l.type === 'FINISH') || locations[1];

  const onTheWayCount = attendees.filter((a) => a.status === 'ON_THE_WAY').length;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[520px] sm:min-h-[580px] rounded-3xl overflow-hidden border border-[#1e2d4d] mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 bg-[#080d1a] shadow-2xl">
        {/* Cinematic Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/cm-hero.jpg"
            alt="Critical Mass Makassar"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center filter brightness-90 contrast-110"
          />
          {/* Subtle gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/85 to-[#080d1a]/40" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#080d1a]/40 to-[#080d1a]/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 py-10 sm:py-16 flex flex-col items-center text-center">
          {/* Tag / Recurring note */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00f076]/10 border border-[#00f076]/30 text-[#00f076] text-xs font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jumat Terakhir Setiap Bulan</span>
          </div>

          {/* Large Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase font-mono drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            CRITICAL MASS
            <span className="block text-[#00f076] drop-shadow-[0_0_35px_rgba(0,240,118,0.5)]">
              MAKASSAR
            </span>
          </h1>

          {/* Subtitle / Tagline */}
          <p className="mt-3 sm:mt-4 text-base sm:text-xl text-[#cbd5e1] font-medium max-w-xl leading-relaxed">
            &ldquo;Bergerak Bersama, Merayakan Kota&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Bersama di jalan, untuk kota yang lebih ramah pesepeda.
          </p>

          {/* Next Event Date Card */}
          <div className="mt-6 px-4 py-2 rounded-xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1e2d4d] inline-flex items-center gap-2 text-xs sm:text-sm text-white font-semibold">
            <Calendar className="w-4 h-4 text-[#00f076]" />
            <span>{formatIndonesianDate(nextFriday)}</span>
          </div>

          {/* COUNTDOWN */}
          <div className="w-full max-w-lg mt-6">
            <Countdown targetDate={nextFriday} />
          </div>

          {/* STATS PILLS */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-2xl mt-6 sm:mt-8">
            <StatCard
              label="Riders Attending"
              value={attendees.length > 0 ? attendees.length : 187}
              variant="green"
              icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
              onClick={() => router.push('/event')}
            />
            <StatCard
              label="Tikum Peserta"
              value={tikums.length > 0 ? tikums.length : 12}
              variant="purple"
              icon={<MapPin className="w-4 h-4 sm:w-5 sm:h-5" />}
              onClick={() => router.push('/tikum')}
            />
            <StatCard
              label="On The Way"
              value={onTheWayCount}
              variant="pink"
              icon={<Bike className="w-4 h-4 sm:w-5 sm:h-5" />}
              onClick={() => router.push('/live')}
            />
          </div>

          {/* PRIMARY & SECONDARY CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mt-6 sm:mt-8">
            <Button
              size="lg"
              variant={isAttending ? 'outline' : 'primary'}
              fullWidth
              isLoading={attendingLoading}
              onClick={handleAttendToggle}
              leftIcon={
                isAttending ? (
                  <CheckCircle className="w-5 h-5 text-[#00f076]" />
                ) : (
                  <Bike className="w-5 h-5 text-[#080d1a]" />
                )
              }
            >
              {isAttending ? "✓ I'm Attending" : "I'M ATTENDING"}
            </Button>

            <Link href="/live" className="w-full">
              <Button
                size="lg"
                variant="outline"
                fullWidth
                leftIcon={<Radio className="w-5 h-5 text-[#00f076] animate-pulse" />}
              >
                LIHAT LIVE MAP
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. LOCATIONS (START & FINISH) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Lokasi Titik Kumpul Utama & Finish
            </h3>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Titik resmi penyelenggaraan Critical Mass Makassar
            </p>
          </div>
          <Link
            href="/event"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#00f076] hover:underline"
          >
            <span>Detail Event</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {startLoc && (
            <LocationCard
              type="MAIN_START"
              name={startLoc.name}
              description={startLoc.description}
              time={startLoc.meeting_time}
              latitude={startLoc.latitude}
              longitude={startLoc.longitude}
              onViewOnMap={() => router.push('/live')}
            />
          )}
          {finishLoc && (
            <LocationCard
              type="FINISH"
              name={finishLoc.name}
              description={finishLoc.description}
              time={finishLoc.meeting_time}
              latitude={finishLoc.latitude}
              longitude={finishLoc.longitude}
              onViewOnMap={() => router.push('/live')}
            />
          )}
        </div>
      </section>

      {/* 3. EVENT LOCATIONS & TIKUM MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="glass" className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f076] animate-pulse" />
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Peta Titik Kumpul & Lokasi Event
                </h3>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Titik Start di Anjungan Losari, titik kumpul wilayah (Tikum), dan titik Finish di Taman Karebosi.
              </p>
            </div>
            <Link href="/live">
              <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Buka di Live Map
              </Button>
            </Link>
          </div>

          <div className="h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#1e2d4d]">
            <MapView
              initialCenter={MAKASSAR_CENTER_COORDS}
              initialZoom={13}
              className="h-full w-full"
              onMapReady={setMapInstance}
            >
              {startLoc && <StartMarker map={mapInstance} location={startLoc} />}
              {finishLoc && <FinishMarker map={mapInstance} location={finishLoc} />}
              {tikums.slice(0, 4).map((tikum) => (
                <TikumMarker
                  key={tikum.id}
                  map={mapInstance}
                  tikum={tikum}
                />
              ))}
            </MapView>
          </div>
        </Card>
      </section>

      {/* 4. POPULAR TIKUMS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Tikum Peserta Terpopuler
            </h3>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Cari rombongan gowes dari wilayahmu menuju Tikum Utama Losari
            </p>
          </div>
          <Link
            href="/tikum"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00f076] hover:underline"
          >
            <span>Semua Tikum ({tikums.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tikums.slice(0, 3).map((tikum) => (
            <Card
              key={tikum.id}
              variant="interactive"
              className="flex flex-col justify-between"
              onClick={() => router.push('/tikum')}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#c084fc] bg-[#a855f7]/15 border border-[#a855f7]/30 px-2.5 py-0.5 rounded-full">
                    {tikum.name}
                  </span>
                  <span className="text-xs font-mono text-[#00f076] font-bold">
                    {tikum.meeting_time} WITA
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] line-clamp-2 mb-3">
                  {tikum.description || 'Titik kumpul rombongan pesepeda wilayah.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1e2d4d] flex items-center justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>{tikum.member_count || 1} Riders bergabung</span>
                </span>
                <span className="text-[#00f076] font-semibold flex items-center gap-0.5">
                  Gabung <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
