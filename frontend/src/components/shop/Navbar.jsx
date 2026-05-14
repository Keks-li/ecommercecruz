import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function Navbar({ search, setSearch }) {
  const { totalItems } = useCart();
  const [categoryOpen, setCategoryOpen] = useState(false);

  return (
    <nav className="w-full bg-[#0d1117] border-b border-white/5">
      {/* Top Bar */}
      <div className="bg-[#0a0a0a] border-b border-white/5 py-2 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-medium text-white/50 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-3V5h3v2zM14 9h-3v2h3V9zM18 9h-2V7h2v2zM18 11h-2v2h2v1h-3v-2h-1V7h1V5h3a1 1 0 011 1v4a1 1 0 01-1 1z"/></svg>
              Free Delivery on orders above ₦50,000
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-yellow-500 transition-colors">Track Order</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">Support</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">Store Locator</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5zM2 12l10 5 10-5-10-5-10 5z"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-xl leading-none tracking-tighter uppercase italic">Cruzaro</span>
            <span className="text-yellow-500 text-[9px] font-bold uppercase tracking-[0.2em] leading-none mt-1">Premium Shop</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative flex items-center">
          <div className="absolute left-0 h-full flex items-center px-4 border-r border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
               onClick={() => setCategoryOpen(!categoryOpen)}>
            All Categories
            <svg className={`ml-2 w-3 h-3 transition-transform duration-300 ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <input
            type="text"
            placeholder="Search for premium products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-40 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
          <div className="absolute right-3 p-2 bg-yellow-500 rounded-lg text-black cursor-pointer hover:bg-yellow-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-6 text-white/60">
            <button className="hover:text-yellow-500 transition-colors relative group">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </button>
            <button className="hover:text-yellow-500 transition-colors relative group">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </button>
          </div>
          
          <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all group">
            <div className="relative">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-yellow-500/30">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Your Cart</span>
              <span className="text-sm font-bold text-white leading-none mt-1 group-hover:text-yellow-500 transition-colors">My Bag</span>
            </div>
          </button>

          <button className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
               <svg className="w-6 h-6 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-10">
        <button className="flex items-center gap-3 bg-yellow-500 text-black px-6 py-3 rounded-t-xl font-bold text-xs uppercase tracking-widest">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          All Categories
        </button>
        <div className="flex items-center gap-8">
          {['Home', 'Shop', 'Deals', 'New Arrivals', 'Brands', 'About Us', 'Contact Us'].map((item) => (
            <a key={item} href="#" className={`text-xs font-bold uppercase tracking-widest transition-colors ${item === 'Home' ? 'text-yellow-500' : 'text-white/60 hover:text-white'}`}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
