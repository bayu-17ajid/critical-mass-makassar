'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import {
  User,
  Shield,
  EyeOff,
  LogOut,
  Calendar,
  Bike,
  Edit2,
  Check,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAdmin, signOut, updateProfile, openAuthModal } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [isAnonymous, setIsAnonymous] = useState(profile?.is_anonymous || false);
  const [saving, setSaving] = useState(false);

  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#141f36] border border-[#1e2d4d] flex items-center justify-center text-[#00f076] mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Profil Pesepeda</h2>
        <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
          Masuk ke akun Critical Mass Makassar Anda untuk melihat status kehadiran dan mengatur privasi live map.
        </p>
        <Button variant="primary" onClick={openAuthModal}>
          Masuk / Daftar Akun
        </Button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      display_name: displayName,
      username,
      is_anonymous: isAnonymous,
    });
    setSaving(false);
    setIsEditing(false);
  };

  const handleToggleAnonymity = async () => {
    const nextVal = !isAnonymous;
    setIsAnonymous(nextVal);
    await updateProfile({ is_anonymous: nextVal });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Profile Header */}
      <Card variant="glass" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Avatar name={profile.display_name} size="xl" border />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {profile.display_name}
              </h1>
              {isAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#00f076] font-mono">
              @{profile.username || 'rider'}
            </p>
            <p className="text-[11px] text-[#64748b] mt-1">
              {user.email || 'Akun Komunitas'}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Batal' : 'Edit Profil'}
          </Button>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-[#1e2d4d] space-y-3">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Nama Tampilan</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#141f36] border border-[#1e2d4d] rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Username (@)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#141f36] border border-[#1e2d4d] rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={saving}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Simpan Perubahan
            </Button>
          </form>
        )}
      </Card>

      {/* Privacy & Live Map Settings */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1e2d4d]">
          <EyeOff className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Pengaturan Privasi & Live Map
          </h3>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Mode Anonim di Live Map</div>
            <div className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
              Jika aktif, lokasi Anda akan ditampilkan dengan nama &ldquo;Rider&rdquo; tanpa memperlihatkan nama asli atau foto profil kepada publik.
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleAnonymity}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              isAnonymous ? 'bg-[#00f076]' : 'bg-[#1e2d4d]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#080d1a] transition-transform duration-200 ease-in-out ${
                isAnonymous ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/event">
          <Card variant="interactive" className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00f076]/10 text-[#00f076] border border-[#00f076]/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Status Event</div>
              <div className="text-[10px] text-[#94a3b8]">Lihat kehadiran saya</div>
            </div>
          </Card>
        </Link>

        <Link href="/live">
          <Card variant="interactive" className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Live Tracking</div>
              <div className="text-[10px] text-[#94a3b8]">Buka peta langsung</div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Admin Quick Access / Login */}
      {isAdmin ? (
        <Card variant="elevated" className="border-purple-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-white">Akses Admin Aktif</span>
            </div>
            <Link href="/admin">
              <Button size="sm" variant="secondary">
                Buka Admin Dashboard
              </Button>
            </Link>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Anda memiliki hak akses untuk mengelola lokasi Tikum, rundown acara, dan titik start/finish.
          </p>
        </Card>
      ) : (
        <Card variant="glass" className="border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-sm font-bold text-white">Khusus Panitia / Admin</span>
                <p className="text-[11px] text-[#94a3b8]">Kelola lokasi Tikum, rundown acara, dan titik start/finish</p>
              </div>
            </div>
            <Link href="/admin">
              <Button size="sm" variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10">
                Login Admin
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Sign Out */}
      <div className="pt-4 border-t border-[#1e2d4d] text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await signOut();
            router.push('/');
          }}
          leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
        >
          Keluar dari Akun
        </Button>
      </div>
    </div>
  );
}
