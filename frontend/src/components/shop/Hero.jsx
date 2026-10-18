import { useState, useEffect } from 'react';

const PHRASES = [
  "Home Appliances",
  "Flagship Smartphones",
  "High-Performance Laptops",
  "Smart Fridges & 4K TVs",
  "Flexible Hire Purchase",
];

export default function Hero({ onExploreClick }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter / writing slideshow effect
  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex];
    let timer;

    if (!isDeleting && displayText === currentPhrase) {
      // Pause at full word for 2 seconds
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      // Switched to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    } else {
      // Typing or backspacing
      const nextText = isDeleting
        ? currentPhrase.substring(0, displayText.length - 1)
        : currentPhrase.substring(0, displayText.length + 1);

      const typingSpeed = isDeleting ? 30 : 65;
      timer = setTimeout(() => setDisplayText(nextText), typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0B1120] to-[#0A1A2F] text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-slate-800/80">
      
      {/* Ambient Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* Left Column: Headline with Typewriter/Writing Slideshow, Copy & CTAs */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Category Chip Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Tech & Home Appliances • Hire Purchase</span>
          </div>

          {/* Main Headline with Writing Slideshow */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.14] min-h-[5rem] sm:min-h-[7rem]">
              <span>Next-Gen </span>
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                {displayText}
              </span>
              <span className="inline-block w-[3px] h-[0.85em] ml-1 bg-cyan-400 align-middle animate-pulse" />
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              From flagship smartphones and powerful laptops to smart refrigerators, 4K TVs, and modern home essentials. Own genuine electronics today with flexible Ghana installment plans.
            </p>
          </div>

          {/* Quick Categories Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300 font-medium">
            <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
              <span className="material-symbols-outlined text-[14px] text-blue-400">smartphone</span>
              <span>Smartphones</span>
            </span>
            <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
              <span className="material-symbols-outlined text-[14px] text-blue-400">laptop_mac</span>
              <span>Laptops</span>
            </span>
            <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">kitchen</span>
              <span>Smart Fridges</span>
            </span>
            <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">tv</span>
              <span>4K TVs & Audio</span>
            </span>
            <span className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
              <span className="material-symbols-outlined text-[14px] text-indigo-400">local_laundry_service</span>
              <span>Appliances</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={onExploreClick}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-2 duration-150"
            >
              <span>Explore Catalog</span>
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            </button>
            
            <button
              onClick={onExploreClick}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs sm:text-sm font-semibold transition active:scale-95 flex items-center gap-2 backdrop-blur-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-400">shopping_bag</span>
              <span>Shop All Products</span>
            </button>
          </div>

        </div>

        {/* Right Column: Premium Visual Showcase */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
            <img
              src="/hero-tech-appliances.jpg"
              alt="Premium Tech & Smart Home Appliances"
              className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Floating Glassmorphic Badge: Pay with MoMo / Installments */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">credit_score</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">Flexible Installment Plans</p>
                  <p className="text-[9px] text-slate-400">MTN MoMo • Telecel • Card</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
