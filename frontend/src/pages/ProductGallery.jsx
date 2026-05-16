import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/shop/ProductCard';
import CartDrawer from '../components/shop/CartDrawer';

function SkeletonCard() {
  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden min-w-[80vw] sm:min-w-[300px] snap-center animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-sm space-y-4">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="h-5 bg-white/5 rounded w-1/2" />
        <div className="h-10 bg-white/5 rounded w-full mt-2" />
      </div>
    </div>
  );
}

export default function ProductGallery() {
  const { products, loading, error } = useProducts();
  const { totalItems } = useCart();
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
      {/* TopAppBar */}
      <header className="bg-background dark:bg-background border-b border-outline-variant shadow-sm docked full-width top-0 sticky z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-max-width mx-auto">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-on-surface hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer">menu</span>
            <h1 className="font-headline-md text-headline-md-mobile font-bold text-primary-container dark:text-primary-fixed-dim tracking-tight">CruzaroEnt</h1>
          </div>
          <div className="flex items-center gap-xs">
            <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-on-surface">shopping_cart</span>
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary-container text-on-primary-container text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* Hero Section: Product of the Month */}
        <section className="relative w-full aspect-[4/5] md:aspect-[16/7] overflow-hidden flex flex-col justify-end p-margin-mobile">
          <div className="absolute inset-0 z-0">
            <img className="w-full h-full object-cover" alt="Hero" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwc2_asPlkgdzH3jCggNFLfQynqLpsvK3s4BbVKRgBtfki_OVfymUIiBUHYZQE80X9wkh4eK9tVpz_UQ5Ci7dY-0ITtsDYJrMqZZ8SozxudqGYePNnANGqGGB_a6UfAivWeaJtAbN2NQPeaDlYU2MvXWQgVi7f6QTI-oWlJN1jj19DoIhidW7jQoHshgH8BWffbgN1ppYfcdG4sqsqihFvlY8wiScA7KkgepGPExPHADHUb1pdwB9GShj00pEm75bw3XHo7XvW9uA" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
          <div className="relative z-10 space-y-sm max-w-lg">
            <span className="inline-block px-3 py-1 bg-primary-container text-on-primary-container font-label-bold text-label-bold rounded-lg uppercase tracking-wider">OWN IT WITHOUT PAYING UPFRONT</span>
            <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-background">Powering Your Everyday Brilliance with Hire Purchase</h2>
            <p className="font-body-md text-body-md text-on-surface-variant opacity-90">You got not money?! No Probel, Just pay in bit and get your dream product.</p>
            <div className="pt-sm">
              <button className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-label-bold text-label-bold hover:brightness-95 transition-all active:scale-95 shadow-lg flex items-center gap-xs">
                Shop Now <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Category Quick Access */}
        <section className="px-margin-mobile py-lg overflow-x-auto no-scrollbar">
          <div className="flex gap-md min-w-max">
            <div className="flex flex-col items-center gap-xs group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-highest transition-colors border border-outline-variant">
                <span className="material-symbols-outlined text-primary-container">kitchen</span>
              </div>
              <span className="text-label-bold font-label-bold">Refrigerators</span>
            </div>
            <div className="flex flex-col items-center gap-xs group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-highest transition-colors border border-outline-variant">
                <span className="material-symbols-outlined text-primary-container">local_laundry_service</span>
              </div>
              <span className="text-label-bold font-label-bold">Washing</span>
            </div>
            <div className="flex flex-col items-center gap-xs group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-highest transition-colors border border-outline-variant">
                <span className="material-symbols-outlined text-primary-container">ac_unit</span>
              </div>
              <span className="text-label-bold font-label-bold">AC Units</span>
            </div>
            <div className="flex flex-col items-center gap-xs group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-highest transition-colors border border-outline-variant">
                <span className="material-symbols-outlined text-primary-container">microwave</span>
              </div>
              <span className="text-label-bold font-label-bold">Microwaves</span>
            </div>
          </div>
        </section>

        {/* Combo Section: Summer Bundle */}
        <section className="px-margin-mobile py-lg bg-surface-container-low">
          <div className="mb-sm">
            <h3 className="font-headline-md text-headline-md-mobile text-on-background flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary-container">auto_awesome</span>Combo
            </h3>
            <p className="text-on-surface-variant">Multiple products&nbsp;</p>
          </div>
          <div className="bg-surface rounded-xl border border-outline-variant p-sm shadow-xl flex flex-col gap-md relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-error-container text-on-error-container px-3 py-1 rounded-lg font-label-bold text-label-bold z-10">SAVE $200</div>
            <div className="flex items-center justify-center gap-xs">
              <div className="w-1/2 aspect-square rounded-lg overflow-hidden bg-surface-container relative">
                <img className="w-full h-full object-contain p-4" alt="Washing Machine" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD25n65KIqrq2t-s8CrplZJwqfrw_CgFe2eQdRVNOygVqXawyQSNW-zDi6GvIGnoiIU9lIUcC2rkcAbb2EYJQwDxm3fNq-QhJnQ-4xv6oILGjfUBRTxNHXpJbIsY_dHj0m5JGHsj4PhX9VDHesNoWxYjVA2cnklEs0vdxIZpTx1AEYo9vq_IFiCJ9rEKw8Wg4f57hpyRD_R3jOG2GMGlIbEspsm_Rx_Ey46NkvXM1klu_8Ztos8LBZM3aXCyakpE-Tqicy4Kl8nH5I" />
              </div>
              <span className="material-symbols-outlined text-primary-container text-4xl">add</span>
              <div className="w-1/2 aspect-square rounded-lg overflow-hidden bg-surface-container">
                <img className="w-full h-full object-contain p-4" alt="Microwave" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi3riCO1XUNZ2eWvVz5NYDmslutpYymqaz95zewThJRnPJ-U4DGeroDK0cFQ6JDAhuOutICv2260-zlJ_CzGECvvOAfSYnaKjQAa_lR1cFUNtLlA9_n2kNB5QDBkwMRGNErBwS6aZZvy9oEvY7BZM2DYVY_RBNWSfvmH-1WN-vlDYoGNhISSFZxPci4QpdFss1mPDmKJwDxVQ1Tv1jFPg66bawnEueWEyDgUVsmkMfPLSbwvuk1uaFHh2ITaHB89ZEbtvkUd6LE_I" />
              </div>
            </div>
            <div className="space-y-xs">
              <h4 className="font-headline-md text-headline-md-mobile">Kitchen Master Set</h4>
              <p className="text-body-md text-on-surface-variant">Titan Pro Smart Fridge + AeroTouch 30L Microwave</p>
              <div className="flex items-baseline gap-sm">
                <span className="font-price-display text-price-display text-primary-container">$1,299.00</span>
                <span className="text-body-md line-through text-on-surface-variant opacity-60">$1,499.00</span>
              </div>
              <button className="w-full bg-primary-container text-on-primary-container py-md rounded-xl font-label-bold text-label-bold mt-sm active:scale-95 transition-transform">Get Bundle Deal</button>
            </div>
          </div>
        </section>

        {/* Product Feed */}
        <section className="px-margin-mobile py-lg space-y-md">
          <div className="flex flex-row gap-md overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            <h3 className="font-headline-md text-headline-md-mobile flex-1">Single Products</h3>
            <span className="text-primary-container font-label-bold text-label-bold flex items-center gap-xs cursor-pointer">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>

          <div className="mb-4">
             <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary-container transition-colors"
             />
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-row gap-md overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="w-full text-center py-10 bg-surface-container rounded-xl text-on-surface-variant border border-outline-variant">
                No products found matching your search.
              </div>
            ) : (
              filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest full-width border-t border-outline-variant mt-lg pb-24">
        <div className="flex flex-col gap-sm items-center text-center w-full px-margin-mobile py-lg max-w-max-width mx-auto">
          <div className="font-headline-md text-primary-container font-bold mb-xs">CruzaroEnt</div>
          <nav className="flex flex-wrap justify-center gap-md mb-md">
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">Track Order</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">Store Locator</a>
          </nav>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-60">© 2026 PowerHub Appliances. All Rights Reserved.</p>
        </div>
      </footer>

      {/* BottomNavBar (Mobile only - placeholder) */}
      <nav className="md:hidden bg-surface-container dark:bg-surface-container border-t border-outline-variant shadow-lg docked full-width bottom-0 fixed z-50 h-16">
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
