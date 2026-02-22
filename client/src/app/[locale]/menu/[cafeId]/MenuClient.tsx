'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/navigation';
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
import { TemplateProps, Cafe, Category, Product, Order as BaseOrder } from '@/components/menu/templates/types';

interface Order extends BaseOrder {
  tableId?: string;
  customerId?: string;
}

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

interface MenuClientProps {
  cafeId: string;
  tableNumber?: string | null;
  initialCafe: Cafe | null;
  initialCategories: Category[];
  initialProducts: Product[];
  isDemo?: boolean;
}

export default function MenuClient({ 
  cafeId, 
  tableNumber, 
  initialCafe, 
  initialCategories, 
  initialProducts,
  isDemo = false
}: MenuClientProps) {
  console.log('--- MenuClient Component Rendered ---');
  const router = useRouter();
  // We can still access searchParams in client component if needed, but we pass essential ones as props
  
  const { customer, setAuthDialogOpen, isGuest, isAuthDialogOpen } = useCustomerStore();
  
  const [cafe, setCafe] = useState<Cafe | null>(initialCafe);
  // Sort categories initially on client side to match user local time
  const [categories, setCategories] = useState<Category[]>(() => {
    if (initialCategories.length > 0) {
        return sortCategoriesByTime(initialCategories);
    }
    return [];
  });
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  // If we have initial data, we are not loading
  const [loading, setLoading] = useState(!initialCafe);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (cafe?.welcomeMessage && !isDemo) {
      setWelcomeOpen(true);
    }
  }, [cafe?.welcomeMessage, isDemo]);

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

      socket.on('tableMoved', (data: { oldTableId: string; newTableId: string; newTableNumber: number }) => {
        console.log('Table moved:', data);
        if (data.oldTableId === currentTableId) {
          toast.info(`Masanız ${data.newTableNumber} numaralı masaya taşındı.`);
          
          // Update local storage
          const storageKey = `cafe_${cafeId}_tableId`;
          localStorage.setItem(storageKey, data.newTableId);

          // Update state
          setCurrentTableId(data.newTableId);
          
          // Update URL - Using router to update query params
          router.replace(`/menu/${cafeId}?table=${data.newTableNumber}`);
        }
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
  }, [cafeId, currentTableId, router]);

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
      if (!cafeId) return;

      try {
          // Get session orders
          let sessionOrderIds: string[] = [];
          try {
              const sessionKey = `session_orders_${cafeId}`;
              sessionOrderIds = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
          } catch (e) {
              console.error('Session storage parse error', e);
          }

          const params = new URLSearchParams();
          params.append('cafeId', cafeId);
          if (currentTableId) params.append('tableId', currentTableId);
          if (sessionOrderIds.length > 0) params.append('orderIds', sessionOrderIds.join(','));

          // Only fetch if we have criteria (table or session orders)
          if (currentTableId || sessionOrderIds.length > 0) {
            const url = `${API_URL}/orders/public?${params.toString()}`;
            const ordersRes = await fetch(url);
            
            if (ordersRes.ok) {
                const orders: Order[] = await ordersRes.json();
                setActiveOrders(orders);
            }
          } else {
            setActiveOrders([]);
          }
      } catch (error) {
          console.error("Siparişler çekilemedi", error);
      }
  }, [cafeId, currentTableId]);

  // Fetch orders when table is resolved or customer is present or on load (to check session)
  useEffect(() => {
    fetchActiveOrders();
  }, [currentTableId, customer, fetchActiveOrders]);

  useEffect(() => {
    if (!customer && !isGuest && !isDemo) {
      setAuthDialogOpen(true);
    }
  }, [customer, isGuest, setAuthDialogOpen, isDemo]);

  useEffect(() => {
    // If we already have initial data, we might not need to fetch again immediately
    // unless we want to ensure freshness or cache is missing.
    // For now, let's rely on initial props + revalidation
    
    // We can update the state if we want to support client-side updates
    if (!cafe && cafeId) {
        const fetchMenu = async () => {
          try {
            console.log('Fetching menu data from (client fallback):', API_URL);
            
            // Fetch Cafe Details
            const cafeRes = await fetch(`${API_URL}/cafes/${cafeId}`);
            if (!cafeRes.ok) throw new Error('Cafe fetch failed');
            const cafeData = await cafeRes.json();
            setCafe(cafeData);

            // Fetch Categories
            const catRes = await fetch(`${API_URL}/categories?cafeId=${cafeId}`);
            if (!catRes.ok) throw new Error('Categories fetch failed');
            const catData = await catRes.json();
            setCategories(sortCategoriesByTime(catData));

            // Fetch Products
            const prodRes = await fetch(`${API_URL}/products?cafeId=${cafeId}`);
            if (!prodRes.ok) throw new Error('Products fetch failed');
            const prodData = await prodRes.json();
            setProducts(prodData.filter((p: Product) => p.isAvailable));

          } catch (error) {
            console.error('Menu loading error:', error);
            toast.error('Veriler yüklenirken hata oluştu');
          } finally {
            setLoading(false);
          }
        };
        fetchMenu();
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cafeId, cafe]);

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
    let cleanUrl = url.trim();
    
    // Upgrade HTTP to HTTPS for social media
    if (cleanUrl.startsWith('http://') && !cleanUrl.includes('localhost')) {
        cleanUrl = cleanUrl.replace('http://', 'https://');
    }

    if (cleanUrl.startsWith('https://')) return cleanUrl;
    
    // If it starts with http:// (and wasn't upgraded because localhost?), return as is
    if (cleanUrl.startsWith('http://')) return cleanUrl;

    if (platform === 'instagram' && !cleanUrl.includes('instagram.com')) return `https://instagram.com/${cleanUrl.replace('@', '')}`;
    if (platform === 'facebook' && !cleanUrl.includes('facebook.com')) return `https://facebook.com/${cleanUrl}`;
    if (platform === 'twitter' && !cleanUrl.includes('twitter.com') && !cleanUrl.includes('x.com')) return `https://twitter.com/${cleanUrl.replace('@', '')}`;
    
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

  const isDemoMode = isDemo || cafeId === '2ea6acce-7d77-4a0b-910f-56a05666d89d';

  const templateProps: TemplateProps = {
    cafe,
    cafeId,
    categories,
    products,
    chefProducts,
    popularProducts,
    filteredProducts,
    activeCategory,
    searchQuery,
    scrolled,
    tableNumber: tableNumber || null,
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

  if (cafe.templateId === 'modern') return <ModernTemplate {...templateProps} />;
  if (cafe.templateId === 'minimal') return <MinimalTemplate {...templateProps} />;
  if (cafe.templateId === 'premium') return <PremiumTemplate {...templateProps} />;
  if (cafe.templateId === 'bistro') return <BistroTemplate {...templateProps} />;

  return <ClassicTemplate {...templateProps} />;
}