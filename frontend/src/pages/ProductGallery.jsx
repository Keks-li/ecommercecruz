import { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/shop/ProductCard';
import CartDrawer from '../components/shop/CartDrawer';

// ─── Icons ────────────────────────────────────────────────────────────────────
function CartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-700/60 rounded w-3/4" />
        <div className="h-3 bg-slate-700/40 rounded w-full" />
        <div className="h-3 bg-slate-700/40 rounded w-2/3" />
        <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
          <div className="h-5 bg-slate-700/60 rounded w-1/3" />
          <div className="h-8 bg-slate-700/60 rounded-xl w-1/3" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProductGallery() {
  const { products, loading, error, refetch } = useProducts();
  const { totalItems } = useCart();

  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filtered = useMemo(() => {
    let list = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.unique_code.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case 'price-asc':  list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'name':       list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest':
      default:           list = [...list].sort((a, b) => b.id - a.id);
    }
    return list;
  }, [products, search, sortBy]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-[#0d1117]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Cruzaro</span>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <SearchIcon />
            </span>
            <input
              id="product-search"
              type="text"
              placeholder="Search products or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 text-slate-200 placeholder-slate-500
                rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60
                focus:border-indigo-500 transition"
            />
          </div>

          {/* Cart button */}
          <button
            id="open-cart-btn"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700
              text-slate-200 rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            <CartIcon />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center
                bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-indigo-500/30">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
          Shop Products
        </h1>
        <p className="text-slate-400 text-sm">
          {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="max-w-7xl mx-auto px-6 mb-6 flex flex-col sm:flex-row gap-3">
        {/* Mobile search */}
        <div className="relative flex-1 sm:hidden">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search products or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/70 border border-slate-700 text-slate-200 placeholder-slate-500
              rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
          />
        </div>

        {/* Sort */}
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-800/70 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5
            text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name A–Z</option>
        </select>

        {/* Refresh */}
        <button
          id="refresh-products-btn"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700
            text-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm">
            <span>⚠</span> {error}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <span className="text-5xl">🔍</span>
            <div>
              <p className="text-slate-300 font-medium text-lg">No products found</p>
              <p className="text-slate-500 text-sm mt-1">Try a different search term or clear the filter.</p>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* ── Cart Drawer ── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
