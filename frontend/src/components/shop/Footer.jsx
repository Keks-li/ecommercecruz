import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-16 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black shadow-xs">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                CRUZARO<span className="text-blue-600">.</span>
              </span>
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              Your premier e-commerce destination for authentic flagship electronics. Offering flexible hire purchase and structured installment plans across Ghana.
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span className="material-symbols-outlined text-blue-600 text-[16px]">verified</span>
              <span>100% Genuine Hardware Guaranteed</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Shopping</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-blue-600 transition-colors">All Products</Link>
              </li>
              <li>
                <Link to="/category/phones" className="hover:text-blue-600 transition-colors">Smartphones</Link>
              </li>
              <li>
                <Link to="/category/laptops" className="hover:text-blue-600 transition-colors">Laptops & Workstations</Link>
              </li>
              <li>
                <Link to="/category/consoles" className="hover:text-blue-600 transition-colors">Gaming Consoles</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Accounts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Customer Hub</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/profile" className="hover:text-blue-600 transition-colors">Order History & Payments</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-blue-600 transition-colors">Account Sign In / Register</Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Nationwide Ghana Delivery</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Flexible Installment Terms</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Cruzaro. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Secure Checkout</span>
            <span>•</span>
            <span>Ghana Pickup Points</span>
            <span>•</span>
            <span>Escrow Protected</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
