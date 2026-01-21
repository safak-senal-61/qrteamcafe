'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { ProductCard } from '@/components/menu/ProductCard';
import { CartSheet } from '@/components/menu/CartSheet';
// OrdersSheet is no longer used in this component
import { CallWaiterButton } from '@/components/menu/CallWaiterButton';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { io } from 'socket.io-client';

interface Cafe {
  id: string;
  name: string;
  coverImage?: string;
  logo?: string;
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
}

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cafeId = params.cafeId as string;
  const tableNumber = searchParams.get('table');
  
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
          
          let statusText = '';
          switch(updatedOrder.status) {
            case 'PREPARING': statusText = 'Hazırlanıyor'; break;
            case 'DELIVERED': statusText = 'Teslim Edildi'; break;
            case 'CANCELLED': statusText = 'İptal Edildi'; break;
            case 'READY': statusText = 'Hazır'; break;
            default: statusText = updatedOrder.status;
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
    const fetchData = async () => {
      try {
        // Fetch Cafe Details
        const cafeRes = await fetch(`${API_URL}/cafes/${cafeId}`);
        if (!cafeRes.ok) throw new Error('Cafe not found');
        const cafeData = await cafeRes.json();
        setCafe(cafeData);

        // Fetch Categories
        const catRes = await fetch(`${API_URL}/categories?cafeId=${cafeId}`);
        const catData = await catRes.json();
        setCategories(catData);

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
      fetchData();
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

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Header Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background z-10" />
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
              className="mb-2 flex flex-col items-start"
            >
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 shadow-sm">{cafe.name}</h1>
              {tableNumber && (
                <Badge variant="secondary" className="text-lg px-4 py-1 font-bold bg-white/90 text-primary backdrop-blur-md shadow-lg border-2 border-primary/20">
                  Masa {tableNumber}
                </Badge>
              )}
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
            categories={[{ id: 'all', name: 'Tümü' }, ...categories]}
            activeCategory={activeCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      </div>

      {/* Product List */}
      <div className="container mx-auto px-4 py-8 space-y-12">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryProducts.map((product, index) => (
                  <ProductCard key={product.id} product={{
                    ...product,
                    category: category.id,
                    image: product.imageUrl
                  }} index={index} />
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

      <CallWaiterButton />
      <CartSheet 
        onOrderSuccess={() => {
          setIsCartOpen(true);
          fetchActiveOrders();
        }}
        activeOrders={activeOrders}
        onCancelOrder={handleCancelOrder}
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
      />
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
