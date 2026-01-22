import { useState, useEffect } from 'react';
import { useCustomerStore } from '@/store/customer-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ShoppingBag, Clock, MapPin, ChevronRight, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateReviewDialog } from './CreateReviewDialog';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    requiresPreparation?: boolean;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

interface Review {
  id: string;
  productId: string;
  rating: number;
  comment?: string;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED' | 'PAID';
  totalAmount: number;
  createdAt: string;
  table?: {
    name: string;
  };
  items: OrderItem[];
  reviews?: Review[];
}

interface CustomerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerProfileDialog({ open, onOpenChange }: CustomerProfileDialogProps) {
  const { customer, logout, token } = useCustomerStore();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  const handleOpenReview = (order: Order) => {
    setSelectedOrderForReview(order);
    setReviewDialogOpen(true);
  };

  useEffect(() => {
    if (open && customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      fetchOrders();
    }
  }, [open, customer]);

  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Sipariş geçmişi yüklenemedi');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !token) return;

    setLoadingUpdate(true);
    try {
      const response = await axios.patch(
        `${API_URL}/customers/${customer.id}`,
        { name, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update store (we need a method in store for this, but for now we'll just show success)
      // Ideally updateCustomer action should exist in store
      toast.success('Profil güncellendi');
      // Force reload or update store manually if possible
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenemedi');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    toast.success('Çıkış yapıldı');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READY': return 'bg-green-100 text-green-800 border-green-200';
      case 'DELIVERED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (order: Order) => {
    const status = order.status;
    // Check if any item in the order requires preparation (default to true if undefined)
    const hasPrepItems = order.items.some(item => item.product.requiresPreparation !== false);

    switch (status) {
      case 'PENDING': return 'Sipariş Alındı';
      case 'PREPARING': 
        return hasPrepItems ? 'Hazırlanıyor' : 'Sipariş Alındı';
      case 'READY': 
        return hasPrepItems ? 'Hazır' : 'Servise Hazır';
      case 'DELIVERED': return 'Teslim Edildi';
      case 'CANCELLED': return 'İptal';
      case 'COMPLETED': return 'Tamamlandı';
      case 'PAID': return 'Ödendi';
      default: return status;
    }
  };

  const getReviewStatus = (order: Order) => {
    if (!order.reviews || order.reviews.length === 0) return 'NONE';
    const reviewedItemIds = order.reviews.map(r => r.productId);
    const allItemsReviewed = order.items.every(item => reviewedItemIds.includes(item.product.id));
    return allItemsReviewed ? 'ALL' : 'PARTIAL';
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl bg-white/80 backdrop-blur-xl h-[85vh] sm:h-[600px] flex flex-col">
        <DialogTitle className="sr-only">Müşteri Profili</DialogTitle>
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-teal-600 shrink-0">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-10 -translate-y-10 blur-2xl" />
          </div>
          <div className="relative h-full flex flex-col justify-end p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border-2 border-white/30 shadow-inner">
                {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{customer.name || 'Misafir'}</h2>
                <p className="text-emerald-100 text-sm opacity-90">{customer.email}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="w-full grid grid-cols-2 bg-emerald-50/50 p-1">
              <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Siparişlerim
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                <User className="w-4 h-4 mr-2" />
                Profilim
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="orders" className="absolute inset-0 m-0 data-[state=active]:flex flex-col">
              <ScrollArea className="flex-1 p-6 pt-2">
                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>Siparişler yükleniyor...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                    <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                    <p>Henüz siparişiniz bulunmuyor.</p>
                    <Button variant="link" className="text-emerald-600 mt-2" onClick={() => onOpenChange(false)}>
                      Menüye Dön
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pb-6">
                    {orders.map((order) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={order.id}
                        className="bg-white rounded-xl p-4 shadow-sm border border-emerald-50/50 hover:border-emerald-100 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("text-xs font-normal border", getStatusColor(order.status))}>
                                {getStatusText(order)}
                              </Badge>
                              <span className="text-xs text-gray-400 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.table ? `Masa ${order.table.name}` : 'Paket Servis'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-600 font-bold">
                              ₺{Number(order.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-t border-dashed border-gray-100 pt-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 text-sm">
                              <div className="h-8 w-8 rounded-md bg-gray-50 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${item.product.imageUrl})` }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 truncate">{item.product.name}</p>
                                {item.note && <p className="text-xs text-gray-400 truncate italic">Not: {item.note}</p>}
                              </div>
                              <div className="text-gray-500 text-xs whitespace-nowrap">
                                {item.quantity} x ₺{Number(item.unitPrice).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {['READY', 'DELIVERED', 'COMPLETED', 'PAID'].includes(order.status) && (
                          <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end items-center gap-2">
                            {getReviewStatus(order) === 'ALL' && (
                              <span className="text-xs text-emerald-600 font-medium flex items-center">
                                <Star className="w-3 h-3 mr-1 fill-emerald-600" />
                                Değerlendirildi
                              </span>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className={cn(
                                "h-8",
                                getReviewStatus(order) === 'ALL' 
                                  ? "text-gray-500 border-gray-200 hover:bg-gray-50" 
                                  : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              )}
                              onClick={() => handleOpenReview(order)}
                            >
                              <Star className={cn("w-3.5 h-3.5 mr-1.5", getReviewStatus(order) === 'ALL' ? "" : "fill-current")} />
                              {getReviewStatus(order) === 'ALL' ? 'Düzenle' : getReviewStatus(order) === 'PARTIAL' ? 'Değerlendirmeye Devam Et' : 'Değerlendir'}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="profile" className="absolute inset-0 m-0 p-6">
              <ScrollArea className="h-full pr-4">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" value={customer.email} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-400">E-posta adresi değiştirilemez.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <Button type="submit" disabled={loadingUpdate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                    {loadingUpdate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Bilgileri Güncelle
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Hesap Ayarları</h4>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-none justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
        
        <CreateReviewDialog 
          open={reviewDialogOpen} 
          onOpenChange={(open) => {
            setReviewDialogOpen(open);
            if (!open) fetchOrders();
          }}
          orderId={selectedOrderForReview?.id || ''}
          items={selectedOrderForReview?.items || []}
          existingReviews={selectedOrderForReview?.reviews || []}
        />
      </DialogContent>
    </Dialog>
  );
}
