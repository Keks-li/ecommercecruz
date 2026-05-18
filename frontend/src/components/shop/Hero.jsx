export default function Hero() {
  return (
    <section className="relative w-full aspect-[4/5] md:aspect-[16/7] overflow-hidden flex flex-col justify-end p-margin-mobile">
      <div className="absolute inset-0 z-0">
        <img className="w-full h-full object-cover" data-alt="A luxurious, high-end black matte smart refrigerator standing elegantly in a minimalist modern kitchen with dark charcoal cabinetry. The lighting is sophisticated and moody, featuring warm accent LEDs that highlight the sleek metallic textures and industrial design. The overall aesthetic is professional, high-performance, and futuristic, following a strictly dark mode palette with golden-yellow highlights." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwc2_asPlkgdzH3jCggNFLfQynqLpsvK3s4BbVKRgBtfki_OVfymUIiBUHYZQE80X9wkh4eK9tVpz_UQ5Ci7dY-0ITtsDYJrMqZZ8SozxudqGYePNnANGqGGB_a6UfAivWeaJtAbN2NQPeaDlYU2MvXWQgVi7f6QTI-oWlJN1jj19DoIhidW7jQoHshgH8BWffbgN1ppYfcdG4sqsqihFvlY8wiScA7KkgepGPExPHADHUb1pdwB9GShj00pEm75bw3XHo7XvW9uA" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
      </div>
      <div className="relative z-10 space-y-sm max-w-lg">
        <span className="inline-block px-3 py-1 bg-primary-container text-on-primary-container font-label-bold text-label-bold rounded-lg uppercase tracking-wider">OWN IT WITHOUT PAYING UPFRONT</span>
        <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-background">Powering Your Everyday Brilliance with Hire Purchase</h2>
        <p className="font-body-md text-body-md text-on-surface-variant opacity-90">You got not money?! No Probel, Just pay in bit and get your dream product.</p>
        <div className="pt-sm">
          <button className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-label-bold text-label-bold hover:brightness-95 transition-all active:scale-95 shadow-lg flex items-center gap-xs">
            Shop Now <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
