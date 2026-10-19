import React from 'react';

/**
 * MercuryBadge
 * Status colors are used only for status badges, deltas and alerts.
 * Tinted solid background with darker text of the same hue.
 * Soft 6px radius (not pill-shaped).
 */
export default function MercuryBadge({
  children,
  variant = 'neutral',
  className = '',
  dot = false,
}) {
  // Normalize string aliases
  const v = (variant || '').toLowerCase();

  let colors = {
    bg: '#ECEEF1',
    text: '#5F6877',
    dot: '#8B93A1',
  };

  if (
    v === 'success' ||
    v === 'active' ||
    v === 'paid' ||
    v === 'approved' ||
    v === 'delivered' ||
    v === 'completed'
  ) {
    colors = { bg: '#E8F5EE', text: '#1E7B50', dot: '#1E7B50' };
  } else if (
    v === 'warning' ||
    v === 'pending' ||
    v === 'partially_paid' ||
    v === 'in_transit' ||
    v === 'requested' ||
    v === 'low_stock'
  ) {
    colors = { bg: '#FDF3E1', text: '#B26B00', dot: '#B26B00' };
  } else if (
    v === 'danger' ||
    v === 'suspended' ||
    v === 'overdue' ||
    v === 'cancelled' ||
    v === 'rejected' ||
    v === 'out_of_stock' ||
    v === 'failed'
  ) {
    colors = { bg: '#FBEAEA', text: '#C02B2B', dot: '#C02B2B' };
  } else if (
    v === 'info' ||
    v === 'refunded' ||
    v === 'processing' ||
    v === 'shipped' ||
    v === 'single' ||
    v === 'combo'
  ) {
    colors = { bg: '#E9F0FA', text: '#2F63B5', dot: '#2F63B5' };
  }

  return (
    <span
      style={{ backgroundColor: colors.bg, color: colors.text }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[12px] font-medium tracking-normal select-none ${className}`}
    >
      {dot && (
        <span
          style={{ backgroundColor: colors.dot }}
          className="w-1.5 h-1.5 rounded-full shrink-0"
        />
      )}
      {children}
    </span>
  );
}
