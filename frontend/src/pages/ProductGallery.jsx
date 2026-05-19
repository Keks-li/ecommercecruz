import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/shop/ProductCard';
import CartDrawer from '../components/shop/CartDrawer';
import { useCart } from '../context/CartContext';

function SkeletonCard() {
  return (
    <div className="min-w-[200px] bg-surface-container-low rounded-2xl p-3 snap-center relative group animate-pulse">
      <div className="w-full aspect-square rounded-xl bg-surface-container mb-3 overflow-hidden"></div>
      <div className="space-y-1">
        <div className="h-4 bg-surface-container rounded w-3/4"></div>
        <div className="h-4 bg-surface-container rounded w-1/2"></div>
        <div className="flex gap-2 justify-center items-center mt-2">
          <div className="h-6 bg-surface-container rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
}

export default function ProductGallery() {
  const { products, loading, error } = useProducts();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { totalItems } = useCart();

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.unique_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  return (
    <>
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background flex justify-between items-center px-margin-page py-stack-md w-full">
        <div className="flex items-center gap-stack-sm">
          <div className="flex items-center">
            <span className="font-price-display text-xl font-bold uppercase tracking-tight">
              CRUZARO<span className="text-[#c7e74c]">.</span>
            </span>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors active:opacity-80 active:scale-95 duration-150">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="mt-20 px-margin-page space-y-stack-lg">
        {/* Search Bar */}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
          <input
            className="w-full py-4 pl-12 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary-container font-body-md text-on-surface placeholder:text-secondary-fixed-dim transition-all"
            placeholder="Search the entire shop"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-container rounded-lg text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
          </button>
        </div>

        {/* Categories Section */}
        <section className="space-y-stack-md">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile">Categories</h2>
            <button className="flex items-center gap-1 text-label-lg font-label-lg text-secondary hover:text-primary transition-colors">
              See all <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-gutter-grid">
            <div className="flex flex-col items-center gap-stack-sm group cursor-pointer">
              <div className="w-full aspect-square bg-surface-container-low rounded-xl flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-secondary group-hover:text-on-primary-container">smartphone</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Phones</span>
            </div>
            <div className="flex flex-col items-center gap-stack-sm group cursor-pointer">
              <div className="w-full aspect-square bg-surface-container-low rounded-xl flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-secondary group-hover:text-on-primary-container">videogame_asset</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Consoles</span>
            </div>
            <div className="flex flex-col items-center gap-stack-sm group cursor-pointer">
              <div className="w-full aspect-square bg-surface-container-low rounded-xl flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-secondary group-hover:text-on-primary-container">laptop_mac</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Laptops</span>
            </div>
            <div className="flex flex-col items-center gap-stack-sm group cursor-pointer">
              <div className="w-full aspect-square bg-surface-container-low rounded-xl flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-secondary group-hover:text-on-primary-container">photo_camera</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface">Cameras</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-error-container/10 border border-error-container/20 rounded-xl p-4 text-error text-sm mb-10">
            {error}
          </div>
        )}

        {/* Single Items Section */}
        <section className="space-y-stack-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-stack-md">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile">Single Items</h2>
            </div>
            <button className="flex items-center gap-1 text-label-lg font-label-lg text-secondary hover:text-primary transition-colors">
              See all <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex gap-gutter-grid overflow-x-auto pb-4 -mx-margin-page px-margin-page snap-x">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 w-full">
                <p className="text-secondary font-medium">No products found</p>
              </div>
            ) : (
              filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>

        {/* Combos Section (Re-using products for demo) */}
        <section className="space-y-stack-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-stack-md">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile">Combos</h2>
            </div>
            <button className="flex items-center gap-1 text-label-lg font-label-lg text-secondary hover:text-primary transition-colors">
              See all <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex gap-gutter-grid overflow-x-auto pb-4 -mx-margin-page px-margin-page snap-x">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 w-full">
                <p className="text-secondary font-medium">No products found</p>
              </div>
            ) : (
              // Reversing to make it look a bit different
              [...filtered].reverse().map((product) => (
                <ProductCard key={`combo-${product.id}`} product={product} />
              ))
            )}
          </div>
        </section>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center py-stack-sm bg-white border-t border-outline-variant rounded-t-xl shadow-lg">
        <a className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary-container transition-colors active:scale-110 duration-200" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>home</span>
          <span className="font-label-md text-label-md">Home</span>
        </a>
        <a className="flex flex-col items-center justify-center text-secondary hover:text-primary-container transition-colors active:scale-110 duration-200" href="#">
          <span className="material-symbols-outlined">search</span>
          <span className="font-label-md text-label-md">Catalog</span>
        </a>
        <button
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center justify-center text-secondary relative hover:text-primary-container transition-colors active:scale-110 duration-200"
        >
          {totalItems > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-container text-[10px] flex items-center justify-center rounded-full text-on-primary-container font-bold">
              {totalItems}
            </div>
          )}
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-label-md text-label-md">Cart</span>
        </button>
        <a className="flex flex-col items-center justify-center text-secondary hover:text-primary-container transition-colors active:scale-110 duration-200" href="#">
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-md text-label-md">Profile</span>
        </a>
      </nav>
    </>
  );
}
