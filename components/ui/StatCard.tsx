import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'green' | 'purple' | 'cyan' | 'pink' | 'default';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  onClick,
}) => {
  const iconColor = {
    green: 'text-[#00f076] bg-[#00f076]/10 border-[#00f076]/20',
    purple: 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/20',
    cyan: 'text-[#38bdf8] bg-[#06b6d4]/10 border-[#06b6d4]/20',
    pink: 'text-[#f43f5e] bg-[#f43f5e]/10 border-[#f43f5e]/20',
    default: 'text-[#94a3b8] bg-[#141f36] border-[#1e2d4d]',
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0f172a]/80 border border-[#1e2d4d] transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#00f076]/40 hover:bg-[#141f36]' : ''
      }`}
    >
      {icon && (
        <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${iconColor}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
          {value}
        </div>
        <div className="text-xs sm:text-sm text-[#94a3b8] font-medium truncate">
          {label}
        </div>
      </div>
    </div>
  );
};
