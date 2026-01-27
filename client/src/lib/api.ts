import axios from 'axios';

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Tarayıcıda çalışıyorsa
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Eğer env tanımlı değilse, mevcut hostname'i (örn: 192.168.2.67) kullan
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  
  // Server tarafında çalışıyorsa (SSR)
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export const API_URL = getApiUrl();
export const SOCKET_URL = API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Check for Admin Token first if we are in admin section
    const isAdminSection = window.location.pathname.includes('/admin');
    const adminToken = localStorage.getItem('token');
    
    if (isAdminSection && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }

    // Check for Customer Token
    const storage = localStorage.getItem('customer-storage');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
        return config;
      }
    }

    // Fallback: Use admin token if available (even if not in admin section, e.g. shared components)
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }
  return config;
});
