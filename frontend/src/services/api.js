import axios from 'axios';

// Normalize API baseURL for production (Cloudflare Pages) & local development
const getNormalizedBaseURL = (url) => {
  if (!url) return '/api';
  let cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned.startsWith('http') && !cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
};

const api = axios.create({
  baseURL: getNormalizedBaseURL(import.meta.env.VITE_API_URL),
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
