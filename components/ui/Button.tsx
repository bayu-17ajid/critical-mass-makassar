import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080d1a] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-lg',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#00f076] text-[#080d1a] hover:bg-[#00d366] focus:ring-[#00f076] shadow-[0_0_20px_rgba(0,240,118,0.25)] hover:shadow-[0_0_28px_rgba(0,240,118,0.4)]',
    secondary:
      'bg-[#a855f7] text-white hover:bg-[#9333ea] focus:ring-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.25)]',
    outline:
      'border border-[#1e2d4d] bg-[#0f172a]/70 text-[#f1f5f9] hover:bg-[#141f36] hover:border-[#00f076]/40 focus:ring-[#00f076]',
    ghost:
      'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#141f36] focus:ring-[#1e2d4d]',
    danger:
      'bg-[#f43f5e] text-white hover:bg-[#e11d48] focus:ring-[#f43f5e] shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-400',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
