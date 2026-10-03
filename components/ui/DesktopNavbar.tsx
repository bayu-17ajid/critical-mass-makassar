'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, Calendar, MapPin, Radio, Shield, User } from 'lucide-react';

interface DesktopNavbarProps {
  user?: { id: string; email?: string; user_metadata?: { display_name?: string } } | null;
  profile?: { display_name?: string; username?: string; role?: string } | null;
  isAdmin?: boolean;
  onSignOut?: () => void;
  onOpenAuth?: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  user,
  profile,
  isAdmin = false,
}) => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Beranda', icon: <Bike className="w-4 h-4" /> },
    { href: '/event', label: 'Event', icon: <Calendar className="w-4 h-4" /> },
    { href: '/tikum', label: 'Tikum', icon: <MapPin className="w-4 h-4" /> },
    {
      href: '/live',
      label: 'Live Map',
      icon: <Radio className="w-4 h-4 text-[#00f076] animate-pulse" />,
      highlight: true,
    },
    {
      href: '/admin',
      label: 'Admin',
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      adminBadge: isAdmin ? 'Aktif' : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d1a]/85 backdrop-blur-md border-b border-[#1e2d4d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#00f076]/10 border border-[#00f076]/30 flex items-center justify-center text-[#00f076] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,240,118,0.2)]">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm tracking-widest text-white uppercase flex items-center gap-1.5 font-mono">
              <span>CRITICAL MASS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00f076] text-[#080d1a] font-bold">
                MKS
              </span>
            </div>
            <div className="text-[10px] text-[#94a3b8] font-medium tracking-tight">
              Makassar Cycling Collective
            </div>
          </div>
        </Link>

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#141f36] text-[#00f076] border border-[#00f076]/30 shadow-[0_0_15px_rgba(0,240,118,0.15)]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#141f36]/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.adminBadge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                    {item.adminBadge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-[#00f076] animate-ping" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / User controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center font-semibold rounded-xl text-xs px-3 py-1.5 gap-1.5 border border-[#1e2d4d] bg-[#0f172a]/70 text-[#f1f5f9] hover:bg-[#141f36] hover:border-[#00f076]/40 transition-all duration-200 select-none cursor-pointer"
            >
              <User className="w-4 h-4 text-[#00f076] shrink-0" />
              <span>{profile?.display_name || user.user_metadata?.display_name || 'Profil Rider'}</span>
              {isAdmin && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400">
                  ADMIN
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center font-semibold rounded-xl text-xs px-3 py-1.5 gap-1.5 bg-[#00f076] text-[#080d1a] hover:bg-[#00d366] shadow-[0_0_20px_rgba(0,240,118,0.25)] hover:shadow-[0_0_28px_rgba(0,240,118,0.4)] transition-all duration-200 select-none cursor-pointer"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Masuk / Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
