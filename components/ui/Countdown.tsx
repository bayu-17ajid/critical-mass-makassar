'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { calculateTimeRemaining, CountdownTime } from '@/lib/event/date';

export interface CountdownProps {
  targetDate: Date | string;
  onExpire?: () => void;
  className?: string;
}

const emptySubscribe = () => () => {};

export const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  onExpire,
  className = '',
}) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const target = React.useMemo(() => {
    return typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  }, [targetDate]);

  const [time, setTime] = useState<CountdownTime>(() => calculateTimeRemaining(target));

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = calculateTimeRemaining(target);
      setTime(remaining);
      if (remaining.isExpired && onExpire) {
        onExpire();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [target, onExpire]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Prevent SSR hydration mismatch
  if (!isMounted) {
    return (
      <div className={`grid grid-cols-4 gap-2 sm:gap-3 text-center ${className}`}>
        {['Hari', 'Jam', 'Menit', 'Detik'].map((unit, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0f172a]/90 border border-[#1e2d4d]"
          >
            <div className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
              --
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mt-1">
              {unit}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (time.isExpired) {
    return (
      <div className="p-4 rounded-2xl bg-[#00f076]/10 border border-[#00f076]/30 text-center">
        <span className="text-[#00f076] font-bold text-base sm:text-lg animate-pulse flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f076]" />
          EVENT SEDANG BERLANGSUNG HARI INI!
        </span>
      </div>
    );
  }

  const items = [
    { label: 'Hari', value: pad(time.days) },
    { label: 'Jam', value: pad(time.hours) },
    { label: 'Menit', value: pad(time.minutes) },
    { label: 'Detik', value: pad(time.seconds) },
  ];

  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-3 text-center ${className}`}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0f172a]/90 border border-[#1e2d4d] shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-[#00f076]/40 transition-colors"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f076]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
            {item.value}
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-[#94a3b8] uppercase tracking-wider mt-1">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};
