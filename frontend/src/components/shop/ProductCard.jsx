import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const optimizeCloudinaryUrl = (url, width = 400) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
};

export default function ProductCard({ product, className = '' }) {
  const { addItem, payNow } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (product.stock !== undefined && product.stock !== null && product.stock <= 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handlePayNow = (e) => {
    e.stopPropagation();
    if (product.stock !== undefined && product.stock !== null && product.stock <= 0) return;
    payNow(product);
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(`/product/${product.id}`);
  };

  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;
  const hasDiscount = product.discount_pct && Number(product.discount_pct) > 0;
  const effectivePrice = hasDiscount
    ? Number((product.price * (1 - product.discount_pct / 100)).toFixed(2))
    : product.price;

  const minDepositPct = product.payment_rule?.min_deposit_pct || 20;
  const minDepositAmount = Number((effectivePrice * (minDepositPct / 100)).toFixed(2));

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      {/* Top Tag & Quick Add */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          <span
            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase border ${
              product.type === 'COMBO'
                ? 'text-purple-700 bg-purple-50 border-purple-200'
                : 'text-slate-700 bg-slate-100 border-slate-200'
            }`}
          >
            {product.type === 'COMBO' ? 'Combo' : 'Single'}
          </span>
          {hasDiscount && (
            <span className="text-[10px] font-extrabold tracking-tight px-1.5 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs">
              -{Math.round(product.discount_pct)}% OFF
            </span>
          )}
          {product.category && (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-md capitalize truncate max-w-[80px]">
              {product.category}
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90 shadow-2xs shrink-0 ${
            added
              ? 'bg-emerald-600 text-white'
              : isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title={isOutOfStock ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {added ? 'check' : isOutOfStock ? 'block' : 'add'}
          </span>
        </button>
      </div>

      {/* Image Showcase (Compact) */}
      <div className="w-full aspect-square rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-center p-3 mb-2.5 overflow-hidden relative">
        <img
          src={optimizeCloudinaryUrl(product.image_url, 400)}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-250"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-2xs flex items-center justify-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1.5 mt-auto">
        <h3 
          className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1 transition-colors leading-tight"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Price and Hire purchase */}
        <div className="pt-1.5 border-t border-slate-100 space-y-1">
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <p className="font-display text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                <span className="text-[10px] font-medium text-slate-500 mr-0.5">GH₵</span>
                {Number(effectivePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {hasDiscount && (
                <span className="text-[10px] text-slate-400 line-through">
                  GH₵{Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <span className="text-[9px] text-blue-600 font-semibold flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Installment</span>
            </span>
          </div>

          <p className="text-[9px] text-slate-500 font-medium">
            Flexible installments · <span className="text-blue-700 font-semibold">{minDepositPct}% deposit</span> recommended to secure
          </p>
        </div>

        {/* Pay Now Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePayNow}
            disabled={isOutOfStock}
            className="w-full h-8 sm:h-8.5 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold transition-all duration-150 active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5 group/pay"
            title={isOutOfStock ? 'Out of stock' : 'Pay full amount now'}
          >
            <span className="material-symbols-outlined text-[15px] text-amber-400 group-hover/pay:scale-110 transition-transform">bolt</span>
            <span>Pay Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
