'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  // We use this state to trigger re-renders when online status changes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial check (only runs on client)
    // We don't set state here synchronously to avoid hydration mismatch or render issues
    // navigator.onLine is available on client side
    
    const handleOnline = () => {
      setIsOnline(true);
      toast.dismiss('offline-toast');
      toast.success('İnternet bağlantısı tekrar sağlandı.', {
        icon: <Wifi className="h-4 w-4" />,
        duration: 4000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('İnternet bağlantısı kesildi. Lütfen bağlantınızı kontrol edin.', {
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity,
        id: 'offline-toast',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status after mount to be safe, but typically event listeners handle changes
    if (typeof window !== 'undefined' && !navigator.onLine) {
       handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}
