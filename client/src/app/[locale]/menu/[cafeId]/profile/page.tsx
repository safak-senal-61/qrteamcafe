'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerStore } from '@/store/customer-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ShoppingBag, Clock, MapPin, ChevronRight, Loader2, Star, TrendingUp, Trophy, Heart, Award, Utensils, ArrowLeft, Mail, Phone, Lock, Trash2, Shield, Key, AlertTriangle, Settings, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
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

const OrderCard = ({ order, onReview }: { order: Order; onReview: (order: Order) => void }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
       <div 
         className="p-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50/50 transition-colors"
         onClick={() => setExpanded(!expanded)}
       >
         <div className="flex items-center gap-3">
            <div className={cn("w-1 h-10 rounded-full shrink-0", getStatusColor(order.status).split(' ')[0])} />
            <div className="min-w-0">
               <div className="flex items-center gap-2 flex-wrap">
                 <span className="font-bold text-gray-900 truncate">
                   {order.table?.name ? `Masa ${order.table.name}` : 'Paket Servis'}
                 </span>
                 <span className="text-xs text-gray-400">•</span>
                 <span className="text-xs text-gray-500 whitespace-nowrap">
                   {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                 </span>
               </div>
               <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border font-medium", getStatusColor(order.status))}>
                    {getStatusText(order)}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {order.items.length} ürün
                  </span>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-3 pl-2">
            <span className="font-black text-emerald-600 whitespace-nowrap">
              ₺{Number(order.totalAmount).toFixed(2)}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
         </div>
       </div>

       {expanded && (
         <div className="bg-gray-50/50 border-t border-gray-100 p-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0 border-dashed">
                   <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <div className="h-8 w-8 rounded-md bg-gray-100 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${item.product.imageUrl || '/placeholder-food.jpg'})` }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                            <span className="text-emerald-600 font-bold text-xs shrink-0">{item.quantity}x</span>
                            <span className="text-gray-700 truncate font-medium">{item.product.name}</span>
                        </div>
                        {item.note && <p className="text-xs text-gray-400 italic truncate">Not: {item.note}</p>}
                      </div>
                   </div>
                   <span className="text-gray-600 text-xs font-medium whitespace-nowrap">₺{Number(item.totalPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            {['READY', 'DELIVERED', 'COMPLETED', 'PAID'].includes(order.status) && (
              <div className="pt-2 flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={cn(
                    "h-8 text-xs font-medium",
                    getReviewStatus(order) === 'ALL' 
                      ? "text-gray-500 border-gray-200 hover:bg-gray-100" 
                      : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview(order);
                  }}
                >
                  <Star className={cn("w-3 h-3 mr-1.5", getReviewStatus(order) === 'ALL' ? "" : "fill-current")} />
                  {getReviewStatus(order) === 'ALL' ? 'Düzenle' : getReviewStatus(order) === 'PARTIAL' ? 'Değerlendirmeye Devam Et' : 'Değerlendir'}
                </Button>
              </div>
            )}
         </div>
       )}
    </div>
  );
};

const Section = ({ title, icon: Icon, children, defaultOpen = true, className }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={cn("bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit transition-all duration-200", className)}>
      <div 
        className={cn("flex justify-between items-center cursor-pointer", isOpen ? "mb-5 pb-3 border-b border-gray-50" : "")}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Icon className="w-5 h-5 mr-2 text-emerald-600" />
          {title}
        </h3>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const cafeId = params.cafeId as string;
  const locale = params.locale as string;

  const { customer, logout, token, setCustomer } = useCustomerStore();
  const [activeTab, setActiveTab] = useState('panel');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Email Verification
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  useEffect(() => {
    if (!customer) {
      router.push(`/${locale}/menu/${cafeId}`);
      return;
    }

    setName(customer.name || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
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

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoadingUpdate(true);
    try {
      const updateData: any = { name, phone, email };
      if (newPassword) {
        updateData.password = newPassword;
      }

      const response = await axios.patch(
        `${API_URL}/customers/${customer.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.emailVerificationRequired) {
        toast.success('Doğrulama kodu e-posta adresinize gönderildi');
        setIsVerifyingEmail(true);
        // Update other fields but not email yet in UI? 
        // Actually, we can update everything except email, or just wait for verification.
        // Let's update name and phone.
        setCustomer({ ...customer, name, phone }, token);
      } else {
        toast.success('Profil güncellendi');
        setCustomer({ ...customer, name, phone, email }, token);
      }
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!customer || !token || !verificationCode) return;
    
    setVerifying(true);
    try {
      await axios.post(
        `${API_URL}/customers/${customer.id}/verify-email-change`,
        { code: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('E-posta adresi başarıyla güncellendi');
      setCustomer({ ...customer, email }, token);
      setIsVerifyingEmail(false);
      setVerificationCode('');
    } catch (error: any) {
      console.error('Error verifying email:', error);
      toast.error(error.response?.data?.message || 'Doğrulama başarısız');
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    
    if (!customer || !token) return;
    
    try {
      await axios.delete(`${API_URL}/customers/${customer.id}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Hesabınız silindi');
      logout();
      router.push(`/${locale}/menu/${cafeId}`);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Hesap silinemedi');
    }
  };

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/menu/${cafeId}`);
    toast.success('Çıkış yapıldı');
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
          <div className="max-w-4xl mx-auto">
            <TabsList className="w-full grid grid-cols-3 bg-emerald-50/50 p-1 mb-2">
              <TabsTrigger value="panel" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Panel</span>
                <span className="md:hidden">Panel</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                <ShoppingBag className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Siparişler</span>
                <span className="md:hidden">Sipariş</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                <User className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Profil & Ayarlar</span>
                <span className="md:hidden">Profil</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-gray-50">
          <TabsContent value="panel" className="absolute inset-0 m-0 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group col-span-1 md:col-span-2">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShoppingBag className="w-16 h-16 text-emerald-600" />
                  </div>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Toplam Sipariş</p>
                  <div className="text-3xl font-black text-gray-900">{stats?.totalOrders || 0}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group col-span-1 md:col-span-2">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="w-16 h-16 text-amber-500" />
                  </div>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-2">Toplam Harcama</p>
                  <div className="text-3xl font-black text-gray-900">₺{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
                </div>
              </div>

              {/* Favorites Section */}
              {stats?.favoriteProduct && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-rose-500 fill-rose-500" />
                    Favori Lezzetiniz
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl bg-gray-100 bg-cover bg-center shrink-0 shadow-inner" 
                         style={{ backgroundImage: `url(${stats.favoriteProduct.image || '/placeholder-food.jpg'})` }} />
                    <div>
                      <p className="text-xs text-emerald-600 font-medium mb-1">En Çok Sipariş Edilen</p>
                      <p className="font-bold text-gray-900 text-xl md:text-2xl mb-1">{stats.favoriteProduct.name}</p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                          {stats.favoriteProduct.count} kez sipariş verildi
                        </Badge>
                      </p>
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
                        <div key={product.id} className="w-48 md:w-56 shrink-0 space-y-3 group cursor-pointer bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
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
            <ScrollArea className="flex-1 p-4 md:p-8">
              <div className="max-w-3xl mx-auto">
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
                      >
                        <OrderCard order={order} onReview={handleOpenReview} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="profile" className="absolute inset-0 m-0 p-4 md:p-8 overflow-y-auto bg-gray-50">
            <div className="max-w-5xl mx-auto pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column: Personal Info */}
              <Section title="Kişisel Bilgiler" icon={User} defaultOpen={true}>
                <div className="pt-2">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Adınız Soyadınız"
                            className="bg-gray-50 border-gray-200 h-11 pl-10 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon Numarası</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="5XX XXX XX XX"
                            className="bg-gray-50 border-gray-200 h-11 pl-10 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresi</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ornek@email.com"
                          className="bg-gray-50 border-gray-200 h-11 pl-10 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow-md transition-all" disabled={loadingUpdate}>
                        {loadingUpdate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Bilgileri Güncelle
                      </Button>
                    </div>
                  </form>
                </div>
              </Section>

                {/* Right Column: Security & Actions */}
                <div className="space-y-4">
                  {/* Security */}
                  <Section title="Güvenlik" icon={Shield} defaultOpen={false}>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Yeni Şifre</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Yeni şifreniz"
                              className="bg-gray-50 border-gray-200 h-11 pl-10 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Tekrar</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Yeni şifreniz (tekrar)"
                              className="bg-gray-50 border-gray-200 h-11 pl-10 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleUpdateProfile} variant="outline" className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors" disabled={!newPassword || loadingUpdate}>
                        {loadingUpdate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                        Şifreyi Değiştir
                      </Button>
                    </div>
                  </Section>
                  
                  {/* Account Operations */}
                  <Section title="Hesap İşlemleri" icon={Settings} defaultOpen={false}>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-11 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-gray-200" 
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Çıkış Yap
                      </Button>

                      <Button 
                        variant="ghost" 
                        className={cn(
                          "h-11 transition-all border",
                          deleteConfirm 
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" 
                            : "bg-white text-red-500 border-red-100 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                        )}
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleteConfirm ? 'Emin misin?' : 'Hesabı Sil'}
                      </Button>
                    </div>
                    {deleteConfirm && (
                      <p className="text-xs text-red-500 mt-2 text-center animate-in fade-in slide-in-from-top-1">
                        Hesabınız kalıcı olarak silinecektir.
                      </p>
                    )}
                  </Section>
                </div>
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

      {/* Email Verification Dialog */}
      <Dialog open={isVerifyingEmail} onOpenChange={setIsVerifyingEmail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>E-posta Doğrulama</DialogTitle>
            <DialogDescription>
              Güvenliğiniz için <strong>{email}</strong> adresine gönderilen 6 haneli doğrulama kodunu giriniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Doğrulama Kodu</Label>
              <Input
                id="code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
             <Button variant="ghost" onClick={() => setIsVerifyingEmail(false)} disabled={verifying}>
              İptal
            </Button>
            <Button onClick={handleVerifyEmailChange} disabled={!verificationCode || verifying} className="bg-emerald-600 hover:bg-emerald-700">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Doğrula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}