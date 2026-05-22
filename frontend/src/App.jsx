import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import ProductGallery from './pages/ProductGallery';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails';
import CustomerAuth from './pages/CustomerAuth';
import CustomerProfile from './pages/CustomerProfile';

function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProductGallery />} />
          <Route path="/category/:categoryName" element={<ProductGallery />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/auth" element={<CustomerAuth />} />
          <Route path="/profile" element={<CustomerProfile />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
