'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { User, Bike, Shield, Lock } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginDirect } = useAuth();
  const [mode, setMode] = useState<'rider' | 'admin'>('rider');
  const [displayName, setDisplayName] = useState('');
  const [bikeType, setBikeType] = useState('Roadbike / Hybrid');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bikeTypes = [
    'Roadbike / Hybrid',
    'Fixed Gear (Fixie)',
    'Sepeda Lipat (Seli)',
    'Mountain Bike (MTB)',
    'Gravel / Touring',
    'Sepeda Onthel / Klasik',
    'Lainnya',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = displayName.trim();
    if (!cleanName && mode === 'rider') {
      setErrorMsg('Silakan masukkan nama panggilan Anda.');
      return;
    }

    if (mode === 'admin') {
      const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || 'admin123';
      if (adminPin.trim() !== expectedPin && adminPin.trim() !== 'cm-mks-admin') {
        setErrorMsg('PIN Admin tidak sesuai. Akses panitia ditolak.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await loginDirect({
        displayName: cleanName || (mode === 'admin' ? 'Panitia CM Makassar' : 'Pesepeda Makassar'),
        emailOrPhone: mode === 'admin' ? 'admin@criticalmass.mks' : undefined,
        role: mode === 'admin' ? 'admin' : 'user',
        bikeType: mode === 'rider' ? bikeType : undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        closeAuthModal();
      }
    } catch {
      setErrorMsg('Gagal menyimpan identitas. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={mode === 'admin' ? 'Masuk Panel Admin' : 'Bergabung ke Critical Mass'}
      maxWidth="sm"
    >
      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-[#0f172a] p-1 border border-[#1e2d4d] mb-4">
        <button
          type="button"
          onClick={() => {
            setMode('rider');
            setErrorMsg('');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mode === 'rider'
              ? 'bg-[#141f36] text-[#00f076] shadow-sm'
              : 'text-[#94a3b8] hover:text-white'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Pesepeda (Rider)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('admin');
            setErrorMsg('');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mode === 'admin'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-[#94a3b8] hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Panitia (Admin)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
            {mode === 'admin' ? 'Nama Panitia' : 'Nama Lengkap / Panggilan'}
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              required={mode === 'rider'}
              placeholder={mode === 'admin' ? 'Panitia CM Makassar' : 'Contoh: Bayu Pratama'}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-[#64748b] mt-1">
            {mode === 'admin'
              ? 'Nama panitia yang tercatat di riwayat perubahan.'
              : 'Nama ini akan tampil di daftar kehadiran & pin live tracking.'}
          </p>
        </div>

        {mode === 'rider' ? (
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
              Jenis Sepeda
            </label>
            <div className="relative">
              <Bike className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <select
                value={bikeType}
                onChange={(e) => setBikeType(e.target.value)}
                className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors appearance-none cursor-pointer"
              >
                {bikeTypes.map((type) => (
                  <option key={type} value={type} className="bg-[#0f172a] text-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
              PIN Rahasia Panitia
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="password"
                required
                placeholder="Masukkan PIN Admin"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full bg-[#141f36] border border-purple-500/30 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors font-mono"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={loading}
          variant={mode === 'admin' ? 'secondary' : 'primary'}
          className="mt-2"
        >
          {mode === 'admin' ? 'Masuk Dashboard Admin' : 'Simpan & Lanjutkan'}
        </Button>

        <p className="text-[11px] text-center text-[#64748b] pt-1">
          Zero-login: Data tersimpan otomatis di perangkat &amp; tersinkronisasi ke server.
        </p>
      </form>
    </Modal>
  );
};
