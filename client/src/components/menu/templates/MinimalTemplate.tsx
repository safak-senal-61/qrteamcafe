import { TemplateProps } from './types';
import { useRouter, useParams } from 'next/navigation';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { ProductCard } from '@/components/menu/ProductCard';
import { CartSheet } from '@/components/menu/CartSheet';
import { CallWaiterButton } from '@/components/menu/CallWaiterButton';
import { CustomerAuthDialog } from '@/components/menu/CustomerAuthDialog';
import { Badge } from '@/components/ui/badge';
import { Search, Wifi, Instagram, Facebook, Twitter, Info, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function MinimalTemplate({
  cafe,
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
  onCategorySelect,
  setSearchQuery,
  setAuthDialogOpen,
  setWelcomeOpen,
  setIsCartOpen,
  handleCancelOrder,
  fetchActiveOrders,
  currentTableId,
  copyWifi,
  getSocialUrl
}: TemplateProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale;

  return (
    <div className="min-h-screen bg-white pb-24 relative font-sans text-zinc-900 selection:bg-zinc-100">
      <CustomerAuthDialog variant="minimal" />
      
      {/* Minimal Header */}
      <div className="pt-8 pb-4 px-6 bg-white border-b border-zinc-100">
        <div className="container mx-auto flex flex-col items-center gap-6">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-20 h-20 rounded-full overflow-hidden border border-zinc-100 shadow-sm"
          >
             <img
                src={cafe.logo || 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?q=80&w=200&h=200&auto=format&fit=crop'}
                alt={cafe.name}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
          </motion.div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light tracking-wide uppercase text-zinc-900">{cafe.name}</h1>
            {tableNumber && (
              <span className="inline-block text-xs font-medium tracking-widest text-zinc-400 border border-zinc-200 px-3 py-1 rounded-full uppercase">
                Masa {tableNumber}
              </span>
            )}
          </div>

          {/* User & Actions */}
          <div className="flex gap-4">
             {customer ? (
              <button 
                onClick={() => router.push(`/${locale}/menu/${cafe.id}/profile`)}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {customer.name}
              </button>
            ) : (
               <button 
                onClick={() => setAuthDialogOpen(true)}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Giriş Yap
              </button>
             )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-50 py-4 px-4">
        <div className="container mx-auto max-w-lg">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
             <input
               type="text"
               placeholder="Menüde ara..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-200 transition-all placeholder:text-zinc-400"
             />
           </div>
        </div>
      </div>

      {/* Categories - Horizontal Scroll */}
      <div className="bg-white border-b border-zinc-100 py-4 sticky top-[73px] z-30">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto gap-6 px-4 pb-2 scrollbar-hide">
            <button
               onClick={() => onCategorySelect('all')}
               className={cn(
                 "whitespace-nowrap text-sm tracking-wide transition-colors pb-1 border-b-2",
                 activeCategory === 'all' 
                   ? "border-zinc-900 text-zinc-900 font-medium" 
                   : "border-transparent text-zinc-500 hover:text-zinc-900"
               )}
            >
              TÜMÜ
            </button>
            {chefProducts.length > 0 && (
               <button
                 onClick={() => onCategorySelect('chef')}
                 className={cn(
                   "whitespace-nowrap text-sm tracking-wide transition-colors pb-1 border-b-2",
                   activeCategory === 'chef' 
                     ? "border-zinc-900 text-zinc-900 font-medium" 
                     : "border-transparent text-zinc-500 hover:text-zinc-900"
                 )}
               >
                 ŞEFİN SEÇİMİ
               </button>
            )}
            {popularProducts.length > 0 && (
               <button
                 onClick={() => onCategorySelect('popular')}
                 className={cn(
                   "whitespace-nowrap text-sm tracking-wide transition-colors pb-1 border-b-2",
                   activeCategory === 'popular' 
                     ? "border-zinc-900 text-zinc-900 font-medium" 
                     : "border-transparent text-zinc-500 hover:text-zinc-900"
                 )}
               >
                 POPÜLER
               </button>
            )}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={cn(
                  "whitespace-nowrap text-sm tracking-wide transition-colors pb-1 border-b-2",
                  activeCategory === cat.id 
                    ? "border-zinc-900 text-zinc-900 font-medium" 
                    : "border-transparent text-zinc-500 hover:text-zinc-900"
                )}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Chef's */}
        {chefProducts.length > 0 && (
          <section id="chef" className="scroll-mt-48">
             <h2 className="text-xl font-light text-center mb-8 tracking-widest uppercase text-zinc-400">Şefin Seçimi</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {chefProducts.map((product, index) => (
                 <div key={product.id} className="group">
                    <ProductCard 
                      product={{...product, category: product.categoryId, image: product.imageUrl}} 
                      index={index} 
                      showRating={cafe?.showProductRatings} 
                      variant="list" 
                      className="border-b border-zinc-100 pb-4 rounded-none bg-transparent hover:bg-transparent shadow-none hover:shadow-none p-0"
                    />
                 </div>
               ))}
             </div>
          </section>
        )}

        {/* Popular */}
        {popularProducts.length > 0 && (
          <section id="popular" className="scroll-mt-48">
             <h2 className="text-xl font-light text-center mb-8 tracking-widest uppercase text-zinc-400">Popüler Lezzetler</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {popularProducts.map((product, index) => (
                 <div key={product.id}>
                    <ProductCard 
                      product={{...product, category: product.categoryId, image: product.imageUrl}} 
                      index={index} 
                      showRating={cafe?.showProductRatings} 
                      variant="list" 
                      className="border-b border-zinc-100 pb-4 rounded-none bg-transparent hover:bg-transparent shadow-none hover:shadow-none p-0"
                    />
                 </div>
               ))}
             </div>
          </section>
        )}

        {/* Categories */}
        {categories.map((category) => {
          const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} id={category.id} className="scroll-mt-48">
              <div className="flex items-center justify-center mb-10">
                 <span className="h-px w-8 bg-zinc-200"></span>
                 <h2 className="text-xl font-light mx-4 tracking-widest uppercase text-zinc-800">{category.name}</h2>
                 <span className="h-px w-8 bg-zinc-200"></span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {categoryProducts.map((product, index) => (
                  <ProductCard 
                    key={product.id}
                    product={{...product, category: category.id, image: product.imageUrl}} 
                    index={index} 
                    showRating={cafe?.showProductRatings} 
                    variant="list"
                    className="border-b border-zinc-100 pb-4 rounded-none bg-transparent hover:bg-transparent shadow-none hover:shadow-none p-0"
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
             <p className="text-zinc-400">Ürün bulunamadı.</p>
          </div>
        )}
      </div>

      <CallWaiterButton options={cafe.waiterCallOptions} />
      
      <CartSheet 
        cafeId={cafe.id}
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

      <CustomerAuthDialog variant="minimal" />
      
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md text-center border-none shadow-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-light tracking-wide uppercase pt-4">Hoş Geldiniz</DialogTitle>
            <DialogDescription className="pt-2 text-zinc-500 font-light">
              {cafe.welcomeMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button 
              onClick={() => setWelcomeOpen(false)}
              className="text-xs tracking-widest uppercase border-b border-zinc-900 pb-1 hover:text-zinc-600 hover:border-zinc-600 transition-colors"
            >
              Menüyü İncele
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
