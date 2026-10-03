import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  glowBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glowBorder = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#141f36]/90 border border-[#1e2d4d]',
    elevated: 'bg-[#1a2947] border border-[#253961] shadow-xl',
    glass: 'bg-[#0f172a]/70 backdrop-blur-md border border-[#1e2d4d]/80',
    interactive:
      'bg-[#141f36]/90 border border-[#1e2d4d] hover:border-[#00f076]/40 hover:bg-[#182642] transition-all duration-200 cursor-pointer',
  }[variant];

  const glowStyles = glowBorder
    ? 'border-[#00f076]/40 shadow-[0_0_24px_rgba(0,240,118,0.12)]'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 ${variantStyles} ${glowStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
