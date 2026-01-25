'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useCustomerStore } from '@/store/customer-store';
import { type Product as CartProduct } from '@/store/cart-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ShoppingBag, Clock, ChevronRight, Loader2, Star, TrendingUp, Trophy, Heart, ArrowLeft, Mail, Phone, Lock, Trash2, Shield, Key, AlertTriangle, Settings, CheckCircle2, ChevronDown, Filter, Sparkles, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateReviewDialog } from '@/components/menu/CreateReviewDialog';
import { ProductDetailDialog } from '@/components/menu/ProductDetailDialog';

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
  deliveredAt?: string;
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
    case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'PREPARING': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'READY': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'DELIVERED': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
    case 'PAID': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (order.deliveredAt && ['DELIVERED', 'COMPLETED', 'PAID'].includes(order.status)) {
      const diff = new Date().getTime() - new Date(order.deliveredAt).getTime();
      if (diff < 5 * 60 * 1000) {
        const interval = setInterval(() => forceUpdate({}), 60000);
        return () => clearInterval(interval);
      }
    }
  }, [order.deliveredAt, order.status]);

  const canReview = () => {
    if (!['DELIVERED', 'COMPLETED', 'PAID'].includes(order.status)) return false;
    if (getReviewStatus(order) === 'ALL') return true;
    if (!order.deliveredAt) return true;
    
    const diff = new Date().getTime() - new Date(order.deliveredAt).getTime();
    return diff >= 5 * 60 * 1000;
  };

  const getButtonText = () => {
    if (getReviewStatus(order) === 'ALL') return 'Düzenle';
    
    if (!canReview() && order.deliveredAt) {
      const diff = new Date().getTime() - new Date(order.deliveredAt).getTime();
      const remaining = 5 * 60 * 1000 - diff;
      if (remaining > 0) {
        const mins = Math.ceil(remaining / 60000);
        return `${mins} dk sonra`;
      }
    }
    
    return getReviewStatus(order) === 'PARTIAL' ? 'Değerlendirmeye Devam Et' : 'Değerlendir';
  };
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
       <button 
         type="button"
         className="w-full p-3 md:p-4 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50/50 transition-colors text-left group"
         onClick={() => setExpanded(!expanded)}
       >
         <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className={cn("w-1.5 h-10 md:h-12 rounded-full shrink-0 transition-all group-hover:h-12 md:group-hover:h-14", getStatusColor(order.status).split(' ')[0])} />
            <div className="min-w-0 flex-1">
               <div className="flex items-center gap-2 flex-wrap mb-0.5 md:mb-1">
                 <span className="font-bold text-gray-900 truncate text-base md:text-lg">
                   {order.table?.name ? `Masa ${order.table.name}` : 'Paket Servis'}
                 </span>
                 <Badge variant="outline" className={cn("text-[10px] px-1.5 md:px-2 py-0.5 h-5 border font-semibold shrink-0", getStatusColor(order.status))}>
                    {getStatusText(order)}
                  </Badge>
               </div>
               <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500 truncate">
                 <span className="flex items-center gap-1 shrink-0">
                   <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                   {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                 <span className="truncate">{order.items.length} ürün</span>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-2 md:gap-3 pl-2 shrink-0">
            <div className="text-right">
              <span className="block font-black text-emerald-600 text-base md:text-lg">
                ₺{Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className={cn("p-1 md:p-1.5 rounded-full bg-gray-50 transition-transform duration-300", expanded && "rotate-180")}>
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
            </div>
         </div>
       </button>

       <AnimatePresence>
         {expanded && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="border-t border-gray-100 bg-gray-50/30"
           >
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm py-2 px-3 bg-white rounded-xl border border-gray-100/50">
                       <div className="flex items-center gap-3 overflow-hidden pr-2">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 bg-cover bg-center shrink-0 shadow-sm" style={{ backgroundImage: `url(${item.product.imageUrl || '/placeholder-food.jpg'})` }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="h-5 px-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">{item.quantity}x</Badge>
                                <span className="text-gray-900 truncate font-medium">{item.product.name}</span>
                            </div>
                            {item.note && <p className="text-xs text-gray-500 italic truncate mt-0.5 ml-1">Not: {item.note}</p>}
                          </div>
                       </div>
                       <span className="text-gray-700 text-sm font-semibold whitespace-nowrap">₺{Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                {['READY', 'DELIVERED', 'COMPLETED', 'PAID'].includes(order.status) && (
                  <div className="pt-2 flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={!canReview() && getReviewStatus(order) !== 'ALL'}
                      className={cn(
                        "h-9 px-4 text-xs font-bold tracking-wide transition-all",
                        getReviewStatus(order) === 'ALL' 
                          ? "text-gray-500 border-gray-200 hover:bg-gray-100" 
                          : !canReview() 
                            ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                            : "text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canReview() || getReviewStatus(order) === 'ALL') {
                          onReview(order);
                        }
                      }}
                    >
                      {!canReview() && getReviewStatus(order) !== 'ALL' ? (
                        <Clock className="w-3.5 h-3.5 mr-2" />
                      ) : (
                        <Star className={cn("w-3.5 h-3.5 mr-2", getReviewStatus(order) === 'ALL' ? "" : "fill-current")} />
                      )}
                      {getButtonText()}
                    </Button>
                  </div>
                )}
              </div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const Section = ({ title, icon: Icon, children, defaultOpen = true, className }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit transition-all duration-200 hover:shadow-md", className)}>
      <button 
        type="button"
        className={cn("w-full flex justify-between items-center cursor-pointer text-left group", isOpen ? "mb-6" : "")}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
            {title}
          </h3>
        </div>
        <div className={cn("p-1.5 rounded-full bg-gray-50 transition-all duration-300", isOpen ? "rotate-180 bg-gray-100" : "")}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
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
  
  // Order Filtering
  const [dateFilter, setDateFilter] = useState('all');

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  
  // Product Detail Dialog
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);

  const handleOpenReview = (order: Order) => {
    setSelectedOrderForReview(order);
    setReviewDialogOpen(true);
  };

  const handleProductClick = (product: Product) => {
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.imageUrl || '',
      category: product.categoryId,
      stock: 999 // Default stock
    };
    setSelectedProduct(cartProduct);
    setProductDetailOpen(true);
  };

  const fetchStats = useCallback(async () => {
    if (!customer?.id) return;
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [customer?.id]);

  const fetchRecommendations = useCallback(async () => {
    if (!customer?.id) return;
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}/recommendations`, {
        params: { cafeId }
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, [customer?.id, cafeId]);

  const fetchOrders = useCallback(async () => {
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
  }, [token]);

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
  }, [customer, cafeId, locale, router, fetchOrders, fetchStats, fetchRecommendations]);

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
      const updateData: { name: string; phone: string; email: string; password?: string } = { name, phone, email };
      if (newPassword) {
        updateData.password = newPassword;
      }

      const response = await axios.patch<{ emailVerificationRequired: boolean }>(
        `${API_URL}/customers/${customer.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.emailVerificationRequired) {
        toast.success('Doğrulama kodu e-posta adresinize gönderildi');
        setIsVerifyingEmail(true);
        setCustomer({ ...customer, name, phone }, token);
      } else {
        toast.success('Profil güncellendi');
        setCustomer({ ...customer, name, phone, email }, token);
      }
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Profil güncellenemedi');
      } else {
        toast.error('Profil güncellenemedi');
      }
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
    } catch (error) {
      console.error('Error verifying email:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Doğrulama başarısız');
      } else {
        toast.error('Doğrulama başarısız');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
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
    if (spent >= 10000) return { name: 'Platinum', color: 'from-slate-900 via-purple-900 to-indigo-900', icon: '💎', textColor: 'text-indigo-100', badgeColor: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' };
    if (spent >= 5000) return { name: 'Gold', color: 'from-amber-900 via-yellow-900 to-amber-950', icon: '👑', textColor: 'text-amber-100', badgeColor: 'bg-amber-500/20 text-amber-200 border-amber-500/30' };
    if (spent >= 1000) return { name: 'Silver', color: 'from-slate-700 via-slate-800 to-slate-900', icon: '🥈', textColor: 'text-slate-100', badgeColor: 'bg-slate-500/20 text-slate-200 border-slate-500/30' };
    return { name: 'Bronze', color: 'from-orange-900 via-orange-950 to-orange-900', icon: '🥉', textColor: 'text-orange-100', badgeColor: 'bg-orange-500/20 text-orange-200 border-orange-500/30' };
  };

  const handleBack = () => {
    router.push(`/${locale}/menu/${cafeId}`);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer || !token) return;

    // Validate file size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload file
      const uploadResponse = await axios.post(`${API_URL}/customers/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const avatarUrl = uploadResponse.data.url;

      // 2. Update customer profile
      await axios.patch(
        `${API_URL}/customers/${customer.id}`,
        { avatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Update local state
      setCustomer({ ...customer, avatarUrl }, token);
      toast.success('Profil fotoğrafı güncellendi');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Profil fotoğrafı yüklenemedi');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getFilteredOrders = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      switch (dateFilter) {
        case 'today':
          return orderDate >= today;
        case 'yesterday':
          const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
          return orderDay.getTime() === yesterday.getTime();
        case 'week':
          return orderDate >= lastWeek;
        case 'month':
          return orderDate >= lastMonth;
        default:
          return true;
      }
    });
  };

  if (!customer) return null;

  const filteredOrders = getFilteredOrders();
  const membership = stats ? getMembershipLevel(stats.totalSpent) : getMembershipLevel(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Modern Header */}
      <div className={cn("relative h-auto min-h-[18rem] md:h-72 shrink-0 overflow-hidden transition-all duration-700 ease-out", "bg-gradient-to-br", membership.color)}>
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
        </div>
        
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>

        {/* Header Content */}
        <div className="relative h-full flex flex-col p-4 md:p-6 max-w-5xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-start mb-6 md:mb-0">
             <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105"
                onClick={handleBack}
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex gap-2">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10"
                 onClick={handleLogout}
               >
                 <LogOut className="w-5 h-5" />
               </Button>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="mt-auto mb-8 md:mb-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 animate-in slide-in-from-bottom-4 duration-700 pb-6 md:pb-0">
             <div className="relative group shrink-0">
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl flex items-center justify-center text-3xl md:text-4xl font-bold border-4 border-white/20 shadow-2xl text-white overflow-hidden relative z-10">
                   {customer.avatarUrl ? (
                      <Image 
                        src={`${API_URL}${customer.avatarUrl}`} 
                        alt="Profile" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 96px, 112px"
                      />
                   ) : (
                      customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()
                   )}
                </div>
                
                {/* Upload Button Overlay */}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                >
                  <Camera className="w-6 h-6 md:w-8 md:h-8" />
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
                
                {/* Loading State */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-white animate-spin" />
                  </div>
                )}

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-white/20 blur-xl -z-10 group-hover:bg-white/30 transition-all duration-500" />
             </div>
             
             <div className="pb-2 space-y-2 text-center md:text-left">
               <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                 {customer.name || 'Misafir'}
               </h2>
               <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                 <Badge variant="outline" className={cn("backdrop-blur-md shadow-lg border px-3 py-1 text-sm font-semibold tracking-wide", membership.badgeColor)}>
                   {membership.icon} {membership.name} Üye
                 </Badge>
                 <div className="hidden md:block h-1.5 w-1.5 rounded-full bg-white/40" />
                 <span className="text-white/80 font-medium text-sm">{customer.phone || customer.email}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col -mt-8 relative z-10">
        <div className="px-4 sm:px-6 shrink-0">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-lg border border-white/50 mx-auto max-w-lg">
              <TabsList className="w-full grid grid-cols-3 h-11 bg-transparent gap-1">
                <TabsTrigger 
                  value="panel" 
                  className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-xs md:text-sm"
                >
                  <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Panel
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-xs md:text-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Siparişler
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-xs md:text-sm"
                >
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Profil
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col mt-6">
          {/* Order Filters */}
          {activeTab === 'orders' && (
            <div className="px-4 pb-4 shrink-0 z-20 sticky top-0 bg-gray-50/95 backdrop-blur-sm pt-2">
              <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'today', label: 'Bugün' },
                  { id: 'week', label: 'Bu Hafta' },
                  { id: 'month', label: 'Bu Ay' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setDateFilter(filter.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap",
                      dateFilter === filter.id 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                        : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <TabsContent value="panel" className="flex-1 m-0 p-4 md:p-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => setActiveTab('orders')}
                  className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-emerald-600 mb-2 md:mb-3 relative z-10" />
                  <div className="relative z-10">
                    <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">Toplam Sipariş</p>
                    <div className="text-2xl md:text-3xl font-black text-gray-900">{stats?.totalOrders || 0}</div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-amber-500 mb-2 md:mb-3 relative z-10" />
                  <div className="relative z-10">
                    <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">Toplam Harcama</p>
                    <div className="text-2xl md:text-3xl font-black text-gray-900">₺{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
                  </div>
                </motion.div>
              </div>

              {/* Favorites Section */}
              {stats?.favoriteProduct && (
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-1 shadow-lg text-white">
                  <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-4 md:p-6 h-full flex flex-col md:flex-row items-center gap-4 md:gap-6 relative overflow-hidden text-center md:text-left">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 shrink-0">
                      <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-white p-1 shadow-xl rotate-3 mx-auto md:mx-0">
                         <div className="h-full w-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${stats.favoriteProduct.image || '/placeholder-food.jpg'})` }} />
                      </div>
                      <div className="absolute -bottom-3 -right-3 bg-white text-rose-500 p-2 rounded-full shadow-lg hidden md:block">
                        <Heart className="w-5 h-5 fill-current" />
                      </div>
                    </div>

                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2 border border-white/20">
                        Favori Lezzetiniz
                      </div>
                      <h3 className="text-xl md:text-2xl font-black mb-1 truncate w-full">{stats.favoriteProduct.name}</h3>
                      <p className="text-white/80 font-medium text-sm md:text-base">
                        Bu lezzeti tam <strong>{stats.favoriteProduct.count}</strong> kez sipariş ettiniz!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-emerald-600" />
                    Son Siparişleriniz
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Tümünü Gör
                  </button>
                </div>
                
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 2).map((order) => (
                      <OrderCard key={order.id} order={order} onReview={handleOpenReview} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">Henüz siparişiniz yok</p>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Lezzetli menümüzden dilediğiniz ürünleri seçip sipariş verebilirsiniz.</p>
                    <Button 
                      onClick={handleBack}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8"
                    >
                      Menüye Git
                    </Button>
                  </div>
                )}
              </div>

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center px-2">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                    Sizin İçin Öneriler
                  </h3>
                  <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
                    <div className="flex gap-4 pb-2 min-w-max">
                      {recommendations.map((product) => (
                        <div 
                           key={product.id} 
                           onClick={() => handleProductClick(product)}
                           className="w-48 shrink-0 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="aspect-square rounded-xl bg-gray-100 relative overflow-hidden mb-3">
                            <Image 
                              src={product.imageUrl || '/placeholder-food.jpg'} 
                              alt={product.name} 
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500" 
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                               <ChevronRight className="w-4 h-4 text-emerald-600" />
                            </div>
                          </div>
                          <div className="px-1 space-y-1">
                            <p className="font-bold text-gray-900 truncate">{product.name}</p>
                            <p className="text-emerald-600 font-black text-lg">₺{Number(product.price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="flex-1 m-0 bg-gray-50 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ScrollArea className="flex-1 px-4 md:px-8 h-full">
              <div className="max-w-3xl mx-auto pb-20">
                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
                    <p>Siparişler yükleniyor...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <Filter className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">Bu kriterde sipariş bulunamadı.</p>
                    <Button variant="link" className="text-emerald-600 font-bold" onClick={() => setDateFilter('all')}>
                      Tüm Siparişleri Göster
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <OrderCard key={order.id} order={order} onReview={handleOpenReview} />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="profile" className="flex-1 m-0 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-3xl mx-auto pb-20 w-full space-y-6">
              
              <Section title="Kişisel Bilgiler" icon={User} defaultOpen={true}>
                <form onSubmit={handleUpdateProfile} className="space-y-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-500 font-medium ml-1">Ad Soyad</Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-50 border-gray-100 h-12 pl-12 rounded-xl focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-500 font-medium ml-1">Telefon</Label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-gray-50 border-gray-100 h-12 pl-12 rounded-xl focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-500 font-medium ml-1">E-posta Adresi</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-gray-50 border-gray-100 h-12 pl-12 rounded-xl focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all" disabled={loadingUpdate}>
                        {loadingUpdate ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                        Bilgileri Güncelle
                      </Button>
                    </div>
                </form>
              </Section>

              <Section title="Güvenlik" icon={Shield} defaultOpen={false}>
                 <div className="space-y-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Yeni Şifre</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-gray-50 border-gray-100 h-12 pl-12 rounded-xl focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Tekrar</Label>
                        <div className="relative group">
                          <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-gray-50 border-gray-100 h-12 pl-12 rounded-xl focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleUpdateProfile} variant="outline" className="w-full h-12 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold transition-all" disabled={!newPassword || loadingUpdate}>
                      {loadingUpdate ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                      Şifreyi Değiştir
                    </Button>
                  </div>
              </Section>
              
              <Section title="Hesap İşlemleri" icon={Settings} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button 
                    variant="outline" 
                    className="h-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 font-bold transition-all" 
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Çıkış Yap
                  </Button>

                  <Button 
                    variant="ghost" 
                    className={cn(
                      "h-12 rounded-xl transition-all border font-bold",
                      deleteConfirm 
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" 
                        : "bg-white text-red-500 border-red-100 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                    )}
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    {deleteConfirm ? 'Emin misin?' : 'Hesabı Sil'}
                  </Button>
                </div>
                {deleteConfirm && (
                  <p className="text-xs text-red-500 mt-3 text-center animate-in fade-in slide-in-from-top-1 bg-red-50 p-2 rounded-lg">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Hesabınız kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                  </p>
                )}
              </Section>
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
                className="text-center text-2xl font-bold tracking-[1em] h-14"
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

      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          open={productDetailOpen}
          onOpenChange={setProductDetailOpen}
          showRating={true}
        />
      )}
    </div>
  );
}
