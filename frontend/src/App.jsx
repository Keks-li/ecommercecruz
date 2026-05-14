import { CartProvider } from './context/CartContext';
import ProductGallery from './pages/ProductGallery';

/**
 * App — CartProvider wraps the entire tree so any descendant can access cart state.
 * Swap out <ProductGallery /> for a router when adding more pages.
 */
function App() {
  return (
    <CartProvider>
      <ProductGallery />
    </CartProvider>
  );
}

export default App;
