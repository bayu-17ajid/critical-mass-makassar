import React from 'react';

export interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = 'h-12 w-full',
  count = 1,
}) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-[#141f36] rounded-xl border border-[#1e2d4d]/50 ${className}`}
        />
      ))}
    </div>
  );
};
