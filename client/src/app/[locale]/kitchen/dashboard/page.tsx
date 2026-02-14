'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCcw, ChefHat, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWaiterSocket } from '@/providers/WaiterSocketProvider';

interface OrderItem {
  id: string;
  product: {
    name: string;
    category?: {
        name: string;
    };
  };
  quantity: number;
  note?: string;
}

interface Order {
  id: string;
  table?: {
    tableNumber: number;
  };
  status: string;
  items: OrderItem[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { socket } = useWaiterSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3');
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error('Audio play failed', e));
    }
  }, []);

  const checkAuth = useCallback(() => {
    const waiterInfo = localStorage.getItem('waiter-info');
    if (!waiterInfo) {
      router.push('/waiter/login');
      return null;
    }
    try {
      const parsed = JSON.parse(waiterInfo);
      if (parsed.role !== 'KITCHEN') {
        router.push('/waiter/dashboard');
        return null;
      }
      return parsed;
    } catch {
      router.push('/waiter/login');
      return null;
    }
  }, [router]);

  const fetchOrders = useCallback(async () => {
    const waiterInfo = checkAuth();
    if (!waiterInfo) return;

    try {
      setIsLoading(true);
      const res = await api.get(`/orders/active?cafeId=${waiterInfo.cafeId}`);
      // Only show orders relevant to kitchen: PENDING, PREPARING, READY
      // Optionally filter out DELIVERED if not needed, but API returns it.
      // We'll filter in the UI tabs.
      setOrders(res.data);
    } catch (error) {
      console.error('Orders fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Siparişler yüklenemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth, toast]);

  useEffect(() => {
    fetchOrders();
    // Backup polling every 60s
    const interval = setInterval(fetchOrders, 60000); 
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = (newOrder: Order) => {
      // Check if order is already in the list to avoid duplicates
      setOrders(prev => {
        if (prev.find(o => o.id === newOrder.id)) return prev;
        playNotification();
        toast({
            title: 'Yeni Sipariş!',
            description: `Masa ${newOrder.table?.tableNumber || '?'} yeni sipariş verdi.`,
        });
        return [newOrder, ...prev];
      });
    };

    const onOrderStatusUpdate = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    socket.on('newOrder', onNewOrder);
    socket.on('orderStatusUpdate', onOrderStatusUpdate);

    return () => {
      socket.off('newOrder', onNewOrder);
      socket.off('orderStatusUpdate', onOrderStatusUpdate);
    };
  }, [socket, playNotification, toast]);

  const handleLogout = () => {
    localStorage.removeItem('waiter-token');
    localStorage.removeItem('waiter-info');
    router.push('/waiter/login');
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast({
        title: 'Başarılı',
        description: `Sipariş durumu güncellendi: ${getStatusLabel(newStatus)}`,
      });
      fetchOrders();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Durum güncellenemedi.',
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Yeni Sipariş';
      case 'PREPARING': return 'Hazırlanıyor';
      case 'READY': return 'Hazır';
      case 'DELIVERED': return 'Teslim Edildi';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-red-100 text-red-800 border-red-200';
      case 'PREPARING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'READY': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className={`border-2 ${order.status === 'PENDING' ? 'border-red-500 animate-pulse' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">Masa {order.table?.tableNumber || '?'}</CardTitle>
          <Badge className={getStatusColor(order.status)} variant="outline">
            {getStatusLabel(order.status)}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          <span className="text-xs ml-1">
             ({Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000)} dk önce)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start border-b pb-2 last:border-0">
              <div className="font-bold text-lg">{item.quantity}x</div>
              <div className="flex-1 px-3">
                <div className="font-medium text-lg">{item.product.name}</div>
                {item.note && (
                  <div className="text-sm bg-yellow-100 text-yellow-800 p-1 rounded mt-1">
                    Not: {item.note}
                  </div>
                )}
                {item.product.category && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {item.product.category.name}
                    </div>
                )}
              </div>
            </div>
          ))}
          {order.note && (
             <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded border border-blue-200">
                <span className="font-bold text-xs block">Sipariş Notu:</span>
                {order.note}
             </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        {order.status === 'PENDING' && (
          <Button 
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" 
            size="lg"
            onClick={() => updateStatus(order.id, 'PREPARING')}
          >
            <ChefHat className="mr-2 h-5 w-5" /> Hazırla
          </Button>
        )}
        {order.status === 'PREPARING' && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            size="lg"
            onClick={() => updateStatus(order.id, 'READY')}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Hazır
          </Button>
        )}
        {order.status === 'READY' && (
            <div className="w-full text-center text-green-600 font-bold border border-green-200 bg-green-50 p-2 rounded">
                Servis Bekleniyor
            </div>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
           <h1 className="text-3xl font-bold flex items-center gap-2">
             <ChefHat className="h-8 w-8" />
             Mutfak Paneli
           </h1>
           <p className="text-muted-foreground">Aktif siparişleri buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Çıkış
            </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-12">
          <TabsTrigger value="pending" className="text-lg">
             Yeni <Badge className="ml-2 bg-red-500 hover:bg-red-600">{pendingOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="preparing" className="text-lg">
             Hazırlanan <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600">{preparingOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ready" className="text-lg">
             Hazır <Badge className="ml-2 bg-green-500 hover:bg-green-600">{readyOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="delivered" className="text-lg">
             Teslim Edilen ({deliveredOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xl bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    Yeni sipariş yok.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
            )}
        </TabsContent>

        <TabsContent value="preparing" className="space-y-4">
            {preparingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xl bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    Hazırlanan sipariş yok.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {preparingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
            )}
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
            {readyOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xl bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    Servis bekleyen sipariş yok.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {readyOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
            )}
        </TabsContent>
        
        <TabsContent value="delivered" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-75">
                {deliveredOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
