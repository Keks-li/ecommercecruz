export default function Footer() {
  return (
    <>
      <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest full-width border-t border-outline-variant mt-lg pb-24">
        <div className="flex flex-col gap-sm items-center text-center w-full px-margin-mobile py-lg max-w-max-width mx-auto">
          <div className="font-headline-md text-primary-container font-bold mb-xs">
            CruzaroEnt
          </div>
          <nav className="flex flex-wrap justify-center gap-md mb-md">
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">
              Terms of Service
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">
              Track Order
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-body-md" href="#">
              Store Locator
            </a>
          </nav>
          <p className="font-body-md text-body-md text-on-surface-variant opacity-60">
            © 2026 PowerHub Appliances. All Rights Reserved.
          </p>
        </div>
      </footer>
      <nav className="md:hidden bg-surface-container dark:bg-surface-container border-t border-outline-variant shadow-lg docked full-width bottom-0 fixed z-50 h-16"></nav>
    </>
  );
}
