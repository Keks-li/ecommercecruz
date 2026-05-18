import { useCart } from '../../context/CartContext';

export default function Navbar({ search, setSearch, onCartClick }) {
  const { totalItems } = useCart();

  return (
    <header className="bg-background dark:bg-background border-b border-outline-variant shadow-sm docked full-width top-0 sticky z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-max-width mx-auto">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-on-surface hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer">menu</span>
          <h1 className="font-headline-md text-headline-md-mobile font-bold text-primary-container dark:text-primary-fixed-dim tracking-tight">CruzaroEnt</h1>
        </div>
        <div className="hidden md:flex flex-1 max-w-2xl relative items-center mx-4">
          <input
            type="text"
            placeholder="Search for premium products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-xs">
          <button onClick={onCartClick} className="relative material-symbols-outlined text-on-surface hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer">
            shopping_cart
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-container text-on-primary-container text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
