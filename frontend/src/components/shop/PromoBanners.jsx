export default function PromoBanners() {
  return (
    <section className="px-margin-mobile py-lg bg-surface-container-low">
      <div className="mb-sm">
        <h3 className="font-headline-md text-headline-md-mobile text-on-background flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary-container">auto_awesome</span>Combo
        </h3>
        <p className="text-on-surface-variant">Multiple products&nbsp;</p>
      </div>
      <div className="bg-surface rounded-xl border border-outline-variant p-sm shadow-xl flex flex-col gap-md relative overflow-hidden">
        <div className="absolute top-4 right-4 bg-error-container text-on-error-container px-3 py-1 rounded-lg font-label-bold text-label-bold z-10">SAVE $200</div>
        <div className="flex items-center justify-center gap-xs">
          <div className="w-1/2 aspect-square rounded-lg overflow-hidden bg-surface-container relative">
            <img className="w-full h-full object-contain p-4" data-alt="A professional product shot of a sleek silver modern washing machine on a dark, reflective surface. The lighting is crisp and highlights the chrome details and digital control panel. The environment is minimalist and high-tech, aligning with a premium industrial aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD25n65KIqrq2t-s8CrplZJwqfrw_CgFe2eQdRVNOygVqXawyQSNW-zDi6GvIGnoiIU9lIUcC2rkcAbb2EYJQwDxm3fNq-QhJnQ-4xv6oILGjfUBRTxNHXpJbIsY_dHj0m5JGHsj4PhX9VDHesNoWxYjVA2cnklEs0vdxIZpTx1AEYo9vq_IFiCJ9rEKw8Wg4f57hpyRD_R3jOG2GMGlIbEspsm_Rx_Ey46NkvXM1klu_8Ztos8LBZM3aXCyakpE-Tqicy4Kl8nH5I" />
          </div>
          <span className="material-symbols-outlined text-primary-container text-4xl">add</span>
          <div className="w-1/2 aspect-square rounded-lg overflow-hidden bg-surface-container">
            <img className="w-full h-full object-contain p-4" data-alt="A modern, matte black convection microwave oven displayed in a high-key studio setting with dramatic shadows. The glass door reflects a professional kitchen environment. The design is sleek, geometric, and minimalist, echoing the PowerHub brand identity of high-performance and precision." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi3riCO1XUNZ2eWvVz5NYDmslutpYymqaz95zewThJRnPJ-U4DGeroDK0cFQ6JDAhuOutICv2260-zlJ_CzGECvvOAfSYnaKjQAa_lR1cFUNtLlA9_n2kNB5QDBkwMRGNErBwS6aZZvy9oEvY7BZM2DYVY_RBNWSfvmH-1WN-vlDYoGNhISSFZxPci4QpdFss1mPDmKJwDxVQ1Tv1jFPg66bawnEueWEyDgUVsmkMfPLSbwvuk1uaFHh2ITaHB89ZEbtvkUd6LE_I" />
          </div>
        </div>
        <div className="space-y-xs">
          <h4 className="font-headline-md text-headline-md-mobile">Kitchen Master Set</h4>
          <p className="text-body-md text-on-surface-variant">Titan Pro Smart Fridge + AeroTouch 30L Microwave</p>
          <div className="flex items-baseline gap-sm">
            <span className="font-price-display text-price-display text-primary-container">$1,299.00</span>
            <span className="text-body-md line-through text-on-surface-variant opacity-60">$1,499.00</span>
          </div>
          <button className="w-full bg-primary-container text-on-primary-container py-md rounded-xl font-label-bold text-label-bold mt-sm active:scale-95 transition-transform">Get Bundle Deal</button>
        </div>
      </div>
    </section>
  );
}
