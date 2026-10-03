import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'purple' | 'pink' | 'cyan' | 'amber' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'green',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  const variantStyles = {
    green: 'bg-[#00f076]/10 text-[#00f076] border border-[#00f076]/30',
    purple: 'bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/30',
    pink: 'bg-[#f43f5e]/15 text-[#fb7185] border border-[#f43f5e]/30',
    cyan: 'bg-[#06b6d4]/15 text-[#38bdf8] border border-[#06b6d4]/30',
    amber: 'bg-[#f59e0b]/15 text-[#fbbf24] border border-[#f59e0b]/30',
    neutral: 'bg-[#1e2d4d]/60 text-[#94a3b8] border border-[#1e2d4d]',
  }[variant];

  const dotColors = {
    green: 'bg-[#00f076]',
    purple: 'bg-[#a855f7]',
    pink: 'bg-[#f43f5e]',
    cyan: 'bg-[#38bdf8]',
    amber: 'bg-[#f59e0b]',
    neutral: 'bg-[#94a3b8]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {children}
    </span>
  );
};
