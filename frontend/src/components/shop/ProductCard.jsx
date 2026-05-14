import { useState } from 'react';
import { useCart } from '../../context/CartContext';

function StarIcon({ filled }) {
  return (
    <svg className={`w-3 h-3 ${filled ? 'text-yellow-500' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
  );
}

export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const [flash, setFlash] = useState(false);

  const inCart = items.some((i) => i.id === product.id);

  function handleAdd() {
    addItem(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  // Calculate a mock discount for the badge
  const discount = Math.floor(Math.random() * 20) + 10;
  const originalPrice = product.price * (1 + discount / 100);

  return (
    <article className="group flex flex-col bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden hover:border-yellow-500/30 transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-square bg-white flex items-center justify-center p-6 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Discount Badge */}
        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded">
          -{discount}%
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="space-y-2">
           <div className="flex items-center gap-1">
             {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= 4} />)}
             <span className="text-[10px] text-white/20 ml-1">(128)</span>
           </div>
           
           <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-yellow-500 transition-colors">
             {product.name}
           </h3>
           
           <div className="flex items-center gap-2">
             <span className="text-white font-black text-lg tracking-tighter">
               ₦{Number(product.price).toLocaleString('en-NG')}
             </span>
             <span className="text-white/20 text-xs line-through font-bold">
               ₦{Number(originalPrice).toLocaleString('en-NG')}
             </span>
           </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all
            ${flash
              ? 'bg-emerald-500 text-white'
              : 'bg-[#0a0a0a] border border-white/10 text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          {flash ? 'Added to Bag!' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
