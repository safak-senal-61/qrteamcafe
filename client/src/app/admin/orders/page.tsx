'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Receipt, ChefHat, CheckCircle2, XCircle, Armchair } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [printTable, setPrintTable] = useState<any | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [cafeId, setCafeId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!cafeId) return;
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(`${API_URL}/orders?cafeId=${cafeId}`),
        fetch(`${API_URL}/tables?cafeId=${cafeId}`)
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
  }, [cafeId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success('Durum güncellendi.');
        fetchData();
      } else {
        toast.error('Güncelleme başarısız.');
      }
    } catch (error) {
      toast.error('Hata oluştu.');
    }
  };

  const getTableItemsSummary = (tableId: string) => {
    const tableOrders = getTableOrders(tableId);
    const summary: { [key: string]: { name: string; quantity: number; total: number } } = {};

    tableOrders.forEach(order => {
      order.items.forEach((item: any) => {
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
    
    // Yazdırma için tabloyu sakla (selectedTable null olsa bile bu kalacak)
    setPrintTable(selectedTable);

    try {
      const res = await fetch(`${API_URL}/orders/table/${selectedTable.id}/pay`, {
        method: 'POST',
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
    } catch (error) {
      toast.error('Hata oluştu.');
    }
  };

  const getTableOrders = (tableId: string) => {
    return orders.filter(o => o.tableId === tableId && o.status !== 'PAID');
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

      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-3xl font-bold tracking-tight">Sipariş Yönetimi</h2>
        <Button onClick={fetchData} variant="outline" size="sm">Yenile</Button>
      </div>

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
                        <div key={order.id} className="mb-3 last:mb-0 border-b last:border-0 pb-2 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">#{order.id.slice(-4)}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item: any) => (
                              <div key={item.id} className="text-xs flex justify-between text-muted-foreground">
                                <span>{item.quantity}x {item.product.name}</span>
                                <span>{Number(item.totalPrice).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-2 justify-end">
                            {order.status === 'PENDING' && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-600" onClick={() => updateOrderStatus(order.id, 'PREPARING')} title="Hazırlanıyor">
                                <ChefHat className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status === 'PREPARING' && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => updateOrderStatus(order.id, 'DELIVERED')} title="Teslim Et">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => updateOrderStatus(order.id, 'CANCELLED')} title="İptal Et">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedTable(table);
                        setIsPayDialogOpen(true);
                      }}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Hesabı Kapat
                    </Button>
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
             <p className="text-sm text-muted-foreground">
               Onayladığınızda tüm aktif siparişler "Ödendi" olarak işaretlenecek ve masa boşaltılacaktır.
             </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>İptal</Button>
            <Button onClick={handlePayTable}>Ödemeyi Al ve Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
