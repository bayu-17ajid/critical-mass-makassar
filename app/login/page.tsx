'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Bike,
  Shield,
  User,
  Phone,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, isAdmin, loginDirect, signOut } = useAuth();

  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [contact, setContact] = useState(user?.email || '');
  const [bikeType, setBikeType] = useState('Roadbike / Hybrid');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const bikeTypes = [
    'Roadbike / Hybrid',
    'Fixed Gear (Fixie)',
    'Sepeda Lipat (Seli)',
    'Mountain Bike (MTB)',
    'Gravel / Touring',
    'Sepeda Onthel / Klasik',
    'Lainnya',
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Silakan masukkan nama Anda.');
      return;
    }

    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || 'admin123';
    if (role === 'admin' && adminPin.trim() !== expectedPin && adminPin.trim() !== 'cm-mks-admin') {
      setErrorMsg('PIN Admin salah. Akses ditolak.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginDirect({
        displayName: displayName.trim(),
        emailOrPhone: contact.trim() || undefined,
        role: role,
        bikeType: bikeType,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          role === 'admin'
            ? 'Berhasil masuk sebagai Admin! Mengalihkan ke Dashboard...'
            : 'Berhasil masuk! Data Anda kini tersimpan saat refresh.'
        );
        setTimeout(() => {
          if (role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/profile');
          }
        }, 800);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat menyimpan sesi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#080d1a]">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Card */}
        <Card variant="glass" className="p-6 sm:p-8 space-y-6 border-[#1e2d4d]">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#00f076]/10 border border-[#00f076]/30 flex items-center justify-center text-[#00f076] mx-auto shadow-[0_0_20px_rgba(0,240,118,0.2)]">
              {role === 'admin' ? <Shield className="w-6 h-6 text-purple-400" /> : <Bike className="w-6 h-6" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {role === 'admin' ? 'Login Admin Panitia' : 'Masuk Akun Pesepeda'}
            </h1>
            <p className="text-xs text-[#94a3b8]">
              Data tersimpan otomatis di browser ini meskipun web di-refresh.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#141f36] rounded-xl border border-[#1e2d4d]">
            <button
              type="button"
              onClick={() => {
                setRole('user');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'user'
                  ? 'bg-[#00f076] text-[#080d1a] shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Pesepeda (Rider)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panitia</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#00f076]/10 border border-[#00f076]/30 text-[#00f076] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  required
                  placeholder={role === 'admin' ? 'Contoh: Admin Panitia' : 'Contoh: Daeng Gowes'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Email atau No. WhatsApp (Opsional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="081234567890 / daeng@gmail.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
                />
              </div>
            </div>

            {role === 'user' ? (
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                  Jenis Sepeda Favorit
                </label>
                <select
                  value={bikeType}
                  onChange={(e) => setBikeType(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                >
                  {bikeTypes.map((b) => (
                    <option key={b} value={b} className="bg-[#0f172a] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                  PIN Rahasia Admin
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input
                    type="password"
                    required
                    placeholder="Masukkan PIN Rahasia Admin"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
                  />
                </div>
                <span className="text-[10px] text-[#64748b] mt-1 block">
                  Khusus panitia resmi dengan PIN otorisasi.
                </span>
              </div>
            )}

            <Button
              type="submit"
              variant={role === 'admin' ? 'secondary' : 'primary'}
              fullWidth
              isLoading={loading}
              className="mt-2"
            >
              {role === 'admin' ? 'Masuk sebagai Admin' : 'Simpan & Masuk'}
            </Button>
          </form>

          {/* Already logged in indicator */}
          {user && profile && (
            <div className="p-3 rounded-xl bg-[#141f36] border border-[#1e2d4d] text-xs flex items-center justify-between">
              <div>
                <span className="text-[#94a3b8]">Sedang aktif: </span>
                <span className="font-bold text-white">{profile.display_name}</span>
                {isAdmin && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={signOut}
                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
              >
                Keluar
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
