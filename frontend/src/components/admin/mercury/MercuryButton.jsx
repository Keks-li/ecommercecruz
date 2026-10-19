import React from 'react';

/**
 * MercuryButton
 * Styles: primary, secondary, tertiary, destructive, destructive-solid
 * Height: 36px (h-9) / 40px (h-10)
 * Radius: 8px (rounded-[8px])
 * Rules: Solid colors only, no gradients, WCAG AA contrast.
 */
export default function MercuryButton({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-[#5266EB]/25 disabled:cursor-not-allowed disabled:opacity-50 rounded-[8px] text-[13px]';

  const sizeClasses = {
    sm: 'h-8 px-2.5 gap-1.5 text-[12px]',
    md: 'h-9 px-3.5 gap-2 text-[13px]',
    lg: 'h-10 px-4 gap-2 text-[14px]',
  };

  const variantClasses = {
    primary:
      'bg-[#5266EB] text-white hover:bg-[#4355D6] active:bg-[#3646B8] border border-transparent shadow-none',
    secondary:
      'bg-white text-[#1B1D22] border border-[#E1E4E8] hover:bg-[#F4F5F7] active:bg-[#ECEEF1] shadow-none',
    tertiary:
      'bg-transparent text-[#5F6877] hover:text-[#1B1D22] hover:bg-[#F4F5F7] active:bg-[#ECEEF1] border border-transparent shadow-none',
    destructive:
      'bg-white text-[#C02B2B] border border-[#E1E4E8] hover:bg-[#FBEAEA] active:bg-[#F8D7D7] shadow-none',
    'destructive-solid':
      'bg-[#C02B2B] text-white hover:bg-[#A82424] active:bg-[#8F1F1F] border border-transparent shadow-none',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.secondary
      } ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0 text-current" strokeWidth={1.5} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0 text-current" strokeWidth={1.5} />
      )}
    </button>
  );
}
