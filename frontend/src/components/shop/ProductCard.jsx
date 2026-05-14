import { useState } from 'react';
import { useCart } from '../../context/CartContext';

function CartPlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * ProductCard — displays a single active product with image, name, price,
 * unique code, and an Add-to-Cart button with a brief "Added!" flash.
 */
export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const [flash, setFlash] = useState(false);

  const inCart = items.some((i) => i.id === product.id);

  function handleAdd() {
    addItem(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  return (
    <article className="group relative flex flex-col bg-slate-900/70 border border-slate-700/50
      rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-slate-600/70
      transition-all duration-300 hover:-translate-y-1">

      {/* ── Image ── */}
      <div className="relative overflow-hidden aspect-[4/3] bg-slate-800">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Unique code badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10
          text-white/80 text-[10px] font-mono px-2.5 py-1 rounded-lg tracking-widest">
          {product.unique_code}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex-1">
          <h2 className="text-white font-semibold text-base leading-snug line-clamp-2 mb-1">
            {product.name}
          </h2>
          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-700/50">
          <span className="text-indigo-400 font-bold text-lg tracking-tight">
            ₦{Number(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>

          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAdd}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
              transition-all duration-200 active:scale-95
              ${flash
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              }`}
          >
            {flash ? <CheckIcon /> : <CartPlusIcon />}
            {flash ? 'Added!' : inCart ? 'Add More' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
