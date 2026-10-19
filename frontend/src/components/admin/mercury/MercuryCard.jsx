import React from 'react';

/**
 * MercuryCard
 * Flat panel: white surface, 1px hairline border (--ash-200),
 * 20 to 24px padding, radius 12px, no visible shadow.
 */
export default function MercuryCard({
  children,
  className = '',
  padding = 'default',
  ...props
}) {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`bg-white border border-[#E1E4E8] rounded-[12px] ${
        paddingMap[padding] || paddingMap.default
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
