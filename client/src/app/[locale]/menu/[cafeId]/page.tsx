'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { ProductCard } from '@/components/menu/ProductCard';
import { CartSheet } from '@/components/menu/CartSheet';
// OrdersSheet is no longer used in this component
import { CallWaiterButton } from '@/components/menu/CallWaiterButton';
import { CustomerAuthDialog } from '@/components/menu/CustomerAuthDialog';
import { CustomerProfileDialog } from '@/components/menu/CustomerProfileDialog';
import { useCustomerStore } from '@/store/customer-store';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Wifi, Instagram, Facebook, Twitter, Info, Lock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Cafe {
  id: string;
  name: string;
  coverImage?: string;
  logo?: string;
  showProductRatings?: boolean;
  brandColor?: string;
  menuViewMode?: 'card' | 'list';
  welcomeMessage?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  website?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  isMaintenanceMode?: boolean;
  waiterCallOptions?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
  stock: number;
  originalPrice?: number;
  isChefRecommended?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

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

const getProductTimeScore = (product: Product, categories: Category[], keywords: string[]) => {
  const lowerName = product.name.toLowerCase();
  const category = categories.find(c => c.id === product.categoryId);
  const lowerCatName = category ? category.name.toLowerCase() : '';

  let score = 0;
  if (keywords.some(k => lowerName.includes(k))) score += 10;
  if (keywords.some(k => lowerCatName.includes(k))) score += 5;
  return score;
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
  
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (cafe?.welcomeMessage) {
      setWelcomeOpen(true);
    }
  }, [cafe?.welcomeMessage]);

  useEffect(() => {
    if (cafe?.brandColor) {
      // Assuming brandColor is a hex code or compatible color
      // Since tailwind config uses oklch for primary, we might need to be careful.
      // But we can try setting it. If it fails, we might need a color converter.
      // For now, let's assume it works or we will use a style tag for specific elements.
      // Actually, updating CSS variable might break oklch alpha modifiers if we put hex.
      // But we can update the variable to a hex value and it should work for standard usage.
      // Alpha modifiers won't work if we break the syntax expected by tailwind.
      // But let's try.
      document.documentElement.style.setProperty('--primary', cafe.brandColor);
      document.documentElement.style.setProperty('--ring', cafe.brandColor);
    }
  }, [cafe?.brandColor]);

  useEffect(() => {
    // Socket connection
    let socket: any;

    if (cafeId && currentTableId) {
      socket = io(API_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        console.log('Connected to websocket, joining table:', currentTableId);
        socket.emit('joinTable', { cafeId, tableId: currentTableId });
      });

      socket.on('orderStatusUpdate', (updatedOrder: any) => {
          console.log('Order status update received:', updatedOrder);
          setActiveOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
          
          const hasPrepItems = updatedOrder.items?.some((item: any) => item.product?.requiresPreparation !== false) ?? true;
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

  const fetchActiveOrders = async () => {
      if (!cafeId || !tableNumber) return;
      try {
          const tablesRes = await fetch(`${API_URL}/tables?cafeId=${cafeId}`);
          if (tablesRes.ok) {
              const tables = await tablesRes.json();
              const currentTable = tables.find((t: any) => t.tableNumber === parseInt(tableNumber));
              
              if (currentTable) {
                  setCurrentTableId(currentTable.id);
                  const ordersRes = await fetch(`${API_URL}/orders?cafeId=${cafeId}`);
                  if (ordersRes.ok) {
                      const allOrders = await ordersRes.json();
                      // Sadece bu masaya ait ve ödenmemiş siparişleri al
                      const tableOrders = allOrders.filter((o: any) => o.tableId === currentTable.id && o.status !== 'PAID');
                      setActiveOrders(tableOrders);
                  }
              }
          }
      } catch (error) {
          console.error("Siparişler çekilemedi", error);
      }
  };

  useEffect(() => {
    if (!customer && !isGuest) {
      setAuthDialogOpen(true);
    }
  }, [customer, isGuest, setAuthDialogOpen]);

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

        // Fetch Active Orders
        await fetchActiveOrders();

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
  }, [cafeId]);

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

  const copyWifi = () => {
    if (cafe?.wifiPassword) {
      navigator.clipboard.writeText(cafe.wifiPassword);
      toast.success(`Wi-Fi şifresi kopyalandı: ${cafe.wifiPassword}`);
    }
  };

  // Social URL helper
  const getSocialUrl = (platform: 'instagram' | 'facebook' | 'twitter' | 'website', url: string) => {
    if (!url) return '';
    
    const cleanUrl = url.trim();

    // If it's already a full URL, ensure protocol and return
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Platform specific logic for non-URL inputs
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

    // Default fallback: assume it's a domain or relative path that needs https
    return `https://${cleanUrl}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Header Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background z-10" />
        
        {/* Profile/Login Button */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {customer ? (
            <div 
              onClick={() => setProfileDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/50 cursor-pointer active:scale-95 transition-all hover:bg-white text-primary font-medium"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">{customer.name || 'Hesabım'}</span>
            </div>
          ) : (
            <div 
              onClick={() => setAuthDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/50 cursor-pointer active:scale-95 transition-all hover:bg-white text-primary font-medium"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Giriş Yap</span>
            </div>
          )}
        </div>

        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          src={cafe.coverImage || 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=2078&auto=format&fit=crop'}
          alt={cafe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-background to-transparent pt-24">
          <div className="container mx-auto flex items-end space-x-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-24 w-24 rounded-2xl border-4 border-background overflow-hidden bg-white shadow-2xl"
            >
              <img
                src={cafe.logo || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=200&h=200&auto=format&fit=crop'}
                alt={cafe.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-2 flex flex-col items-start gap-2"
            >
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-1 shadow-sm">{cafe.name}</h1>
              <div className="flex flex-wrap gap-2">
                {tableNumber && (
                  <Badge variant="secondary" className="text-lg px-4 py-1 font-bold bg-white/90 text-primary backdrop-blur-md shadow-lg border-2 border-primary/20">
                    Masa {tableNumber}
                  </Badge>
                )}
                {cafe.wifiSsid && (
                  <div 
                    onClick={copyWifi}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/50 cursor-pointer active:scale-95 transition-all hover:bg-white"
                  >
                    <Wifi className="h-4 w-4 text-primary" />
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] text-muted-foreground font-bold">Wi-Fi: {cafe.wifiSsid}</span>
                      <span className="text-xs font-bold text-foreground">Bağlan</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search Area */}
      <div className="container mx-auto p-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Lezzetli bir şeyler ara..."
            className="pl-10 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-background rounded-2xl h-12 text-base transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky Navigation Area */}
      <div className={cn(
        "sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b transition-all duration-300",
        scrolled ? "shadow-md" : ""
      )}>
        <div className="container mx-auto">
          <CategoryNav
            categories={[
              { id: 'all', name: 'Tümü' },
              ...(chefProducts.length > 0 ? [{ id: 'chef', name: 'Şefin Önerisi' }] : []),
              ...(popularProducts.length > 0 ? [{ id: 'popular', name: 'Popüler' }] : []),
              ...categories
            ]}
            activeCategory={activeCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      </div>

      {/* Product List */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Chef's Recommendations */}
        {chefProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            id="chef"
            className="scroll-mt-48"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-8 bg-orange-500 rounded-full inline-block" />
                Şefin Önerisi
              </h2>
            </div>
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 scrollbar-hide snap-x snap-mandatory">
              {chefProducts.map((product, index) => (
                <div key={product.id} className="w-[280px] flex-shrink-0 snap-center">
                  <ProductCard product={{
                    ...product,
                    category: product.categoryId,
                    image: product.imageUrl
                  }} index={index} showRating={cafe?.showProductRatings} variant="card" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Popular Products */}
        {popularProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            id="popular"
            className="scroll-mt-48"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-8 bg-yellow-400 rounded-full inline-block" />
                Popüler Ürünler
              </h2>
            </div>
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 scrollbar-hide snap-x snap-mandatory">
              {popularProducts.map((product, index) => (
                <div key={product.id} className="w-[280px] flex-shrink-0 snap-center">
                  <ProductCard product={{
                    ...product,
                    category: product.categoryId,
                    image: product.imageUrl
                  }} index={index} showRating={cafe?.showProductRatings} variant="card" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {categories.map((category, catIndex) => {
          const categoryProducts = filteredProducts.filter(
            (p) => p.categoryId === category.id
          );

          if (categoryProducts.length === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: catIndex * 0.1 }}
              key={category.id}
              id={category.id}
              className="scroll-mt-48"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-8 bg-primary rounded-full inline-block" />
                  {category.name}
                </h2>
                <Badge variant="outline" className="text-sm px-3 py-1 border-primary/20 text-muted-foreground bg-primary/5">
                  {categoryProducts.length} ürün
                </Badge>
              </div>
              <div className={cn(
                "grid gap-6",
                cafe.menuViewMode === 'list' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {categoryProducts.map((product, index) => (
                  <ProductCard key={product.id} product={{
                    ...product,
                    category: category.id,
                    image: product.imageUrl
                  }} index={index} showRating={cafe?.showProductRatings} variant={cafe.menuViewMode || 'card'} />
                ))}
              </div>
            </motion.div>
          );
        })}
        
        {/* If searching and no results */}
        {filteredProducts.length === 0 && (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="bg-secondary/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Sonuç Bulunamadı</h3>
                <p className="text-muted-foreground">"{searchQuery}" için eşleşen ürün yok.</p>
            </div>
        )}
      </div>

      <CallWaiterButton options={cafe.waiterCallOptions} />

      {/* Footer with Social Links */}
      <footer className="mt-20 py-10 bg-secondary/30 border-t">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6">
          <div className="flex gap-4">
            {cafe.instagramUrl && (
              <a href={getSocialUrl('instagram', cafe.instagramUrl)} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white shadow-md hover:scale-110 transition-transform text-pink-600">
                <Instagram className="h-6 w-6" />
              </a>
            )}
            {cafe.facebookUrl && (
              <a href={getSocialUrl('facebook', cafe.facebookUrl)} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white shadow-md hover:scale-110 transition-transform text-blue-600">
                <Facebook className="h-6 w-6" />
              </a>
            )}
            {cafe.twitterUrl && (
              <a href={getSocialUrl('twitter', cafe.twitterUrl)} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white shadow-md hover:scale-110 transition-transform text-sky-500">
                <Twitter className="h-6 w-6" />
              </a>
            )}
            {cafe.website && (
              <a href={getSocialUrl('website', cafe.website)} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white shadow-md hover:scale-110 transition-transform text-gray-700">
                <Info className="h-6 w-6" />
              </a>
            )}
          </div>
          <div className="text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} {cafe.name}</p>
            <p className="mt-1">QR Team Cafe Altyapısı ile Hazırlanmıştır</p>
          </div>
        </div>
      </footer>

      <CartSheet 
        cafeId={cafeId}
        tableId={currentTableId || undefined}
        onOrderSuccess={() => {
          setIsCartOpen(true);
          fetchActiveOrders();
        }}
        activeOrders={activeOrders}
        onCancelOrder={handleCancelOrder}
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
      />

      {/* Welcome Message Dialog */}
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex flex-col items-center gap-4 pt-4">
              {cafe.logo && (
                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-primary/20">
                   <img src={cafe.logo} alt={cafe.name} className="h-full w-full object-cover" />
                </div>
              )}
              <span>Hoş Geldiniz!</span>
            </DialogTitle>
            <DialogDescription className="text-lg pt-2 text-foreground/80">
              {cafe.welcomeMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4 pb-2">
            <Badge variant="outline" className="text-primary border-primary/50 py-1 px-4 cursor-pointer hover:bg-primary/5" onClick={() => setWelcomeOpen(false)}>
              Menüyü İncele
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
      <CustomerAuthDialog />
      <CustomerProfileDialog 
        open={isProfileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </div>
  );
}
