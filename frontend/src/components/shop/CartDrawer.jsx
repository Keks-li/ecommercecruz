import { useEffect } from 'react';
import { useCart } from '../../context/CartContext';

// ─── Icons ────────────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="w-5 h-5 animate-spin text-primary-container" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function EmptyCartIcon() {
  return (
    <svg className="w-16 h-16 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

/**
 * CartDrawer — slides in from the right.
 * On open it calls validateCart() to purge any suspended items.
 */
export default function CartDrawer({ open, onClose }) {
  const {
    items,
    totalItems,
    totalPrice,
    validating,
    suspendedWarnings,
    removeItem,
    updateQty,
    clearCart,
    clearWarnings,
    validateCart,
  } = useCart();

  // Validate cart every time the drawer opens
  useEffect(() => {
    if (open) validateCart();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trap body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-surface-container border-l border-outline-variant
          shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-on-background font-bold text-lg">Your Cart</h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-background hover:bg-surface-container-highest transition"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Suspension warning banner ── */}
        {suspendedWarnings.length > 0 && (
          <div className="mx-4 mt-4 bg-error-container/10 border border-error-container/30 rounded-xl p-4">
            <div className="flex items-start gap-2 text-error mb-2">
              <WarningIcon />
              <p className="text-xs font-semibold leading-snug">
                {suspendedWarnings.length} item{suspendedWarnings.length > 1 ? 's were' : ' was'} removed
                because {suspendedWarnings.length > 1 ? 'they are' : "it's"} no longer available:
              </p>
            </div>
            <ul className="space-y-0.5 pl-6 text-xs text-error/80 list-disc">
              {suspendedWarnings.map((w) => (
                <li key={w.id}>{w.name}</li>
              ))}
            </ul>
            <button
              onClick={clearWarnings}
              className="mt-3 text-xs text-error/70 hover:text-error underline underline-offset-2 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Validating overlay ── */}
        {validating && (
          <div className="flex items-center gap-2 px-6 py-3 text-on-surface-variant text-xs border-b border-outline-variant">
            <SpinnerIcon />
            Checking item availability…
          </div>
        )}

        {/* ── Items list ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 && !validating ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <EmptyCartIcon />
              <div>
                <p className="text-on-surface font-medium">Your cart is empty</p>
                <p className="text-on-surface-variant text-xs mt-1">Add some products from the gallery.</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onQtyChange={(qty) => updateQty(item.id, qty)}
              />
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className="border-t border-outline-variant px-6 py-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="text-on-background font-bold text-lg">
                ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              id="checkout-btn"
              className="w-full bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-semibold py-3
                rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98]"
            >
              Proceed to Checkout
            </button>

            <button
              id="clear-cart-btn"
              onClick={clearCart}
              className="w-full text-on-surface-variant hover:text-error text-xs font-medium transition py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── CartItem ─────────────────────────────────────────────────────────────────
function CartItem({ item, onRemove, onQtyChange }) {
  return (
    <div className="flex gap-3 bg-surface border border-outline-variant rounded-xl p-3">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-on-background text-sm font-medium truncate leading-snug">{item.name}</p>
        <p className="text-on-surface-variant text-[10px] font-mono mt-0.5">{item.unique_code}</p>
        <p className="text-primary-container text-xs font-semibold mt-1">
          ${(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end justify-between gap-1">
        <button onClick={onRemove} className="text-on-surface-variant hover:text-error transition p-1">
          <TrashIcon />
        </button>
        <div className="flex items-center gap-1.5 bg-surface-container-highest rounded-lg px-2 py-1">
          <button
            onClick={() => onQtyChange(item.qty - 1)}
            className="text-on-surface-variant hover:text-on-background w-4 text-center font-bold leading-none transition"
          >−</button>
          <span className="text-on-background text-xs font-semibold w-5 text-center">{item.qty}</span>
          <button
            onClick={() => onQtyChange(item.qty + 1)}
            className="text-on-surface-variant hover:text-on-background w-4 text-center font-bold leading-none transition"
          >+</button>
        </div>
      </div>
    </div>
  );
}
