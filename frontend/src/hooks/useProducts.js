import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * useProducts — fetches GET /api/products (returns only ACTIVE products from the backend).
 * Provides search and sort utilities for the gallery UI.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/products');
      // Backend already filters for ACTIVE, but double-guard on the client side
      setProducts(data.filter((p) => p.status === 'ACTIVE'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
