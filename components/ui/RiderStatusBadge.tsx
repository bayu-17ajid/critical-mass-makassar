import React from 'react';
import { AttendeeStatus } from '@/types';
import { Bike, MapPin, CheckCircle2, Clock } from 'lucide-react';

export interface RiderStatusBadgeProps {
  status: AttendeeStatus;
  size?: 'sm' | 'md';
}

export const RiderStatusBadge: React.FC<RiderStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'ON_THE_WAY':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-[#00f076]/15 text-[#00f076] border border-[#00f076]/40 ${sizeClasses}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f076] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f076]" />
          </span>
          <Bike className="w-3 h-3" />
          <span>ON THE WAY</span>
        </span>
      );

    case 'AT_TIKUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/40 ${sizeClasses}`}
        >
          <MapPin className="w-3 h-3" />
          <span>DI TIKUM</span>
        </span>
      );

    case 'ARRIVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-[#f43f5e]/15 text-[#fb7185] border border-[#f43f5e]/40 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>ARRIVED</span>
        </span>
      );

    case 'ATTENDING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-full bg-[#1e2d4d]/80 text-[#94a3b8] border border-[#263b63] ${sizeClasses}`}
        >
          <Clock className="w-3 h-3" />
          <span>ATTENDING</span>
        </span>
      );
  }
};
