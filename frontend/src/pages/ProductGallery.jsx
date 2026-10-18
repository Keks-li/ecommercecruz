import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import Navbar from '../components/shop/Navbar';
import Hero from '../components/shop/Hero';
import ProductCard from '../components/shop/ProductCard';
import CartDrawer from '../components/shop/CartDrawer';
import Footer from '../components/shop/Footer';
import { useCart } from '../context/CartContext';

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 bg-slate-200 rounded-md w-16" />
        <div className="w-9 h-9 bg-slate-200 rounded-xl" />
      </div>
      <div className="w-full aspect-square rounded-xl bg-slate-100 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <div className="h-5 bg-slate-200 rounded w-20" />
          <div className="h-3 bg-slate-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function ProductGallery() {
  const { products, loading, error, refetch } = useProducts();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState('ALL'); // 'ALL' | 'SINGLE' | 'COMBO'
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' | 'grid'
  const { totalItems } = useCart();
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Dynamic categories extracted from real products
  const availableCategories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    const base = ['Phones', 'Laptops', 'Consoles', 'Audio', 'Accessories'];
    base.forEach((b) => set.add(b));
    return Array.from(set);
  }, [products]);

  // Filtered products based on search, category URL, and type tab
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (categoryName) {
        if (!p.category || p.category.toLowerCase() !== categoryName.toLowerCase()) {
          return false;
        }
      }

      // Type tab filter
      if (activeTypeTab === 'SINGLE' && p.type === 'COMBO') return false;
      if (activeTypeTab === 'COMBO' && p.type !== 'COMBO') return false;

      // Search term filter (matches name, unique_code, category, description)
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.unique_code?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryName, activeTypeTab]);

  const singleCount = useMemo(() => products.filter((p) => p.type === 'SINGLE' || !p.type).length, [products]);
  const comboCount = useMemo(() => products.filter((p) => p.type === 'COMBO').length, [products]);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        search={search}
        setSearch={setSearch}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-10">
        
        {/* Hero Section (only when not filtered by search/category for clean focus) */}
        {!search && !categoryName && (
          <Hero onExploreClick={scrollToCatalog} />
        )}

        {/* Catalog Container */}
        <section ref={catalogRef} className="space-y-6 pt-2">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Live Inventory</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {categoryName ? `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Collection` : 'Featured Hardware'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Showing {filtered.length} {filtered.length === 1 ? 'device' : 'devices'} available for immediate dispatch or hire purchase.
              </p>
            </div>

            {/* Controls Bar: Type Switcher + View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              
              {/* Type Filter Switcher */}
              <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTypeTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTypeTab === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({products.length})
                </button>
                <button
                  onClick={() => setActiveTypeTab('SINGLE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTypeTab === 'SINGLE'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single ({singleCount})
                </button>
                <button
                  onClick={() => setActiveTypeTab('COMBO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTypeTab === 'COMBO'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Combos ({comboCount})
                </button>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('scroll')}
                  title="Scroll View"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'scroll'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_carousel</span>
                  <span>Scroll</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span>Grid</span>
                </button>
              </div>

              {/* Scroll Arrow Buttons (Only in Scroll Mode) */}
              {viewMode === 'scroll' && filtered.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 pl-1">
                  <button
                    onClick={() => handleScroll('left')}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-xs transition active:scale-95"
                    title="Scroll left"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => handleScroll('right')}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-xs transition active:scale-95"
                    title="Scroll right"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                !categoryName
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">apps</span>
              All Categories
            </button>

            {availableCategories.map((cat) => {
              const isSelected = categoryName?.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => navigate(`/category/${cat.toLowerCase()}`)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm font-bold'
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {cat.toLowerCase().includes('phone') ? 'smartphone' :
                     cat.toLowerCase().includes('laptop') ? 'laptop_mac' :
                     cat.toLowerCase().includes('console') ? 'videogame_asset' :
                     cat.toLowerCase().includes('audio') ? 'headphones' :
                     cat.toLowerCase().includes('camera') ? 'photo_camera' : 'devices'}
                  </span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Notice */}
          {(categoryName || search) && (
            <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">filter_list</span>
                <span>Active filters:</span>
                {categoryName && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold capitalize">
                    Category: {categoryName}
                  </span>
                )}
                {search && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                    Query: "{search}"
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearch('');
                  navigate('/');
                }}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Reset
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{error}</span>
              </div>
              <button
                onClick={refetch}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Products Showcase (Scroll View or Grid View) */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500 border border-slate-200">
                <span className="material-symbols-outlined text-3xl">inventory_2</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">
                  {products.length === 0 ? 'Catalog Ready for Products' : 'No Devices Found'}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  {products.length === 0
                    ? 'Products added in the admin dashboard will appear here in clean scrollable boxes with full hire purchase options.'
                    : `No active items match your current filter criteria${search ? ` for "${search}"` : ''}. Try adjusting your keywords or clearing the category.`}
                </p>
              </div>
              {(search || categoryName || activeTypeTab !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setActiveTypeTab('ALL');
                    navigate('/');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Clear Filters
                </button>
              )}
            </div>
          ) : viewMode === 'scroll' ? (
            /* Horizontal Scroll View */
            <div className="space-y-3">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 snap-x"
              >
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className="w-[280px] sm:w-[310px] flex-shrink-0 snap-start"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                <span>Swipe or use arrows to scroll through all {filtered.length} devices</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Switch to Grid View
                </button>
              </div>
            </div>
          ) : (
            /* Responsive Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Floating Navigation Dock */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl flex items-center justify-around">
        <button
          onClick={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-blue-600"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="text-[10px] font-semibold tracking-wider">Home</span>
        </button>

        <button
          onClick={scrollToCatalog}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <span className="material-symbols-outlined text-[20px]">grid_view</span>
          <span className="text-[10px] font-semibold tracking-wider">Catalog</span>
        </button>

        <button
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900 relative"
        >
          {totalItems > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
              {totalItems}
            </span>
          )}
          <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          <span className="text-[10px] font-semibold tracking-wider">Cart</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
          <span className="text-[10px] font-semibold tracking-wider">Account</span>
        </button>
      </nav>
    </div>
  );
}
