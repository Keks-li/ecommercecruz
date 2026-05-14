import heroImage from '../../assets/hero_appliances_banner.png';

export default function Hero() {
  return (
    <section className="relative w-full h-[600px] overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Premium Appliances" 
          className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-[10s] hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-start">
        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em]">New Collection 2026</span>
          </div>
          
          <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            Powering Your <br />
            <span className="text-yellow-500">Everyday</span> <br />
            Brilliance
          </h1>
          
          <p className="text-white/60 text-lg max-w-lg font-medium leading-relaxed">
            High-performance electrical appliances for a smarter, easier life. Upgrade your home with the latest technology.
          </p>
          
          <div className="flex items-center gap-4 pt-4">
            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 px-10 rounded-xl transition-all shadow-2xl shadow-yellow-500/20 uppercase tracking-widest text-xs flex items-center gap-3 group">
              Shop Now
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-5 px-10 rounded-xl transition-all uppercase tracking-widest text-xs">
              Explore Deals
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="absolute bottom-10 left-0 w-full">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-12 text-white/40">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:text-yellow-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 leading-none">100% Genuine Products</span>
              <span className="text-[9px] mt-1">Trusted quality across all brands</span>
            </div>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:text-yellow-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 leading-none">Secure Payments</span>
              <span className="text-[9px] mt-1">Safe & encrypted transactions</span>
            </div>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:text-yellow-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 leading-none">Free & Fast Delivery</span>
              <span className="text-[9px] mt-1">On orders over ₦50,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-yellow-500 h-6' : 'bg-white/20'}`}></div>
        ))}
      </div>
    </section>
  );
}
