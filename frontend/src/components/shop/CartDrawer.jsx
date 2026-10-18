import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { payWithPaystack } from '../../services/paystack';

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
    <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function EmptyCartIcon() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
      <span className="material-symbols-outlined text-3xl">shopping_cart</span>
    </div>
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
  const [contactPhone, setContactPhone] = useState('');
  const [amountToPay, setAmountToPay] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [paymentPolicy, setPaymentPolicy] = useState(null);

  // Validate cart every time the drawer opens; reset states when closed
  useEffect(() => {
    if (open) {
      validateCart();
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.phone) setContactPhone(u.phone);
      } catch (_) {}
    } else {
      setCheckoutSuccess(null);
      setAuthPrompt(false);
      setCheckoutError('');
      setCheckoutStep('cart');
      setSelectedRegion('');
      setSelectedDistrict('');
      setCity('');
      setContactPhone('');
      setAmountToPay('');
      setPolicyAccepted(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load payment policy when reaching payment step
  useEffect(() => {
    if (open && checkoutStep === 'payment' && !paymentPolicy) {
      api.get('/products/payment-policy')
        .then((res) => setPaymentPolicy(res.data))
        .catch(() => {
          setPaymentPolicy({
            name: 'Cruzaro Payment Policy',
            default_deadline_days: 14,
            default_penalty_pct: 10,
            grace_period_days: 3,
            default_cancel_fee_pct: 15,
            max_refund_days: 30,
          });
        });
    }
  }, [open, checkoutStep, paymentPolicy]);

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

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'CUSTOMER') {
        setAuthPrompt(true);
        return;
      }
    } catch {
      setAuthPrompt(true);
      return;
    }

    // Authenticated! Go to the delivery step
    setCheckoutStep('address');
  };

  const handleProceedToPayment = async () => {
    if (!selectedRegion || !selectedDistrict || !city.trim()) {
      setCheckoutError('Please provide all delivery details before continuing.');
      return;
    }

    // Save or update phone in customer profile if provided
    if (contactPhone.trim()) {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.phone !== contactPhone.trim()) {
          const { data } = await api.patch('/auth/profile', { phone: contactPhone.trim() });
          if (data?.user) {
            localStorage.setItem('user', JSON.stringify({ ...u, phone: data.user.phone }));
          }
        }
      } catch (_) {
        // Non-blocking
      }
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
    if (!policyAccepted) {
      setCheckoutError('Please review and check the Payment Policy agreement to proceed.');
      return;
    }

    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      const orderItems = items.map(item => ({
        id: item.id,
        qty: item.qty
      }));

      const userObj = JSON.parse(localStorage.getItem('user') || '{}');

      // Initialize Paystack checkout session
      const { data } = await api.post('/paystack/initialize-checkout', {
        items: orderItems,
        pickup_region: selectedRegion,
        pickup_district: selectedDistrict,
        pickup_city: city.trim(),
        amount_paid: numAmount,
        email: userObj.email,
      });

      // Launch Paystack inline checkout or redirect
      await payWithPaystack({
        email: userObj.email,
        amountInCedis: numAmount,
        reference: data.paystack?.reference,
        accessCode: data.paystack?.access_code,
        authorizationUrl: data.paystack?.authorization_url,
        onSuccess: async (paystackRes) => {
          try {
            // Verify payment and record transaction
            const { data: verified } = await api.get(`/paystack/verify/${encodeURIComponent(paystackRes.reference)}`);
            clearCart();
            setCheckoutSuccess(verified.order || data.order);
          } catch (vErr) {
            console.error('Verification error:', vErr);
            clearCart();
            setCheckoutSuccess(data.order);
          } finally {
            setCheckoutLoading(false);
          }
        },
        onClose: () => {
          setCheckoutLoading(false);
          setCheckoutError('Payment window was closed. Your order was created in your account. You can complete payment at any time from your profile.');
        },
        onError: (pErr) => {
          setCheckoutLoading(false);
          setCheckoutError(pErr.message || 'Payment initialization failed.');
        }
      });
    } catch (err) {
      setCheckoutLoading(false);
      setCheckoutError(err.response?.data?.error || err.message || 'Failed to process order. Please try again.');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out text-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-base leading-tight">Your Cart</h2>
              <p className="text-slate-500 text-xs">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in bag
              </p>
            </div>
          </div>

          <button
            id="close-cart-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close Cart"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Step Progression (when checking out) */}
        {!checkoutSuccess && !authPrompt && items.length > 0 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className={checkoutStep === 'cart' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
              1. Review Bag
            </span>
            <span className="text-slate-300">→</span>
            <span className={checkoutStep === 'address' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
              2. Destination
            </span>
            <span className="text-slate-300">→</span>
            <span className={checkoutStep === 'payment' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
              3. Flexible Pay
            </span>
          </div>
        )}

        {/* ── Render Success Screen ── */}
        {checkoutSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-slate-900 font-display text-xl font-bold">Order Placed Successfully!</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                Your order is confirmed and currently being prepared for pickup and shipment.
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Order Reference</p>
                <p className="text-blue-600 text-sm font-mono font-bold">
                  #CRZ-{checkoutSuccess.id.toString().padStart(5, '0')}
                </p>
              </div>
            </div>

            <div className="w-full space-y-3 pt-4">
              <button
                onClick={() => {
                  onClose();
                  setCheckoutSuccess(null);
                  navigate('/profile');
                }}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 duration-200"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                View Order & Track Payments
              </button>
              <button
                onClick={() => {
                  onClose();
                  setCheckoutSuccess(null);
                }}
                className="w-full text-slate-500 hover:text-slate-900 text-xs font-semibold py-2 transition"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : authPrompt ? (
          /* ── Auth Required Screen ── */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-slate-900 font-display text-xl font-bold">Sign In Required</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                To check out and establish your installment schedule, please log in or create a free customer account.
              </p>
            </div>
            <div className="w-full space-y-3 pt-4">
              <button
                onClick={() => {
                  onClose();
                  navigate('/auth?redirect=/');
                }}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 duration-200"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign In / Register
              </button>
              <button
                onClick={() => setAuthPrompt(false)}
                className="w-full text-slate-500 hover:text-slate-900 text-xs font-semibold py-2 transition"
              >
                Return to Cart
              </button>
            </div>
          </div>
        ) : checkoutStep === 'address' ? (
          /* ── Step 2: Delivery & Pickup Address ── */
          <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckoutStep('cart')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div>
                  <h3 className="text-slate-900 font-bold text-base">Pickup & Delivery</h3>
                  <p className="text-slate-500 text-xs">Nationwide distribution across Ghana</p>
                </div>
              </div>

              {checkoutError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Region Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="drawer-region-select">
                    Region (Ghana)
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs appearance-none focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
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
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* District Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="drawer-district-select">
                    District / Municipality
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs appearance-none focus:outline-none focus:bg-white focus:border-blue-600 transition-colors disabled:opacity-40"
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
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* City / Town Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="drawer-pickup-location">
                    City / Town / Street Address
                  </label>
                  <input
                    className="block w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 transition-colors placeholder:text-slate-400"
                    id="drawer-pickup-location"
                    placeholder="e.g. East Legon, Spintex Road, Kumasi Adum..."
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                {/* Delivery & MoMo Mobile Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700" htmlFor="drawer-contact-phone">
                      Contact & MoMo Mobile Phone
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      🇬🇭 Ghana (+233)
                    </span>
                  </div>
                  <input
                    className="block w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:bg-white focus:border-blue-600 transition-colors placeholder:text-slate-400"
                    id="drawer-contact-phone"
                    placeholder="e.g. 024 123 4567 / 055 987 6543"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500">
                    Used for courier delivery coordination and Paystack Mobile Money payments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">local_shipping</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our dispatch team will coordinate delivery/pickup with you upon order confirmation.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Amount</span>
                <span className="text-slate-900 font-display font-bold text-lg">
                  GH₵ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <button
                id="proceed-to-payment-btn"
                onClick={handleProceedToPayment}
                disabled={!selectedRegion || !selectedDistrict || !city.trim()}
                className="w-full bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                <span>Continue to Flexible Payment</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : checkoutStep === 'payment' ? (
          /* ── Step 3: Flexible Deposit / Installment Step ── */
          <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckoutStep('address')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div>
                  <h3 className="text-slate-900 font-bold text-base">Payment Plan</h3>
                  <p className="text-slate-500 text-xs">Pay in full or deposit an initial fraction</p>
                </div>
              </div>

              {checkoutError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Order Total Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Full Order Total</span>
                  <span className="text-slate-900 font-bold font-display">
                    GH₵ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {parseFloat(amountToPay) > 0 && parseFloat(amountToPay) < totalPrice && (
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Remaining Balance</span>
                    <span className="text-blue-600 font-bold font-display">
                      GH₵ {(totalPrice - parseFloat(amountToPay)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700" htmlFor="payment-amount-input">
                  Amount Paying Now (GH₵)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">
                    GH₵
                  </span>
                  <input
                    id="payment-amount-input"
                    type="number"
                    min="0.01"
                    max={totalPrice}
                    step="0.01"
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(e.target.value)}
                    className="block w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                    placeholder={totalPrice.toFixed(2)}
                  />
                </div>

                {/* Quick-fill preset buttons */}
                <div className="flex gap-2 pt-1">
                  {[25, 50, 75, 100].map(pct => {
                    const val = (totalPrice * pct / 100);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAmountToPay(val.toFixed(2))}
                        className="flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 transition shadow-xs"
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Installment Info Callout */}
              <div className="flex items-start gap-2.5 bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">info</span>
                <p className="text-xs text-blue-950 leading-relaxed">
                  <strong className="text-blue-700">Flexible Installment:</strong> Paying an initial deposit secures your reservation. You can make ongoing partial payments directly from your account page anytime.
                </p>
              </div>

              {/* Payment Policy Rules Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-2.5">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">policy</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {paymentPolicy?.name || 'Payment & Hire Purchase Policy'}
                    </h4>
                    <p className="text-[10px] text-slate-500">Official rules governing this transaction</p>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Settlement Deadline:</strong> Remaining balance must be cleared within <strong className="text-slate-900">{paymentPolicy?.default_deadline_days || 14} days</strong> from order placement.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Grace Period & Penalty:</strong> A <strong className="text-slate-900">{paymentPolicy?.grace_period_days || 3}-day grace period</strong> applies. Overdue balances incur a <strong className="text-slate-900">{paymentPolicy?.default_penalty_pct || 10}% late penalty</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Ownership Transfer:</strong> Device ownership is officially released to customer upon <strong className="text-slate-900">100% full balance completion</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Cancellations:</strong> Cancellations requested before dispatch are subject to a <strong className="text-slate-900">{paymentPolicy?.default_cancel_fee_pct || 15}% administrative fee</strong>. Approved refunds processed within {paymentPolicy?.max_refund_days || 30} days.
                    </span>
                  </li>
                </ul>

                {/* Policy Agreement Checkbox */}
                <div className="pt-2.5 border-t border-slate-200">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                    <input
                      id="policy-agreement-checkbox"
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(e) => {
                        setPolicyAccepted(e.target.checked);
                        if (e.target.checked) setCheckoutError('');
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 font-semibold group-hover:text-blue-600 transition leading-snug">
                      I have read, understand, and agree to the Payment Policy and Hire Purchase terms above. <span className="text-rose-500">*</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <button
                id="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={checkoutLoading || !amountToPay || parseFloat(amountToPay) <= 0 || !policyAccepted}
                className="w-full bg-[#0ba4db] hover:bg-[#0991c2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <span>Connecting Secure Paystack Checkout...</span>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>
                      Pay GH₵ {parseFloat(amountToPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via Paystack
                    </span>
                  </div>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 py-1">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  MTN MoMo
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-600">Telecel Cash</span>
                <span>•</span>
                <span className="font-semibold text-slate-600">AirtelTigo</span>
                <span>•</span>
                <span className="font-semibold text-slate-600">Debit Card</span>
              </div>

              {!policyAccepted && (
                <p className="text-[11px] text-center text-slate-400">
                  Please tick the policy agreement checkbox above to enable payment
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ── Step 1: Cart Items List ── */
          <>
            {/* Suspension warning banner */}
            {suspendedWarnings.length > 0 && (
              <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <div className="flex items-start gap-2 text-amber-800 mb-2">
                  <WarningIcon />
                  <p className="text-xs font-semibold leading-snug">
                    {suspendedWarnings.length} item{suspendedWarnings.length > 1 ? 's were' : ' was'} removed
                    because {suspendedWarnings.length > 1 ? 'they are' : "it's"} no longer available:
                  </p>
                </div>
                <ul className="space-y-0.5 pl-6 text-xs text-amber-800/80 list-disc">
                  {suspendedWarnings.map((w) => (
                    <li key={w.id}>{w.name}</li>
                  ))}
                </ul>
                <button
                  onClick={clearWarnings}
                  className="mt-2 text-xs text-amber-700 font-semibold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Validating indicator */}
            {validating && (
              <div className="flex items-center gap-2 px-6 py-2.5 text-slate-500 text-xs border-b border-slate-200 bg-slate-50">
                <SpinnerIcon />
                <span>Checking latest availability...</span>
              </div>
            )}

            {/* Error banner */}
            {checkoutError && (
              <div className="mx-4 mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-xs">
                {checkoutError}
              </div>
            )}

            {/* Items scroll area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 && !validating ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <EmptyCartIcon />
                  <div>
                    <p className="text-slate-900 font-bold text-base">Your bag is empty</p>
                    <p className="text-slate-500 text-xs mt-1">Explore our catalog and add devices to start.</p>
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

            {/* Cart Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-200 px-6 py-5 space-y-4 bg-white">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Price</span>
                  <span className="text-slate-900 font-display font-bold text-xl">
                    GH₵ {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  id="checkout-btn"
                  onClick={handleProceedToCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                >
                  <span>Proceed to Delivery & Checkout</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  id="clear-cart-btn"
                  onClick={clearCart}
                  className="w-full text-slate-400 hover:text-rose-600 text-xs font-medium transition py-1 text-center"
                >
                  Empty Bag
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
    <div className="flex gap-3 bg-white border border-slate-200 rounded-2xl p-3.5 hover:border-slate-300 transition shadow-xs">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100 p-1 flex items-center justify-center">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 text-xs font-semibold truncate leading-snug">{item.name}</p>
        <p className="text-slate-500 text-[10px] font-mono mt-0.5">{item.unique_code}</p>
        <p className="text-slate-900 text-xs font-bold mt-1 font-display">
          GH₵ {(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end justify-between gap-1">
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 transition p-1"
          title="Remove item"
        >
          <TrashIcon />
        </button>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
          <button
            onClick={() => onQtyChange(item.qty - 1)}
            className="text-slate-500 hover:text-slate-900 w-4 text-center font-bold text-xs transition"
          >
            −
          </button>
          <span className="text-slate-900 text-xs font-semibold w-5 text-center">{item.qty}</span>
          <button
            onClick={() => onQtyChange(item.qty + 1)}
            className="text-slate-500 hover:text-slate-900 w-4 text-center font-bold text-xs transition"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
