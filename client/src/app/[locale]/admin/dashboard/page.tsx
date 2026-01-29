'use client';

import { useEffect, useState } from 'react';
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
  ExternalLink,
  BellRing,
  ChevronRight,
  Star,
  Crown,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/navigation';
import { API_URL } from '@/lib/api';
import Image from 'next/image';
import { Socket } from 'socket.io-client';

// Sayfanın dinamik olmasını zorla (Cache sorunlarını önlemek için)
export const dynamic = 'force-dynamic';

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

import { io } from 'socket.io-client';
import { useRef } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
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

  // WebSocket connection for real-time active tables
  useEffect(() => {
    // LocalStorage'dan sayaç durumunu yükle
    const savedCount = localStorage.getItem('newOrderCount');
    if (savedCount) {
      setNewOrderCount(parseInt(savedCount));
    }

    let socket: Socket | undefined;

    if (cafeId) {
      console.log('Connecting to websocket with cafeId:', cafeId);
      socket = io(API_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        console.log('Admin connected to websocket');
        setIsConnected(true);
        socket?.emit('joinAdmin', { cafeId });
      });

      socket.on('disconnect', () => {
        console.log('Admin disconnected from websocket');
        setIsConnected(false);
      });

      socket.on('activeTablesUpdate', (count: number) => {
        console.log('Active tables update:', count);
        setStats((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            activeTables: count,
          };
        });
      });

      socket.on('newOrder', (order: DashboardOrder) => {
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
            onClick: () => router.push('/admin/orders'),
          },
        });
        
        setNewOrderCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem('newOrderCount', newCount.toString());
          return newCount;
        });

        // Sipariş sayısını ve listesini güncelle
        setStats((prev) => {
          if (!prev) return null;
          // Yeni siparişi listenin başına ekle
          const updatedRecentOrders = [order, ...prev.recentOrders].slice(0, 10);
          
          return {
            ...prev,
            totalOrders: prev.totalOrders + 1,
            recentOrders: updatedRecentOrders,
          };
        });
      });

      // Garson Çağırma Bildirimi
      socket.on('waiterCall', (call: WaiterCall) => {
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
      });
    }

    return () => {
      if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
      }
    };
  }, [cafeId, audio, router]); // soundEnabled bağımlılığı kaldırıldı, ref kullanılıyor

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
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Sunucu hatası.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleViewOrders = () => {
    setNewOrderCount(0);
    localStorage.setItem('newOrderCount', '0');
  };

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
      value: stats.activeTables,
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

    const { plan, subscriptionEndsAt, trialEndsAt, isSubscriptionActive } = stats.subscription;
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
      {/* Subscription Status Banner */}
      {subStatus && (
        <div className={`p-6 rounded-xl text-white shadow-lg ${subStatus.color} flex items-center justify-between relative overflow-hidden`}>
          <div className="flex items-center gap-4 z-10">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <subStatus.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {subStatus.label}
                {subStatus.type === 'PRO' && <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">Premium</Badge>}
              </h3>
              <p className="text-white/90 text-sm">
                {subStatus.daysLeft > 0 
                  ? `${subStatus.daysLeft} gün kaldı` 
                  : 'Abonelik süreniz doldu, lütfen yenileyin.'}
              </p>
            </div>
          </div>
          
          {subStatus.type !== 'PRO' && (
             <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100 z-10" onClick={() => router.push('/pricing')}>
               Yükselt
             </Button>
          )}

          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-10" />
        </div>
      )}

      {newOrderCount > 0 && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-full animate-pulse">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary">Yeni Sipariş Var!</h3>
              <p className="text-sm text-muted-foreground">
                {newOrderCount} adet yeni sipariş onay bekliyor.
              </p>
            </div>
          </div>
          <Link href="/admin/orders">
             <Button onClick={handleViewOrders} className="rounded-full px-6 font-bold shadow-lg shadow-primary/20">
               Siparişleri Görüntüle <ChevronRight className="ml-2 h-4 w-4" />
             </Button>
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel Özeti</h2>
          <p className="text-muted-foreground">
            İşletmenizin genel durumunu buradan takip edebilirsiniz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isConnected && (
            <Badge variant="destructive" className="animate-pulse">
              Bağlantı Yok
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSound}
            className={`gap-2 transition-all duration-300 ${
              soundEnabled 
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 shadow-sm'
                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 shadow-sm'
            }`}
          >
            <BellRing className={`h-4 w-4 ${soundEnabled ? 'fill-current animate-pulse' : 'opacity-50'}`} />
            Bildirim Sesi Ayarları: {soundEnabled ? 'Açık' : 'Kapalı'}
          </Button>
          <Link href="/admin/products">
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 gap-2"
            >
              <Star className="h-4 w-4 fill-current" />
              Öneri Sun
            </Button>
          </Link>
          {cafeId && (
            <Link href={`/menu/${cafeId}?demo=true`} target="_blank">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                <ExternalLink className="mr-2 h-4 w-4" />
                Menü Önizleme
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const CardComponent = (
            <Card className={`border-none shadow-sm hover:shadow-md transition-all h-full ${stat.href ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <span className="text-green-600 flex items-center font-medium mr-1">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    {stat.change}
                  </span>
                </p>
              </CardContent>
            </Card>
          );

          return stat.href ? (
            <Link key={index} href={stat.href} className="block h-full">
              {CardComponent}
            </Link>
          ) : (
            <div key={index} className="h-full">
              {CardComponent}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Son Siparişler</CardTitle>
            <CardDescription>
              Son alınan siparişler.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-4">
                {stats.recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Henüz sipariş yok.</p>
                ) : (
                  stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50 group">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                        M{order.table?.tableNumber || '?'}
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold leading-none text-foreground/80 group-hover:text-primary transition-colors">
                            Masa {order.table?.tableNumber}
                          </p>
                          <span className="text-xs text-muted-foreground font-mono">
                            #{order.id.slice(-4)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length || 0} Parça Ürün
                        </p>
                      </div>
                      <div className="ml-4 font-bold text-sm bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-100">
                        +₺{Number(order.totalAmount).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Popüler Ürünler</CardTitle>
            <CardDescription>
              En çok tercih edilen ürünleriniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.popularProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Veri yok.</p>
              ) : (
                stats.popularProducts.map((product) => (
                  <div key={product.id} className="flex items-center">
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden relative">
                       {product.imageUrl ? (
                         <Image 
                           src={product.imageUrl} 
                           alt={product.name} 
                           fill
                           className="object-cover"
                           unoptimized
                         />
                       ) : (
                         <span className="text-2xl">🍔</span>
                       )}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product._count?.orderItems || 0} Satış
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
  );
}