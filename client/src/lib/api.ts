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
