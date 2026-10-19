import React from 'react';
import MercuryButton from './MercuryButton';

/**
 * MercuryEmptyState
 * Single line icon, one sentence, one action.
 */
export default function MercuryEmptyState({
  icon: Icon,
  message = 'No data available to display.',
  actionLabel,
  onAction,
  actionVariant = 'secondary',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-[#E1E4E8] rounded-[12px] ${className}`}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-[8px] bg-[#F4F5F7] flex items-center justify-center text-[#8B93A1] mb-3">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-[14px] text-[#5F6877] mb-4 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <MercuryButton variant={actionVariant} size="sm" onClick={onAction}>
          {actionLabel}
        </MercuryButton>
      )}
    </div>
  );
}
