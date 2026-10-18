import axios from 'axios';

const api = axios.create({
  // In production (Cloudflare Pages) VITE_API_URL is set to the full backend URL
  // e.g. https://cruzaro-backend.onrender.com/api
  // In local dev the Vite proxy rewrites /api → http://localhost:5000/api
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
