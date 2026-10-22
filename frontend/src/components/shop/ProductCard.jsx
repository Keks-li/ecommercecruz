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
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (product.stock !== undefined && product.stock !== null && product.stock <= 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(`/product/${product.id}`);
  };

  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      {/* Top Tag & Quick Add */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1 min-w-0">
          <span
            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase border ${
              product.type === 'COMBO'
                ? 'text-purple-700 bg-purple-50 border-purple-200'
                : 'text-slate-700 bg-slate-100 border-slate-200'
            }`}
          >
            {product.type === 'COMBO' ? 'Combo' : 'Single'}
          </span>
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
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90 shadow-2xs shrink-0 ${
            added
              ? 'bg-emerald-600 text-white'
              : isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-blue-600 text-white'
          }`}
          title={isOutOfStock ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
        >
          <span className="material-symbols-outlined text-[17px]">
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
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
          <div>
            <p className="font-display text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
              <span className="text-[10px] font-medium text-slate-500 mr-0.5">GH₵</span>
              {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 justify-end bg-blue-50 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Installment</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
