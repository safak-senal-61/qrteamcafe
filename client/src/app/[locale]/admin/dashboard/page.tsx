'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed,
  DollarSign,
  Users,
  ArrowUpRight,
  Loader2,
  Package,
  BellRing,
  Crown,
  CreditCard,
  Clock,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link, useRouter, usePathname } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { getMediaUrl, api } from '@/lib/api';
import Image from 'next/image';
import axios from 'axios';
import { useAdminSocket } from '@/providers/AdminSocketProvider';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Sayfanın dinamik olmasını zorla (Cache sorunlarını önlemek için)
export const dynamic = 'force-dynamic';

const actionTypeLabels: Record<string, string> = {
  ORDER_CREATED: 'Yeni Sipariş',
  ORDER_UPDATED: 'Sipariş Güncelleme',
  ORDER_CANCELLED: 'Sipariş İptali',
  TABLE_MOVED: 'Masa Taşıma',
  TABLE_CLOSE_PAYMENT: 'Hesap Kapatma',
  PRODUCT_CREATE: 'Ürün Ekleme',
  PRODUCT_UPDATE: 'Ürün Güncelleme',
  PRODUCT_DELETE: 'Ürün Silme',
  CATEGORY_CREATE: 'Kategori Ekleme',
  CATEGORY_UPDATE: 'Kategori Güncelleme',
  CATEGORY_DELETE: 'Kategori Silme',
  WAITER_INVITE: 'Garson Daveti',
  WAITER_DELETE: 'Garson Silme',
  CAFE_SETTINGS_UPDATE: 'Kafe Ayarları',
  SYSTEM_AUTO_CLOSE: 'Otomatik Kapanış',
};

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface DashboardOrder {
  id: string;
  table?: {
    tableNumber: string;
  };
  items?: OrderItem[];
  totalAmount: number | string;
  createdAt: string;
}

interface PopularProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  _count?: {
    orderItems: number;
  };
}

interface WaiterCall {
  table?: {
    tableNumber: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
  targetRole: 'ALL' | 'CAFE_ADMIN' | 'WAITER';
  expiresAt?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actionType: string;
  details: string;
  timestamp: string;
  admin?: { name: string };
  waiter?: { firstName: string; lastName: string };
}

interface DashboardStats {
  totalOrders: number;
  dailyRevenue: number;
  activeTables: number;
  totalProducts: number;
  recentOrders: DashboardOrder[];
  popularProducts: PopularProduct[];
  isSoundEnabled: boolean;
  subscription?: {
    plan: string;
    subscriptionEndsAt: string | null;
    trialEndsAt: string | null;
    isSubscriptionActive: boolean;
  };
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { socket, activeTablesCount } = useAdminSocket();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Payment Success Dialog State
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [hasStoredCard, setHasStoredCard] = useState(false);

  // DB'den gelen ses ayarı - Default olarak TRUE (Açık) başlatıyoruz
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Socket eventleri içinde güncel değeri okuyabilmek için ref kullanıyoruz
  const soundEnabledRef = useRef(true);

  // Ses dosyasını önceden yükle
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      a.volume = 0.7;
      return a;
    }
    return null;
  });

  // Ref'i state ile senkronize et
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    // LocalStorage'ı da güncelle
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // Sayfa yüklendiğinde veya yenilendiğinde tarayıcı autoplay politikasını aşmak için
  // kullanıcının ilk etkileşimini yakala ve sesi "kilitli" durumdan kurtar.
  useEffect(() => {
    const unlockAudio = () => {
      if (audio && (audio.paused || audio.currentTime === 0)) {
        // Sesi çok kısa çalıp durdurarak tarayıcıya "kullanıcı etkileşimi var" sinyali veriyoruz
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log("Audio system unlocked via interaction");
        }).catch((error) => {
          console.log("Audio autoplay interaction needed:", error);
        });
      }
      // Listener'ı temizle, sadece ilk tıklama yeterli
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    // Eğer ses açıksa veya kapalı olsa bile kilidi açmak için dinle (her ihtimale karşı)
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, [audio]);

  // Payment Status Handler
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const reason = searchParams.get('reason');
    const mode = searchParams.get('mode');
    const cardStored = searchParams.get('card_stored');

    console.log('Payment Callback Params:', {
        paymentStatus,
        reason,
        mode,
        cardStored,
        allParams: Object.fromEntries(searchParams.entries())
    });

    if (paymentStatus === 'success') {
      // Check if we have a stored card
      const checkCardStatus = async () => {
        try {
          console.log('Checking stored cards from API...');
          const res = await api.get('/payments/cards');
          
          if (res.status === 200) {
            const cards = res.data;
            console.log('Stored cards response:', cards);
            setHasStoredCard(Array.isArray(cards) && cards.length > 0);
          } else {
             console.error('Failed to fetch cards:', res.status, res.statusText);
          }
        } catch (e) {
          console.error('Failed to check cards', e);
        } finally {
          setShowPaymentSuccess(true);
        }
      };
      
      checkCardStatus();
      
      // URL'i temizle
      router.replace(pathname);
    } else if (paymentStatus === 'failed') {
      toast.error(`Ödeme başarısız oldu. ${reason ? `Sebep: ${reason}` : ''}`, {
        duration: 5000,
      });
      // URL'i temizle
      router.replace(pathname);
    } else if (paymentStatus === 'error') {
      toast.error('Ödeme işlemi sırasında bir hata oluştu.', {
        duration: 5000,
      });
      // URL'i temizle
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  const toggleSound = async () => {
    const newState = !soundEnabled;
    
    // Optimistik güncelleme
    setSoundEnabled(newState);
    soundEnabledRef.current = newState; // Ref'i anında güncelle
    localStorage.setItem('soundEnabled', String(newState)); // LocalStorage'ı anında güncelle
    
    if (newState && audio) {
      // Tarayıcı kısıtlamasını aşmak için kullanıcı etkileşimi sırasında ses çal
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(console.error);
    }

    try {
      if (!cafeId) return;
      
      const response = await api.patch(`/cafes/${cafeId}`, { isSoundEnabled: newState });

      if (response.status === 200) {
        toast.success(newState ? 'Bildirim sesi açıldı' : 'Bildirim sesi kapatıldı');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Failed to update sound setting:', error);
      // Hata durumunda geri al
      setSoundEnabled(!newState);
      soundEnabledRef.current = !newState;
      localStorage.setItem('soundEnabled', String(!newState));
      toast.error('Ses ayarı güncellenemedi');
    }
  };

  // Sync active tables from context
  useEffect(() => {
    setStats((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        activeTables: activeTablesCount,
      };
    });
  }, [activeTablesCount]);

  // WebSocket event listeners
  useEffect(() => {
    // LocalStorage'dan sayaç durumunu yükle
    const savedCount = localStorage.getItem('newOrderCount');
    if (savedCount) {
      // setNewOrderCount(parseInt(savedCount));
    }

    if (!socket) return;

    const onNewOrder = (order: DashboardOrder) => {
      console.log('New order received:', order);
        
      // Ses çalma işlemi - DB ayarını ve LocalStorage'ı kontrol et
      const isEnabledLocal = localStorage.getItem('soundEnabled') !== 'false';
      const shouldPlay = soundEnabledRef.current && isEnabledLocal;
      
      console.log('Sound check -> Ref:', soundEnabledRef.current, 'Local:', isEnabledLocal, 'Decision:', shouldPlay);

      if (shouldPlay && audio) {
        audio.play().catch(e => {
          console.log('Audio play failed:', e);
          // Sadece gerçekten bir hata varsa uyar, kullanıcı henüz etkileşime girmemiş olabilir
        });
      }

      toast.success(`Masa ${order.table?.tableNumber || '?'} yeni sipariş verdi!`, {
        duration: 5000,
        action: {
          label: 'Görüntüle',
          onClick: () => {
             // Force navigation to avoid locale duplication issues
             // Use a relative path or a known clean path logic
             // But since we are in a component, we can't easily get the "raw" router without locale if next-intl adds it.
             // We'll use window.location as a fallback to ensure correctness.
             const locale = window.location.pathname.split('/')[1];
             window.location.href = `/${locale}/admin/orders`;
          },
        },
      });
      
      // setNewOrderCount((prev) => {
      //   const newCount = prev + 1;
      //   localStorage.setItem('newOrderCount', newCount.toString());
      //   return newCount;
      // });

      // Sipariş sayısını ve listesini güncelle
      setStats((prev) => {
        if (!prev) return null;
        // Yeni siparişi listenin başına ekle
        const updatedRecentOrders = [order, ...prev.recentOrders].slice(10);
        
        return {
          ...prev,
          totalOrders: prev.totalOrders + 1,
          recentOrders: updatedRecentOrders,
        };
      });
    };

    const onWaiterCall = (call: WaiterCall) => {
      console.log('Waiter call received:', call);
        
      // Ses çalma işlemi - DB ayarını ve LocalStorage'ı kontrol et
      const isEnabledLocal = localStorage.getItem('soundEnabled') !== 'false';
      const shouldPlay = soundEnabledRef.current && isEnabledLocal;
      
      console.log('Waiter call sound check -> Ref:', soundEnabledRef.current, 'Local:', isEnabledLocal, 'Decision:', shouldPlay);
      
      if (shouldPlay && audio) {
        audio.play().catch(console.error);
      }

      toast.info(`Masa ${call.table?.tableNumber || '?'} garson çağırıyor!`, {
        duration: 5000,
        icon: <BellRing className="h-4 w-4" />,
        action: {
          label: 'Görüntüle',
          onClick: () => router.push('/admin/orders'), // veya garson çağrıları sayfasına
        },
      });
    };

    socket.on('newOrder', onNewOrder);
    socket.on('waiterCall', onWaiterCall);

    return () => {
      socket.off('newOrder', onNewOrder);
      socket.off('waiterCall', onWaiterCall);
    };
  }, [socket, audio, router]);

  useEffect(() => {
    const fetchStats = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) return;
      
      const user = JSON.parse(userStr);
      const cafeId = user.cafeId;
      setCafeId(cafeId);

      try {
        const response = await api.get(`/cafes/${cafeId}/dashboard-stats`);
        if (response.status === 200) {
          const data = response.data;
          setStats(data);
          // DB'den gelen değeri state'e ata
          const isEnabled = data.isSoundEnabled !== false;
          setSoundEnabled(isEnabled);
          
          console.log('Received Stats:', data);
          console.log('Popular Products:', data.popularProducts);

          // Ref ve LocalStorage'ı da senkronize et
          soundEnabledRef.current = isEnabled;
          localStorage.setItem('soundEnabled', String(isEnabled));
        } else {
          toast.error('Veriler yüklenemedi.');
        }

        // Fetch Announcements
        const annResponse = await api.get('/announcements/active');
        if (annResponse.status === 200) {
           const annData = annResponse.data;
           setAnnouncements(annData);
        }

        // Fetch Audit Logs
        const logsResponse = await api.get('/audit-logs?limit=5');
        if (logsResponse.status === 200) {
           const logsData = logsResponse.data;
           // Server returns { total, data: logs }
           setAuditLogs(logsData.data || []);
        }

      } catch (error: unknown) {
        console.error('Failed to fetch stats:', error);
        // If error is handled by interceptor (e.g. 401), we might not want to show generic error
        if (axios.isAxiosError(error) && error.response?.status !== 401) {
          toast.error('Sunucu hatası.');
        } else if (!axios.isAxiosError(error)) {
           // Fallback for non-axios errors
           toast.error('Sunucu hatası.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Toplam Sipariş',
      value: stats.totalOrders,
      change: 'Hepsi',
      icon: UtensilsCrossed,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      href: '/admin/orders',
    },
    {
      title: 'Günlük Ciro',
      value: `₺${Number(stats.dailyRevenue).toFixed(2)}`,
      change: 'Bugün',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
      href: '/admin/statistics',
    },
    {
      title: 'Aktif Masa',
      value: activeTablesCount,
      change: 'Şu an',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      href: '/admin/orders',
    },
    {
      title: 'Toplam Ürün',
      value: stats.totalProducts,
      change: 'Aktif',
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      href: '/admin/products',
    },
  ];

  // Subscription Status Logic
  const getSubscriptionStatus = () => {
    if (!stats.subscription) return null;

    const { subscriptionEndsAt, trialEndsAt, isSubscriptionActive } = stats.subscription;
    const now = new Date();
    
    // Check Pro Subscription first
    if (isSubscriptionActive && subscriptionEndsAt) {
      const end = new Date(subscriptionEndsAt);
      const diffTime = Math.abs(end.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return {
        type: 'PRO',
        label: 'Pro Üyelik',
        daysLeft: diffDays,
        color: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: Crown
      };
    }

    // Check Trial
    if (trialEndsAt) {
      const end = new Date(trialEndsAt);
      if (end > now) {
        const diffTime = Math.abs(end.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          type: 'TRIAL',
          label: 'Deneme Sürümü',
          daysLeft: diffDays,
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: Clock
        };
      }
    }

    return {
      type: 'EXPIRED',
      label: 'Süre Doldu',
      daysLeft: 0,
      color: 'bg-red-500',
      icon: Clock
    };
  };

  const subStatus = getSubscriptionStatus();

  return (
    <div className="space-y-8">
      {/* Payment Success Dialog */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Crown className="w-5 h-5" />
              Ödeme Başarılı
            </DialogTitle>
            <DialogDescription>
              Aboneliğiniz başarıyla yenilenmiştir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
             {hasStoredCard ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                   <div className="p-1 bg-green-100 rounded-full shrink-0">
                      <CreditCard className="w-4 h-4 text-green-600" />
                   </div>
                   <div>
                      <h4 className="font-semibold text-green-900 text-sm">Otomatik Yenileme Aktif</h4>
                      <p className="text-green-700 text-xs mt-1">
                        Kayıtlı kartınız ile aboneliğiniz otomatik olarak yenilenecektir.
                      </p>
                   </div>
                </div>
             ) : (
                <div className="space-y-4">
                   <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                     <div className="p-1 bg-amber-100 rounded-full shrink-0">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-amber-900 text-sm">Otomatik Yenileme Kapalı</h4>
                        <p className="text-amber-700 text-xs mt-1">
                          Henüz kayıtlı kartınız bulunmuyor. Aboneliğinizin kesintisiz devam etmesi için kartınızı kaydedebilirsiniz.
                        </p>
                     </div>
                   </div>

                   <div className="flex items-center justify-between border p-4 rounded-lg bg-slate-50">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Kartımı Kaydet</Label>
                        <p className="text-xs text-muted-foreground">Otomatik yenileme için kart bilgilerinizi ekleyin</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/pricing?mode=update_card')}
                        className="gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Kart Ekle
                      </Button>
                   </div>
                </div>
             )}
          </div>
          <DialogFooter>
             <Button onClick={() => setShowPaymentSuccess(false)}>Tamam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Kafe durumunu ve istatistiklerini görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
           {/* Sound Toggle */}
           <Button
             variant="outline"
             size="icon"
             onClick={toggleSound}
             className={`shrink-0 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}
             title={soundEnabled ? 'Bildirim sesi açık' : 'Bildirim sesi kapalı'}
           >
             {soundEnabled ? (
               <BellRing className="h-5 w-5" />
             ) : (
               <div className="relative">
                 <BellRing className="h-5 w-5 opacity-50" />
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-current -rotate-45" />
               </div>
             )}
           </Button>

           <Button variant="outline" className="flex-1 sm:flex-none whitespace-nowrap" asChild>
             <Link href="/admin/settings">Ayarlar</Link>
           </Button>
           <Button className="flex-1 sm:flex-none whitespace-nowrap" asChild>
             <Link href="/admin/orders">Siparişler</Link>
           </Button>
        </div>
      </div>

      {/* Subscription Status Banner - Ultra Compact */}
      {subStatus && (
        <div className={`${subStatus.color} rounded-lg shadow-sm text-white relative overflow-hidden`}>
           <div className="absolute right-0 top-0 h-full w-24 bg-white/10 skew-x-12 translate-x-8" />
           <div className="px-4 py-3 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                 <subStatus.icon className="h-5 w-5 shrink-0" />
                 <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{subStatus.label}</span>
                    <span className="text-white/80 text-xs">
                       • {subStatus.type === 'EXPIRED' 
                          ? 'Süre doldu'
                          : `${subStatus.daysLeft} Gün`}
                    </span>
                 </div>
              </div>
              <Button 
                size="sm"
                variant="secondary" 
                className="h-7 text-xs px-3 bg-white/20 hover:bg-white/30 text-white border-none shadow-none"
                asChild
              >
                 <Link href="/pricing">
                    {subStatus.type === 'EXPIRED' ? 'Yenile' : 'Yükselt'}
                 </Link>
              </Button>
           </div>
        </div>
      )}

      {/* Active Announcements */}
      {announcements.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((ann) => (
             <div key={ann.id} className={`p-4 rounded-lg border flex items-start gap-3 ${
                ann.type === 'DANGER' ? 'bg-red-50 border-red-200' :
                ann.type === 'WARNING' ? 'bg-amber-50 border-amber-200' :
                ann.type === 'SUCCESS' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
             }`}>
                <Megaphone className={`h-5 w-5 shrink-0 ${
                   ann.type === 'DANGER' ? 'text-red-600' :
                   ann.type === 'WARNING' ? 'text-amber-600' :
                   ann.type === 'SUCCESS' ? 'text-green-600' :
                   'text-blue-600'
                }`} />
                <div>
                   <h4 className={`font-semibold text-sm ${
                      ann.type === 'DANGER' ? 'text-red-900' :
                      ann.type === 'WARNING' ? 'text-amber-900' :
                      ann.type === 'SUCCESS' ? 'text-green-900' :
                      'text-blue-900'
                   }`}>{ann.title}</h4>
                   <p className={`text-xs mt-1 ${
                      ann.type === 'DANGER' ? 'text-red-700' :
                      ann.type === 'WARNING' ? 'text-amber-700' :
                      ann.type === 'SUCCESS' ? 'text-green-700' :
                      'text-blue-700'
                   }`}>{ann.content}</p>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link href={stat.href} key={stat.title}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: stat.color.replace('text-', 'var(--') }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Badge variant="secondary" className="mr-2 font-normal text-[10px] px-1.5">
                    {stat.change}
                  </Badge>
                  durumunda
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-7 gap-4">
        {/* Recent Orders */}
        <Card className="lg:col-span-4 h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Son Siparişler</CardTitle>
                <CardDescription>
                  Son alınan 10 sipariş
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders" className="gap-1">
                  Tümü <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] lg:h-[calc(100vh-450px)] lg:min-h-[350px] pr-4">
              <div className="space-y-4">
                {stats.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Henüz sipariş bulunmuyor.
                  </div>
                ) : (
                  stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Masa {order.table?.tableNumber || '?'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.map(i => `${i.quantity}x ${i.product.name}`).join(', ') || 'Ürün bilgisi yok'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(order.createdAt), 'd MMM HH:mm', { locale: tr })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="font-bold">
                           ₺{Number(order.totalAmount).toFixed(2)}
                         </div>
                         <Badge variant="outline" className="text-[10px]">
                           Yeni
                         </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Audit Logs & Popular Products */}
        <div className="lg:col-span-3 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-1 content-start">
          {/* Audit Logs */}
          <Card className="h-full border-none shadow-md overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                </div>
                Son İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {auditLogs.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-3">
                     <div className="p-3 bg-slate-50 rounded-full">
                       <ShieldCheck className="h-6 w-6 opacity-20" />
                     </div>
                     <p className="text-xs font-medium">Henüz işlem kaydı bulunmuyor</p>
                   </div>
                ) : (
                   <div className="divide-y">
                     {auditLogs.map((log) => (
                       <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                         <div className="flex items-start gap-3">
                           {/* Icon based on type */}
                           <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                             log.actionType.includes('DELETE') ? 'bg-red-100 text-red-600' :
                             log.actionType.includes('UPDATE') ? 'bg-amber-100 text-amber-600' :
                             'bg-emerald-100 text-emerald-600'
                           }`}>
                             <ShieldCheck className="h-3 w-3" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between gap-2 mb-0.5">
                               <p className="font-medium text-xs text-slate-900 truncate">
                                 {actionTypeLabels[log.actionType] || log.actionType}
                               </p>
                               <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                 {format(new Date(log.timestamp), 'HH:mm', { locale: tr })}
                               </span>
                             </div>
                             <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                               {log.details}
                             </p>
                             <div className="mt-2 flex items-center gap-2">
                               <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-white font-normal text-slate-500">
                                 {log.admin ? log.admin.name : log.waiter ? `${log.waiter.firstName} ${log.waiter.lastName}` : 'Sistem'}
                               </Badge>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card className="h-full border-none shadow-md overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4 border-b">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <Crown className="h-4 w-4 text-orange-600" />
                    </div>
                    Popüler Ürünler
                  </CardTitle>
               </div>
               <CardDescription className="text-xs mt-1">
                 En çok tercih edilen lezzetler
               </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {stats.popularProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-3">
                    <div className="p-3 bg-slate-50 rounded-full">
                       <UtensilsCrossed className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-xs font-medium">Henüz veri oluşmadı</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {stats.popularProducts.map((product, index) => (
                      <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                        <div className="flex-none font-bold text-sm w-6 text-center text-muted-foreground/50 group-hover:text-primary transition-colors">
                           {index === 0 ? <Crown className="h-5 w-5 text-amber-500 mx-auto fill-amber-500" /> : 
                            index === 1 ? <span className="text-slate-700 text-lg font-black">2</span> :
                            index === 2 ? <span className="text-slate-600 text-lg font-black">3</span> :
                            <span className="text-sm text-slate-400 font-medium">{index + 1}</span>}
                        </div>
                        
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-white shadow-sm shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={getMediaUrl(product.imageUrl)}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-50">
                              <UtensilsCrossed className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                             <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                               {product.name}
                             </p>
                             <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 whitespace-nowrap ml-2">
                               {product._count?.orderItems || 0}
                             </span>
                          </div>
                          
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${
                                 index === 0 ? 'bg-amber-500' : 
                                 index === 1 ? 'bg-slate-700' :
                                 index === 2 ? 'bg-slate-500' :
                                 'bg-primary/60'
                               }`}
                               style={{ width: `${Math.min(100, ((product._count?.orderItems || 0) / (stats.popularProducts[0]?._count?.orderItems || 1)) * 100)}%` }} 
                             />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
