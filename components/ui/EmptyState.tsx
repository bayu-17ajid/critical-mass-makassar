import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#0f172a]/60 border border-[#1e2d4d] border-dashed ${className}`}
    >
      {icon && (
        <div className="p-4 rounded-2xl bg-[#141f36] text-[#00f076] border border-[#1e2d4d] mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-[#94a3b8] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
