'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Receipt, Bell, RefreshCcw, CheckCircle2, Clock, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWaiterSocket } from '@/providers/WaiterSocketProvider';
import { cn } from '@/lib/utils';

interface WaiterCall {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}

interface Table {
  id: string;
  tableNumber: number;
  isOccupied: boolean;
  waiterCalls: WaiterCall[];
}

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
  status: string;
}

interface Order {
  id: string;
  tableId?: string;
  table?: {
    id: string;
    tableNumber: number;
  };
  status: string;
  items: OrderItem[];
  totalAmount: number;
  note?: string;
  createdAt: string;
}

export default function WaiterDashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { socket } = useWaiterSocket();
  const [activeTab, setActiveTab] = useState('tables');
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Table & Order Selection
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Audio Context Ref
  // const audioContextRef = useState<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      
      setAudioEnabled(true);
    } catch (e) {
      console.error('Audio play failed', e);
      setAudioEnabled(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const waiterInfo = localStorage.getItem('waiter-info');
      if (!waiterInfo) return;
      const { cafeId } = JSON.parse(waiterInfo);

      const [tablesRes, ordersRes] = await Promise.all([
        api.get(`/tables?cafeId=${cafeId}`),
        api.get(`/orders/active?cafeId=${cafeId}`)
      ]);

      setTables(tablesRes.data);
      setActiveOrders(ordersRes.data);
    } catch (error) {
      console.error('Data fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Veriler yüklenirken bir sorun oluştu.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial Fetch & Socket Listeners
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: Order) => {
      // Add new order to list
      setActiveOrders(prev => [order, ...prev]);
      // Update table status
      setTables(prev => prev.map(t => 
        t.id === order.tableId || t.tableNumber === order.table?.tableNumber
          ? { ...t, isOccupied: true } 
          : t
      ));
      
      setNewOrderCount(prev => prev + 1);
      
      // Play notification sound
      if (audioEnabled) {
        playNotificationSound();
      }
    };

    const handleOrderStatusUpdate = (updatedOrder: Order) => {
      setActiveOrders(prev => prev.map(o => 
        o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
      ));
      
      // If order is completed/paid, refresh to sync table status
      if (['COMPLETED', 'PAID', 'CANCELLED'].includes(updatedOrder.status)) {
         fetchData(); 
      }
    };

    const handleWaiterCall = (call: { tableNumber: number; type: string }) => {
        setTables(prev => prev.map(t => {
            if (t.tableNumber === call.tableNumber) {
                const existingCall = t.waiterCalls.find(c => c.type === call.type);
                if (!existingCall) {
                     return {
                        ...t,
                        waiterCalls: [...t.waiterCalls, { 
                            id: Date.now().toString(), 
                            type: call.type, 
                            status: 'PENDING', 
                            createdAt: new Date().toISOString() 
                        }]
                     };
                }
            }
            return t;
        }));
        
        toast({
            title: call.type === 'HESAP' || call.type === 'BILL' ? 'Hesap İstendi!' : 'Garson Çağırıldı!',
            description: `Masa ${call.tableNumber}`,
            variant: call.type === 'HESAP' || call.type === 'BILL' ? 'destructive' : 'default',
        });
        
        if (audioEnabled) {
          playNotificationSound();
        }
    };

    const handleTableUpdate = () => {
        fetchData();
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdate', handleOrderStatusUpdate);
    socket.on('waiterCall', handleWaiterCall);
    socket.on('activeTablesUpdate', handleTableUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdate', handleOrderStatusUpdate);
      socket.off('waiterCall', handleWaiterCall);
      socket.off('activeTablesUpdate', handleTableUpdate);
    };
  }, [socket, fetchData, toast, audioEnabled, playNotificationSound]);

  // --- Helper Functions ---

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getTableStatusColor = (table: Table) => {
    const hasBillRequest = table.waiterCalls.some(call => call.type === 'HESAP' || call.type === 'BILL');
    const hasWaiterCall = table.waiterCalls.some(call => call.type === 'GARSON');
    
    if (hasBillRequest) return 'bg-red-500 hover:bg-red-600 border-red-600 text-white';
    if (hasWaiterCall) return 'bg-orange-500 hover:bg-orange-600 border-orange-600 text-white';
    if (table.isOccupied) return 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white';
    
    return 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white';
  };

  const getTableStatusText = (table: Table) => {
    const hasBillRequest = table.waiterCalls.some(call => call.type === 'HESAP' || call.type === 'BILL');
    const hasWaiterCall = table.waiterCalls.some(call => call.type === 'GARSON');

    if (hasBillRequest) return 'HESAP';
    if (hasWaiterCall) return 'ÇAĞRI';
    if (table.isOccupied) return 'DOLU';
    return 'BOŞ';
  };

  const handlePayment = async (method: 'CASH' | 'CREDIT_CARD') => {
      if(!selectedTable) return;
      try {
          await api.post(`/orders/table/${selectedTable.id}/pay`, { paymentMethod: method });
          toast({ title: 'Başarılı', description: 'Ödeme alındı ve masa kapatıldı.' });
          setIsPaymentDialogOpen(false);
          setSelectedTable(null);
          fetchData(); // Refresh data
      } catch {
          toast({ variant: 'destructive', title: 'Hata', description: 'İşlem başarısız oldu.' });
      }
  };

  const selectedTableOrders = (table: Table | null) => {
    if (!table) return [];
    return activeOrders.filter(o => o.table?.id === table.id || (o.table && o.table.tableNumber === table.tableNumber));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalActiveOrders = activeOrders.length;
  const occupiedTables = tables.filter(t => t.isOccupied).length;
  const waiterCalls = tables.reduce((acc, t) => acc + t.waiterCalls.length, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Header & Stats */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="w-full p-2 md:p-4">
            <div className="flex flex-row justify-between items-center gap-2 mb-2 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                   <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg">
                      <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                   </div>
                   <div>
                      <h1 className="text-lg md:text-2xl font-bold text-gray-800">Garson Paneli</h1>
                      <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">qrders Yönetim</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!audioEnabled ? (
                    <Button onClick={playNotificationSound} variant="outline" size="sm" className="h-8 md:h-9 text-xs gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700">
                      <Bell className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden md:inline">Sesi Aç</span>
                    </Button>
                  ) : (
                    <Button onClick={() => setAudioEnabled(false)} variant="ghost" size="sm" className="h-8 md:h-9 text-xs gap-2 text-green-600 hover:bg-green-50 hover:text-green-700">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden md:inline">Ses Açık</span>
                    </Button>
                  )}
                  <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8 w-8 p-0 md:w-auto md:h-9 md:px-3 md:py-2 gap-2 shadow-sm rounded-full md:rounded-md">
                     <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} /> <span className="hidden md:inline">Yenile</span>
                  </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-6">
                <div className="bg-blue-50 border border-blue-100 p-2 md:p-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 text-center md:text-left">
                    <div className="bg-blue-500 text-white p-1.5 md:p-2 rounded-full">
                        <Utensils className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-blue-600 font-semibold uppercase leading-tight">Aktif<br className="md:hidden" /> Sipariş</p>
                        <p className="text-lg md:text-xl font-bold text-blue-900 leading-none">{totalActiveOrders}</p>
                    </div>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-2 md:p-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 text-center md:text-left">
                    <div className="bg-orange-500 text-white p-1.5 md:p-2 rounded-full">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-orange-600 font-semibold uppercase leading-tight">Dolu<br className="md:hidden" /> Masa</p>
                        <p className="text-lg md:text-xl font-bold text-orange-900 leading-none">{occupiedTables}</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 p-2 md:p-3 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 text-center md:text-left">
                    <div className="bg-red-500 text-white p-1.5 md:p-2 rounded-full">
                        <Bell className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-red-600 font-semibold uppercase leading-tight">Çağrılar</p>
                        <p className="text-lg md:text-xl font-bold text-red-900 leading-none">{waiterCalls}</p>
                    </div>
                </div>
            </div>
          </div>
      </div>

      <div className="w-full p-2 md:p-4 space-y-4 md:space-y-6 mt-2 md:mt-4">
        {newOrderCount > 0 && (
            <div 
                className="bg-red-600 text-white p-3 md:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 shadow-xl shadow-red-200 cursor-pointer border border-red-700"
                onClick={() => {
                    setActiveTab('orders');
                    setNewOrderCount(0);
                }}
            >
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="bg-white/20 p-2 md:p-3 rounded-full animate-pulse">
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                <h4 className="font-bold text-lg md:text-xl">Yeni Sipariş Var!</h4>
                <p className="text-white/90 text-xs md:text-sm font-medium">
                    {newOrderCount} adet yeni sipariş onay bekliyor.
                </p>
                </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto bg-white text-red-600 hover:bg-gray-100 border-0 font-bold shadow-sm">
                Siparişleri Gör
            </Button>
            </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] p-1 bg-white border shadow-sm rounded-xl mx-auto md:mx-0 h-auto">
            <TabsTrigger value="tables" className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 font-medium py-2 text-xs sm:text-sm">
                Masalar
                {waiterCalls > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-[10px] sm:text-xs">
                        {waiterCalls}
                    </Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 font-medium py-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">Aktif&nbsp;</span>Siparişler
                {activeOrders.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground text-[10px] sm:text-xs">
                        {activeOrders.length}
                    </Badge>
                )}
            </TabsTrigger>
            </TabsList>

            {/* TABLES TAB */}
            <TabsContent value="tables" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {tables.map(table => (
                <Card 
                    key={table.id} 
                    className={cn(
                        "transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-0 relative overflow-hidden group shadow-md cursor-pointer",
                        getTableStatusColor(table)
                    )}
                    onClick={() => setSelectedTable(table)}
                >
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 font-semibold shadow-sm text-[10px] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5">
                            {getTableStatusText(table)}
                        </Badge>
                    </div>

                    <CardContent className="p-4 flex flex-col items-center justify-center min-h-[100px] md:min-h-[140px]">
                        <span className="text-4xl md:text-5xl font-bold mb-2 tracking-tighter shadow-sm">{table.tableNumber}</span>
                        <div className="flex gap-2 mt-1 md:mt-2 h-5 md:h-6">
                            {table.waiterCalls.map((call, idx) => (
                                <div key={idx} className="bg-white/30 p-1 md:p-1.5 rounded-full animate-pulse shadow-sm" title={call.type}>
                                    {call.type === 'HESAP' || call.type === 'BILL' ? <Receipt className="w-3 h-3 md:w-4 md:h-4" /> : <Bell className="w-3 h-3 md:w-4 md:h-4" />}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
            </TabsContent>

            {/* ACTIVE ORDERS TAB */}
            <TabsContent value="orders">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeOrders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm">
                        <Utensils className="w-16 h-16 mb-4 opacity-10" />
                        <h3 className="text-lg font-medium text-gray-900">Aktif sipariş bulunmuyor</h3>
                        <p className="text-sm">Yeni siparişler buraya düşecek.</p>
                    </div>
                ) : (
                    activeOrders.map(order => (
                        <Card key={order.id} className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg border-l-4 border-l-primary group overflow-hidden" onClick={() => setSelectedOrder(order)}>
                            <CardHeader className="pb-3 border-b bg-gray-50/50 p-3 md:p-6">
                                <div className="flex flex-wrap justify-between items-center gap-2">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm md:text-lg shadow-sm">
                                            {order.table?.tableNumber || '?'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm md:text-base font-bold">Masa {order.table?.tableNumber}</CardTitle>
                                            <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={order.status === 'READY' ? 'default' : 'secondary'} className={cn("px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs", order.status === 'READY' ? "bg-green-600 hover:bg-green-700" : "")}>
                                        {order.status === 'READY' ? 'HAZIR' : order.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-3 md:pt-4 p-3 md:p-6">
                                <div className="space-y-3">
                                    {order.items.slice(0, 4).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm items-start group-hover:bg-gray-50/50 p-1 rounded transition-colors">
                                            <div className="flex gap-2">
                                                <span className="font-bold text-primary w-5 text-right">{item.quantity}x</span>
                                                <span className="text-gray-700 font-medium">{item.product.name}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{item.totalPrice} ₺</span>
                                        </div>
                                    ))}
                                    {order.items.length > 4 && (
                                        <div className="text-xs text-primary font-medium text-center pt-2 border-t mt-2">
                                            + {order.items.length - 4} ürün daha...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50/80 border-t p-3 flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-medium">Toplam Tutar</span>
                                <span className="text-xl font-bold text-primary">{order.totalAmount} ₺</span>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
            </TabsContent>
        </Tabs>

        {/* TABLE DETAIL DIALOG */}
        <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
            <DialogContent className="w-[95%] max-w-md rounded-xl md:rounded-2xl p-4 md:p-6">
            <DialogHeader className="border-b pb-3 md:pb-4">
                <DialogTitle className="text-xl md:text-2xl flex items-center gap-2 md:gap-3">
                    <span className="bg-primary text-primary-foreground w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-lg shadow-sm">
                        {selectedTable?.tableNumber}
                    </span>
                    <div className="flex flex-col text-left">
                        <span>Masa Detayı</span>
                        <span className="text-xs md:text-sm font-normal text-muted-foreground">Durum ve İşlemler</span>
                    </div>
                </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 md:space-y-6 py-2 md:py-4">
                {/* Waiter Calls */}
                {selectedTable?.waiterCalls && selectedTable.waiterCalls.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg md:rounded-xl p-3 md:p-4 space-y-2 md:space-y-3 animate-in fade-in zoom-in-95">
                        <h4 className="font-semibold text-red-700 flex items-center gap-2 text-sm md:text-base">
                            <Bell className="w-4 h-4 md:w-5 md:h-5" /> Bekleyen Çağrılar
                        </h4>
                        <div className="space-y-2">
                            {selectedTable.waiterCalls.map(call => (
                                <div key={call.id} className="flex justify-between items-center text-xs md:text-sm text-red-700 bg-white p-2 md:p-3 rounded-md md:rounded-lg border border-red-100 shadow-sm">
                                    <span className="font-medium">{call.type === 'HESAP' || call.type === 'BILL' ? 'Hesap İstendi' : 'Garson Çağrıldı'}</span>
                                    <span className="text-[10px] md:text-xs opacity-70 bg-red-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">{new Date(call.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                            ))}
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full mt-1 md:mt-2 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs md:text-sm h-8 md:h-9"
                            onClick={async () => {
                                toast({ description: "Bildirimler temizlendi" });
                                // In a real app, you would call an API to clear these
                            }}
                        >
                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Bildirimleri Temizle
                        </Button>
                    </div>
                )}

                {/* Active Orders for Table */}
                <div className="space-y-2 md:space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-gray-800 text-sm md:text-base">
                        <Utensils className="w-3 h-3 md:w-4 md:h-4 text-primary" /> Masa Siparişleri
                    </h4>
                    {selectedTableOrders(selectedTable).length > 0 ? (
                        <ScrollArea className="h-[200px] md:h-[240px] border rounded-lg md:rounded-xl p-2 md:p-3 bg-gray-50">
                            {selectedTableOrders(selectedTable).map(order => (
                                <div key={order.id} className="mb-3 md:mb-4 last:mb-0 bg-white p-2 md:p-3 rounded-lg border shadow-sm">
                                    <div className="flex justify-between items-center mb-2 md:mb-3 border-b pb-1 md:pb-2 border-dashed">
                                        <Badge variant="outline" className="text-[10px] md:text-xs font-normal px-1.5 py-0.5">{order.status}</Badge>
                                        <span className="font-bold text-primary text-sm md:text-base">{order.totalAmount} ₺</span>
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs md:text-sm">
                                                <div className="flex gap-1.5 md:gap-2">
                                                    <span className="font-bold text-gray-500 w-4">{item.quantity}x</span>
                                                    <span className="text-gray-800 line-clamp-1">{item.product.name}</span>
                                                </div>
                                                <span className="font-medium">{item.totalPrice} ₺</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    ) : (
                        <div className="text-center py-6 md:py-8 text-muted-foreground bg-gray-50 rounded-lg md:rounded-xl border border-dashed">
                            <Utensils className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs md:text-sm">Bu masada aktif sipariş yok</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {selectedTableOrders(selectedTable).length > 0 && (
                    <div className="pt-1 md:pt-2">
                        <Button 
                            size="lg"
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200 h-10 md:h-11 text-sm md:text-base" 
                            onClick={() => setIsPaymentDialogOpen(true)}
                        >
                            <Receipt className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Ödeme Al ve Masayı Kapat
                        </Button>
                    </div>
                )}
            </div>
            </DialogContent>
        </Dialog>

        {/* PAYMENT CONFIRMATION DIALOG */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent className="max-w-sm text-center rounded-2xl">
            <DialogHeader>
                <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-green-600" />
                </div>
                <DialogTitle className="text-xl">Masa {selectedTable?.tableNumber} Kapatılıyor</DialogTitle>
                <DialogDescription>
                    Ödeme alındıktan sonra masa boş olarak işaretlenecektir.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-6">
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg" onClick={() => handlePayment('CASH')}>
                    Nakit Ödeme
                </Button>
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg" onClick={() => handlePayment('CREDIT_CARD')}>
                    Kredi Kartı
                </Button>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)} className="w-full">İptal</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* ORDER DETAIL DIALOG (FOR ACTIVE ORDERS TAB) */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Sipariş Detayı</span>
                        <Badge variant="outline" className="text-base px-3 py-1 bg-primary/10 text-primary border-0">
                            Masa {selectedOrder?.table?.tableNumber}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        {new Date(selectedOrder?.createdAt || '').toLocaleString('tr-TR')}
                    </DialogDescription>
                </DialogHeader>
                {selectedOrder && (
                    <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                            <span className="text-sm font-medium text-muted-foreground">Durum</span>
                            <Badge variant={selectedOrder.status === 'READY' ? 'default' : 'secondary'} className="text-sm">
                                {selectedOrder.status === 'READY' ? 'HAZIR' : selectedOrder.status}
                            </Badge>
                        </div>
                        
                        <ScrollArea className="max-h-[350px] pr-4">
                            <div className="space-y-4">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex gap-3">
                                            <span className="font-bold bg-gray-100 w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-700">
                                                {item.quantity}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.product.name}</p>
                                                {item.note && (
                                                    <p className="text-xs text-orange-600 italic mt-1 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
                                                        Not: {item.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-semibold text-gray-900 whitespace-nowrap">{item.totalPrice} ₺</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        
                        <div className="bg-primary/5 p-4 rounded-xl flex justify-between items-center border border-primary/10">
                            <span className="font-medium text-gray-600">Toplam Tutar</span>
                            <span className="text-2xl font-bold text-primary">{selectedOrder.totalAmount} ₺</span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
