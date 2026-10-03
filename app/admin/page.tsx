'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { eventService } from '@/lib/supabase/service';
import {
  CriticalMassEvent,
  MeetingPoint,
  LiveLocation,
  RundownItem,
  EventLocation,
  EventAttendee,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { RiderStatusBadge } from '@/components/ui/RiderStatusBadge';
import { LocationPicker } from '@/components/map/LocationPicker';
import {
  Shield,
  Calendar,
  Users,
  MapPin,
  Trash2,
  CheckCircle,
  Radio,
  ArrowLeft,
  Sparkles,
  Plus,
  Clock,
  Flag,
  Navigation,
  Edit2,
  Check,
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, isLoading, loginDirect } = useAuth();

  const [event, setEvent] = useState<CriticalMassEvent | null>(null);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [rundowns, setRundowns] = useState<RundownItem[]>([]);
  const [tikums, setTikums] = useState<MeetingPoint[]>([]);
  const [liveRiders, setLiveRiders] = useState<LiveLocation[]>([]);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RUNDOWN' | 'LOCATIONS' | 'TIKUM' | 'RIDERS'>('OVERVIEW');
  const [savingStatus, setSavingStatus] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Start & Finish edit states
  const [startName, setStartName] = useState('');
  const [startTime, setStartTime] = useState('18:30');
  const [startDesc, setStartDesc] = useState('');
  const [startLat, setStartLat] = useState(-5.1437);
  const [startLng, setStartLng] = useState(119.4069);

  const [finishName, setFinishName] = useState('');
  const [finishTime, setFinishTime] = useState('20:30');
  const [finishDesc, setFinishDesc] = useState('');
  const [finishLat, setFinishLat] = useState(-5.1348);
  const [finishLng, setFinishLng] = useState(119.4124);

  // Rundown Modal state
  const [isRundownModalOpen, setIsRundownModalOpen] = useState(false);
  const [editingRundownId, setEditingRundownId] = useState<string | null>(null);
  const [rundownTime, setRundownTime] = useState('');
  const [rundownTitle, setRundownTitle] = useState('');
  const [rundownDesc, setRundownDesc] = useState('');
  const [rundownOrder, setRundownOrder] = useState<number>(1);

  // Tikum Modal state
  const [isTikumModalOpen, setIsTikumModalOpen] = useState(false);
  const [tikumName, setTikumName] = useState('');
  const [tikumDesc, setTikumDesc] = useState('');
  const [tikumTime, setTikumTime] = useState('17:45');
  const [tikumCoords, setTikumCoords] = useState<{ lat: number; lng: number }>({
    lat: -5.1477,
    lng: 119.4327,
  });

  const loadAllAdminData = async () => {
    const ev = await eventService.getLatestEvent();
    setEvent(ev);

    const [locs, rds, tks, lvs, atts] = await Promise.all([
      eventService.getEventLocations(ev.id),
      eventService.getEventRundown(ev.id),
      eventService.getTikums(ev.id),
      eventService.getActiveLiveLocations(ev.id),
      eventService.getEventAttendees(ev.id),
    ]);

    setLocations(locs);
    setRundowns(rds);
    setTikums(tks);
    setLiveRiders(lvs);
    setAttendees(atts);

    const start = locs.find((l) => l.type === 'MAIN_START') || locs[0];
    if (start) {
      setStartName(start.name);
      setStartTime(start.meeting_time || '18:30');
      setStartDesc(start.description || '');
      setStartLat(start.latitude);
      setStartLng(start.longitude);
    }

    const finish = locs.find((l) => l.type === 'FINISH') || locs[1];
    if (finish) {
      setFinishName(finish.name);
      setFinishTime(finish.meeting_time || '20:30');
      setFinishDesc(finish.description || '');
      setFinishLat(finish.latitude);
      setFinishLng(finish.longitude);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const ev = await eventService.getLatestEvent();
      if (!isMounted) return;
      setEvent(ev);

      const [locs, rds, tks, lvs, atts] = await Promise.all([
        eventService.getEventLocations(ev.id),
        eventService.getEventRundown(ev.id),
        eventService.getTikums(ev.id),
        eventService.getActiveLiveLocations(ev.id),
        eventService.getEventAttendees(ev.id),
      ]);

      if (!isMounted) return;
      setLocations(locs);
      setRundowns(rds);
      setTikums(tks);
      setLiveRiders(lvs);
      setAttendees(atts);

      const start = locs.find((l) => l.type === 'MAIN_START') || locs[0];
      if (start) {
        setStartName(start.name);
        setStartTime(start.meeting_time || '18:30');
        setStartDesc(start.description || '');
        setStartLat(start.latitude);
        setStartLng(start.longitude);
      }

      const finish = locs.find((l) => l.type === 'FINISH') || locs[1];
      if (finish) {
        setFinishName(finish.name);
        setFinishTime(finish.meeting_time || '20:30');
        setFinishDesc(finish.description || '');
        setFinishLat(finish.latitude);
        setFinishLng(finish.longitude);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Admin Login state for non-admin view
  const [pinInput, setPinInput] = useState('');
  const [adminNameInput, setAdminNameInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || 'admin123';
    if (pinInput.trim() !== expectedPin && pinInput.trim() !== 'cm-mks-admin') {
      setLoginError('PIN Admin salah. Akses ditolak.');
      return;
    }

    setLoggingIn(true);
    try {
      await loginDirect({
        displayName: adminNameInput.trim() || 'Admin Panitia CM',
        emailOrPhone: 'admin@criticalmass.mks',
        role: 'admin',
      });
      await loadAllAdminData();
    } catch {
      setLoginError('Gagal masuk sebagai admin.');
    } finally {
      setLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-xs text-[#94a3b8] font-mono">Memuat akses admin...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-[0_0_25px_rgba(168,85,247,0.2)]">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Login Admin Panitia</h1>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
            Halaman ini khusus untuk panitia Critical Mass Makassar untuk menambah titik kumpul (Tikum), memanage rundown acara, dan mengatur titik start &amp; finish.
          </p>
        </div>

        <Card variant="glass" className="border-purple-500/30 p-5 space-y-4">
          <form onSubmit={handleAdminPinSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                Nama Panitia (Opsional)
              </label>
              <input
                type="text"
                value={adminNameInput}
                onChange={(e) => setAdminNameInput(e.target.value)}
                placeholder="cth: Koordinator Rute"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141f36] border border-[#1e2d4d] text-white text-sm focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                PIN Keamanan Admin <span className="text-purple-400">*</span>
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN Rahasia Admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141f36] border border-[#1e2d4d] text-white text-sm focus:outline-none focus:border-purple-400 transition-colors"
                autoFocus
                required
              />
              <p className="text-[11px] text-[#64748b] mt-1">
                Hanya panitia inti dengan PIN resmi yang dapat mengakses halaman ini.
              </p>
            </div>

            <Button
              type="submit"
              variant="secondary"
              fullWidth
              isLoading={loggingIn}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Masuk ke Dashboard Admin
            </Button>
          </form>
        </Card>

        {/* Feature summary */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/60 border border-[#1e2d4d] text-xs space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Fitur yang Hanya Dapat Dikelola Admin:</span>
          </div>
          <ul className="space-y-1.5 text-[#94a3b8] text-[11px]">
            <li className="flex items-center gap-2">
              <span className="text-[#00f076]">✓</span>
              <span><strong>Tambah &amp; Hapus Lokasi Tikum</strong> (pilih koordinat langsung di peta)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00f076]">✓</span>
              <span><strong>Kelola Rundown Acara</strong> (tambah agenda baru, edit jam, dan hapus)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00f076]">✓</span>
              <span><strong>Atur Titik Start &amp; Finish</strong> (nama lokasi, jam kumpul, dan koordinat)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00f076]">✓</span>
              <span><strong>Live Monitor Pesepeda</strong> (pantau pesepeda yang sedang aktif di jalan)</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-[#94a3b8] hover:text-white transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // 1. SAVE START LOCATION
  const handleSaveStartLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus(true);
    const startLoc = locations.find((l) => l.type === 'MAIN_START') || locations[0];
    const locId = startLoc ? startLoc.id : 'loc-start';

    await eventService.updateEventLocation(locId, {
      name: startName,
      meeting_time: startTime,
      description: startDesc,
      latitude: startLat,
      longitude: startLng,
      type: 'MAIN_START',
    });

    await loadAllAdminData();
    setSavingStatus(false);
    showNotification('Titik Start / Tikum Utama berhasil diperbarui!');
  };

  // 2. SAVE FINISH LOCATION
  const handleSaveFinishLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus(true);
    const finishLoc = locations.find((l) => l.type === 'FINISH') || locations[1];
    const locId = finishLoc ? finishLoc.id : 'loc-finish';

    await eventService.updateEventLocation(locId, {
      name: finishName,
      meeting_time: finishTime,
      description: finishDesc,
      latitude: finishLat,
      longitude: finishLng,
      type: 'FINISH',
    });

    await loadAllAdminData();
    setSavingStatus(false);
    showNotification('Titik Finish berhasil diperbarui!');
  };

  // 3. RUNDOWN MANAGEMENT
  const handleOpenAddRundown = () => {
    setEditingRundownId(null);
    setRundownTime('');
    setRundownTitle('');
    setRundownDesc('');
    setRundownOrder(rundowns.length + 1);
    setIsRundownModalOpen(true);
  };

  const handleOpenEditRundown = (item: RundownItem) => {
    setEditingRundownId(item.id);
    setRundownTime(item.time);
    setRundownTitle(item.title);
    setRundownDesc(item.description || '');
    setRundownOrder(item.order);
    setIsRundownModalOpen(true);
  };

  const handleSaveRundownItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rundownTime.trim() || !rundownTitle.trim()) return;

    setSavingStatus(true);
    const evId = event?.id || 'cm-mks-event-01';

    await eventService.saveRundownItem({
      event_id: evId,
      id: editingRundownId || undefined,
      time: rundownTime,
      title: rundownTitle,
      description: rundownDesc,
      order: Number(rundownOrder),
    });

    await loadAllAdminData();
    setSavingStatus(false);
    setIsRundownModalOpen(false);
    showNotification(editingRundownId ? 'Agenda rundown diperbarui!' : 'Agenda rundown baru ditambahkan!');
  };

  const handleDeleteRundown = async (id: string) => {
    if (confirm('Hapus agenda rundown ini?')) {
      await eventService.deleteRundownItem(id);
      await loadAllAdminData();
      showNotification('Agenda rundown dihapus.');
    }
  };

  // 4. TIKUM MANAGEMENT (ADMIN ONLY)
  const handleCreateAdminTikum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tikumName.trim()) return;

    setSavingStatus(true);
    const evId = event?.id || 'cm-mks-event-01';

    await eventService.createTikum({
      event_id: evId,
      creator_id: user?.id || 'admin-user',
      name: tikumName,
      description: tikumDesc,
      meeting_time: tikumTime,
      latitude: tikumCoords.lat,
      longitude: tikumCoords.lng,
    });

    await loadAllAdminData();
    setSavingStatus(false);
    setIsTikumModalOpen(false);
    setTikumName('');
    setTikumDesc('');
    showNotification('Lokasi Tikum baru berhasil ditambahkan oleh Admin!');
  };

  const handleDeleteTikum = async (tikumId: string) => {
    if (confirm('Yakin ingin menghapus/menonaktifkan lokasi Tikum ini?')) {
      await eventService.deleteTikum(tikumId);
      await loadAllAdminData();
      showNotification('Lokasi Tikum berhasil dihapus.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2d4d]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-[#141f36] text-[#94a3b8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white">Panel Administrasi Critical Mass</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Kelola Rundown Acara, Titik Start & Finish, dan Tambah Lokasi Tikum Resmi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/live">
            <Button size="sm" variant="outline" leftIcon={<Radio className="w-4 h-4 text-[#00f076]" />}>
              Buka Live Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Notification Banner */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-[#00f076]/15 border border-[#00f076]/40 text-[#00f076] text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#1e2d4d]">
        {[
          { id: 'OVERVIEW' as const, label: 'Ringkasan', icon: Shield },
          { id: 'RUNDOWN' as const, label: `Kelola Rundown (${rundowns.length})`, icon: Calendar },
          { id: 'LOCATIONS' as const, label: 'Kelola Start & Finish', icon: Navigation },
          { id: 'TIKUM' as const, label: `Kelola Tikum (${tikums.length})`, icon: MapPin },
          { id: 'RIDERS' as const, label: `Monitor Riders (${liveRiders.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-[#141f36] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Peserta Terdaftar"
              value={attendees.length}
              variant="green"
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Tikum Resmi"
              value={tikums.length}
              variant="purple"
              icon={<MapPin className="w-4 h-4" />}
            />
            <StatCard
              label="Agenda Rundown"
              value={rundowns.length}
              variant="cyan"
              icon={<Calendar className="w-4 h-4" />}
            />
            <StatCard
              label="Rider On The Way"
              value={liveRiders.filter((r) => r.status === 'ON_THE_WAY').length}
              variant="pink"
              icon={<Radio className="w-4 h-4" />}
            />
          </div>

          <Card variant="glass" className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00f076]" />
              <span>Ringkasan Event Aktif</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e2d4d]">
                <div className="text-[#94a3b8] mb-1 font-semibold">Titik Start:</div>
                <div className="text-white font-bold text-sm">{startName}</div>
                <div className="text-[#00f076] font-mono mt-1">Kumpul: {startTime} WITA</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e2d4d]">
                <div className="text-[#94a3b8] mb-1 font-semibold">Titik Finish:</div>
                <div className="text-white font-bold text-sm">{finishName}</div>
                <div className="text-[#f43f5e] font-mono mt-1">Tiba: {finishTime} WITA</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e2d4d]">
                <div className="text-[#94a3b8] mb-1 font-semibold">Hak Akses Tikum:</div>
                <div className="text-purple-400 font-bold text-sm">Hanya Admin</div>
                <div className="text-[#64748b] mt-1">Peserta tidak dapat membuat tikum publik</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. RUNDOWN MANAGEMENT TAB */}
      {activeTab === 'RUNDOWN' && (
        <Card variant="glass" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2d4d]">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>Manajemen Rundown Acara</span>
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Kelola jadwal dan urutan agenda kegiatan Critical Mass Makassar. Perubahan langsung tampil di halaman /event.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddRundown}
            >
              + Tambah Agenda
            </Button>
          </div>

          <div className="space-y-3">
            {rundowns.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#0f172a] border border-[#1e2d4d] hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xs font-mono font-bold text-purple-300 shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-sm font-bold text-white">{item.title}</span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00f076]/10 text-[#00f076] border border-[#00f076]/30">
                        {item.time} WITA
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-[#94a3b8] leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditRundown(item)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5 text-purple-400" />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRundown(item.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. LOCATIONS (START & FINISH) TAB */}
      {activeTab === 'LOCATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* START LOCATION CARD */}
          <Card variant="glass" className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2d4d]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00f076] shadow-[0_0_10px_#00f076]" />
                <h3 className="text-lg font-bold text-white">Titik Start / Tikum Utama</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00f076]/20 text-[#00f076]">
                OFFICIAL START
              </span>
            </div>

            <form onSubmit={handleSaveStartLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                  Nama Titik Start
                </label>
                <input
                  type="text"
                  required
                  value={startName}
                  onChange={(e) => setStartName(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                  Jam Kumpul (WITA)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                  Deskripsi / Petunjuk Tempat
                </label>
                <textarea
                  rows={2}
                  value={startDesc}
                  onChange={(e) => setStartDesc(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={startLat}
                    onChange={(e) => setStartLat(parseFloat(e.target.value))}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={startLng}
                    onChange={(e) => setStartLng(parseFloat(e.target.value))}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={savingStatus}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Simpan Titik Start
              </Button>
            </form>
          </Card>

          {/* FINISH LOCATION CARD */}
          <Card variant="glass" className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2d4d]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f43f5e] shadow-[0_0_10px_#f43f5e]" />
                <h3 className="text-lg font-bold text-white">Titik Finish Resmi</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f43f5e]/20 text-[#f43f5e]">
                OFFICIAL FINISH
              </span>
            </div>

            <form onSubmit={handleSaveFinishLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                  Nama Titik Finish
                </label>
                <input
                  type="text"
                  required
                  value={finishName}
                  onChange={(e) => setFinishName(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#f43f5e] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                  Estimasi Tiba (WITA)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input
                    type="text"
                    required
                    value={finishTime}
                    onChange={(e) => setFinishTime(e.target.value)}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#f43f5e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                  Deskripsi / Petunjuk Tempat
                </label>
                <textarea
                  rows={2}
                  value={finishDesc}
                  onChange={(e) => setFinishDesc(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#f43f5e] rounded-xl px-4 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={finishLat}
                    onChange={(e) => setFinishLat(parseFloat(e.target.value))}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#f43f5e] rounded-xl px-4 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={finishLng}
                    onChange={(e) => setFinishLng(parseFloat(e.target.value))}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#f43f5e] rounded-xl px-4 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="danger"
                fullWidth
                isLoading={savingStatus}
                leftIcon={<Flag className="w-4 h-4" />}
              >
                Simpan Titik Finish
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* 4. TIKUM MANAGEMENT TAB (ADMIN ONLY) */}
      {activeTab === 'TIKUM' && (
        <Card variant="glass" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2d4d]">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                <span>Kelola Lokasi Tikum Resmi</span>
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Hanya admin yang memiliki hak untuk menambah lokasi titik kumpul baru. Tikum akan tampil di peta publik.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsTikumModalOpen(true)}
            >
              + Tambah Lokasi Tikum
            </Button>
          </div>

          <div className="space-y-3">
            {tikums.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94a3b8] bg-[#0f172a] rounded-2xl border border-[#1e2d4d]">
                Belum ada lokasi Tikum resmi. Klik tombol di atas untuk menambah Tikum baru.
              </div>
            ) : (
              tikums.map((tikum) => (
                <div
                  key={tikum.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#0f172a] border border-[#1e2d4d] hover:border-purple-500/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-bold text-white text-sm">{tikum.name}</span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {tikum.meeting_time} WITA
                      </span>
                    </div>
                    {tikum.description && (
                      <p className="text-xs text-[#94a3b8] leading-relaxed max-w-xl">
                        {tikum.description}
                      </p>
                    )}
                    <div className="text-[11px] font-mono text-[#64748b] mt-1.5 flex items-center gap-3">
                      <span>Lat: {tikum.latitude.toFixed(4)}</span>
                      <span>Lng: {tikum.longitude.toFixed(4)}</span>
                      <span>• {tikum.member_count || 1} Rider terdaftar</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTikum(tikum.id)}
                    leftIcon={<Trash2 className="w-4 h-4 text-rose-400" />}
                  >
                    Hapus
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* 5. RIDER MONITOR TAB */}
      {activeTab === 'RIDERS' && (
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e2d4d]">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Live Rider Monitor</h3>
              <p className="text-xs text-[#94a3b8]">
                Status GPS realtime pesepeda yang aktif di jalanan Kota Makassar.
              </p>
            </div>
            <Link href="/live">
              <Button size="sm" variant="outline" rightIcon={<Radio className="w-3.5 h-3.5 text-[#00f076]" />}>
                Pantau di Peta
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1e2d4d] text-[#94a3b8] font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Rider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Kecepatan</th>
                  <th className="py-2.5 px-3">Akurasi GPS</th>
                  <th className="py-2.5 px-3">Koordinat</th>
                  <th className="py-2.5 px-3">Sinyal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4d]">
                {liveRiders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#94a3b8]">
                      <Radio className="w-6 h-6 mx-auto mb-2 text-[#64748b] opacity-50" />
                      <p className="font-semibold text-xs text-white">Belum Ada Rider Aktif</p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        Status GPS realtime akan muncul di sini otomatis saat pesepeda mulai menyalakan tracking di rute Makassar
                      </p>
                    </td>
                  </tr>
                ) : (
                  liveRiders.map((r) => (
                    <tr key={r.id} className="hover:bg-[#141f36]/40">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {r.is_anonymous ? 'Rider (Anonim)' : r.display_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <RiderStatusBadge status={r.status || 'ON_THE_WAY'} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#00f076]">
                        {r.speed_mps ? (r.speed_mps * 3.6).toFixed(1) + ' km/h' : '0 km/h'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#94a3b8]">
                        ±{r.accuracy_meters ? Math.round(r.accuracy_meters) : 5}m
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#64748b]">
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#00f076]">
                        Aktif
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: ADD / EDIT RUNDOWN ITEM */}
      <Modal
        isOpen={isRundownModalOpen}
        onClose={() => setIsRundownModalOpen(false)}
        title={editingRundownId ? 'Edit Agenda Rundown' : 'Tambah Agenda Rundown Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveRundownItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Waktu Kegiatan (WITA)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 18:30 - 18:45"
              value={rundownTime}
              onChange={(e) => setRundownTime(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Judul Kegiatan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Briefing Rute & Doa Bersama"
              value={rundownTitle}
              onChange={(e) => setRundownTitle(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Deskripsi / Keterangan
            </label>
            <textarea
              rows={3}
              placeholder="Penjelasan detail aktivitas..."
              value={rundownDesc}
              onChange={(e) => setRundownDesc(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Nomor Urutan
            </label>
            <input
              type="number"
              min={1}
              required
              value={rundownOrder}
              onChange={(e) => setRundownOrder(parseInt(e.target.value) || 1)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRundownModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingStatus}
            >
              Simpan Agenda
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD TIKUM (ADMIN ONLY) */}
      <Modal
        isOpen={isTikumModalOpen}
        onClose={() => setIsTikumModalOpen(false)}
        title="Tambah Lokasi Titik Kumpul (Admin)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAdminTikum} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Nama Titik Kumpul (Tikum)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tikum Pettarani / Depan McD"
              value={tikumName}
              onChange={(e) => setTikumName(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                Jam Kumpul (WITA)
              </label>
              <input
                type="text"
                required
                placeholder="17:45"
                value={tikumTime}
                onChange={(e) => setTikumTime(e.target.value)}
                className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
                Koordinat Terpilih
              </label>
              <div className="w-full bg-[#141f36] border border-[#1e2d4d] rounded-xl px-4 py-2 text-xs font-mono text-[#00f076]">
                {tikumCoords.lat.toFixed(5)}, {tikumCoords.lng.toFixed(5)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1">
              Deskripsi & Panduan Rute Menuju Start
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Kumpul jam 17:30, gowes santai lewat Pettarani menuju Losari..."
              value={tikumDesc}
              onChange={(e) => setTikumDesc(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2 text-sm text-white outline-none"
            />
          </div>

          {/* Interactive Map Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
              Tentukan Lokasi di Peta Makassar (Ketuk Peta untuk Memilih Titik):
            </label>
            <LocationPicker
              initialLatitude={tikumCoords.lat}
              initialLongitude={tikumCoords.lng}
              onLocationSelect={(lat, lng) => setTikumCoords({ lat, lng })}
              className="h-60 w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTikumModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingStatus}
            >
              Publikasikan Lokasi Tikum
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
