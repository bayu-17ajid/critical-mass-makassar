'use client';

import React from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { DesktopNavbar } from '@/components/ui/DesktopNavbar';
import { MobileBottomNav } from '@/components/ui/MobileBottomNav';
import { AuthModal } from '@/components/auth/AuthModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, signOut, openAuthModal } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-[#f1f5f9]">
      <DesktopNavbar
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        onSignOut={signOut}
        onOpenAuth={openAuthModal}
      />
      <main className="flex-1 pb-20 md:pb-8">{children}</main>
      <MobileBottomNav />
      <AuthModal />
    </div>
  );
};
