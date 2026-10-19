import React from 'react';
import MercuryBadge from './mercury/MercuryBadge';

/**
 * StatusBadge — updated for Mercury design system.
 * Uses tinted solid background with darker text of the same hue.
 * Soft 6px radius (no pill shapes, no glowing rings).
 */
export default function StatusBadge({ status }) {
  const isSuspended = status === 'SUSPENDED';
  const label = isSuspended ? 'Suspended' : 'Active';
  const variant = isSuspended ? 'danger' : 'success';

  return (
    <MercuryBadge variant={variant} dot={true}>
      {label}
    </MercuryBadge>
  );
}
