import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [flash, setFlash] = useState(false);

  function handleAdd(e) {
    e.stopPropagation(); // prevent clicking through if we add link wrapper later
    addItem(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  function handleNavigate(e) {
    if (e.target.closest('button')) return;
    window.location.href = `/product/${product.id}`;
  }

  return (
    <div
      className="min-w-[200px] bg-surface-container-low rounded-2xl p-3 snap-center relative group cursor-pointer flex flex-col justify-between"
      onClick={handleNavigate}
    >
      <button
        onClick={handleAdd}
        className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full transition-colors
          ${flash ? 'text-primary bg-primary-container' : 'text-secondary hover:text-primary'}`}
        title="Add to cart"
      >
        <span className="material-symbols-outlined text-[20px]">
          {flash ? 'check' : 'add_shopping_cart'}
        </span>
      </button>

      <div className="w-full aspect-square rounded-xl bg-white mb-3 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="space-y-1">
        <h3 className="font-label-lg text-on-surface line-clamp-2" title={product.name}>
          {product.name}
        </h3>
        <p className="text-[10px] text-on-surface-variant truncate">{product.unique_code}</p>
        <div className="flex gap-2 justify-center items-center pt-1">
          <span className="font-price-display text-price-display text-on-surface text-center">
            GH₵ {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
