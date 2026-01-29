'use client';

import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Receipt, ChefHat, CheckCircle2, XCircle, Armchair, ArrowRightLeft, MessageSquare } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  productId: string;
  totalPrice: number | string;
  product: {
    name: string;
  };
  note?: string;
  options?: string;
}

interface Order {
  id: string;
  tableId: string;
  createdAt: string;
  status: string;
  totalAmount: number | string;
  note?: string;
  items: OrderItem[];
}

interface Table {
  id: string;
  tableNumber: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [printTable, setPrintTable] = useState<Table | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState('active');

  // Move Table State
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveSourceTable, setMoveSourceTable] = useState<Table | null>(null);
  const [moveTargetTableId, setMoveTargetTableId] = useState<string>('');
  
  const [cafeId, setCafeId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!cafeId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(`${API_URL}/orders?cafeId=${cafeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/tables?cafeId=${cafeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (ordersRes.ok && tablesRes.ok) {
        setOrders(await ordersRes.json());
        setTables(await tablesRes.json());
      }
    } catch (error) {
      console.error(error);
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [cafeId]);

  const handleMoveTable = async () => {
    if (!moveSourceTable || !moveTargetTableId || !cafeId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/tables/move?cafeId=${cafeId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fromTableId: moveSourceTable.id,
          toTableId: moveTargetTableId
        })
      });

      if (res.ok) {
        toast.success('Masa başarıyla taşındı.');
        setIsMoveDialogOpen(false);
        setMoveSourceTable(null);
        setMoveTargetTableId('');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Masa taşınamadı.');
      }
    } catch (_error) {
      console.error(_error);
      toast.error('Bir hata oluştu.');
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCafeId(user.cafeId);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Gerçek zamanlı güncellemeler için socket eklenebilir
    // Şimdilik polling ile 10 saniyede bir güncelleme
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [cafeId, fetchData]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success('Durum güncellendi.');
        fetchData();
      } else {
        toast.error('Güncelleme başarısız.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Hata oluştu.');
    }
  };

  const getTableItemsSummary = (tableId: string) => {
    const tableOrders = getTableOrders(tableId);
    const summary: { [key: string]: { name: string; quantity: number; total: number } } = {};

    tableOrders.forEach(order => {
      order.items.forEach((item: OrderItem) => {
        if (!summary[item.productId]) {
          summary[item.productId] = { 
            name: item.product.name, 
            quantity: 0, 
            total: 0 
          };
        }
        summary[item.productId].quantity += item.quantity;
        summary[item.productId].total += Number(item.totalPrice);
      });
    });

    return Object.values(summary);
  };

  const handlePayTable = async () => {
    if (!selectedTable) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Yazdırma için tabloyu sakla (selectedTable null olsa bile bu kalacak)
    setPrintTable(selectedTable);

    try {
      const res = await fetch(`${API_URL}/orders/table/${selectedTable.id}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Hesap kapatıldı. Toplam: ${Number(data.totalAmount).toFixed(2)} ₺`);
        
        setIsPayDialogOpen(false);
        setSelectedTable(null);
        fetchData();
        
        // DOM güncellemesi için kısa bir gecikme
        setTimeout(() => {
            window.print();
            // Yazdırma bitince (veya pencere kapanınca) printTable'ı temizle
            // Not: window.print() bloklayan bir işlem olduğu için bu satır yazdırma penceresi kapandıktan sonra çalışır (çoğu tarayıcıda)
            // Ama garanti olsun diye timeout içinde de yapabiliriz veya kullanıcıya bırakabiliriz.
            // Şimdilik temizlemiyoruz ki yazıcı penceresinde kalsın.
        }, 100);

      } else {
        const err = await res.json();
        toast.error(err.message || 'Ödeme işlemi başarısız.');
      }
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  const getFilteredOrders = () => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'active':
          return o.status !== 'PAID' && o.status !== 'CANCELLED' && o.status !== 'COMPLETED';
        case 'today':
          return orderDate >= today;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
          return orderDay.getTime() === yesterday.getTime();
        case 'week':
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          return orderDate >= lastWeek;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getTableNumber = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.tableNumber : '-';
  };

  const getTableOrders = (tableId: string) => {
    return orders.filter(o => {
      // Filter by Table ID
      if (o.tableId !== tableId) return false;

      // Filter by Date/Status
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'active':
          return o.status !== 'PAID' && o.status !== 'CANCELLED' && o.status !== 'COMPLETED';
        case 'today':
          return orderDate >= today;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
          return orderDay.getTime() === yesterday.getTime();
        case 'week':
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          return orderDate >= lastWeek;
        default:
          return true;
      }
    });
  };

  const calculateTableTotal = (tableId: string) => {
    const tableOrders = getTableOrders(tableId);
    return tableOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Bekliyor</Badge>;
      case 'PREPARING': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Hazırlanıyor</Badge>;
      case 'DELIVERED': return <Badge variant="secondary" className="bg-green-100 text-green-800">Teslim Edildi</Badge>;
      case 'CANCELLED': return <Badge variant="secondary" className="bg-red-100 text-red-800">İptal</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Hidden Print Section */}
      <div className="hidden print:block print-area">
        {printTable && (
          <div className="print-content">
            <div className="text-center mb-4 border-b-2 border-black border-dashed pb-2">
              <h1 className="text-xl font-bold uppercase tracking-wider">QR Cafe Team</h1>
              <p className="text-xs mt-1">Sipariş Fişi</p>
            </div>
            
            <div className="text-xs mb-3 font-mono">
              <div className="flex justify-between">
                <span>Tarih:</span>
                <span>{new Date().toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Saat:</span>
                <span>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between font-bold mt-1">
                <span>Masa No:</span>
                <span className="text-lg">{printTable.tableNumber}</span>
              </div>
            </div>

            <div className="border-t-2 border-b-2 border-black border-dashed py-2 mb-2">
              <div className="flex justify-between font-bold text-xs mb-1">
                <span className="w-8">Adet</span>
                <span className="flex-1 text-left px-1">Ürün</span>
                <span className="w-12 text-right">Tutar</span>
              </div>
              {getTableItemsSummary(printTable.id).map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-mono mb-1">
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="flex-1 text-left px-1 truncate">{item.name}</span>
                  <span className="w-12 text-right">{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-lg font-bold border-b-2 border-black border-dashed pb-2 mb-4">
              <span>TOPLAM</span>
              <span>{calculateTableTotal(printTable.id).toFixed(2)} ₺</span>
            </div>

            <div className="text-center text-[10px] font-mono space-y-1">
              <p>*** Mali Değeri Yoktur ***</p>
              <p>Bizi tercih ettiğiniz için teşekkürler.</p>
              <p>Afiyet Olsun!</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Sipariş Yönetimi</h2>
          <Button onClick={fetchData} variant="outline" size="sm">Yenile</Button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {[
              { id: 'active', label: 'Aktif Siparişler' },
              { id: 'today', label: 'Bugün' },
              { id: 'yesterday', label: 'Dün' },
              { id: 'week', label: 'Son 7 Gün' },
            ].map((filter) => (
              <Badge
                key={filter.id}
                variant={dateFilter === filter.id ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer whitespace-nowrap px-3 py-1.5 transition-all hover:scale-105 active:scale-95",
                  dateFilter === filter.id 
                    ? "bg-primary hover:bg-primary/90 border-primary shadow-sm text-primary-foreground" 
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary/20 border-gray-200 text-gray-600 bg-white"
                )}
                onClick={() => setDateFilter(filter.id)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {dateFilter === 'active' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => {
          const activeOrders = getTableOrders(table.id);
          const totalAmount = calculateTableTotal(table.id);
          const hasActiveOrders = activeOrders.length > 0;

          return (
            <Card key={table.id} className={`relative ${hasActiveOrders ? 'border-primary/50 shadow-md' : 'opacity-70'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Armchair className="h-5 w-5" />
                  Masa {table.tableNumber}
                </CardTitle>
                {hasActiveOrders && (
                  <Badge variant="default" className="text-lg px-3">
                    {totalAmount.toFixed(2)} ₺
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {hasActiveOrders ? (
                  <div className="space-y-4">
                    <ScrollArea className="h-[200px] w-full rounded-md border p-2 bg-secondary/10">
                      {activeOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="mb-3 last:mb-0 border-b last:border-0 pb-2 last:pb-0 cursor-pointer hover:bg-background/80 p-2 rounded-md transition-colors border border-transparent hover:border-primary/20"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">#{order.id.slice(-4)}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          
                          {/* Order Note - Visible on Card */}
                          {order.note && (
                            <div className="text-xs bg-amber-100 text-amber-800 p-1.5 rounded mb-2 font-medium border border-amber-200 flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="break-words">{order.note}</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            {order.items.map((item: OrderItem) => (
                              <div key={item.id} className="text-xs flex flex-col gap-1 text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>{item.quantity}x {item.product.name}</span>
                                  <span>{Number(item.totalPrice).toFixed(2)}</span>
                                </div>
                                
                                {/* Item Note - Visible on Card */}
                                {item.note && (
                                  <div className="flex items-start gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit max-w-full">
                                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span className="break-words">{item.note}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            {order.status === 'PENDING' && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => updateOrderStatus(order.id, 'PREPARING')} title="Hazırlanıyor">
                                <ChefHat className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status === 'PREPARING' && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={() => updateOrderStatus(order.id, 'DELIVERED')} title="Teslim Et">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateOrderStatus(order.id, 'CANCELLED')} title="İptal Et">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="flex gap-2 w-full">
                      <Button 
                        className="flex-1" 
                        onClick={() => {
                          setSelectedTable(table);
                          setIsPayDialogOpen(true);
                        }}
                      >
                        <Receipt className="mr-2 h-4 w-4" />
                        Hesabı Kapat
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Masayı Taşı"
                        onClick={() => {
                          setMoveSourceTable(table);
                          setIsMoveDialogOpen(true);
                        }}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
                    Aktif sipariş yok
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      ) : (
        <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Masa</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İçerik</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredOrders().length > 0 ? (
                getFilteredOrders().map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(-4)}</TableCell>
                    <TableCell>Masa {getTableNumber(order.tableId)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString('tr-TR')}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[300px] truncate" title={order.items.map((i: OrderItem) => `${i.quantity}x ${i.product.name}`).join(', ')}>
                        {order.items.map((i: OrderItem) => `${i.quantity}x ${i.product.name}`).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>{Number(order.totalAmount).toFixed(2)} ₺</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                   <TableCell colSpan={6} className="h-24 text-center">
                     Bu tarih aralığında sipariş bulunamadı.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masa {selectedTable?.tableNumber} - Hesabı Kapat</DialogTitle>
            <DialogDescription>
              Aşağıdaki tutar tahsil edilecek ve masa kapatılacaktır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
             {/* Dialog Content Summary */}
             <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Sipariş Özeti</h4>
                <div className="space-y-2 border rounded-lg p-3 bg-secondary/10">
                  {selectedTable && getTableItemsSummary(selectedTable.id).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.total.toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="flex justify-between items-center text-2xl font-bold">
               <span>Toplam Tutar:</span>
               <span className="text-primary">{selectedTable ? calculateTableTotal(selectedTable.id).toFixed(2) : 0} ₺</span>
             </div>
             <Separator className="my-4" />
             <DialogDescription>
               Onayladığınızda tüm aktif siparişler &quot;Ödendi&quot; olarak işaretlenecek ve masa boşaltılacaktır.
             </DialogDescription>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>İptal</Button>
            <Button onClick={handlePayTable}>Ödemeyi Al ve Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Sipariş Detayı #{selectedOrder?.id.slice(-4)}
            </DialogTitle>
            <DialogDescription>
              Masa {selectedOrder && getTableNumber(selectedOrder.tableId)} - {new Date(selectedOrder?.createdAt || '').toLocaleString('tr-TR')}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Order Note */}
              {selectedOrder?.note && (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                    <MessageSquare className="w-4 h-4" />
                    Sipariş Notu
                  </div>
                  <p className="text-sm text-amber-900">{selectedOrder.note}</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Ürünler</h4>
                {selectedOrder?.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex justify-between items-start font-medium">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 rounded-full bg-primary/10 border-primary/20 text-primary">
                          {item.quantity}
                        </Badge>
                        <span>{item.product.name}</span>
                      </div>
                      <span>{Number(item.totalPrice).toFixed(2)} ₺</span>
                    </div>
                    
                    {/* Options (if parsable) */}
                    {item.options && item.options !== '{}' && (
                      <div className="text-xs text-muted-foreground mt-2 pl-8">
                        {(() => {
                          try {
                            const opts = JSON.parse(item.options);
                            return Object.entries(opts).map(([key, value]) => (
                              <div key={key} className="flex gap-1">
                                <span className="font-medium">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ));
                          } catch {
                            return item.options;
                          }
                        })()}
                      </div>
                    )}

                    {/* Item Note */}
                    {item.note && (
                      <div className="mt-2 pl-8">
                        <div className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded inline-flex items-center gap-1 border border-amber-100">
                          <MessageSquare className="w-3 h-3" />
                          {item.note}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-4 sm:justify-between items-center border-t pt-4">
             <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Durum</span>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
             </div>
             <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Toplam Tutar</span>
                  <span className="font-bold text-xl text-primary">{Number(selectedOrder?.totalAmount).toFixed(2)} ₺</span>
                </div>
                <Button onClick={() => setIsDetailsDialogOpen(false)}>Kapat</Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masa Taşıma: Masa {moveSourceTable?.tableNumber}</DialogTitle>
            <DialogDescription>
              Bu masadaki siparişleri başka bir masaya taşıyın veya birleştirin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <label className="block text-sm font-medium mb-2">Hedef Masa</label>
             <select 
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
               value={moveTargetTableId}
               onChange={(e) => setMoveTargetTableId(e.target.value)}
             >
               <option value="">Masa seçiniz</option>
               {tables
                 .filter(t => t.id !== moveSourceTable?.id)
                 .map(t => {
                   const isActive = getTableOrders(t.id).length > 0;
                   return (
                     <option key={t.id} value={t.id}>
                       Masa {t.tableNumber} {isActive ? '(Dolu - Birleştir)' : '(Boş)'}
                     </option>
                   );
                 })
               }
             </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>İptal</Button>
            <Button onClick={handleMoveTable} disabled={!moveTargetTableId}>Taşı</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Sipariş Detayı #{selectedOrder?.id.slice(-4)}
            </DialogTitle>
            <DialogDescription>
              Masa {selectedOrder && getTableNumber(selectedOrder.tableId)} - {new Date(selectedOrder?.createdAt || '').toLocaleString('tr-TR')}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Order Note */}
              {selectedOrder?.note && (
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                    <MessageSquare className="w-4 h-4" />
                    Sipariş Notu
                  </div>
                  <p className="text-sm text-amber-900">{selectedOrder.note}</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Ürünler</h4>
                {selectedOrder?.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex justify-between items-start font-medium">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 rounded-full bg-primary/10 border-primary/20 text-primary">
                          {item.quantity}
                        </Badge>
                        <span>{item.product.name}</span>
                      </div>
                      <span>{Number(item.totalPrice).toFixed(2)} ₺</span>
                    </div>
                    
                    {/* Options (if parsable) */}
                    {item.options && item.options !== '{}' && (
                      <div className="text-xs text-muted-foreground mt-2 pl-8">
                        {(() => {
                          try {
                            const opts = JSON.parse(item.options);
                            return Object.entries(opts).map(([key, value]) => (
                              <div key={key} className="flex gap-1">
                                <span className="font-medium">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ));
                          } catch {
                            return item.options;
                          }
                        })()}
                      </div>
                    )}

                    {/* Item Note */}
                    {item.note && (
                      <div className="mt-2 pl-8">
                        <div className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded inline-flex items-center gap-1 border border-amber-100">
                          <MessageSquare className="w-3 h-3" />
                          {item.note}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-4 sm:justify-between items-center border-t pt-4">
             <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Durum</span>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
             </div>
             <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Toplam Tutar</span>
                  <span className="font-bold text-xl text-primary">{Number(selectedOrder?.totalAmount).toFixed(2)} ₺</span>
                </div>
                <Button onClick={() => setIsDetailsDialogOpen(false)}>Kapat</Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
