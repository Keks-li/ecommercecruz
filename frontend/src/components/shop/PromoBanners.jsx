import summerBanner from '../../assets/summer_sale_banner.png';

export default function PromoBanners() {
  return (
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
      {/* Mega Summer Sale */}
      <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-600/20 to-yellow-900/40 border border-yellow-500/10 group cursor-pointer">
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
        <div className="relative h-full p-6 flex flex-col justify-between items-start">
          <div className="space-y-1">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Mega Sale</span>
             <h3 className="text-xl font-black text-white uppercase italic leading-none">Summer <br /> Sale</h3>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2">Up to 50% Off</p>
          </div>
          <button className="bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all">Shop Now</button>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-30 group-hover:opacity-50 transition-opacity transform rotate-12 group-hover:scale-110 duration-500">
           <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
      </div>

      {/* Stay Cool */}
      <div className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer border border-white/5">
        <img src={summerBanner} alt="AC Banner" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        <div className="relative h-full p-6 flex flex-col justify-between items-start">
          <div className="space-y-1">
             <h3 className="text-xl font-black text-white uppercase italic leading-none">Stay Cool <br /> This Summer</h3>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2">ACs starting at ₦120k</p>
          </div>
          <button className="bg-white hover:bg-white/90 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all">Shop Now</button>
        </div>
      </div>

      {/* Smart Homes */}
      <div className="relative h-48 rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/5 group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
        <div className="relative h-full p-6 flex flex-col justify-between items-start z-10">
          <div className="space-y-1">
             <h3 className="text-xl font-black text-white uppercase italic leading-none">Smart Homes <br /> Smarter Living</h3>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2">Up to 40% Off</p>
          </div>
          <button className="bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all">Shop Now</button>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/2 opacity-60 group-hover:opacity-80 transition-opacity">
           <div className="grid grid-cols-2 gap-1 p-2">
              <div className="h-10 bg-white/5 rounded"></div>
              <div className="h-10 bg-white/5 rounded"></div>
              <div className="h-10 bg-white/5 rounded"></div>
              <div className="h-10 bg-white/5 rounded"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
