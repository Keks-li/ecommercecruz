import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [flash, setFlash] = useState(false);

  function handleAdd() {
    addItem(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden group min-w-[80vw] sm:min-w-[300px] snap-center">
      <div className="aspect-square relative overflow-hidden bg-white/5">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded font-bold">NEW</div>
      </div>
      <div className="p-sm space-y-base">
        <h5 className="text-label-bold font-label-bold truncate">{product.name}</h5>
        <p className="text-[12px] text-on-surface-variant line-clamp-1">{product.unique_code || 'Premium Appliance'}</p>
        <div className="font-price-display text-price-display text-primary-container">
          ₦{Number(product.price).toLocaleString('en-NG')}
        </div>
        <button
          onClick={handleAdd}
          className={`w-full mt-xs py-2 border border-outline rounded-lg text-label-bold transition-colors active:scale-95 ${
            flash ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-surface-container-highest'
          }`}
        >
          {flash ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
