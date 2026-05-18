import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/shop/ProductCard';
import CartDrawer from '../components/shop/CartDrawer';
import Navbar from '../components/shop/Navbar';
import Hero from '../components/shop/Hero';
import CategoryBar from '../components/shop/CategoryBar';
import PromoBanners from '../components/shop/PromoBanners';
import Footer from '../components/shop/Footer';

function SkeletonCard() {
  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden group min-w-[80vw] snap-center animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-sm space-y-base">
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="h-10 bg-white/5 rounded w-full mt-2" />
      </div>
    </div>
  );
}

export default function ProductGallery() {
  const { products, loading, error } = useProducts();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.unique_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  return (
    <>
      <Navbar search={search} setSearch={setSearch} onCartClick={() => setCartOpen(true)} />
      
      <main className="w-full">
        <Hero />
        <CategoryBar />
        <PromoBanners />

        <section className="px-margin-mobile py-lg space-y-md">
          <div className="flex flex-row gap-md overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            <h3 className="font-headline-md text-headline-md-mobile">Single Products</h3>
            <span className="text-primary-container font-label-bold text-label-bold flex items-center gap-xs cursor-pointer">View All <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
          </div>

          {error && (
            <div className="bg-error-container/10 border border-error-container/20 rounded-xl p-4 text-error text-sm mb-10">
              {error}
            </div>
          )}

          <div className="flex flex-row gap-md overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 w-full rounded-3xl border border-outline-variant">
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">No products found matching your search</p>
              </div>
            ) : (
              filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <nav className="md:hidden bg-surface-container dark:bg-surface-container border-t border-outline-variant shadow-lg docked full-width bottom-0 fixed z-50">
        <div className="flex justify-around items-center px-4 py-2">
          <button className="flex flex-col items-center gap-1 text-primary-container">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">category</span>
            <span className="text-[10px] font-bold">Categories</span>
          </button>
          <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="text-[10px] font-bold">Cart</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </div>
      </nav>
    </>
  );
}
