'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, User, Bike, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Masukkan alamat email');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const res = isSignUp
        ? await signUpWithEmail(email, password, displayName, username)
        : await signInWithEmail(email, password);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        closeAuthModal();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'rider' | 'admin') => {
    setLoading(true);
    setErrorMsg('');
    const demoEmail = role === 'admin' ? 'admin@criticalmass.id' : 'bayu@gowesmakassar.id';
    await signInWithEmail(demoEmail, 'password123');
    setLoading(false);
    closeAuthModal();
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={isSignUp ? 'Daftar Komunitas Critical Mass' : 'Masuk ke Critical Mass'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {isSignUp && (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bayu Pratama"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
                Username (@)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748b] font-mono">
                  @
                </span>
                <input
                  type="text"
                  placeholder="bayu_mks"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94a3b8] mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#141f36] border border-[#1e2d4d] focus:border-[#00f076] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#475569] outline-none transition-colors"
            />
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={loading} className="mt-2">
          {isSignUp ? 'Daftar Sekarang' : 'Masuk'}
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs text-[#00f076] hover:underline"
          >
            {isSignUp
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Buat akun rider'}
          </button>
        </div>

        {/* Demo Fast Logins for instant review */}
        <div className="pt-3 border-t border-[#1e2d4d]">
          <p className="text-[11px] text-[#64748b] text-center mb-2 font-medium">
            Demo Cepat (Sekali Klik)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Bike className="w-3.5 h-3.5 text-[#00f076]" />}
              onClick={() => handleDemoLogin('rider')}
            >
              Demo Rider
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
              onClick={() => handleDemoLogin('admin')}
            >
              Demo Admin
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
