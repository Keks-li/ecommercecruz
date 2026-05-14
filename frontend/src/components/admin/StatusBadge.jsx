/**
 * StatusBadge — pill badge that reflects a user's current status.
 */
export default function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide
        ${isActive
          ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
          : 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30'
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );
}
