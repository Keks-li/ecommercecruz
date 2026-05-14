export default function CategoryBar() {
  const categories = [
    { name: 'Refrigerators', icon: '❄️', discount: 'Up to 30% Off' },
    { name: 'Washing Machines', icon: '🧺', discount: 'Up to 25% Off' },
    { name: 'Air Conditioners', icon: '💨', discount: 'Up to 20% Off' },
    { name: 'Microwaves', icon: '🍲', discount: 'Up to 15% Off' },
    { name: 'Vacuum Cleaners', icon: '🧹', discount: 'Up to 20% Off' },
    { name: 'Kitchen Appliances', icon: '🍳', discount: 'Up to 30% Off' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center gap-6">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center gap-4 group cursor-pointer shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:bg-yellow-500 group-hover:text-black transition-all duration-300 transform group-hover:scale-110 shadow-xl">
              {cat.icon}
            </div>
            <div className="text-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-white group-hover:text-yellow-500 transition-colors">{cat.name}</h3>
              <p className="text-[9px] font-bold text-white/30 uppercase mt-1 tracking-tighter">{cat.discount}</p>
            </div>
          </div>
        ))}
        <div className="flex flex-col items-center gap-4 group cursor-pointer shrink-0">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all duration-300 shadow-xl">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </div>
          <div className="text-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">View All</h3>
            <p className="text-[9px] font-bold text-white/30 uppercase mt-1 tracking-tighter">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}
