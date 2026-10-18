import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function Navbar({ search, setSearch, onCartClick }) {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'CUSTOMER') {
          setUser(parsed);
        }
      }
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black group-hover:bg-blue-600 transition-colors duration-200">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                CRUZARO<span className="text-blue-600">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-500 -mt-1 hidden sm:inline-block">
                Flagship Electronics
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          {setSearch !== undefined && (
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search devices, consoles, codes (e.g. MACB-001)..."
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all duration-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                    title="Clear search"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action Icons & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mobile Search Toggle */}
            {setSearch !== undefined && (
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle search"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mobileSearchOpen ? 'close' : 'search'}
                </span>
              </button>
            )}

            {/* Quick Link to Catalog */}
            <Link
              to="/"
              className={`hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                location.pathname === '/' 
                  ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Catalog
            </Link>

            {/* Cart Trigger Button */}
            <button
              id="navbar-cart-btn"
              onClick={onCartClick}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 transition-all active:scale-95 duration-150 group shadow-sm"
              title="Shopping Cart"
            >
              <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">
                shopping_bag
              </span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-sm animate-scaleIn">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Profile / Sign In */}
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all group"
                title="Your Profile & Orders"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-slate-800 group-hover:text-blue-600 truncate max-w-[100px]">
                    {user.email.split('@')[0]}
                  </span>
                  <span className="text-[9px] text-slate-500 -mt-0.5 uppercase tracking-wider">
                    Customer
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </Link>
            )}

          </div>
        </div>

        {/* Mobile Search Input Drawer/Bar */}
        {setSearch !== undefined && mobileSearchOpen && (
          <div className="md:hidden pb-4 pt-1">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                autoFocus
                placeholder="Search products or code..."
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-blue-600"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
