import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const regions = {
  "greater-accra": ["Accra Metropolis", "Tema Metropolis", "Ga East", "Ga West"],
  "ashanti": ["Kumasi Metropolis", "Obuasi Municipal", "Ejisu-Juaben", "Amansie West"],
  "central": ["Cape Coast Metropolis", "Awutu Senya", "Effutu", "Komenda/Edina/Eguafo/Abirem"],
  "eastern": ["New Juaben", "Nsawam Adoagyiri", "Akuapem North", "East Akim"],
  "western": ["Sekondi-Takoradi Metropolis", "Tarkwa Nsuaem", "Ellembelle", "Jomoro"],
  "volta": ["Ho Municipal", "Ketu South", "Kpando", "Hohoe"],
  "northern": ["Tamale Metropolis", "Sagnarigu", "Yendi", "Tolon"],
  "upper-east": ["Bolgatanga Municipal", "Kassena Nankana", "Bawku Municipal", "Navrongo"],
  "upper-west": ["Wa Municipal", "Nadowli-Kaleo", "Jirapa", "Lawra"],
  "bono": ["Sunyani Municipal", "Berekum", "Dormaa", "Wenchi"],
  "bono-east": ["Techiman Municipal", "Kintampo North", "Nkoranza South", "Atebubu-Amantin"],
  "ahafo": ["Goaso Municipal", "Asunafo North", "Tano South", "Tano North"],
  "savannah": ["Damongo", "Bole", "West Gonja", "East Gonja"],
  "north-east": ["Nalerigu", "Walewale", "East Mamprusi", "West Mamprusi"],
  "oti": ["Dambai", "Krachi East", "Nkwanta South", "Kadjebi"],
  "western-north": ["Sefwi Wiawso", "Bibiani-Anhwiaso-Bekwai", "Juaboso", "Aowin"]
};

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

  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Step and location states
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'address' | 'payment'
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [city, setCity] = useState('');
  const [amountToPay, setAmountToPay] = useState('');

  // Validate cart every time the drawer opens; reset states when closed
  useEffect(() => {
    if (open) {
      validateCart();
    } else {
      setCheckoutSuccess(null);
      setAuthPrompt(false);
      setCheckoutError('');
      setCheckoutStep('cart');
      setSelectedRegion('');
      setSelectedDistrict('');
      setCity('');
      setAmountToPay('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trap body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleProceedToCheckout = () => {
    setCheckoutError('');
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      setAuthPrompt(true);
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'CUSTOMER') {
      setAuthPrompt(true);
      return;
    }

    // Authenticated! Go to the delivery step
    setCheckoutStep('address');
  };

  const handleProceedToPayment = () => {
    if (!selectedRegion || !selectedDistrict || !city.trim()) {
      setCheckoutError('Please fill out all delivery details.');
      return;
    }
    setCheckoutError('');
    // Pre-fill amount with full total so user can adjust down
    setAmountToPay(totalPrice.toFixed(2));
    setCheckoutStep('payment');
  };

  const handlePlaceOrder = async () => {
    const numAmount = parseFloat(amountToPay);
    if (isNaN(numAmount) || numAmount <= 0) {
      setCheckoutError('Please enter a valid payment amount.');
      return;
    }
    if (numAmount > totalPrice) {
      setCheckoutError('Payment amount cannot exceed the order total.');
      return;
    }

    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      const orderItems = items.map(item => ({
        id: item.id,
        qty: item.qty
      }));

      const { data } = await api.post('/orders', {
        items: orderItems,
        pickup_region: selectedRegion,
        pickup_district: selectedDistrict,
        pickup_city: city.trim(),
        amount_paid: numAmount
      });

      clearCart();
      setCheckoutSuccess(data);
    } catch (err) {
      setCheckoutError(err.response?.data?.error || 'Failed to process order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

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

        {/* Render Success Screen */}
        {checkoutSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <span className="material-symbols-outlined text-5xl text-emerald-400 bg-emerald-500/10 p-4 rounded-3xl animate-pulse">
              check_circle
            </span>
            <div className="space-y-2">
              <h3 className="text-on-background font-bold text-lg">Order Placed Successfully!</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed max-w-xs mx-auto">
                Thank you for your purchase. Your order was successfully processed.
              </p>
              <p className="text-indigo-400 text-xs font-mono font-semibold pt-2">
                Order Reference: #CRZ-{checkoutSuccess.id.toString().padStart(5, '0')}
              </p>
            </div>
            <div className="w-full space-y-3 pt-4">
              <button
                onClick={() => {
                  onClose();
                  setCheckoutSuccess(null);
                  navigate('/profile');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm duration-200"
              >
                View My Orders
              </button>
              <button
                onClick={() => {
                  onClose();
                  setCheckoutSuccess(null);
                }}
                className="w-full text-on-surface-variant hover:text-on-background text-xs font-semibold py-2 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : authPrompt ? (
          /* Render Auth Required Overlay */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <span className="material-symbols-outlined text-5xl text-[#c7e74c] bg-surface-container-highest p-4 rounded-3xl">
              account_circle
            </span>
            <div className="space-y-2">
              <h3 className="text-on-background font-bold text-lg font-price-display">Account Required</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed max-w-xs mx-auto">
                Please log in or create a customer account to check out and track your order.
              </p>
            </div>
            <div className="w-full space-y-3 pt-4">
              <button
                onClick={() => {
                  onClose();
                  navigate('/auth?redirect=/');
                }}
                className="w-full bg-[#c7e74c] hover:bg-[#b5d342] text-black font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm duration-200"
              >
                Sign In / Sign Up
              </button>
              <button
                onClick={() => setAuthPrompt(false)}
                className="w-full text-on-surface-variant hover:text-on-background text-xs font-semibold py-2 transition"
              >
                Go Back to Cart
              </button>
            </div>
          </div>
        ) : checkoutStep === 'address' ? (
          /* Render Delivery & Pickup address entry step */
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckoutStep('cart')}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container-highest transition"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">arrow_back</span>
                </button>
                <div>
                  <h3 className="text-on-background font-bold text-lg">Delivery Details</h3>
                  <p className="text-on-surface-variant text-xs mt-0.5">Please provide your pickup location</p>
                </div>
              </div>

              {checkoutError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-xs">
                  {checkoutError}
                </div>
              )}

              <div className="space-y-4">
                {/* Region Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="drawer-region-select">
                    Region
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full px-3.5 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface text-xs appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
                      id="drawer-region-select"
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedDistrict('');
                      }}
                    >
                      <option disabled value="">Select Region</option>
                      <option value="greater-accra">Greater Accra</option>
                      <option value="ashanti">Ashanti</option>
                      <option value="central">Central</option>
                      <option value="eastern">Eastern</option>
                      <option value="western">Western</option>
                      <option value="volta">Volta</option>
                      <option value="northern">Northern</option>
                      <option value="upper-east">Upper East</option>
                      <option value="upper-west">Upper West</option>
                      <option value="bono">Bono</option>
                      <option value="bono-east">Bono East</option>
                      <option value="ahafo">Ahafo</option>
                      <option value="savannah">Savannah</option>
                      <option value="north-east">North East</option>
                      <option value="oti">Oti</option>
                      <option value="western-north">Western North</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-secondary text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* District Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="drawer-district-select">
                    District
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full px-3.5 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface text-xs appearance-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                      id="drawer-district-select"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedRegion}
                    >
                      <option disabled value="">Select District</option>
                      {selectedRegion && regions[selectedRegion]?.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-secondary text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Street / City Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant" htmlFor="drawer-pickup-location">
                    City or Street Address
                  </label>
                  <input
                    className="block w-full px-3.5 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-secondary"
                    id="drawer-pickup-location"
                    placeholder="Enter city or street name"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 bg-surface-container/50 p-3.5 rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">info</span>
                <p className="font-body-sm text-xs text-secondary italic">
                  Note: Delivery amount will be determined based on location after payment.
                </p>
              </div>
            </div>

            {/* Footer containing Checkout controls */}
            <div className="border-t border-outline-variant pt-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Order Total</span>
                <span className="text-on-background font-bold text-lg">
                  GH₵ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                id="proceed-to-payment-btn"
                onClick={handleProceedToPayment}
                disabled={!selectedRegion || !selectedDistrict || !city.trim()}
                className="w-full bg-[#c7e74c] hover:bg-[#b5d342] disabled:opacity-55 disabled:cursor-not-allowed text-black font-bold py-3.5
                  rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        ) : checkoutStep === 'payment' ? (
          /* ── Installment Payment Step ── */
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckoutStep('address')}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container-highest transition"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">arrow_back</span>
                </button>
                <div>
                  <h3 className="text-on-background font-bold text-lg">Payment</h3>
                  <p className="text-on-surface-variant text-xs mt-0.5">Enter the amount you're paying now</p>
                </div>
              </div>

              {checkoutError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-xs">
                  {checkoutError}
                </div>
              )}

              {/* Order Total Summary */}
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Order Total</span>
                  <span className="text-on-background font-bold">GH₵ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {parseFloat(amountToPay) > 0 && parseFloat(amountToPay) < totalPrice && (
                  <div className="flex justify-between items-center text-sm border-t border-outline-variant/30 pt-2">
                    <span className="text-on-surface-variant">Balance Remaining</span>
                    <span className="text-amber-400 font-bold">
                      GH₵ {(totalPrice - parseFloat(amountToPay)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="payment-amount-input">
                  Amount Paying Now (GH₵)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">GH₵</span>
                  <input
                    id="payment-amount-input"
                    type="number"
                    min="0.01"
                    max={totalPrice}
                    step="0.01"
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder={totalPrice.toFixed(2)}
                  />
                </div>
                {/* Quick-fill buttons */}
                <div className="flex gap-2 pt-1">
                  {[25, 50, 75, 100].map(pct => {
                    const val = (totalPrice * pct / 100);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAmountToPay(val.toFixed(2))}
                        className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant hover:border-indigo-500 hover:text-indigo-400 transition"
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Installment Notice */}
              <div className="flex items-start gap-2 bg-indigo-500/5 p-3.5 rounded-xl border border-indigo-500/20">
                <span className="material-symbols-outlined text-[16px] text-indigo-400 mt-0.5">payments</span>
                <p className="text-xs text-indigo-300 leading-relaxed">
                  <span className="font-bold">Installment Payment:</span> You can pay any amount now and settle the remaining balance later. The full order total is GH₵ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-outline-variant pt-5 space-y-3">
              <button
                id="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={checkoutLoading || !amountToPay || parseFloat(amountToPay) <= 0}
                className="w-full bg-[#c7e74c] hover:bg-[#b5d342] disabled:opacity-55 disabled:cursor-not-allowed text-black font-bold py-3.5
                  rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Pay GH₵ ${parseFloat(amountToPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} & Place Order`
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Render Standard Cart Items & Controls */
          <>
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

            {/* ── Checkout Error banner ── */}
            {checkoutError && (
              <div className="mx-4 mt-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-xs">
                {checkoutError}
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
                  onClick={handleProceedToCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-[#c7e74c] hover:bg-[#b5d342] disabled:opacity-60 text-black font-bold py-3.5
                    rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-2"
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
          </>
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
