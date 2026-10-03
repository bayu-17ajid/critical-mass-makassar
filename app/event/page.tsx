'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { eventService } from '@/lib/supabase/service';
import { getNextCriticalMassDate, formatIndonesianDate } from '@/lib/event/date';
import {
  CriticalMassEvent,
  EventLocation,
  RundownItem,
  EventRoute,
  EventAttendee,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { LocationCard } from '@/components/ui/LocationCard';
import { EventTimeline } from '@/components/ui/EventTimeline';
import { RiderStatusBadge } from '@/components/ui/RiderStatusBadge';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Flag,
  CheckCircle,
  Radio,
  EyeOff,
  Eye,
  Shield,
} from 'lucide-react';

export default function EventPage() {
  const router = useRouter();
  const { user, isAdmin, openAuthModal } = useAuth();

  const [event, setEvent] = useState<CriticalMassEvent | null>(null);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [rundown, setRundown] = useState<RundownItem[]>([]);
  const [, setRoute] = useState<EventRoute | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attendingLoading, setAttendingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ON_THE_WAY' | 'AT_TIKUM' | 'ARRIVED'>('ALL');

  const nextFriday = React.useMemo(() => getNextCriticalMassDate(), []);

  useEffect(() => {
    async function loadData() {
      const ev = await eventService.getLatestEvent();
      setEvent(ev);

      const [locs, rd, r, atts] = await Promise.all([
        eventService.getEventLocations(ev.id),
        eventService.getEventRundown(ev.id),
        eventService.getEventRoute(ev.id),
        eventService.getEventAttendees(ev.id),
      ]);

      setLocations(locs);
      setRundown(rd);
      setRoute(r);
      setAttendees(atts);

      if (user) {
        const myAtt = atts.find((a) => a.user_id === user.id);
        if (myAtt) {
          setIsAttending(true);
          setIsAnonymous(myAtt.is_anonymous || false);
        }
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
        const newAtt = await eventService.attendEvent(event.id, user.id, isAnonymous);
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

  const filteredAttendees = attendees.filter((a) => {
    if (activeTab === 'ALL') return true;
    return a.status === activeTab;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1e2d4d]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-[#141f36] text-[#94a3b8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Detail Event</h1>
            <p className="text-xs text-[#94a3b8]">Informasi lengkap Critical Mass Makassar</p>
          </div>
        </div>

        <Link href="/live">
          <Button size="sm" variant="outline" leftIcon={<Radio className="w-4 h-4 text-[#00f076]" />}>
            Live Map
          </Button>
        </Link>
      </div>

      {/* Date & Stats Header Card */}
      <Card variant="glass" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#00f076]/10 border border-[#00f076]/30 text-[#00f076]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {formatIndonesianDate(nextFriday)}
            </h2>
            <p className="text-xs text-[#94a3b8]">Jumat terakhir setiap bulan • 18:30 WITA</p>
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#1e2d4d]">
          <div className="text-center p-2 rounded-xl bg-[#080d1a]/50">
            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {attendees.length}
            </div>
            <div className="text-[10px] sm:text-xs text-[#94a3b8] flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-[#00f076]" /> Attending
            </div>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#080d1a]/50">
            <div className="text-lg sm:text-xl font-black text-white font-mono">5</div>
            <div className="text-[10px] sm:text-xs text-[#94a3b8] flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-[#a855f7]" /> Tikum
            </div>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#080d1a]/50">
            <div className="text-lg sm:text-xl font-black text-white font-mono">1</div>
            <div className="text-[10px] sm:text-xs text-[#94a3b8] flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-[#00f076]" /> Start
            </div>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#080d1a]/50">
            <div className="text-lg sm:text-xl font-black text-white font-mono">1</div>
            <div className="text-[10px] sm:text-xs text-[#94a3b8] flex items-center justify-center gap-1">
              <Flag className="w-3 h-3 text-[#f43f5e]" /> Finish
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance Action Box */}
      <Card variant={isAttending ? 'glass' : 'elevated'} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-5 h-5 ${isAttending ? 'text-[#00f076]' : 'text-[#64748b]'}`} />
            <h3 className="font-bold text-white text-base">
              {isAttending ? 'Anda Terdaftar Sebagai Peserta' : 'Konfirmasi Kehadiran Anda'}
            </h3>
          </div>

          {/* Anonymous toggle */}
          {user && (
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-white cursor-pointer"
              title="Toggle Anonim di Live Map"
            >
              {isAnonymous ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Anonim Aktif</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Publik</span>
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#94a3b8]">
          {isAttending
            ? 'Terima kasih telah bergabung! Pada hari Jumat nanti, kamu bisa menekan tombol "ON THE WAY" untuk membagikan posisi secara live ke sesama pesepeda.'
            : 'Klik tombol di bawah untuk konfirmasi kehadiran dan biarkan teman-teman komunitas tahu kamu akan gowes bersama!'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            size="md"
            variant={isAttending ? 'outline' : 'primary'}
            fullWidth
            isLoading={attendingLoading}
            onClick={handleAttendToggle}
          >
            {isAttending ? "✓ Batalkan Kehadiran" : "I'm Attending"}
          </Button>

          <Link href="/live" className="w-full sm:w-auto shrink-0">
            <Button size="md" variant="secondary" fullWidth>
              Buka Live Map
            </Button>
          </Link>
        </div>
      </Card>

      {/* Rundown Acara */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-bold text-white">Rundown Acara</h3>
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Shield className="w-3.5 h-3.5 text-purple-400" />}
              className="text-xs text-purple-300 border-purple-500/30 hover:bg-purple-500/10"
            >
              {isAdmin ? 'Kelola Rundown (Admin)' : 'Login Admin untuk Kelola Rundown'}
            </Button>
          </Link>
        </div>
        <EventTimeline items={rundown} />
      </div>

      {/* Lokasi Utama (Start & Finish) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-bold text-white">Lokasi Utama (Start &amp; Finish)</h3>
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Shield className="w-3.5 h-3.5 text-purple-400" />}
              className="text-xs text-purple-300 border-purple-500/30 hover:bg-purple-500/10"
            >
              {isAdmin ? 'Atur Lokasi (Admin)' : 'Login Admin untuk Atur Lokasi'}
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Daftar Peserta (Attendees List) */}
      <div className="space-y-4 pt-4 border-t border-[#1e2d4d]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Daftar Peserta ({attendees.length})
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Pesepeda yang telah konfirmasi akan meramaikan jalanan Makassar
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#1e2d4d]">
          {[
            { id: 'ALL' as const, label: `Semua (${attendees.length})` },
            { id: 'ON_THE_WAY' as const, label: 'On The Way' },
            { id: 'AT_TIKUM' as const, label: 'Di Tikum' },
            { id: 'ARRIVED' as const, label: 'Arrived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#00f076]/15 text-[#00f076] border border-[#00f076]/30'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#141f36]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Attendees Grid / List */}
        {filteredAttendees.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-[#0f172a]/50 border border-dashed border-[#1e2d4d]">
            <div className="w-12 h-12 rounded-full bg-[#141f36] border border-[#1e2d4d] flex items-center justify-center text-[#94a3b8] mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {activeTab === 'ALL'
                ? 'Belum Ada Peserta yang Terdaftar'
                : 'Belum Ada Peserta di Kategori Ini'}
            </h4>
            <p className="text-xs text-[#94a3b8] max-w-sm mx-auto mb-4">
              Jadilah pesepeda pertama yang mengonfirmasi kehadiran untuk meramaikan Critical Mass Makassar!
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={handleAttendToggle}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Konfirmasi Kehadiran Saya
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAttendees.map((att) => {
              const isMe = user?.id === att.user_id;
              const displayName = att.is_anonymous
                ? isMe
                  ? 'Saya (Anonim)'
                  : 'Rider'
                : att.profile?.display_name || 'Rider Makassar';
              const username = att.is_anonymous ? 'anonymous' : att.profile?.username || 'goweser';

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a]/70 border border-[#1e2d4d] hover:border-[#00f076]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={displayName} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00f076]/20 text-[#00f076] font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748b] font-mono truncate">
                        @{username}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <RiderStatusBadge status={att.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
