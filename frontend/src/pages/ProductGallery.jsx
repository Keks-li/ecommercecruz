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
    <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden animate-pulse min-w-[80vw] md:min-w-[300px] snap-center">
      <div className="aspect-square bg-white/5" />
      <div className="p-sm space-y-4">
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
    <div className="min-h-screen bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
      <Navbar setCartOpen={setCartOpen} search={search} setSearch={setSearch} />
      
      <main className="w-full">
        <Hero />
        <CategoryBar />
        <PromoBanners />

        {/* Product Feed */}
        <section className="px-margin-mobile py-lg space-y-md">
          <div className="flex flex-row justify-between items-center gap-md pb-4">
            <h3 className="font-headline-md text-headline-md-mobile">Single Products</h3>
            <span className="text-primary-container font-label-bold text-label-bold flex items-center gap-xs cursor-pointer">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container border border-error rounded-xl p-4 text-sm mb-10">
              {error}
            </div>
          )}

          <div className="flex flex-row gap-md overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="w-full text-center py-20 bg-surface-container rounded-3xl border border-outline-variant">
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
    </div>
  );
}
