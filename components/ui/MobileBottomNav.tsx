'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Home, Calendar, MapPin, Radio, User, Shield } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/event', label: 'Event', icon: Calendar },
    { href: '/tikum', label: 'Tikum', icon: MapPin },
    { href: '/live', label: 'Live', icon: Radio, highlight: true },
    { href: '/admin', label: 'Admin', icon: Shield, isAdminItem: true },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080d1a]/95 backdrop-blur-xl border-t border-[#1e2d4d] px-1 py-1 safe-area-pb">
      <div className="grid grid-cols-6 items-center justify-around h-15">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 select-none transition-colors duration-150 ${
                isActive ? 'text-[#00f076]' : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {item.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00f076] animate-pulse ring-2 ring-[#080d1a]" />
                )}
                {item.isAdminItem && isAdmin && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-[#080d1a]" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold tracking-tight ${
                  isActive ? 'text-[#00f076]' : 'text-[#94a3b8]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
