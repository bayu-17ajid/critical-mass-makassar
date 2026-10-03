'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { eventService } from '@/lib/supabase/service';
import { MeetingPoint, EventLocation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { MapView } from '@/components/map/MapView';
import { TikumMarker } from '@/components/map/TikumMarker';
import { StartMarker } from '@/components/map/StartMarker';
import { FinishMarker } from '@/components/map/FinishMarker';
import { LocationPicker } from '@/components/map/LocationPicker';
import { Map as MapLibreMap } from '@/lib/map/maplibre';
import { Plus, Users, Clock, MapPin, Check, Flag, Navigation, Shield } from 'lucide-react';

const MAKASSAR_TIKUM_CENTER: [number, number] = [119.4300, -5.1450];

export default function TikumPage() {
  const { user, isAdmin, openAuthModal } = useAuth();

  const [tikums, setTikums] = useState<MeetingPoint[]>([]);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [activeTab, setActiveTab] = useState<'TIKUM_PESERTA' | 'TIKUM_UTAMA'>('TIKUM_PESERTA');
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('17:45');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: -5.1477,
    lng: 119.4327,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoadingId, setJoinLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const ev = await eventService.getLatestEvent();
      const [tks, locs] = await Promise.all([
        eventService.getTikums(ev.id, user?.id),
        eventService.getEventLocations(ev.id),
      ]);
      setTikums(tks);
      setLocations(locs);
    }
    loadData();
  }, [user]);

  const handleJoinToggle = async (tikum: MeetingPoint) => {
    if (!user) {
      openAuthModal();
      return;
    }

    setJoinLoadingId(tikum.id);
    try {
      if (tikum.is_joined) {
        await eventService.leaveTikum(tikum.id, user.id);
        setTikums((prev) =>
          prev.map((t) =>
            t.id === tikum.id
              ? { ...t, is_joined: false, member_count: Math.max(0, (t.member_count || 1) - 1) }
              : t
          )
        );
      } else {
        await eventService.joinTikum(tikum.id, user.id);
        setTikums((prev) =>
          prev.map((t) =>
            t.id === tikum.id
              ? { ...t, is_joined: true, member_count: (t.member_count || 0) + 1 }
              : t
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle Tikum membership:', err);
    } finally {
      setJoinLoadingId(null);
    }
  };

  const handleCreateTikum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!isAdmin) {
      alert('Hanya admin yang memiliki hak untuk menambah lokasi Tikum.');
      return;
    }
    if (!name.trim()) return;

    setCreateLoading(true);
    try {
      const ev = await eventService.getLatestEvent();
      const newTikum = await eventService.createTikum({
        event_id: ev.id,
        creator_id: user.id,
        name,
        description,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        meeting_time: meetingTime,
      });

      setTikums((prev) => [newTikum, ...prev]);
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');

      // Fly map to new Tikum
      if (mapInstance) {
        mapInstance.flyTo({
          center: [selectedCoords.lng, selectedCoords.lat],
          zoom: 14,
          essential: true,
        });
      }
    } catch (err) {
      console.error('Failed to create Tikum:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const startLoc = locations.find((l) => l.type === 'MAIN_START') || locations[0];
  const finishLoc = locations.find((l) => l.type === 'FINISH') || locations[1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2d4d]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">Tikum (Titik Kumpul)</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94a3b8]">
            Kumpul bersama rombongan wilayahmu dan gowes beriringan menuju Tikum Utama Losari
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Shield className="w-3.5 h-3.5 text-purple-400" />}
              >
                Panel Admin
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Tambah Lokasi Tikum
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] text-[#94a3b8] bg-[#141f36] border border-[#1e2d4d] px-3 py-1.5 rounded-xl hidden sm:block">
              📍 Titik kumpul resmi dikurasi Admin Panitia
            </div>
            <Link href="/admin">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Shield className="w-4 h-4" />}
              >
                Login Admin untuk Tambah Tikum
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('TIKUM_PESERTA')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'TIKUM_PESERTA'
              ? 'bg-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-[#141f36] text-[#94a3b8] hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tikum Peserta ({tikums.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TIKUM_UTAMA')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'TIKUM_UTAMA'
              ? 'bg-[#00f076] text-[#080d1a] shadow-[0_0_15px_rgba(0,240,118,0.3)]'
              : 'bg-[#141f36] text-[#94a3b8] hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Tikum Utama & Finish</span>
        </button>
      </div>

      {/* Main Grid: List + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Tikum Cards List */}
        <div className="lg:col-span-5 space-y-3.5 order-2 lg:order-1">
          {activeTab === 'TIKUM_PESERTA' ? (
            tikums.length > 0 ? (
              tikums.map((tikum) => (
                <Card
                  key={tikum.id}
                  variant="interactive"
                  className="flex flex-col justify-between"
                  onClick={() => {
                    if (mapInstance) {
                      mapInstance.flyTo({
                        center: [tikum.longitude, tikum.latitude],
                        zoom: 15,
                        essential: true,
                      });
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#a855f7] shrink-0" />
                        <span>{tikum.name}</span>
                      </h4>
                      <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                        {tikum.description || 'Titik kumpul rombongan pesepeda wilayah.'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs font-mono font-bold text-[#00f076] bg-[#00f076]/10 border border-[#00f076]/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{tikum.meeting_time} WITA</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1e2d4d] flex items-center justify-between">
                    <span className="text-xs text-white font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#a855f7]" />
                      <span className="font-mono font-bold">{tikum.member_count || 1}</span>
                      <span className="text-[#94a3b8]">riders bergabung</span>
                    </span>

                    <Button
                      size="sm"
                      variant={tikum.is_joined ? 'outline' : 'secondary'}
                      isLoading={joinLoadingId === tikum.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinToggle(tikum);
                      }}
                      leftIcon={tikum.is_joined ? <Check className="w-3.5 h-3.5 text-[#00f076]" /> : undefined}
                    >
                      {tikum.is_joined ? 'Sudah Gabung' : 'Gabung'}
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-[#0f172a] border border-[#1e2d4d] text-center">
                <p className="text-sm text-[#94a3b8] mb-3">
                  Belum ada titik kumpul yang aktif saat ini.
                </p>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Tambah Lokasi Tikum Pertama
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {startLoc && (
                <Card variant="glass" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00f076] bg-[#00f076]/10 border border-[#00f076]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      START / TIKUM UTAMA
                    </span>
                    <span className="text-xs font-mono text-[#00f076] font-bold">
                      {startLoc.meeting_time || '18:30'} WITA
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{startLoc.name}</h4>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    {startLoc.description}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    leftIcon={<Navigation className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (mapInstance) {
                        mapInstance.flyTo({
                          center: [startLoc.longitude, startLoc.latitude],
                          zoom: 16,
                          essential: true,
                        });
                      }
                    }}
                  >
                    Fokus ke Anjungan Losari
                  </Button>
                </Card>
              )}

              {finishLoc && (
                <Card variant="glass" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f43f5e] bg-[#f43f5e]/10 border border-[#f43f5e]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      OFFICIAL FINISH
                    </span>
                    <span className="text-xs font-mono text-[#f43f5e] font-bold">
                      {finishLoc.meeting_time || '20:30'} WITA
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <Flag className="w-4 h-4 text-[#f43f5e]" />
                    <span>{finishLoc.name}</span>
                  </h4>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    {finishLoc.description}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    leftIcon={<Navigation className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (mapInstance) {
                        mapInstance.flyTo({
                          center: [finishLoc.longitude, finishLoc.latitude],
                          zoom: 16,
                          essential: true,
                        });
                      }
                    }}
                  >
                    Fokus ke Taman Karebosi
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="lg:col-span-7 h-[420px] sm:h-[540px] rounded-3xl overflow-hidden border border-[#1e2d4d] shadow-2xl relative order-1 lg:order-2">
          <MapView
            initialCenter={MAKASSAR_TIKUM_CENTER}
            initialZoom={13}
            className="w-full h-full"
            onMapReady={setMapInstance}
          >
            {startLoc && <StartMarker map={mapInstance} location={startLoc} />}
            {finishLoc && <FinishMarker map={mapInstance} location={finishLoc} />}
            {tikums.map((tikum) => (
              <TikumMarker
                key={tikum.id}
                map={mapInstance}
                tikum={tikum}
                onJoin={() => handleJoinToggle(tikum)}
              />
            ))}
          </MapView>
        </div>
      </div>

      {/* CREATE TIKUM MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Tikum (Titik Kumpul Baru)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTikum} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
              Nama Titik Kumpul (Tikum)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tikum Pettarani / Depan McD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Jam Kumpul (WITA)
              </label>
              <input
                type="text"
                required
                placeholder="17:45"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Keterangan Singkat
              </label>
              <input
                type="text"
                placeholder="Titik kumpul & rute santai"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
              Pilih Lokasi di Peta Makassar (Ketuk Peta)
            </label>
            <LocationPicker
              initialLatitude={selectedCoords.lat}
              initialLongitude={selectedCoords.lng}
              onLocationSelect={(lat, lng) => setSelectedCoords({ lat, lng })}
              className="h-56 w-full"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setIsCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" fullWidth isLoading={createLoading}>
              Simpan & Terbitkan Tikum
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
