export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Newsletter */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-10 mb-20 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Subscribe to our Newsletter</h3>
              <p className="text-white/40 text-sm mt-1">Get the latest updates on new products and exclusive offers.</p>
            </div>
          </div>
          <div className="w-full md:w-auto flex items-center gap-3">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 w-full md:w-80 transition-all"
            />
            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 px-8 rounded-xl transition-all uppercase tracking-widest text-xs">Subscribe</button>
          </div>
        </div>

        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5zM2 12l10 5 10-5-10-5-10 5z"/></svg>
              </div>
              <span className="text-white font-black text-xl leading-none tracking-tighter uppercase italic">Cruzaro</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Your one-stop destination for premium electrical appliances. Quality, reliability, and performance you can trust.
            </p>
            <div className="flex items-center gap-4 text-white/30">
               {['facebook', 'instagram', 'twitter', 'youtube'].map((social) => (
                 <a key={social} href="#" className="hover:text-yellow-500 transition-colors">
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                       <span className="sr-only">{social}</span>
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                    </div>
                 </a>
               ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8 italic">Shop</h4>
            <ul className="space-y-4 text-sm font-bold text-white/40 uppercase tracking-widest">
              <li><a href="#" className="hover:text-yellow-500 transition-colors">All Categories</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Deals</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">New Arrivals</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Best Sellers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8 italic">Customer Service</h4>
            <ul className="space-y-4 text-sm font-bold text-white/40 uppercase tracking-widest">
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-8 italic">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-white/40 uppercase tracking-widest">
              <li><a href="#" className="hover:text-yellow-500 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
            © 2026 CruzaroHub. All Rights Reserved.
          </p>
          <div className="flex items-center gap-8 text-white/20 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
