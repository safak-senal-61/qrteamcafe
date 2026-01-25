import { useEffect, useState, useRef } from 'react';
import { useRouter } from '@/navigation';
import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '@/lib/api';
import { Bell, Receipt, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingOrder {
  id: string;
  table: {
    tableNumber: number;
  };
  totalAmount: number;
  createdAt: string;
  status: string;
}

export function PendingOrdersWidget() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Notification sound
    audioRef.current = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3');
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const cafeId = user.cafeId;

    // Fetch initial pending orders
    const fetchPendingOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/orders?cafeId=${cafeId}`);
        if (res.ok) {
          const allOrders = await res.json();
          // Filter only PENDING orders
          const pending = allOrders.filter((o: PendingOrder) => o.status === 'PENDING');
          setPendingOrders(pending);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchPendingOrders();

    // Socket connection
    socketRef.current = io(SOCKET_URL || 'http://localhost:3001');

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('joinAdmin', { cafeId });
    });

    socketRef.current.on('newOrder', (newOrder: PendingOrder) => {
      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      }
      
      toast.info(`Masa ${newOrder.table?.tableNumber || '?'} yeni sipariş verdi!`);
      
      setPendingOrders(prev => {
        // Prevent duplicates
        if (prev.some(o => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    });

    socketRef.current.on('orderStatusUpdate', (updatedOrder: PendingOrder) => {
      setPendingOrders(prev => {
        // If status is no longer PENDING, remove it
        if (updatedOrder.status !== 'PENDING') {
          return prev.filter(o => o.id !== updatedOrder.id);
        }
        return prev;
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  if (pendingOrders.length === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-20 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-full h-14 w-14 shadow-lg ${isOpen ? 'bg-secondary text-secondary-foreground' : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'}`}
        >
          <Receipt className="h-6 w-6" />
          <Badge className="absolute -top-2 -right-2 bg-white text-red-600 border-2 border-red-600 h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs font-bold">
            {pendingOrders.length}
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
            className="fixed bottom-24 right-6 z-50 w-80 max-h-[60vh] overflow-y-auto"
          >
            <Card className="shadow-2xl border-red-200">
              <div className="p-4 border-b bg-red-50 dark:bg-red-950/20 flex justify-between items-center sticky top-0 backdrop-blur-md">
                <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Bekleyen Siparişler ({pendingOrders.length})
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2 space-y-2">
                {pendingOrders.map(order => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-3 bg-muted/50 rounded-lg flex items-center justify-between group"
                    onClick={() => router.push(`/${window.location.pathname.split('/')[1]}/admin/orders`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Masa {order.table.tableNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                      Yeni
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
