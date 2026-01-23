'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerStore } from '@/store/customer-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ShoppingBag, Clock, MapPin, ChevronRight, Loader2, Star, TrendingUp, Trophy, Heart, Award, Utensils, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CreateReviewDialog } from '@/components/menu/CreateReviewDialog';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
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

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProduct: { count: number; name: string; image: string | null } | null;
  favoriteCategory: { count: number; name: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  category?: { name: string };
  averageRating?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const cafeId = params.cafeId as string;
  const locale = params.locale as string;

  const { customer, logout, token } = useCustomerStore();
  const [activeTab, setActiveTab] = useState('panel');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  useEffect(() => {
    if (!customer) {
      router.push(`/${locale}/menu/${cafeId}`);
      return;
    }

    setName(customer.name || '');
    setPhone(customer.phone || '');
    fetchOrders();
    fetchStats();
    fetchRecommendations();
  }, [customer, cafeId, locale, router]);

  const handleOpenReview = (order: Order) => {
    setSelectedOrderForReview(order);
    setReviewDialogOpen(true);
  };

  const fetchStats = async () => {
    if (!customer?.id) return;
    setLoadingStats(true);
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!customer?.id) return;
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}/recommendations`, {
        params: { cafeId }
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

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
      
      toast.success('Profil güncellendi');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenemedi');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/menu/${cafeId}`);
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

  const getMembershipLevel = (spent: number) => {
    if (spent >= 10000) return { name: 'Platinum', color: 'from-slate-300 via-purple-300 to-indigo-400', icon: '💎', textColor: 'text-indigo-900' };
    if (spent >= 5000) return { name: 'Gold', color: 'from-amber-200 via-yellow-400 to-amber-500', icon: '👑', textColor: 'text-amber-900' };
    if (spent >= 1000) return { name: 'Silver', color: 'from-slate-100 via-slate-300 to-slate-400', icon: '🥈', textColor: 'text-slate-900' };
    return { name: 'Bronze', color: 'from-orange-200 via-orange-300 to-orange-400', icon: '🥉', textColor: 'text-orange-900' };
  };

  const handleBack = () => {
    router.push(`/${locale}/menu/${cafeId}`);
  };

  if (!customer) return null;

  const membership = stats ? getMembershipLevel(stats.totalSpent) : getMembershipLevel(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={cn("relative h-48 bg-gradient-to-r shrink-0 transition-colors duration-500", membership.color)}>
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-10 -translate-y-10 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-5 translate-y-5 blur-xl" />
        </div>
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
            <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm"
                onClick={handleBack}
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
        </div>

        <div className="relative h-full flex flex-col justify-end p-6">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-3xl font-bold border-2 border-white/40 shadow-lg text-white">
                {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className={cn("text-2xl font-bold drop-shadow-sm", membership.textColor)}>{customer.name || 'Misafir'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-white/30 hover:bg-white/40 border-none text-white backdrop-blur-sm shadow-sm">
                    {membership.icon} {membership.name} Üye
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
          <TabsList className="w-full grid grid-cols-3 bg-emerald-50/50 p-1 mb-2">
            <TabsTrigger value="panel" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Panel
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Siparişler
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
              <User className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden relative bg-gray-50">
          <TabsContent value="panel" className="absolute inset-0 m-0 p-6 overflow-y-auto">
            <div className="space-y-6 pb-20">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShoppingBag className="w-16 h-16 text-emerald-600" />
                  </div>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Toplam Sipariş</p>
                  <div className="text-3xl font-black text-gray-900">{stats?.totalOrders || 0}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="w-16 h-16 text-amber-500" />
                  </div>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-2">Toplam Harcama</p>
                  <div className="text-3xl font-black text-gray-900">₺{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
                </div>
              </div>

              {/* Favorites Section */}
              {stats?.favoriteProduct && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-rose-500 fill-rose-500" />
                    Favori Lezzetiniz
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gray-100 bg-cover bg-center shrink-0 shadow-inner" 
                         style={{ backgroundImage: `url(${stats.favoriteProduct.image || '/placeholder-food.jpg'})` }} />
                    <div>
                      <p className="text-xs text-emerald-600 font-medium mb-1">En Çok Sipariş Edilen</p>
                      <p className="font-bold text-gray-900 text-lg">{stats.favoriteProduct.name}</p>
                      <p className="text-sm text-gray-500">{stats.favoriteProduct.count} kez sipariş verildi</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center px-1">
                    <Award className="w-4 h-4 mr-2 text-purple-500" />
                    Sizin İçin Öneriler
                  </h3>
                  <ScrollArea className="w-full whitespace-nowrap pb-4">
                    <div className="flex gap-4 px-1">
                      {recommendations.map((product) => (
                        <div key={product.id} className="w-40 shrink-0 space-y-3 group cursor-pointer bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-xl bg-gray-100 relative overflow-hidden">
                            <img src={product.imageUrl || '/placeholder-food.jpg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="px-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-emerald-600 font-black">₺{Number(product.price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="absolute inset-0 m-0 data-[state=active]:flex flex-col bg-gray-50">
            <ScrollArea className="flex-1 p-6">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
                  <p>Siparişler yükleniyor...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Henüz siparişiniz bulunmuyor.</p>
                  <Button variant="outline" className="mt-6" onClick={handleBack}>
                    Menüye Göz At
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pb-20">
                  {orders.map((order) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={order.id}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 border-0", getStatusColor(order.status))}>
                              {getStatusText(order)}
                            </Badge>
                            <span className="text-xs text-gray-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-base font-bold text-gray-900">
                            {order.table ? `Masa ${order.table.name}` : 'Paket Servis'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-600 font-black text-lg">
                            ₺{Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 border-t border-dashed border-gray-100 pt-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 text-sm">
                            <div className="h-10 w-10 rounded-lg bg-gray-50 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${item.product.imageUrl})` }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">{item.product.name}</p>
                              {item.note && <p className="text-xs text-gray-500 truncate italic">Not: {item.note}</p>}
                            </div>
                            <div className="text-gray-600 font-medium whitespace-nowrap">
                              {item.quantity} x ₺{Number(item.unitPrice).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {['READY', 'DELIVERED', 'COMPLETED', 'PAID'].includes(order.status) && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end items-center gap-3">
                          {getReviewStatus(order) === 'ALL' && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-md">
                              <Star className="w-3 h-3 mr-1 fill-emerald-600" />
                              Değerlendirildi
                            </span>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className={cn(
                              "h-9 px-4 font-medium",
                              getReviewStatus(order) === 'ALL' 
                                ? "text-gray-500 border-gray-200 hover:bg-gray-50" 
                                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            )}
                            onClick={() => handleOpenReview(order)}
                          >
                            <Star className={cn("w-4 h-4 mr-2", getReviewStatus(order) === 'ALL' ? "" : "fill-current")} />
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

          <TabsContent value="profile" className="absolute inset-0 m-0 p-6 overflow-y-auto bg-gray-50">
            <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                Profil Bilgileri
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="bg-gray-50 border-gray-200 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="bg-gray-50 border-gray-200 h-12"
                  />
                </div>
                
                <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" disabled={loadingUpdate}>
                  {loadingUpdate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Güncelle
                </Button>
              </form>
              
              <div className="mt-8 pt-8 border-t border-gray-100">
                <Button 
                  variant="destructive" 
                  className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {selectedOrderForReview && (
        <CreateReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          orderId={selectedOrderForReview.id}
          items={selectedOrderForReview.items}
          onSuccess={() => {
            fetchOrders();
          }}
          existingReviews={selectedOrderForReview.reviews}
        />
      )}
    </div>
  );
}