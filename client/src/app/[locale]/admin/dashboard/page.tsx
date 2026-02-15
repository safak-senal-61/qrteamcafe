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
import { API_URL, getMediaUrl } from '@/lib/api';
import Image from 'next/image';
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
          const token = localStorage.getItem('token');
          console.log('Checking stored cards from API...');
          const res = await fetch(`${API_URL}/payments/cards`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const cards = await res.json();
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
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isSoundEnabled: newState }),
      });

      if (response.ok) {
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
        const response = await fetch(`${API_URL}/cafes/${cafeId}/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
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
        const annResponse = await fetch(`${API_URL}/announcements/active`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (annResponse.ok) {
           const annData = await annResponse.json();
           setAnnouncements(annData);
        }

        // Fetch Audit Logs
        const logsResponse = await fetch(`${API_URL}/audit-logs?limit=5`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logsResponse.ok) {
           const logsData = await logsResponse.json();
           setAuditLogs(logsData.logs || []);
        }

      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Sunucu hatası.');
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

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel</h2>
          <p className="text-muted-foreground">
            Kafe durumunu ve istatistiklerini görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-4">
           {/* Sound Toggle */}
           <Button
             variant="outline"
             size="icon"
             onClick={toggleSound}
             className={soundEnabled ? 'text-primary' : 'text-muted-foreground'}
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

           <Button variant="outline" asChild>
             <Link href="/admin/settings">Ayarlar</Link>
           </Button>
           <Button asChild>
             <Link href="/admin/orders">Siparişler</Link>
           </Button>
        </div>
      </div>

      {/* Subscription Status Banner */}
      {subStatus && (
        <Card className={`${subStatus.color} border-none text-white shadow-lg overflow-hidden relative`}>
           <div className="absolute right-0 top-0 h-full w-32 bg-white/10 skew-x-12 translate-x-16" />
           <CardContent className="p-6 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-full">
                    <subStatus.icon className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">{subStatus.label}</h3>
                    <p className="text-white/90 text-sm">
                       {subStatus.type === 'EXPIRED' 
                          ? 'Abonelik süreniz dolmuştur. Hizmetlerden yararlanmaya devam etmek için lütfen yenileyin.'
                          : `Kalan Süre: ${subStatus.daysLeft} Gün`}
                    </p>
                 </div>
              </div>
              <Button 
                variant="secondary" 
                className="whitespace-nowrap bg-white text-slate-900 hover:bg-slate-100"
                asChild
              >
                 <Link href="/pricing">
                    {subStatus.type === 'EXPIRED' ? 'Hemen Yenile' : 'Paketi Yükselt'}
                 </Link>
              </Button>
           </CardContent>
        </Card>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="col-span-4">
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
            <ScrollArea className="h-[350px] pr-4">
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
        <div className="col-span-3 space-y-4">
          {/* Audit Logs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Son İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                      İşlem kaydı yok.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0 last:pb-0">
                        <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${
                          log.actionType.includes('DELETE') ? 'bg-red-100 text-red-600' :
                          log.actionType.includes('UPDATE') ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">
                            {actionTypeLabels[log.actionType] || log.actionType}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {log.admin ? log.admin.name : log.waiter ? `${log.waiter.firstName} ${log.waiter.lastName}` : 'Sistem'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(log.timestamp), 'HH:mm', { locale: tr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card>
            <CardHeader>
              <CardTitle>Popüler Ürünler</CardTitle>
              <CardDescription>
                En çok sipariş edilenler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.popularProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Veri yok.
                  </div>
                ) : (
                  stats.popularProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        {product.imageUrl ? (
                          <Image
                            src={getMediaUrl(product.imageUrl)}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product._count?.orderItems || 0} sipariş
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
