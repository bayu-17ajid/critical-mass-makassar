'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { eventService } from '@/lib/supabase/service';
import { useLiveGps } from '@/hooks/useLiveGps';
import { useRealtimeRiders } from '@/hooks/useRealtimeRiders';
import {
  CriticalMassEvent,
  EventLocation,
  MeetingPoint,
  LiveLocation,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RiderStatusBadge } from '@/components/ui/RiderStatusBadge';
import { MapLegend } from '@/components/ui/MapOverlay';
import { MapView } from '@/components/map/MapView';
import { StartMarker } from '@/components/map/StartMarker';
import { FinishMarker } from '@/components/map/FinishMarker';
import { TikumMarker } from '@/components/map/TikumMarker';
import { RiderMarker } from '@/components/map/RiderMarker';
import { Modal } from '@/components/ui/Modal';
import { Map as MapLibreMap } from '@/lib/map/maplibre';
import {
  Bike,
  Radio,
  AlertTriangle,
  Users,
  Compass,
  Wifi,
  WifiOff,
  User,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';

const MAKASSAR_CENTER_COORDS: [number, number] = [119.4250, -5.1420];

const BIKE_TYPES = [
  'Roadbike / Hybrid',
  'Fixed Gear (Fixie)',
  'Sepeda Lipat (Seli)',
  'Mountain Bike (MTB)',
  'Gravel / Touring',
  'Sepeda Onthel / Klasik',
  'Lainnya',
];

export default function LiveMapPage() {
  const { user, profile, loginDirect, updateProfile } = useAuth();

  const [event, setEvent] = useState<CriticalMassEvent | null>(null);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [tikums, setTikums] = useState<MeetingPoint[]>([]);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [selectedRider, setSelectedRider] = useState<LiveLocation | null>(null);

  // Quick Rider Nickname Modal state (Zero login required)
  const [isQuickRiderModalOpen, setIsQuickRiderModalOpen] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState(profile?.display_name || '');
  const [tempBikeType, setTempBikeType] = useState('Roadbike / Hybrid');
  const [tempIsAnonymous, setTempIsAnonymous] = useState(profile?.is_anonymous || false);
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Load initial static event assets
  useEffect(() => {
    async function loadData() {
      const ev = await eventService.getLatestEvent();
      setEvent(ev);

      const [locs, tks] = await Promise.all([
        eventService.getEventLocations(ev.id),
        eventService.getTikums(ev.id),
      ]);

      setLocations(locs);
      setTikums(tks);
    }
    loadData();
  }, []);

  const eventId = event?.id || 'cm-mks-event-01';

  // Realtime hook for all active riders
  const { riders, connectionState } = useRealtimeRiders({ eventId });

  // Browser GPS tracking hook for current authenticated user
  const {
    isTracking,
    currentStatus,
    gpsError,
    accuracyWarning,
    startTracking,
    stopTracking,
    updateStatus,
  } = useLiveGps({
    eventId,
    userId: user?.id || null,
    displayName: profile?.is_anonymous ? 'Rider' : (profile?.display_name || 'Saya'),
    isAnonymous: profile?.is_anonymous || false,
    onLocationUpdate: ({ latitude, longitude }) => {
      // Center map initially when user starts tracking
      if (mapInstance && !isTracking) {
        mapInstance.flyTo({ center: [longitude, latitude], zoom: 15, essential: true });
      }
    },
  });

  const onTheWayRiders = useMemo(() => riders.filter((r) => r.status === 'ON_THE_WAY'), [riders]);
  const atTikumRiders = useMemo(() => riders.filter((r) => r.status === 'AT_TIKUM'), [riders]);
  const arrivedRiders = useMemo(() => riders.filter((r) => r.status === 'ARRIVED'), [riders]);

  const startLoc = locations.find((l) => l.type === 'MAIN_START') || locations[0];
  const finishLoc = locations.find((l) => l.type === 'FINISH') || locations[1];

  const handleStartTrackingClick = () => {
    const isCustomNameSet = typeof window !== 'undefined' && localStorage.getItem('cm_mks_custom_name_set') === 'true';
    const hasPersonalizedName = profile?.display_name && profile.display_name !== 'Pesepeda Makassar';

    // If user hasn't set their nickname yet, open the quick modal
    if (!isCustomNameSet || !hasPersonalizedName) {
      setTempDisplayName(hasPersonalizedName ? profile.display_name : '');
      setTempIsAnonymous(profile?.is_anonymous || false);
      setNameError('');
      setIsQuickRiderModalOpen(true);
      return;
    }

    startTracking();
  };

  const handleSaveQuickRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    const trimmed = tempDisplayName.trim();
    if (!tempIsAnonymous && !trimmed) {
      setNameError('Silakan masukkan nama panggilan Anda atau aktifkan Mode Anonim');
      return;
    }

    const finalName = tempIsAnonymous
      ? 'Rider'
      : (trimmed || `Rider #${Math.floor(100 + Math.random() * 900)}`);

    setIsSavingName(true);
    try {
      await loginDirect({
        displayName: finalName,
        role: profile?.role === 'admin' ? 'admin' : 'user',
        bikeType: tempBikeType,
      });

      if (tempIsAnonymous) {
        await updateProfile({ is_anonymous: true });
      } else {
        await updateProfile({ is_anonymous: false });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cm_mks_custom_name_set', 'true');
      }

      setIsQuickRiderModalOpen(false);

      if (!isTracking) {
        startTracking();
      }
    } catch {
      setNameError('Terjadi kesalahan saat menyimpan nama');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#080d1a]">
      {/* Top Bar on Map */}
      <div className="absolute top-3 inset-x-4 sm:inset-x-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#080d1a]/90 backdrop-blur-md border border-[#1e2d4d] px-3.5 py-1.5 rounded-2xl shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-[#00f076]/10 border border-[#00f076]/30 flex items-center justify-center text-[#00f076]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Live Tracking
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#00f076]/20 text-[#00f076] border border-[#00f076]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f076] animate-ping" />
                Live
              </span>
            </div>
            <div className="text-[10px] text-[#94a3b8] font-mono">
              Makassar • {riders.length} Rider Aktif
            </div>
          </div>
        </div>

        {/* Realtime Connection Indicator */}
        <div className="pointer-events-auto bg-[#080d1a]/90 backdrop-blur-md border border-[#1e2d4d] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xl">
          {connectionState === 'connected' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#00f076]" />
              <span className="text-[11px] text-[#94a3b8] hidden sm:inline">Tersambung Realtime</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] text-amber-400 font-semibold">Reconnecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="relative flex-1 flex w-full h-full">
        {/* DESKTOP LEFT SIDEBAR */}
        <aside className="hidden md:flex flex-col w-96 z-10 bg-[#080d1a]/95 backdrop-blur-xl border-r border-[#1e2d4d] p-4 space-y-4 overflow-y-auto">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-[#0f172a] border border-[#1e2d4d] text-center">
              <div className="text-lg font-black text-[#00f076] font-mono">
                {onTheWayRiders.length}
              </div>
              <div className="text-[10px] text-[#94a3b8] font-semibold uppercase mt-0.5">
                On The Way
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0f172a] border border-[#1e2d4d] text-center">
              <div className="text-lg font-black text-[#c084fc] font-mono">
                {atTikumRiders.length}
              </div>
              <div className="text-[10px] text-[#94a3b8] font-semibold uppercase mt-0.5">
                Di Tikum
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0f172a] border border-[#1e2d4d] text-center">
              <div className="text-lg font-black text-[#fb7185] font-mono">
                {arrivedRiders.length}
              </div>
              <div className="text-[10px] text-[#94a3b8] font-semibold uppercase mt-0.5">
                Finish
              </div>
            </div>
          </div>

          {/* GPS TRACKING CONTROLLER CARD */}
          <div className="p-4 rounded-2xl bg-[#141f36] border border-[#1e2d4d] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className={`w-4 h-4 ${isTracking ? 'text-[#00f076] animate-spin' : 'text-[#64748b]'}`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  GPS Saya
                </span>
              </div>
              {isTracking && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00f076]/20 text-[#00f076] border border-[#00f076]/40 animate-pulse">
                  TRACKING AKTIF
                </span>
              )}
            </div>

            {/* Error & Warning Banners */}
            {gpsError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}
            {accuracyWarning && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px]">
                {accuracyWarning}
              </div>
            )}

            {/* Display Name Pill on Desktop */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f172a] border border-[#1e2d4d]">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-[#00f076]/10 border border-[#00f076]/30 flex items-center justify-center text-[#00f076] shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] text-[#94a3b8] font-medium leading-none">Nama di Peta:</div>
                  <div className="font-bold text-white text-xs truncate mt-0.5">
                    {profile?.is_anonymous ? '🕶️ Mode Anonim (Rider)' : (profile?.display_name || 'Pesepeda Makassar')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempDisplayName(profile?.display_name && profile.display_name !== 'Pesepeda Makassar' ? profile.display_name : '');
                  setTempIsAnonymous(profile?.is_anonymous || false);
                  setNameError('');
                  setIsQuickRiderModalOpen(true);
                }}
                className="px-2 py-1 rounded-lg bg-[#141f36] hover:bg-[#1e2d4d] border border-[#1e2d4d] text-[11px] font-semibold text-[#00f076] flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Ubah
              </button>
            </div>

            {/* Status switcher when tracking */}
            {isTracking ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => updateStatus('ON_THE_WAY')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentStatus === 'ON_THE_WAY'
                        ? 'bg-[#00f076] text-[#080d1a]'
                        : 'bg-[#0f172a] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    On The Way
                  </button>
                  <button
                    onClick={() => updateStatus('AT_TIKUM')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentStatus === 'AT_TIKUM'
                        ? 'bg-[#a855f7] text-white'
                        : 'bg-[#0f172a] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Di Tikum
                  </button>
                  <button
                    onClick={() => updateStatus('ARRIVED')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentStatus === 'ARRIVED'
                        ? 'bg-[#f43f5e] text-white'
                        : 'bg-[#0f172a] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Finish
                  </button>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={stopTracking}
                >
                  STOP SHARING LOCATION
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleStartTrackingClick}
                leftIcon={<Bike className="w-4 h-4" />}
              >
                ON THE WAY
              </Button>
            )}

            {/* Mandatory GPS Disclosure note */}
            <p className="text-[10px] text-[#64748b] leading-tight text-center">
              ⚠️ Live location works while this page is active. Background tracking may be limited by your browser or phone.
            </p>
          </div>

          {/* ACTIVE RIDERS LIST */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#94a3b8] font-bold uppercase tracking-wider pb-1 border-b border-[#1e2d4d]">
              <span>Rider Aktif ({riders.length})</span>
              <Users className="w-3.5 h-3.5 text-[#00f076]" />
            </div>

            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {riders.length === 0 ? (
                <div className="py-8 px-3 text-center rounded-xl bg-[#0f172a]/40 border border-dashed border-[#1e2d4d]">
                  <Bike className="w-6 h-6 text-[#64748b] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[#94a3b8]">Belum Ada Rider Live</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5 max-w-[200px] mx-auto">
                    Klik tombol ON THE WAY di atas untuk membagikan posisi Anda di peta jalanan Makassar!
                  </p>
                </div>
              ) : (
                riders.map((r) => {
                  const displayName = r.is_anonymous ? 'Rider' : (r.display_name || 'Rider');
                  const isMe = user?.id === r.user_id;

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedRider(r);
                        if (mapInstance) {
                          mapInstance.flyTo({
                            center: [r.longitude, r.latitude],
                            zoom: 16,
                            essential: true,
                          });
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedRider?.id === r.id
                          ? 'bg-[#141f36] border-[#00f076]/40'
                          : 'bg-[#0f172a]/60 border-[#1e2d4d] hover:bg-[#141f36]/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={displayName} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                            <span>{displayName}</span>
                            {isMe && (
                              <span className="text-[9px] px-1 rounded bg-[#00f076]/20 text-[#00f076] font-mono">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#64748b] font-mono">
                            {r.speed_mps ? (r.speed_mps * 3.6).toFixed(1) + ' km/h' : '0 km/h'}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <RiderStatusBadge status={r.status || 'ON_THE_WAY'} size="sm" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* MAP CONTAINER */}
        <div className="flex-1 w-full h-full relative">
          <MapView
            initialCenter={MAKASSAR_CENTER_COORDS}
            initialZoom={13}
            className="w-full h-full"
            onMapReady={setMapInstance}
          >
            {/* Official Start & Finish */}
            {startLoc && <StartMarker map={mapInstance} location={startLoc} />}
            {finishLoc && <FinishMarker map={mapInstance} location={finishLoc} />}

            {/* Tikums */}
            {tikums.map((tikum) => (
              <TikumMarker key={tikum.id} map={mapInstance} tikum={tikum} />
            ))}

            {/* Live Riders */}
            {riders.map((r) => (
              <RiderMarker
                key={r.id}
                map={mapInstance}
                rider={r}
                onClickRider={setSelectedRider}
              />
            ))}
          </MapView>

          {/* Floating Map Legend (Desktop bottom right) */}
          <div className="hidden lg:block absolute bottom-6 right-6 z-20">
            <MapLegend />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR GPS & RIDERS */}
      <div className="md:hidden">
        <BottomSheet
          header={
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#141f36]">
                  <div className="text-base font-black text-[#00f076] font-mono">
                    {onTheWayRiders.length}
                  </div>
                  <div className="text-[9px] text-[#94a3b8] font-bold uppercase">
                    On The Way
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#141f36]">
                  <div className="text-base font-black text-[#c084fc] font-mono">
                    {atTikumRiders.length}
                  </div>
                  <div className="text-[9px] text-[#94a3b8] font-bold uppercase">
                    Di Tikum
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#141f36]">
                  <div className="text-base font-black text-[#fb7185] font-mono">
                    {arrivedRiders.length}
                  </div>
                  <div className="text-[9px] text-[#94a3b8] font-bold uppercase">
                    Finish
                  </div>
                </div>
              </div>

              {/* Mobile Quick Nickname Pill */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#141f36] border border-[#1e2d4d]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-lg bg-[#00f076]/10 border border-[#00f076]/30 flex items-center justify-center text-[#00f076] shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-[9px] text-[#94a3b8] leading-none">Nama di Peta:</div>
                    <div className="font-bold text-white text-xs truncate mt-0.5">
                      {profile?.is_anonymous ? '🕶️ Mode Anonim' : (profile?.display_name || 'Pesepeda Makassar')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempDisplayName(profile?.display_name && profile.display_name !== 'Pesepeda Makassar' ? profile.display_name : '');
                    setTempIsAnonymous(profile?.is_anonymous || false);
                    setNameError('');
                    setIsQuickRiderModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#0f172a] border border-[#1e2d4d] text-[10px] font-bold text-[#00f076] flex items-center gap-1"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  Ubah
                </button>
              </div>

              {isTracking ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => updateStatus('ON_THE_WAY')}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        currentStatus === 'ON_THE_WAY'
                          ? 'bg-[#00f076] text-[#080d1a]'
                          : 'bg-[#141f36] text-[#94a3b8]'
                      }`}
                    >
                      On The Way
                    </button>
                    <button
                      onClick={() => updateStatus('AT_TIKUM')}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        currentStatus === 'AT_TIKUM'
                          ? 'bg-[#a855f7] text-white'
                          : 'bg-[#141f36] text-[#94a3b8]'
                      }`}
                    >
                      Di Tikum
                    </button>
                    <button
                      onClick={() => updateStatus('ARRIVED')}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        currentStatus === 'ARRIVED'
                          ? 'bg-[#f43f5e] text-white'
                          : 'bg-[#141f36] text-[#94a3b8]'
                      }`}
                    >
                      Finish
                    </button>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    onClick={stopTracking}
                  >
                    STOP SHARING LOCATION
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleStartTrackingClick}
                  leftIcon={<Bike className="w-4 h-4" />}
                >
                  ON THE WAY
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-2 pb-6">
            <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2">
              Daftar Rider Aktif ({riders.length})
            </div>
            {riders.length === 0 ? (
              <div className="py-6 px-3 text-center rounded-xl bg-[#0f172a]/40 border border-dashed border-[#1e2d4d]">
                <Bike className="w-5 h-5 text-[#64748b] mx-auto mb-1.5 opacity-50" />
                <p className="text-xs font-semibold text-[#94a3b8]">Belum Ada Rider Live</p>
                <p className="text-[10px] text-[#64748b] mt-0.5">
                  Nyalakan GPS dengan tombol ON THE WAY di atas
                </p>
              </div>
            ) : (
              riders.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRider(r);
                    if (mapInstance) {
                      mapInstance.flyTo({
                        center: [r.longitude, r.latitude],
                        zoom: 16,
                        essential: true,
                      });
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141f36]/70 border border-[#1e2d4d]"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={r.display_name || 'Rider'} size="xs" />
                    <span className="text-xs font-bold text-white">
                      {r.is_anonymous ? 'Rider' : (r.display_name || 'Rider')}
                    </span>
                  </div>
                  <RiderStatusBadge status={r.status || 'ON_THE_WAY'} size="sm" />
                </div>
              ))
            )}
          </div>
        </BottomSheet>
      </div>

      {/* QUICK RIDER NICKNAME MODAL (No login required) */}
      <Modal
        isOpen={isQuickRiderModalOpen}
        onClose={() => setIsQuickRiderModalOpen(false)}
        title="Nama Panggilan di Peta"
        maxWidth="md"
      >
        <form onSubmit={handleSaveQuickRider} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#00f076]/10 border border-[#00f076]/20 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#00f076] shrink-0 mt-0.5" />
            <span className="text-[#e2e8f0] leading-relaxed">
              Nama ini akan tampil di atas titik sepeda Anda di peta dan dilihat oleh seluruh kawan pesepeda lainnya. <strong>Tanpa password & langsung aktif!</strong>
            </span>
          </div>

          {nameError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {nameError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
              Nama Panggilan / Alias <span className="text-[#00f076]">*</span>
            </label>
            <input
              type="text"
              disabled={tempIsAnonymous}
              value={tempDisplayName}
              onChange={(e) => setTempDisplayName(e.target.value)}
              placeholder="cth: Daeng Rahmat, Eki Fixie, Sarah..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141f36] border border-[#1e2d4d] text-white text-sm focus:outline-none focus:border-[#00f076] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              autoFocus
            />
            <p className="text-[11px] text-[#64748b] mt-1">
              Bebas menggunakan nama asli atau julukan sepeda Anda.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
              Jenis Sepeda (Opsional)
            </label>
            <select
              value={tempBikeType}
              onChange={(e) => setTempBikeType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141f36] border border-[#1e2d4d] text-white text-sm focus:outline-none focus:border-[#00f076] transition-colors"
            >
              {BIKE_TYPES.map((bt) => (
                <option key={bt} value={bt} className="bg-[#0f172a] text-white">
                  {bt}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#94a3b8] hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={tempIsAnonymous}
                onChange={(e) => setTempIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-[#1e2d4d] text-[#00f076] focus:ring-0 bg-[#141f36]"
              />
              <span>Mode Anonim (Sembunyikan nama, tampilkan hanya sebagai <em>&quot;Rider&quot;</em>)</span>
            </label>
          </div>

          <div className="flex items-center gap-2.5 pt-3">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSavingName}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isTracking ? 'Simpan Nama' : 'Mulai Gowes & Bagikan Lokasi'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsQuickRiderModalOpen(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
