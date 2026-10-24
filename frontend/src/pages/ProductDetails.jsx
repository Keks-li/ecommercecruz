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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
        <Navbar onCartClick={() => setCartOpen(true)} />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
            <div className="w-full aspect-square bg-slate-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded-md w-1/3" />
              <div className="h-10 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
              <div className="h-32 bg-slate-200 rounded-2xl w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
        <Navbar onCartClick={() => setCartOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
          <p className="text-slate-500 text-sm max-w-md">{error || 'This device may be suspended or no longer listed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs transition"
          >
            Return to Store
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discount_pct && Number(product.discount_pct) > 0;
  const effectivePrice = hasDiscount
    ? Number((product.price * (1 - product.discount_pct / 100)).toFixed(2))
    : product.price;

  const minDepositPct = product.payment_rule?.min_deposit_pct || 20;
  const minDepositAmount = Number((effectivePrice * (minDepositPct / 100)).toFixed(2));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <Navbar onCartClick={() => setCartOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span>
            Home
          </Link>
          <span className="text-slate-300">/</span>
          {product.category && (
            <>
              <Link 
                to={`/category/${product.category.toLowerCase()}`}
                className="hover:text-blue-600 transition-colors capitalize"
              >
                {product.category}
              </Link>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: Image Showcase */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-white border border-slate-200 p-8 flex items-center justify-center overflow-hidden shadow-sm group">
              <img
                src={optimizeCloudinaryUrl(product.image_url, 800)}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Type Badge */}
              <div className="absolute top-5 left-5 flex gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border shadow-xs uppercase tracking-wider ${
                  product.type === 'COMBO'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {product.type === 'COMBO' ? 'Combo' : 'Single'}
                </span>
              </div>

              {/* Status Badge */}
              <div className="absolute top-5 right-5">
                {isOutOfStock ? (
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold tracking-wider uppercase">
                    Out of Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    In Stock ({product.stock})
                  </span>
                )}
              </div>
            </div>

            {/* Micro Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center space-y-1 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">verified</span>
                <p className="text-[11px] font-bold text-slate-900">Genuine</p>
                <p className="text-[9px] text-slate-500">100% Authentic</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center space-y-1 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">local_shipping</span>
                <p className="text-[11px] font-bold text-slate-900">Nationwide</p>
                <p className="text-[9px] text-slate-500">Fast Ghana Pickup</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center space-y-1 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">security</span>
                <p className="text-[11px] font-bold text-slate-900">Protected</p>
                <p className="text-[9px] text-slate-500">Verified Platform</p>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing, & Actions */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Title & Category */}
            <div className="space-y-2">
              {product.category && (
                <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
                  {product.category}
                </span>
              )}
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Price</p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      <span className="text-sm font-semibold text-slate-500 mr-1">GH₵</span>
                      {Number(effectivePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        GH₵ {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        -{Math.round(product.discount_pct)}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                    Hire Purchase Eligible
                  </span>
                </div>
              </div>

              {/* Installment Callout */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5">credit_score</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">Pay in installments:</strong> You can pay any initial amount today. An initial deposit of at least <strong className="text-blue-700">{minDepositPct}% (GH₵ {minDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</strong> is recommended to secure and prioritize your device reservation.
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Overview & Specifications</h3>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-sm">
                {product.description || 'No detailed description provided for this device.'}
              </div>
            </div>

            {/* Quantity Selector & Purchase Actions */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    disabled={qty <= 1 || isOutOfStock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">{qty}</span>
                  <button
                    onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                    disabled={qty >= product.stock || isOutOfStock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  id="addToCartBtn"
                  onClick={() => handleAddToCart(false)}
                  disabled={isOutOfStock || addingToCart}
                  className="py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm tracking-wide border border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 duration-200 disabled:opacity-50 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {addingToCart ? 'sync' : 'add_shopping_cart'}
                  </span>
                  <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={isOutOfStock}
                  className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 duration-200 disabled:opacity-50 shadow-sm group/btn"
                >
                  <span className="material-symbols-outlined text-[20px] text-amber-400 group-hover/btn:scale-110 transition-transform">bolt</span>
                  <span>Pay Now (Full Amount)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={closeCart} />

      {/* Toast Notification */}
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
          onClick={() => {
            setAddedToast(false);
            setCartOpen(true);
          }}
          className="ml-2 text-xs font-bold text-blue-400 hover:underline"
        >
          View Cart
        </button>
      </div>

      <Footer />
    </div>
  );
}
