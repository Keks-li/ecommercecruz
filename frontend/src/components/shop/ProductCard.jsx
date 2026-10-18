import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product, className = '' }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (product.stock !== undefined && product.stock !== null && product.stock <= 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(`/product/${product.id}`);
  };

  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-1 ${className}`}
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            {product.unique_code}
          </span>
          {product.type === 'COMBO' ? (
            <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md uppercase">
              Bundle
            </span>
          ) : product.category ? (
            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md capitalize truncate max-w-[80px]">
              {product.category}
            </span>
          ) : null}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm ${
            added
              ? 'bg-emerald-600 text-white'
              : isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-blue-600 text-white'
          }`}
          title={isOutOfStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
        >
          <span className="material-symbols-outlined text-[19px]">
            {added ? 'check' : isOutOfStock ? 'block' : 'add_shopping_cart'}
          </span>
        </button>
      </div>

      {/* Image Showcase */}
      <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-4 mb-4 overflow-hidden relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-widest bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2 mt-auto">
        <h3 
          className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-2 transition-colors leading-snug min-h-[2.5rem]"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Price and Stock Indicator */}
        <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Price</p>
            <p className="font-display text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              GH₵ {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Hire purchase</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {product.stock > 0 ? `${product.stock} in stock` : 'Restocking soon'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
