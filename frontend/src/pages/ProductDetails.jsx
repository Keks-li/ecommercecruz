import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import Navbar from '../components/shop/Navbar';
import CartDrawer from '../components/shop/CartDrawer';
import Footer from '../components/shop/Footer';

const optimizeCloudinaryUrl = (url, width = 800) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, payNow, cartOpen, setCartOpen, closeCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = (isPayNow = false) => {
    if (!product || product.stock <= 0) return;
    setAddingToCart(true);

    if (isPayNow) {
      // Add items and trigger Pay Now
      for (let i = 0; i < qty; i++) {
        addItem(product);
      }
      setTimeout(() => {
        setAddingToCart(false);
        payNow(product);
      }, 300);
      return;
    }

    // Standard add to cart
    for (let i = 0; i < qty; i++) {
      addItem(product);
    }

    setTimeout(() => {
      setAddingToCart(false);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar onCartClick={() => setCartOpen(true)} />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
            <div className="w-full aspect-square bg-slate-200 rounded-3xl" />
            <div className="space-y-5 pt-2">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-9 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-7 bg-slate-200 rounded-lg w-1/3" />
              <div className="h-28 bg-slate-200 rounded-2xl w-full" />
              <div className="h-12 bg-slate-200 rounded-2xl w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar onCartClick={() => setCartOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
          <p className="text-slate-500 text-sm max-w-md">{error || 'This item may be suspended or no longer listed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-sm transition"
          >
            Return to Store
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const discountPct = (product.discount_pct !== undefined && product.discount_pct !== null)
    ? Number(product.discount_pct)
    : 5;
  const hasDiscount = discountPct > 0;
  const effectivePrice = hasDiscount
    ? Number((product.price * (1 - discountPct / 100)).toFixed(2))
    : product.price;

  const minDepositPct = product.payment_rule?.min_deposit_pct || 20;
  const minDepositAmount = Number((product.price * qty * (minDepositPct / 100)).toFixed(2));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <Navbar onCartClick={() => setCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
          <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">home</span>
            <span>Home</span>
          </Link>
          {product.category && (
            <>
              <span className="text-slate-300">/</span>
              <Link
                to={`/category/${product.category.toLowerCase()}`}
                className="hover:text-blue-600 transition-colors capitalize"
              >
                {product.category}
              </Link>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* ── Left: Image panel ── */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden group flex items-center justify-center p-8">
              <img
                src={optimizeCloudinaryUrl(product.image_url, 800)}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-[1.04] transition-transform duration-300 ease-out"
              />

              {/* Type chip */}
              <span className={`absolute top-4 left-4 text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-xs ${
                product.type === 'COMBO'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {product.type === 'COMBO' ? 'Combo' : 'Single'}
              </span>

              {/* Stock chip */}
              <span className={`absolute top-4 right-4 text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500' }`} />
                {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
              </span>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: 'verified',        label: 'Genuine',    sub: '100% Authentic'    },
                { icon: 'local_shipping',  label: 'Nationwide', sub: 'Fast Ghana Pickup' },
                { icon: 'security',        label: 'Secure',     sub: 'Verified Platform' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-2xl px-3 py-3.5 flex flex-col items-center gap-1.5 shadow-xs">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">{icon}</span>
                  <p className="text-[11px] font-bold text-slate-800 leading-none">{label}</p>
                  <p className="text-[10px] text-slate-400 leading-none text-center">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Details panel ── */}
          <div className="space-y-6">

            {/* Product identity */}
            <div>
              {product.category && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 mb-1.5">{product.category}</p>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">

              {/* Price row + qty selector */}
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Price</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
                      <span className="text-base font-semibold text-slate-400 mr-0.5">GH₵</span>
                      {Number(product.price * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      Installment
                    </span>
                  </div>
                </div>

                {/* Qty selector */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shrink-0">
                  <button
                    onClick={() => setQty((p) => Math.max(1, p - 1))}
                    disabled={qty <= 1 || isOutOfStock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="w-9 text-center font-bold text-sm text-slate-900">{qty}</span>
                  <button
                    onClick={() => setQty((p) => Math.min(product.stock, p + 1))}
                    disabled={qty >= product.stock || isOutOfStock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              {/* Installment callout */}
              <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-200/60 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0 mt-0.5">payments</span>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Pay by installment:</span>{' '}
                  Spread payments across flexible deposits. An initial deposit of{' '}
                  <span className="font-bold text-blue-700">
                    {minDepositPct}% (GH₵ {minDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>{' '}
                  is recommended to secure your reservation.
                </p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Overview</h2>
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line shadow-xs">
                  {product.description}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="addToCartBtn"
                onClick={() => handleAddToCart(false)}
                disabled={isOutOfStock || addingToCart}
                className="py-4 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {addingToCart ? 'sync' : 'add_shopping_cart'}
                </span>
                <span>{addingToCart ? 'Adding…' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={() => handleAddToCart(true)}
                disabled={isOutOfStock}
                className="py-4 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-between gap-2 shadow-xs disabled:opacity-50 overflow-hidden group/pay"
                title={isOutOfStock ? 'Out of stock' : 'Pay full amount now'}
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-amber-400 group-hover/pay:scale-110 transition-transform">bolt</span>
                  <span>Pay Now</span>
                </div>
                <span className="font-mono tabular-nums text-emerald-400 font-extrabold text-sm shrink-0">
                  GH₵ {Number(effectivePrice * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </button>
            </div>

            {/* Pay Now discount note */}
            {hasDiscount && !isOutOfStock && (
              <p className="text-[11px] text-slate-400 text-center">
                <span className="material-symbols-outlined text-[13px] align-middle mr-0.5 text-amber-500">bolt</span>
                Pay Now saves you <span className="font-bold text-slate-600">{discountPct}%</span> — GH₵{' '}
                {Number((product.price - effectivePrice) * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} off
              </p>
            )}

          </div>
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={closeCart} />

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          addedToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
        <div className="text-xs">
          <p className="font-bold">{qty} × {product.name} added</p>
          <p className="text-slate-400">Cart updated successfully</p>
        </div>
        <button
          onClick={() => { setAddedToast(false); setCartOpen(true); }}
          className="ml-2 text-xs font-bold text-blue-400 hover:underline"
        >
          View Cart
        </button>
      </div>

      <Footer />
    </div>
  );
}
