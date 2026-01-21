'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial check (only runs on client)
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}
