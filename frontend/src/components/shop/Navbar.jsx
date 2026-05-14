import { useCart } from '../../context/CartContext';

export default function Navbar({ setCartOpen }) {
  const { totalItems } = useCart();

  return (
    <header className="bg-background dark:bg-background border-b border-outline-variant shadow-sm docked full-width top-0 sticky z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-max-width mx-auto">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-on-surface hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer">
            menu
          </span>
          <h1 className="font-headline-md text-headline-md-mobile font-bold text-primary-container dark:text-primary-fixed-dim tracking-tight">
            CruzaroEnt
          </h1>
        </div>
        <div className="flex items-center gap-xs relative" onClick={() => setCartOpen(true)}>
          <span className="material-symbols-outlined text-on-surface hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer">
            shopping_cart
          </span>
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-primary-container text-on-primary-container text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full pointer-events-none">
              {totalItems}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
