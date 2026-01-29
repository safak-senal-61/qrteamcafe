'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useCustomerStore } from '@/store/customer-store';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

import { ClassicTemplate } from '@/components/menu/templates/ClassicTemplate';
import { ModernTemplate } from '@/components/menu/templates/ModernTemplate';
import { MinimalTemplate } from '@/components/menu/templates/MinimalTemplate';
import { PremiumTemplate } from '@/components/menu/templates/PremiumTemplate';
import { BistroTemplate } from '@/components/menu/templates/BistroTemplate';
import { TemplateProps, Cafe, Category, Product, Order } from '@/components/menu/templates/types';

interface Table {
  id: string;
  tableNumber: number;
}

// Helper functions
const getPriorityKeywords = (currentHour: number) => {
  if (currentHour >= 5 && currentHour < 12) {
    // Sabah (05:00 - 12:00): Kahvaltı öncelikli
    return ['kahvaltı', 'börek', 'poğaça', 'simit', 'tost', 'yumurta', 'menemen', 'çay', 'sıcak içecek'];
  } else if (currentHour >= 12 && currentHour < 17) {
    // Öğle (12:00 - 17:00): Hızlı yemek ve öğle menüleri
    return ['döner', 'burger', 'pide', 'lahmacun', 'kebap', 'ana yemek', 'pizza', 'salata', 'makarna', 'çorba'];
  } else if (currentHour >= 17 && currentHour < 22) {
    // Akşam (17:00 - 22:00): Ana yemekler
    return ['ana yemek', 'ızgara', 'balık', 'steak', 'makarna', 'pizza', 'kebap', 'başlangıç'];
  } else {
    // Gece (22:00 - 05:00): Çorba, tatlı, atıştırmalık
    return ['çorba', 'kokoreç', 'sokak', 'tatlı', 'atıştırmalık', 'içecek', 'kahve'];
  }
};

const sortCategoriesByTime = (categories: Category[]) => {
  const now = new Date();
  const currentHour = now.getHours();
  const priorityKeywords = getPriorityKeywords(currentHour);

  // Helper to check if category matches any keyword
  const isPriority = (name: string) => {
    const lowerName = name.toLowerCase();
    return priorityKeywords.some(keyword => lowerName.includes(keyword));
  };

  // Separate into two groups while preserving original sortOrder
  const priorityCats: Category[] = [];
  const otherCats: Category[] = [];

  categories.forEach(cat => {
    if (isPriority(cat.name)) {
      priorityCats.push(cat);
    } else {
      otherCats.push(cat);
    }
  });

  return [...priorityCats, ...otherCats];
};

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cafeId = params.cafeId as string;
  const tableNumber = searchParams.get('table');
  const { customer, setAuthDialogOpen, isGuest, isAuthDialogOpen } = useCustomerStore();
  
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    const isDemo = searchParams.get('demo') === 'true';
    if (cafe?.welcomeMessage && !isDemo) {
      setWelcomeOpen(true);
    }
  }, [cafe?.welcomeMessage, searchParams]);

  useEffect(() => {
    if (cafe?.themeConfig) {
      try {
        const config = JSON.parse(cafe.themeConfig);
        if (config.theme === 'bordo-gold') {
          document.documentElement.setAttribute('data-theme', 'bordo-gold');
          // Remove inline styles to let the theme class take over
          document.documentElement.style.removeProperty('--primary');
          document.documentElement.style.removeProperty('--ring');
          return;
        }
      } catch (e) {
        console.error('Theme config parse error', e);
      }
    }
    
    // Default or Custom handling
    document.documentElement.removeAttribute('data-theme');
    if (cafe?.brandColor) {
      document.documentElement.style.setProperty('--primary', cafe.brandColor);
      document.documentElement.style.setProperty('--ring', cafe.brandColor);
    }
  }, [cafe?.brandColor, cafe?.themeConfig]);

  useEffect(() => {
    // Socket connection
    let socket: Socket | undefined;

    if (cafeId && currentTableId) {
      socket = io(API_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        console.log('Connected to websocket, joining table:', currentTableId);
        socket?.emit('joinTable', { cafeId, tableId: currentTableId });
      });

      socket.on('orderStatusUpdate', (updatedOrder: Order) => {
          console.log('Order status update received:', updatedOrder);
          setActiveOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
          
          const hasPrepItems = updatedOrder.items?.some((item) => item.product?.requiresPreparation !== false) ?? true;
          let statusText = '';
          
          switch(updatedOrder.status) {
            case 'PREPARING': 
              statusText = hasPrepItems ? 'Hazırlanıyor' : 'Sipariş Alındı'; 
              break;
            case 'DELIVERED': 
              statusText = 'Teslim Edildi'; 
              break;
            case 'CANCELLED': 
              statusText = 'İptal Edildi'; 
              break;
            case 'READY': 
              statusText = hasPrepItems ? 'Hazır' : 'Servise Hazır'; 
              break;
            default: 
              statusText = updatedOrder.status;
          }
          
          toast.info(`Sipariş durumu güncellendi: ${statusText}`);
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [cafeId, currentTableId]);

  // Resolve Table ID independently
  useEffect(() => {
    const resolveTable = async () => {
      // Try to recover from storage if param is missing
      const storageKey = `cafe_${cafeId}_tableId`;
      
      if (!tableNumber) {
        const savedTableId = localStorage.getItem(storageKey);
        if (savedTableId) {
            console.log('Restoring tableId from storage:', savedTableId);
            setCurrentTableId(savedTableId);
        }
        return;
      }

      try {
        console.log('Fetching tables for cafe:', cafeId);
        const tablesRes = await fetch(`${API_URL}/tables?cafeId=${cafeId}`);
        if (tablesRes.ok) {
          const tables: Table[] = await tablesRes.json();
          console.log('Tables fetched:', tables);
          
          // Use loose comparison for tableNumber (string vs number)
          const currentTable = tables.find((t) => t.tableNumber == parseInt(tableNumber));
          
          if (currentTable) {
            console.log('Table resolved:', currentTable);
            setCurrentTableId(currentTable.id);
            localStorage.setItem(storageKey, currentTable.id);
          } else {
            console.warn('Table not found for number:', tableNumber);
            toast.error(`Masa ${tableNumber} bulunamadı.`);
          }
        } else {
            console.error('Failed to fetch tables:', tablesRes.status);
        }
      } catch (error) {
        console.error("Masa bilgisi alınamadı", error);
        toast.error('Masa bilgisi alınırken hata oluştu.');
      }
    };
    resolveTable();
  }, [cafeId, tableNumber]);

  const fetchActiveOrders = useCallback(async () => {
      if (!cafeId || !currentTableId) return;
      try {
          const ordersRes = await fetch(`${API_URL}/orders?cafeId=${cafeId}`);
          if (ordersRes.ok) {
              const allOrders: Order[] = await ordersRes.json();
              // Sadece bu masaya ait ve ödenmemiş siparişleri al
              const tableOrders = allOrders.filter((o) => o.tableId === currentTableId && o.status !== 'PAID');
              setActiveOrders(tableOrders);
          }
      } catch (error) {
          console.error("Siparişler çekilemedi", error);
      }
  }, [cafeId, currentTableId]);

  // Fetch orders when table is resolved
  useEffect(() => {
    if (currentTableId) {
      fetchActiveOrders();
    }
  }, [currentTableId, fetchActiveOrders]);

  useEffect(() => {
    const isDemo = searchParams.get('demo') === 'true';
    if (!customer && !isGuest && !isDemo) {
      setAuthDialogOpen(true);
    }
  }, [customer, isGuest, setAuthDialogOpen, searchParams]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Fetch Cafe Details
        const cafeRes = await fetch(`${API_URL}/cafes/${cafeId}`);
        if (!cafeRes.ok) throw new Error('Cafe not found');
        const cafeData = await cafeRes.json();
        setCafe(cafeData);

        // Fetch Categories
        const catRes = await fetch(`${API_URL}/categories?cafeId=${cafeId}`);
        const catData = await catRes.json();
        // Apply time-based sorting
        const sortedCats = sortCategoriesByTime(catData);
        setCategories(sortedCats);

        // Fetch Products
        const prodRes = await fetch(`${API_URL}/products?cafeId=${cafeId}`);
        const prodData = await prodRes.json();
        setProducts(prodData.filter((p: Product) => p.isAvailable));

      } catch (error) {
        console.error(error);
        toast.error('Menü yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (cafeId) {
      fetchMenu();
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cafeId, fetchActiveOrders]);

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const chefProducts = products.filter(p => p.isChefRecommended);
  const popularProducts = [...products].sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0)).slice(0, 5);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (res.ok) {
        toast.success('Sipariş iptal edildi.');
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      } else {
        const error = await res.json();
        toast.error(error.message || 'Sipariş iptal edilemedi.');
      }
    } catch (error) {
      console.error(error);
      toast.error('İptal işlemi sırasında bir hata oluştu.');
    }
  };

  const copyWifi = () => {
    if (cafe?.wifiPassword) {
      navigator.clipboard.writeText(cafe.wifiPassword);
      toast.success(`Wi-Fi şifresi kopyalandı: ${cafe.wifiPassword}`);
    }
  };

  const getSocialUrl = (platform: 'instagram' | 'facebook' | 'twitter' | 'website', url: string) => {
    if (!url) return '';
    
    const cleanUrl = url.trim();

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    if (platform === 'instagram') {
        if (!cleanUrl.includes('instagram.com')) {
             return `https://instagram.com/${cleanUrl.replace('@', '')}`;
        }
    }
    
    if (platform === 'facebook') {
        if (!cleanUrl.includes('facebook.com')) {
             return `https://facebook.com/${cleanUrl}`;
        }
    }

    if (platform === 'twitter') {
        if (!cleanUrl.includes('twitter.com') && !cleanUrl.includes('x.com')) {
             return `https://twitter.com/${cleanUrl.replace('@', '')}`;
        }
    }

    return `https://${cleanUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Cafe Bulunamadı</h1>
        <p className="text-muted-foreground">Aradığınız menüye şu anda ulaşılamıyor.</p>
      </div>
    );
  }

  if (cafe.isMaintenanceMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center space-y-6">
         <Lock className="h-24 w-24 text-muted-foreground opacity-20" />
         <h1 className="text-3xl font-bold">Hizmet Dışı</h1>
         <p className="text-muted-foreground max-w-md">
           Şu anda bakım çalışması yapıyoruz veya hizmet dışıyız. Lütfen daha sonra tekrar deneyiniz.
         </p>
      </div>
    );
  }

  const isDemoMode = searchParams.get('demo') === 'true' || cafeId === '2ea6acce-7d77-4a0b-910f-56a05666d89d';

  const templateProps: TemplateProps = {
    cafe,
    cafeId, // Explicitly pass cafeId from params
    categories,
    products,
    chefProducts,
    popularProducts,
    filteredProducts,
    activeCategory,
    searchQuery,
    scrolled,
    tableNumber,
    customer,
    activeOrders,
    isCartOpen,
    welcomeOpen,
    isAuthDialogOpen,
    onCategorySelect: handleCategorySelect,
    setSearchQuery,
    setAuthDialogOpen,
    setWelcomeOpen,
    setIsCartOpen,
    handleCancelOrder,
    fetchActiveOrders,
    currentTableId,
    copyWifi,
    getSocialUrl,
    isDemoMode,
  };

  if (cafe.templateId === 'modern') {
    return <ModernTemplate {...templateProps} />;
  }

  if (cafe.templateId === 'minimal') {
    return <MinimalTemplate {...templateProps} />;
  }

  if (cafe.templateId === 'premium') {
    return <PremiumTemplate {...templateProps} />;
  }

  if (cafe.templateId === 'bistro') {
    return <BistroTemplate {...templateProps} />;
  }

  return <ClassicTemplate {...templateProps} />;
}
