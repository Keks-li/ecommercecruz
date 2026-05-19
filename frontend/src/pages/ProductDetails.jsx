import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const regions = {
  "greater-accra": ["Accra Metropolis", "Tema Metropolis", "Ga East", "Ga West"],
  "ashanti": ["Kumasi Metropolis", "Obuasi Municipal", "Ejisu-Juaben", "Amansie West"],
  "central": ["Cape Coast Metropolis", "Awutu Senya", "Effutu", "Komenda/Edina/Eguafo/Abirem"],
  "eastern": ["New Juaben", "Nsawam Adoagyiri", "Akuapem North", "East Akim"],
  "western": ["Sekondi-Takoradi Metropolis", "Tarkwa Nsuaem", "Ellembelle", "Jomoro"],
  "volta": ["Ho Municipal", "Ketu South", "Kpando", "Hohoe"],
  "northern": ["Tamale Metropolis", "Sagnarigu", "Yendi", "Tolon"],
  "upper-east": ["Bolgatanga Municipal", "Kassena Nankana", "Bawku Municipal", "Navrongo"],
  "upper-west": ["Wa Municipal", "Nadowli-Kaleo", "Jirapa", "Lawra"],
  "bono": ["Sunyani Municipal", "Berekum", "Dormaa", "Wenchi"],
  "bono-east": ["Techiman Municipal", "Kintampo North", "Nkoranza South", "Atebubu-Amantin"],
  "ahafo": ["Goaso Municipal", "Asunafo North", "Tano South", "Tano North"],
  "savannah": ["Damongo", "Bole", "West Gonja", "East Gonja"],
  "north-east": ["Nalerigu", "Walewale", "East Mamprusi", "West Mamprusi"],
  "oti": ["Dambai", "Krachi East", "Nkwanta South", "Kadjebi"],
  "western-north": ["Sefwi Wiawso", "Bibiani-Anhwiaso-Bekwai", "Juaboso", "Aowin"]
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [city, setCity] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    setAddingToCart(true);
    addItem(product);
    setTimeout(() => {
      setAddingToCart(false);
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 3000);
    }, 800);
  };

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
    setSelectedDistrict('');
  };

  const isCityDisabled = !selectedRegion || !selectedDistrict;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-error">{error}</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header backdrop-blur-md bg-surface/80">
        <div className="flex justify-between items-center px-margin-page py-stack-md max-w-screen-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div className="flex gap-stack-sm">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors active:scale-95 duration-150">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors active:scale-95 duration-150">
              <span className="material-symbols-outlined text-on-surface">share</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 max-w-screen-md mx-auto">
        {/* Product Gallery */}
        <section className="px-margin-page py-stack-lg">
          <div className="relative w-full aspect-square bg-[#f4f5f0] rounded-3xl overflow-hidden flex items-center justify-center group">
            <img
              alt={product.name}
              className="w-4/5 h-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
              src={product.image_url}
            />
            {/* Pagination Dots Simulator */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1 product-gallery-indicator">
              <span className="w-2 h-2 rounded-full bg-outline-variant opacity-40"></span>
              <span className="w-4 h-2 rounded-full bg-primary active-indicator"></span>
              <span className="w-2 h-2 rounded-full bg-outline-variant opacity-40"></span>
              <span className="w-2 h-2 rounded-full bg-outline-variant opacity-40"></span>
            </div>
          </div>
        </section>

        {/* Product Info Canvas */}
        <section className="px-margin-page space-y-stack-lg">
          {/* Title and Status */}
          <div className="space-y-stack-sm">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{product.name}</h1>
          </div>

          {/* Pricing Card */}
          <div className="bg-surface-container-lowest border border-surface-variant p-stack-md rounded-2xl">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <p className="font-price-display text-price-display text-on-surface">
                  GH₵ {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-stack-sm">
            <p className="font-body-md text-body-md text-on-secondary-fixed-variant leading-relaxed">
              {product.description || "No description available."}
              <button className="text-on-surface font-bold hover:underline ml-1">Read more</button>
            </p>
          </div>

          {/* Delivery Info */}
          <div className="space-y-2">
            <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="pickup-location-group">
              Pick-up Location
            </label>
            <div className="space-y-3" id="pickup-location-group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-secondary text-[20px]">map</span>
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-3 bg-surface-container-low border-none rounded-xl text-on-surface font-body-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container transition-colors"
                  id="region-select"
                  name="region"
                  value={selectedRegion}
                  onChange={handleRegionChange}
                >
                  <option disabled value="">Select Region</option>
                  <option value="greater-accra">Greater Accra</option>
                  <option value="ashanti">Ashanti</option>
                  <option value="central">Central</option>
                  <option value="eastern">Eastern</option>
                  <option value="western">Western</option>
                  <option value="volta">Volta</option>
                  <option value="northern">Northern</option>
                  <option value="upper-east">Upper East</option>
                  <option value="upper-west">Upper West</option>
                  <option value="bono">Bono</option>
                  <option value="bono-east">Bono East</option>
                  <option value="ahafo">Ahafo</option>
                  <option value="savannah">Savannah</option>
                  <option value="north-east">North East</option>
                  <option value="oti">Oti</option>
                  <option value="western-north">Western North</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-secondary text-[20px]">expand_more</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-secondary text-[20px]">location_city</span>
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-3 bg-surface-container-low border-none rounded-xl text-on-surface font-body-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container transition-colors"
                  id="district-select"
                  name="district"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedRegion}
                >
                  <option disabled value="">Select District</option>
                  {selectedRegion && regions[selectedRegion]?.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-secondary text-[20px]">expand_more</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-secondary text-[20px]">location_on</span>
                </div>
                <input
                  className={`block w-full pl-10 pr-3 py-3 ${isCityDisabled ? 'bg-surface-container-low/50 text-secondary' : 'bg-surface-container-low text-on-surface'} border-none rounded-xl font-body-sm placeholder:text-secondary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container transition-colors`}
                  id="pickup-location"
                  name="pickup-location"
                  placeholder="Enter city or street"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isCityDisabled}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-stack-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">info</span>
            <p className="font-body-sm text-body-sm text-secondary italic">
                Note: Delivery amount will be determined based on location after payment.
            </p>
          </div>
        </section>
      </main>

      {/* Fixed Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant px-margin-page py-6 z-40 max-w-screen-md mx-auto">
        <button
          id="addToCartBtn"
          onClick={handleAddToCart}
          className="w-full bg-primary-container text-on-primary-fixed font-bold py-stack-lg rounded-2xl flex items-center justify-center gap-stack-sm active:scale-95 transition-all duration-200 shadow-lg shadow-primary-container/20"
        >
          {addingToCart ? (
            <span className="material-symbols-outlined animate-spin">sync</span>
          ) : toastOpen ? (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-label-lg text-label-lg">Added!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="font-label-lg text-label-lg">Add to cart</span>
            </>
          )}
        </button>
      </footer>

      {/* Cart Overlay Interaction */}
      <div
        className={`fixed bottom-28 left-margin-page right-margin-page bg-inverse-surface text-inverse-on-surface px-stack-lg py-stack-md rounded-xl pointer-events-none transition-all duration-300 z-50 flex items-center justify-between
          ${toastOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <span className="font-body-sm text-body-sm">Added to cart successfully</span>
        <button className="text-primary-fixed-dim font-bold text-label-md pointer-events-auto">UNDO</button>
      </div>
    </div>
  );
}
