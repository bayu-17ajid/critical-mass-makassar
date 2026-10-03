import React from 'react';
import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  border?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Rider',
  size = 'md',
  className = '',
  border = true,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  const initials = (name || 'R')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const borderClass = border ? 'border-2 border-[#1e2d4d]' : '';

  if (src) {
    return (
      <div className={`relative rounded-full overflow-hidden shrink-0 ${sizeClasses} ${borderClass} ${className}`}>
        <Image
          src={src}
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }

  // Consistent pleasant gradient based on name hash
  const colors = [
    'from-emerald-500 to-teal-700',
    'from-purple-500 to-indigo-700',
    'from-cyan-500 to-blue-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-700',
  ];
  const charCodeSum = (name || 'R').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgGradient = colors[charCodeSum % colors.length];

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${bgGradient} text-white font-bold flex items-center justify-center shrink-0 select-none ${sizeClasses} ${borderClass} ${className}`}
    >
      {initials}
    </div>
  );
};

export interface AvatarGroupProps {
  avatars: { src?: string | null; name: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'sm',
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((item, idx) => (
        <Avatar
          key={idx}
          src={item.src}
          name={item.name}
          size={size}
          className="ring-2 ring-[#080d1a]"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`rounded-full bg-[#1e2d4d] text-[#94a3b8] font-bold flex items-center justify-center ring-2 ring-[#080d1a] ${
            size === 'xs'
              ? 'w-6 h-6 text-[10px]'
              : size === 'sm'
              ? 'w-8 h-8 text-xs'
              : 'w-10 h-10 text-sm'
          }`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
