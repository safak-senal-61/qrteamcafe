import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from '@/navigation';
import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '@/lib/api';
import { Bell, HandPlatter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface WaiterCall {
  id: string;
  table: {
    tableNumber: number;
  };
  type: string;
  createdAt: string;
  status: string;
}

export function WaiterCallWidget() {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Notification sound - different from orders
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) return;
    
    const user = JSON.parse(userStr);
    const cafeId = user.cafeId;

    // Fetch initial pending calls
    const fetchCalls = async () => {
      try {
        const res = await fetch(`${API_URL}/waiter-calls?cafeId=${cafeId}&status=PENDING`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCalls(data);
        }
      } catch (error) {
        console.error('Error fetching waiter calls:', error);
      }
    };

    fetchCalls();

    // Socket connection
    socketRef.current = io(SOCKET_URL || 'http://localhost:3001');

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('joinAdmin', { cafeId });
    });

    socketRef.current.on('waiterCall', (newCall: WaiterCall) => {
      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      }
      
      toast.warning(`Masa ${newCall.table?.tableNumber || '?'} garson çağırıyor!`, {
        duration: 5000,
        action: {
          label: 'Görüntüle',
          onClick: () => router.push('/admin/waiter-calls'),
        },
      });
      
      setCalls(prev => {
        // Prevent duplicates
        if (prev.some(c => c.id === newCall.id)) return prev;
        return [newCall, ...prev];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [router]);

  const handleComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/waiter-calls/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCalls(prev => prev.filter(c => c.id !== id));
        toast.success('Çağrı tamamlandı.');
      }
    } catch (error) {
      console.error('Error completing call:', error);
    }
  };

  if (calls.length === 0) return null;

  return (
    <>
      {/* Floating Button - Yellow Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-24 right-20 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-full h-14 w-14 shadow-lg ${isOpen ? 'bg-secondary text-secondary-foreground' : 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse'}`}
        >
          <HandPlatter className="h-6 w-6" />
          <Badge className="absolute -top-2 -right-2 bg-white text-yellow-600 border-2 border-yellow-500 h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs font-bold">
            {calls.length}
          </Badge>
        </Button>
      </motion.div>

      {/* Popup List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-6 z-50 w-80 max-h-[60vh] overflow-y-auto"
          >
            <Card className="shadow-2xl border-yellow-200">
              <div className="p-4 border-b bg-yellow-50 dark:bg-yellow-950/20 flex justify-between items-center sticky top-0 backdrop-blur-md">
                <h3 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Garson Çağrıları ({calls.length})
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2 space-y-2">
                {calls.map(call => (
                  <div 
                    key={call.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      router.push('/admin/waiter-calls');
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                       {/* Nice Photo/Icon as requested */}
                       <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                         <Image 
                           src="https://cdn-icons-png.flaticon.com/512/3448/3448650.png" 
                           alt="Waiter" 
                           width={32}
                           height={32}
                           className="object-contain"
                           unoptimized
                         />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-lg">Masa {call.table?.tableNumber}</span>
                            <span className="text-xs text-muted-foreground">{new Date(call.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {call.type}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full h-8 text-xs border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                            onClick={(e) => handleComplete(e, call.id)}
                          >
                            Tamamlandı İşaretle
                          </Button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
