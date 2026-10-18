export default function Hero({ onExploreClick }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-sm">
      <div className="relative z-10 max-w-3xl space-y-6">
        
        {/* Value Proposition Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>Flexible Hire Purchase & Instant Ownership</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Power Your Ambition with <span className="text-blue-600">Premium Tech</span>.
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-normal leading-relaxed max-w-2xl">
            Get direct access to flagship smartphones, high-performance laptops, and audio gear. Pay comfortably with flexible installment plans tailored to your budget.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onExploreClick}
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-sm tracking-wide shadow-sm active:scale-95 transition-all flex items-center gap-2 duration-200"
          >
            <span>Explore Catalog</span>
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
          
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">verified_user</span>
            <span>Nationwide Ghana Delivery</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Flexible Deposits</p>
              <p className="text-[11px] text-slate-500">Pay deposit, balance later</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">devices</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">100% Genuine</p>
              <p className="text-[11px] text-slate-500">Authentic hardware only</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Tracked Logistics</p>
              <p className="text-[11px] text-slate-500">Safe pickup regions</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
