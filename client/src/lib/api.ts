import axios from 'axios';
import { toast } from 'sonner';

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Tarayıcıda çalışıyorsa
    const hostname = window.location.hostname;
    
    // Debug log to understand environment detection
    if (process.env.NODE_ENV === 'development') {
        console.log('API_URL Detection - Hostname:', hostname);
    }

    // Debug override
    try {
      const debugUrl = localStorage.getItem('DEBUG_API_URL');
      if (debugUrl) return debugUrl;
    } catch (e) {}
    
    // Eğer localhost ise yerel portu kullan (process.env.NEXT_PUBLIC_API_URL olsa bile)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:3001`;
    }

    // Check for local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') ||
      (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31)
    ) {
       return `${window.location.protocol}//${hostname}:3001`;
    }

    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    // Production ortamında env'den gelen URL'i kullan veya varsayılan değere dön
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  
  // Server tarafında çalışıyorsa (SSR)
  // Eğer NODE_ENV development ise localhost kullan
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
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
        // Upgrade HTTP to HTTPS for specific domains or generally in production
        let finalUrl = url;
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

        if (!isLocalhost && finalUrl.startsWith('http://')) {
            // Always upgrade known secure providers
            if (
                finalUrl.includes('unsplash.com') || 
                finalUrl.includes('digitaloceanspaces.com') ||
                finalUrl.includes('qrders.com.tr')
            ) {
                finalUrl = finalUrl.replace('http://', 'https://');
            }
        }

        new URL(finalUrl);
        return finalUrl;
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
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request Interceptor:', {
        url: config.url,
        isAdminSection,
        hasAdminToken: !!adminToken,
        pathname: window.location.pathname
      });
    }
    
    // Check for Waiter Token
    const isWaiterSection = window.location.pathname.includes('/waiter');
    const waiterToken = localStorage.getItem('waiter-token');

    // Check for Customer Token
    const storage = localStorage.getItem('customer-storage');
    let customerToken = null;
    if (storage) {
       try {
         const { state } = JSON.parse(storage);
         if (state?.token) {
           customerToken = state.token;
         }
       } catch {}
    }

    if (isAdminSection && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }

    if (isWaiterSection && waiterToken) {
      config.headers.Authorization = `Bearer ${waiterToken}`;
      return config;
    }

    // Default to customer token if available and not in admin/waiter section
    if (customerToken && !isAdminSection && !isWaiterSection) {
        config.headers.Authorization = `Bearer ${customerToken}`;
        return config;
    }

    // Fallback: Use admin token if available (even if not in admin section, e.g. shared components)
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
      const pathname = window.location.pathname;

      // Prevent infinite loops if the login endpoint itself returns 401
      if (pathname.includes('/login') || pathname.includes('/register')) {
        return Promise.reject(error);
      }

      // Admin Logout Logic
      if (pathname.includes('/admin')) {
        // Clear all admin related storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        
        // Force redirect to login
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1000);
      }
      
      // Waiter Logout Logic
      else if (pathname.includes('/waiter')) {
         localStorage.removeItem('waiter-token');
         localStorage.removeItem('waiter-user');
         toast.error('Oturum süreniz doldu.');
         setTimeout(() => {
            window.location.href = '/waiter/login';
         }, 1000);
      }
      // Customer Logic (Optional - usually we don't force logout for customers in the same way, 
      // but if needed we can clear customer-storage)
    }
    return Promise.reject(error);
  }
);
