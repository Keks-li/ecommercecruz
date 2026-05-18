export default function CategoryBar() {
  const categories = [
    { name: 'Refrigerators', icon: 'kitchen' },
    { name: 'Washing', icon: 'local_laundry_service' },
    { name: 'AC Units', icon: 'ac_unit' },
    { name: 'Microwaves', icon: 'microwave' },
  ];

  return (
    <section className="px-margin-mobile py-lg overflow-x-auto no-scrollbar">
      <div className="flex gap-md min-w-max">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center gap-xs group cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-surface-container-highest transition-colors border border-outline-variant">
              <span className="material-symbols-outlined text-primary-container">{cat.icon}</span>
            </div>
            <span className="text-label-bold font-label-bold">{cat.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
