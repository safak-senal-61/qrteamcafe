'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useCustomerStore } from '@/store/customer-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ShoppingBag, Clock, MapPin, ChevronRight, Loader2, Star, TrendingUp, Trophy, Heart, Award, Utensils, ArrowLeft, Mail, Phone, Lock, Trash2, Shield, Key, AlertTriangle, Settings, CheckCircle2, ChevronDown, ChevronUp, Copy, Gift, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import { MenuService } from '@/services/menu.service';
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
  loyaltyPoints: number;
  favoriteProduct: { count: number; name: string; image: string | null } | null;
  favoriteCategory: { count: number; name: string } | null;
}

interface LoyaltyTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  isActive: boolean;
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
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // If waiting for review time, update every minute
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
    if (!order.deliveredAt) return true; // Old orders
    
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
                  disabled={!canReview() && getReviewStatus(order) !== 'ALL'}
                  className={cn(
                    "h-8 text-xs font-medium",
                    getReviewStatus(order) === 'ALL' 
                      ? "text-gray-500 border-gray-200 hover:bg-gray-100" 
                      : !canReview() 
                        ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                        : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canReview() || getReviewStatus(order) === 'ALL') {
                      onReview(order);
                    }
                  }}
                >
                  {!canReview() && getReviewStatus(order) !== 'ALL' ? (
                    <Clock className="w-3 h-3 mr-1.5" />
                  ) : (
                    <Star className={cn("w-3 h-3 mr-1.5", getReviewStatus(order) === 'ALL' ? "" : "fill-current")} />
                  )}
                  {getButtonText()}
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
  
  // Loyalty
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<{ code: string; reward: Reward } | null>(null);

  // Profile Form States
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [realCafeId, setRealCafeId] = useState<string | null>(null);
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

  // Avatar Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !customer || !token) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadingAvatar(true);
    try {
      // 1. Upload Image
      const uploadRes = await axios.post(`${API_URL}/customers/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const avatarUrl = uploadRes.data.url;

      // 2. Update Customer Profile
      const updateRes = await axios.patch(`${API_URL}/customers/${customer.id}`, {
        avatarUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Update Store
      setCustomer({ ...customer, avatarUrl }, token);
      toast.success('Profil fotoğrafı güncellendi');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Profil fotoğrafı yüklenirken hata oluştu');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!customer) {
      router.push(`/menu/${cafeId}`);
      return;
    }

    setName(customer.name || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    fetchOrders();
    fetchStats();
    fetchRecommendations();
    fetchLoyaltyData();
    
    if (!customer.referralCode) {
      fetchCustomerProfile();
    }
  }, [customer, cafeId, locale, router]);

  const fetchCustomerProfile = async () => {
    if (!customer?.id || !token) return;
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.referralCode && response.data.referralCode !== customer.referralCode) {
         setCustomer({ ...customer, ...response.data }, token);
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    }
  };

  const fetchLoyaltyData = async () => {
    if (!customer?.id || !token) return;
    setLoadingLoyalty(true);
    try {
      const [historyRes, rewardsRes] = await Promise.all([
        axios.get(`${API_URL}/loyalty/history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/loyalty/rewards/${cafeId}`)
      ]);
      setLoyaltyHistory(historyRes.data);
      setRewards(rewardsRes.data);
    } catch (error) {
      console.error('Loyalty data fetch error:', error);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!customer?.id || !token) return;
    if ((stats?.loyaltyPoints || 0) < reward.pointsCost) {
      toast.error('Yetersiz puan');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/loyalty/redeem`, { rewardId: reward.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedemptionResult({ code: response.data.code, reward });
      toast.success('Ödül başarıyla alındı!');
      fetchStats(); // Update points
      fetchLoyaltyData(); // Update history
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ödül alınamadı');
    }
  };

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
    if (!customer?.id || !realCafeId) return;
    try {
      const response = await axios.get(`${API_URL}/customers/${customer.id}/recommendations`, {
        params: { cafeId: realCafeId }
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
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        toast.error('Oturum süreniz doldu, lütfen tekrar giriş yapın.');
        logout();
        // Router push will be handled by the useEffect watching 'customer'
      } else {
        toast.error('Sipariş geçmişi yüklenemedi');
      }
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
      router.push(`/menu/${cafeId}`);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Hesap silinemedi');
    }
  };

  const handleLogout = () => {
    logout();
    router.push(`/menu/${cafeId}`);
    toast.success('Çıkış yapıldı');
  };

  const getMembershipLevel = (spent: number) => {
    if (spent >= 10000) return { 
      name: 'Platinum', 
      gradient: 'from-slate-900 via-purple-900 to-slate-900',
      accent: 'text-purple-400',
      border: 'border-purple-500/50',
      shadow: 'shadow-purple-500/20',
      icon: '💎'
    };
    if (spent >= 5000) return { 
      name: 'Gold', 
      gradient: 'from-yellow-950 via-yellow-700 to-yellow-900',
      accent: 'text-yellow-400',
      border: 'border-yellow-500/50',
      shadow: 'shadow-yellow-500/20',
      icon: '👑'
    };
    if (spent >= 1000) return { 
      name: 'Silver', 
      gradient: 'from-slate-800 via-slate-600 to-slate-800',
      accent: 'text-slate-300',
      border: 'border-slate-400/50',
      shadow: 'shadow-slate-500/20',
      icon: '🥈'
    };
    return { 
      name: 'Bronze', 
      gradient: 'from-orange-950 via-orange-800 to-orange-900',
      accent: 'text-orange-300',
      border: 'border-orange-500/50',
      shadow: 'shadow-orange-500/20',
      icon: '🥉'
    };
  };

  const handleBack = () => {
    router.push(`/menu/${cafeId}`);
  };

  const handleCopyReferralCode = () => {
    if (!customer?.referralCode) return;
    
    const referralUrl = `${window.location.origin}/${locale}/menu/${cafeId}?referralCode=${customer.referralCode}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referralUrl)
        .then(() => toast.success('Davet linki kopyalandı'))
        .catch(() => copyToClipboardFallback(referralUrl));
    } else {
      copyToClipboardFallback(referralUrl);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success('Davet linki kopyalandı');
      } else {
        toast.error('Kopyalama başarısız');
      }
    } catch (err) {
      toast.error('Kopyalama başarısız');
    }
    
    document.body.removeChild(textArea);
  };

  if (!customer) return null;

  const membership = stats ? getMembershipLevel(stats.totalSpent) : getMembershipLevel(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modern Profile Header */}
      <div className="relative bg-slate-950 overflow-hidden pb-12">
        {/* Background Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-br ${membership.gradient} opacity-40`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/20 blur-3xl rounded-full" />

        {/* Navigation */}
        <div className="relative z-10 px-6 py-6 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Content */}
        <div className="relative z-10 px-6 pt-4 flex flex-col items-center text-center">
          {/* Avatar Ring */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative mb-6 group cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            <div className={`absolute inset-0 rounded-full blur-xl bg-gradient-to-tr ${membership.gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
            <div className={`relative w-28 h-28 rounded-full border-4 ${membership.border} bg-slate-900 flex items-center justify-center shadow-2xl overflow-hidden`}>
              {uploadingAvatar ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : customer.avatarUrl ? (
                <img src={`${API_URL}${customer.avatarUrl}`} alt="Profile" className="w-full h-full object-cover" />
              ) : customer.name ? (
                <span className="text-4xl font-bold text-white bg-clip-text bg-gradient-to-br from-white to-white/50">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-12 h-12 text-white/50" />
              )}
            </div>

            {/* Edit Overlay */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Camera className="w-8 h-8 text-white drop-shadow-lg" />
            </div>

            <div className="absolute -bottom-2 inset-x-0 flex justify-center z-30">
              <Badge className="bg-slate-900 border border-white/10 text-xs px-3 py-1 shadow-lg text-white">
                {membership.icon} {membership.name}
              </Badge>
            </div>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {customer.name || 'Misafir Kullanıcı'}
            </h1>
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-6">
              <Mail className="w-4 h-4" />
              <span>{customer.email || 'E-posta eklenmemiş'}</span>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-4 w-full max-w-sm mb-6"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">{stats?.totalOrders || 0}</div>
              <div className="text-xs text-white/50 font-medium">Sipariş</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">
                {stats?.favoriteProduct ? '1' : '0'}
              </div>
              <div className="text-xs text-white/50 font-medium">Favori</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">
                {stats?.loyaltyPoints || 0}
              </div>
              <div className="text-xs text-white/50 font-medium">Puan</div>
            </div>
          </motion.div>

          {/* Menu Button - Header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-sm px-1"
          >
            <Button
              className="w-full bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold py-6 rounded-2xl shadow-lg shadow-emerald-900/20 group relative overflow-hidden border border-emerald-500/30 backdrop-blur-sm"
              onClick={() => router.push(`/menu/${cafeId}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
              
              <div className="flex items-center justify-center gap-3 w-full relative z-10">
                <Utensils className="w-5 h-5 text-emerald-100" />
                <span className="text-lg tracking-tight">Menüyü İncele</span>
                <ChevronRight className="w-5 h-5 text-emerald-100 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="-mt-6 relative z-20 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-[calc(100vh-400px)]">
          <div className="bg-white rounded-t-3xl shadow-xl border-t border-gray-100">
            <div className="px-2 pt-4 pb-2">
              <TabsList className="w-full grid grid-cols-3 bg-gray-100/50 p-1">
                <TabsTrigger value="panel" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Özet</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Siparişler</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Ayarlar</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-gray-50">
          <TabsContent value="panel" className="absolute inset-0 m-0 p-4 md:p-8 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto space-y-6 pb-20"
            >
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
                        <div key={product.id} className="w-56 md:w-64 shrink-0 space-y-3 group cursor-pointer bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-xl bg-gray-100 relative overflow-hidden">
                            <img src={product.imageUrl || '/placeholder-food.jpg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="px-1">
                            <p className="text-base font-bold text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-emerald-600 font-black">₺{Number(product.price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="orders" className="absolute inset-0 m-0 data-[state=active]:flex flex-col bg-gray-50">
            <ScrollArea className="flex-1 p-4 md:p-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto"
              >
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
              </motion.div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="profile" className="absolute inset-0 m-0 p-4 md:p-8 overflow-y-auto bg-gray-50">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto pb-20"
            >
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
                  {/* Referral Section */}
                  <Section title="Arkadaşını Davet Et" icon={Gift} defaultOpen={true}>
                    <div className="space-y-4">
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-full shadow-sm">
                             <Trophy className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Puan Kazan</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              Arkadaşlarını davet et, her kayıt olan arkadaşın için puan kazan!
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Davet Kodun</Label>
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <Gift className="h-4 w-4 text-gray-400" />
                             </div>
                             <Input 
                               readOnly 
                               value={customer.referralCode || 'Kod Oluşturuluyor...'} 
                               className="pl-10 font-mono tracking-wider bg-gray-50 border-gray-200"
                             />
                           </div>
                           <Button 
                             size="icon" 
                             variant="outline" 
                             className="shrink-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                             onClick={handleCopyReferralCode}
                           >
                             <Copy className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* Rewards Catalog */}
                  <Section title="Hediye Kataloğu" icon={Gift} defaultOpen={false}>
                    {loadingLoyalty ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                    ) : rewards.length === 0 ? (
                      <div className="text-center p-4 text-gray-500 text-sm">Henüz aktif hediye bulunmuyor.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rewards.map(reward => (
                          <div key={reward.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex gap-3">
                            {reward.imageUrl ? (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${reward.imageUrl})` }} />
                            ) : (
                              <div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                <Gift className="w-8 h-8 text-emerald-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">{reward.title}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{reward.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                                  {reward.pointsCost} Puan
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => handleRedeem(reward)}
                                  disabled={(stats?.loyaltyPoints || 0) < reward.pointsCost}
                                >
                                  Kullan
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Points History */}
                  <Section title="Puan Geçmişi" icon={Clock} defaultOpen={false}>
                    {loadingLoyalty ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                    ) : loyaltyHistory.length === 0 ? (
                      <div className="text-center p-4 text-gray-500 text-sm">Henüz puan hareketiniz yok.</div>
                    ) : (
                      <div className="space-y-3">
                        {loyaltyHistory.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-full", tx.amount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                                {tx.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{tx.description || (tx.type === 'EARNED_ORDER' ? 'Sipariş Kazancı' : 'Harcama')}</p>
                                <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <div className={cn("font-bold text-sm", tx.amount > 0 ? "text-emerald-600" : "text-amber-600")}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount} P
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

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
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>

      {selectedOrderForReview && (
        <CreateReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          orderId={selectedOrderForReview!.id}
          items={selectedOrderForReview!.items}
          onSuccess={() => {
            fetchOrders();
          }}
          existingReviews={selectedOrderForReview!.reviews}
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

      {/* Redemption Success Dialog */}
      <Dialog open={!!redemptionResult} onOpenChange={(open) => !open && setRedemptionResult(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-emerald-600">Tebrikler!</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Ödülünüz başarıyla tanımlandı.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg text-gray-900">{redemptionResult?.reward.title}</h3>
              <p className="text-sm text-gray-500">{redemptionResult?.reward.description}</p>
            </div>

            <div className="w-full bg-emerald-50 rounded-xl p-6 border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center space-y-2">
              <p className="text-sm font-medium text-emerald-800 uppercase tracking-wide">Ödül Kodunuz</p>
              <div className="text-4xl font-black text-emerald-600 tracking-widest font-mono">
                {redemptionResult?.code}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>Bu kodu garsona göstererek ödülünüzü alabilirsiniz.</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => setRedemptionResult(null)}
            >
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}