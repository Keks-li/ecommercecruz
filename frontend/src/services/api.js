import axios from 'axios';

// Normalize API baseURL for production (Cloudflare Pages) & local development.
// Guarantees HTTPS for all non-localhost remote API endpoints to prevent Mixed Content errors.
const getNormalizedBaseURL = (url) => {
  if (!url || !url.trim()) return '/api';
  let cleaned = url.trim().replace(/\/+$/, '');

  // If provided as a domain without protocol (e.g. api.cruzaroent.com), prepend https://
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://') && !cleaned.startsWith('/')) {
    cleaned = `https://${cleaned}`;
  }

  // If not localhost, always enforce https://
  const isLocalhost = cleaned.includes('localhost') || cleaned.includes('127.0.0.1');
  if (!isLocalhost && cleaned.startsWith('http://')) {
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }

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
