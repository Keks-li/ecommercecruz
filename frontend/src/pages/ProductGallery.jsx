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
    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-5 space-y-4">
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

  const brands = ['Samsung', 'LG', 'Panasonic', 'Whirlpool', 'Bosch', 'IFB'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500 selection:text-black">
      <Navbar search={search} setSearch={setSearch} />
      
      <main>
        <Hero />
        <CategoryBar />
        <PromoBanners />

        {/* Best Sellers / Product Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Our Top Picks</span>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Best Sellers</h2>
            </div>
            <a href="#" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-yellow-500 transition-colors flex items-center gap-2 group">
              View All Products
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-sm mb-10">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No products found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Brand Slider (Static) */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
           <div className="flex justify-between items-center opacity-20 grayscale">
              {brands.map(brand => (
                <span key={brand} className="text-3xl font-black uppercase tracking-tighter italic">{brand}</span>
              ))}
           </div>
        </section>

        {/* Feature Highlights */}
        <section className="bg-white/5 py-10 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
             {[
               { title: 'Free Delivery', desc: 'On orders over ₦50,000', icon: '🚚' },
               { title: 'Easy Returns', desc: 'Within 7 days', icon: '🔄' },
               { title: '2 Year Warranty', desc: 'On most products', icon: '🛡️' },
               { title: '24/7 Support', desc: 'Dedicated support', icon: '🎧' },
             ].map(item => (
               <div key={item.title} className="flex items-center gap-4">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{item.title}</h4>
                    <p className="text-[9px] text-white/40 font-bold uppercase mt-0.5">{item.desc}</p>
                  </div>
               </div>
             ))}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
