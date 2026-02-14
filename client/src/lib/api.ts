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

export const getMediaUrl = (url?: string | null): string => {
  if (!url || url.trim() === '') {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';
  }

  // Fix: Handle double URL prefix (e.g. http://localhost:3001https://...) caused by DB data corruption
  if (url.includes('http') && url.lastIndexOf('http') > 0) {
    const lastHttpIndex = url.lastIndexOf('http');
    // Eğer http://localhost:3001/https://... gibi slash varsa onu da atla
    // Ancak lastIndexOf 'http' bulduğu için, eğer önünde / varsa onu dahil etmemek gerek.
    // url.substring(lastHttpIndex) direkt https://... kısmını alır.
    const potentialUrl = url.substring(lastHttpIndex);
    
    // Validasyon yap, eğer geçerli URL ise döndür
    try {
      new URL(potentialUrl);
      return potentialUrl;
    } catch {
       // Eğer URL validasyonu başarısız olursa, belki slash sorunu vardır veya başka bir şey.
       // Bu durumda devam et (aşağıdaki bloklara düşecek)
    }
  }

  try {
    // Eski IP/Domain ile kaydedilmiş resimleri düzelt (sadece uploads klasörü için)
    if (url.startsWith('http') && url.includes('/uploads/')) {
      try {
        const urlObj = new URL(url);
        // Sadece pathname'i al (örn: /uploads/products/xyz.jpg)
        const pathName = urlObj.pathname;
        
        // Eğer bu pathname zaten API_URL ile başlıyorsa (ki olmamalı ama kontrol edelim)
        // API_URL sonundaki slash'ı temizle
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        return `${baseUrl}${pathName}`;
      } catch {}
    }

    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      // Validate URL format
      try {
        new URL(url);
        return url;
      } catch {
        // Try encoding if it contains spaces or special chars
        try {
          const encoded = encodeURI(url);
          new URL(encoded);
          return encoded;
        } catch {
          // Still invalid, return placeholder
          console.error('Invalid URL encountered:', url);
          return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';
        }
      }
    }

    const path = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${API_URL}${path}`;
    
    // Validate constructed URL
    try {
      new URL(fullUrl);
      return fullUrl;
    } catch {
      console.error('Invalid constructed URL:', fullUrl);
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';
    }
  } catch (error) {
    console.error('Error in getMediaUrl:', error);
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';
  }
};

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

    // Check for Waiter Token
    const isWaiterSection = window.location.pathname.includes('/waiter');
    const waiterToken = localStorage.getItem('waiter-token');

    if (isWaiterSection && waiterToken) {
      config.headers.Authorization = `Bearer ${waiterToken}`;
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
