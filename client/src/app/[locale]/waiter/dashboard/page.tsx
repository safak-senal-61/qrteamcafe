'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Receipt, Bell, RefreshCcw, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export default function WaiterDashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]); // All calls list
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const handleCloseTable = (tableId: string) => {
    setIsPaymentDialogOpen(true);
  };

  // Order Creation State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchData = async () => {
    try {
      const waiterInfo = localStorage.getItem('waiter-info');
      if (!waiterInfo) return;
      const { cafeId } = JSON.parse(waiterInfo);

      // Fetch Tables
      const tablesRes = await api.get(`/tables?cafeId=${cafeId}`);
      setTables(tablesRes.data);

      // Fetch Active Orders
      const ordersRes = await api.get(`/orders/active?cafeId=${cafeId}`);
      setActiveOrders(ordersRes.data);

      // Fetch Menu Data (if not already loaded)
      if (categories.length === 0) {
        const [catRes, prodRes] = await Promise.all([
          api.get(`/categories?cafeId=${cafeId}`),
          api.get(`/products?cafeId=${cafeId}`)
        ]);
        setCategories(catRes.data);
        setProducts(prodRes.data);
      }

    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const getTableStatusColor = (table: Table) => {
    const hasBillRequest = table.waiterCalls.some(call => call.type === 'HESAP' || call.type === 'BILL');
    if (hasBillRequest) return 'bg-red-500 hover:bg-red-600 text-white';
    
    if (table.isOccupied) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    
    return 'bg-green-500 hover:bg-green-600 text-white';
  };

  const getTableStatusText = (table: Table) => {
    const hasBillRequest = table.waiterCalls.some(call => call.type === 'HESAP' || call.type === 'BILL');
    if (hasBillRequest) return 'HESAP İSTENDİ';
    if (table.isOccupied) return 'DOLU';
    return 'BOŞ';
  };

  const handlePayment = async (method: 'CASH' | 'CREDIT_CARD') => {
      if(!selectedTable) return;
      try {
          await api.post(`/orders/table/${selectedTable.id}/pay`, { paymentMethod: method });
          toast({ title: 'Masa kapatıldı', description: 'Ödeme alındı ve masa boşaltıldı.' });
          setIsPaymentDialogOpen(false);
          setSelectedTable(null);
          fetchData();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Hata', description: 'Masa kapatılamadı.' });
      }
  };

  const selectedTableOrders = selectedTable
    ? activeOrders.filter(o => o.table?.id === selectedTable.id)
    : [];

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: 'Ürün eklendi', description: `${product.name} sepete eklendi.` });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateNote = (productId: string, note: string) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, note } : item
    ));
  };

  const handleCreateOrder = async () => {
    if (!selectedTable || cart.length === 0) return;

    try {
      const waiterInfo = localStorage.getItem('waiter-info');
      if (!waiterInfo) return;
      const { id: waiterId, cafeId } = JSON.parse(waiterInfo);

      const orderData = {
        tableId: selectedTable.id,
        waiterId,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          note: item.note
        }))
      };

      await api.post(`/orders?cafeId=${cafeId}`, orderData);
      
      toast({ title: 'Sipariş oluşturuldu', description: 'Sipariş mutfağa iletildi.' });
      setCart([]);
      setIsNewOrderOpen(false);
      fetchData(); // Refresh orders
    } catch (error) {
      console.error('Order create error:', error);
      toast({ variant: 'destructive', title: 'Hata', description: 'Sipariş oluşturulamadı.' });
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Panel</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tables">Masalar</TabsTrigger>
          <TabsTrigger value="orders">Aktif Siparişler ({activeOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              <Card 
                key={table.id} 
                className={`cursor-pointer transition-colors ${getTableStatusColor(table)}`}
                onClick={() => setSelectedTable(table)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-32">
                  <div className="text-2xl font-bold mb-1">{table.tableNumber}</div>
                  <div className="text-xs font-medium opacity-90">{getTableStatusText(table)}</div>
                  {table.waiterCalls.length > 0 && (
                     <div className="mt-2 flex items-center justify-center bg-white/20 rounded-full px-2 py-1 text-xs">
                        <Bell className="w-3 h-3 mr-1" />
                        {table.waiterCalls.length}
                     </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {activeOrders.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                    Aktif sipariş bulunmuyor.
                </div>
             ) : (
                activeOrders.map(order => (
                    <Card key={order.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedOrder(order)}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">Masa {order.table?.tableNumber || '?'}</CardTitle>
                                <Badge variant={order.status === 'READY' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {order.items.slice(0, 3).map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.product.name}</span>
                                        <span className="font-medium">{item.totalPrice} ₺</span>
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="text-xs text-muted-foreground pt-1">
                                        + {order.items.length - 3} ürün daha...
                                    </div>
                                )}
                                <div className="pt-2 mt-2 border-t flex justify-between font-bold">
                                    <span>Toplam</span>
                                    <span>{order.totalAmount} ₺</span>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                    {new Date(order.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
             )}
           </div>
        </TabsContent>
      </Tabs>

      {/* Table Detail Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Masa {selectedTable?.tableNumber} Detayı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-2">
                <Button className="w-full" variant="outline" onClick={() => setIsNewOrderOpen(true)}>
                    <Utensils className="mr-2 h-4 w-4" /> Sipariş Ekle
                </Button>
                <Button 
                    className="w-full" 
                    variant="destructive"
                    onClick={() => selectedTable && handleCloseTable(selectedTable.id)}
                    disabled={!selectedTable?.isOccupied && selectedTableOrders.length === 0}
                >
                    <Receipt className="mr-2 h-4 w-4" /> Hesabı Kapat
                </Button>
             </div>
             
             {selectedTableOrders.length > 0 ? (
                 <div className="space-y-4">
                     {selectedTableOrders.map(order => (
                         <div key={order.id} className="bg-muted/50 p-3 rounded-lg space-y-2">
                             <div className="flex justify-between text-xs text-muted-foreground">
                                 <span>Sipariş #{order.id.slice(0, 8)}</span>
                                 <span>{new Date(order.createdAt).toLocaleTimeString('tr-TR')}</span>
                             </div>
                             <div className="space-y-1">
                                 {order.items.map(item => (
                                     <div key={item.id} className="flex justify-between text-sm">
                                         <div className="flex gap-2">
                                             <span className="font-bold w-6">{item.quantity}x</span>
                                             <span>{item.product.name}</span>
                                         </div>
                                         <span className="font-medium">{item.totalPrice} ₺</span>
                                     </div>
                                 ))}
                             </div>
                             {order.note && (
                                 <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-yellow-800 dark:text-yellow-200">
                                     Not: {order.note}
                                 </div>
                             )}
                             <div className="pt-2 border-t flex justify-between font-bold text-sm">
                                 <span>Ara Toplam</span>
                                 <span>{order.totalAmount} ₺</span>
                             </div>
                         </div>
                     ))}
                     
                     <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center">
                         <span className="font-bold text-lg">Genel Toplam</span>
                         <span className="font-bold text-xl text-primary">
                             {selectedTableOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2)} ₺
                         </span>
                     </div>
                 </div>
             ) : (
                 <div className="bg-muted p-8 rounded-lg text-center">
                    <p className="text-muted-foreground">Bu masaya ait aktif sipariş bulunmamaktadır.</p>
                 </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                     <Badge variant="outline">Masa {selectedOrder.table?.tableNumber}</Badge>
                     <Badge variant={selectedOrder.status === 'READY' ? 'default' : 'secondary'}>{selectedOrder.status}</Badge>
                 </div>
                 
                 <div className="space-y-2">
                     {selectedOrder.items.map(item => (
                         <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                             <div className="flex gap-2">
                                 <span className="font-bold w-6">{item.quantity}x</span>
                                 <span>{item.product.name}</span>
                             </div>
                             <span className="font-medium">{item.totalPrice} ₺</span>
                         </div>
                     ))}
                 </div>

                 {selectedOrder.note && (
                     <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-yellow-800 dark:text-yellow-200">
                         Not: {selectedOrder.note}
                     </div>
                 )}

                 <div className="pt-2 flex justify-between font-bold text-lg border-t">
                     <span>Toplam</span>
                     <span className="text-primary">{selectedOrder.totalAmount} ₺</span>
                 </div>

                 <div className="text-xs text-muted-foreground text-center pt-2">
                     Oluşturulma: {new Date(selectedOrder.createdAt).toLocaleTimeString('tr-TR')}
                 </div>
             </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ödeme Yöntemi Seçin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
              onClick={() => handlePayment('CASH')}
            >
              <span className="text-2xl">💵</span>
              <span>Nakit</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
              onClick={() => handlePayment('CREDIT_CARD')}
            >
              <span className="text-2xl">💳</span>
              <span>Kredi Kartı</span>
            </Button>
          </div>
          <div className="bg-muted p-4 rounded-lg text-center">
             <span className="text-sm text-muted-foreground">Toplam Tutar</span>
             <div className="text-2xl font-bold text-primary">
                {selectedTableOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2)} ₺
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Yeni Sipariş - Masa {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 overflow-hidden gap-4">
            {/* Left: Menu */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="h-12 mb-2">
                <div className="flex gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Tümü
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="font-bold">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.price} ₺</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Cart */}
            <div className="w-1/3 border-l pl-4 flex flex-col">
              <h3 className="font-bold mb-2">Sepet</h3>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-muted p-2 rounded text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.product.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-medium">
                          {item.product.price * item.quantity} ₺
                        </div>
                      </div>
                      <Input
                        placeholder="Not..."
                        className="h-6 text-xs mt-1"
                        value={item.note || ''}
                        onChange={(e) => updateNote(item.product.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam</span>
                  <span>
                    {cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)} ₺
                  </span>
                </div>
                <Button className="w-full" onClick={handleCreateOrder} disabled={cart.length === 0}>
                  Siparişi Tamamla
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
