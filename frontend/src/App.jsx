import { CartProvider } from './context/CartContext';
import ProductGallery from './pages/ProductGallery';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  return (
    <CartProvider>
      <ProductGallery />
    </CartProvider>
  );
}

export default App;
