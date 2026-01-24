import { TemplateProps } from './types';
import { useRouter, useParams } from 'next/navigation';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { ProductCard } from '@/components/menu/ProductCard';
import { CartSheet } from '@/components/menu/CartSheet';
import { CallWaiterButton } from '@/components/menu/CallWaiterButton';
import { CustomerAuthDialog } from '@/components/menu/CustomerAuthDialog';
import { Badge } from '@/components/ui/badge';
import { Search, Wifi, Instagram, Facebook, Twitter, Info, User, UtensilsCrossed, ChefHat } from 'lucide-react';
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

export function BistroTemplate({
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
  const locale = params.locale as string;

  return (
    <div className="min-h-screen bg-[#f8f5e6] text-stone-800 pb-24 relative font-serif selection:bg-orange-200">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] z-0"></div>

      {/* Header Image */}
      <div className="relative h-[40vh] w-full overflow-hidden border-b-4 border-stone-800">
        <div className="absolute inset-0 bg-stone-900/40 z-10" />
        
        {/* Profile/Login Button */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {customer ? (
            <div 
              onClick={() => router.push(`/${locale}/menu/${cafe.id}/profile`)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#f8f5e6] shadow-lg border-2 border-stone-800 cursor-pointer active:scale-95 transition-all hover:bg-orange-50 text-stone-800 font-bold tracking-wide"
            >
              <User className="h-4 w-4" />
              <span className="text-sm uppercase">{customer.name || 'Hesabım'}</span>
            </div>
          ) : (
            <div 
              onClick={() => setAuthDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#f8f5e6] shadow-lg border-2 border-stone-800 cursor-pointer active:scale-95 transition-all hover:bg-orange-50 text-stone-800 font-bold tracking-wide"
            >
              <User className="h-4 w-4" />
              <span className="text-sm uppercase">Giriş</span>
            </div>
          )}
        </div>

        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          src={cafe.coverImage || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop'}
          alt={cafe.name}
          className="w-full h-full object-cover sepia-[.2]"
        />
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full border-4 border-[#f8f5e6] shadow-2xl overflow-hidden mb-6 bg-[#f8f5e6]"
          >
            <img
              src={cafe.logo || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200&auto=format&fit=crop'}
              alt={cafe.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-[#f8f5e6] drop-shadow-lg tracking-tight font-display mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {cafe.name}
          </motion.h1>
          {cafe.description && (
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[#f8f5e6]/90 text-lg italic max-w-xl"
            >
              "{cafe.description}"
            </motion.p>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-stone-800 text-[#f8f5e6] py-3 px-4 shadow-md relative z-30">
        <div className="container mx-auto flex flex-wrap justify-center gap-6 text-sm font-medium tracking-wider uppercase">
          {cafe.wifiPassword && (
            <button onClick={copyWifi} className="flex items-center gap-2 hover:text-orange-200 transition-colors">
              <Wifi className="h-4 w-4" />
              <span>Wi-Fi: {cafe.wifiPassword}</span>
            </button>
          )}
          {tableNumber && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Masa {tableNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            {getSocialUrl('instagram', cafe.instagramUrl || '') && (
              <a href={getSocialUrl('instagram', cafe.instagramUrl || '')} target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {getSocialUrl('website', cafe.website || '') && (
              <a href={getSocialUrl('website', cafe.website || '')} target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                <Info className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Search */}
        <div className="mb-10 max-w-md mx-auto relative">
          <Input
            type="text"
            placeholder="Lezzet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white border-2 border-stone-200 focus:border-stone-800 rounded-none shadow-sm text-lg font-serif placeholder:italic"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-4 min-w-max px-2">
              <button
                onClick={() => onCategorySelect('all')}
                className={cn(
                  "px-6 py-3 border-2 transition-all font-bold tracking-wider uppercase text-sm",
                  activeCategory === 'all'
                    ? "bg-stone-800 text-[#f8f5e6] border-stone-800 shadow-lg scale-105"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                )}
              >
                Tümü
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={cn(
                    "px-6 py-3 border-2 transition-all font-bold tracking-wider uppercase text-sm whitespace-nowrap",
                    activeCategory === category.id
                      ? "bg-stone-800 text-[#f8f5e6] border-stone-800 shadow-lg scale-105"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-16">
          {searchQuery ? (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-stone-300"></div>
                <h2 className="text-3xl font-bold text-stone-800 italic">Arama Sonuçları</h2>
                <div className="h-px flex-1 bg-stone-300"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} index={index} product={{ ...product, image: product.imageUrl, category: product.categoryId }} variant="card" />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <UtensilsCrossed className="h-16 w-16 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 text-xl italic">Aradığınız lezzet bulunamadı...</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {activeCategory === 'all' && (
                <>
                  {/* Chef's Specials */}
                  {chefProducts.length > 0 && (
                    <section className="bg-white p-8 border-2 border-stone-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ChefHat className="w-32 h-32" />
                      </div>
                      <div className="flex items-center justify-center gap-4 mb-10 relative z-10">
                        <div className="h-0.5 w-12 bg-orange-400"></div>
                        <h2 className="text-3xl font-bold text-center uppercase tracking-widest text-stone-800">Şefin Önerileri</h2>
                        <div className="h-0.5 w-12 bg-orange-400"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        {chefProducts.map((product, index) => (
                          <ProductCard key={product.id} index={index} product={{ ...product, image: product.imageUrl, category: product.categoryId }} variant="list" className="bg-[#f8f5e6] border-none shadow-none" />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Popular Items */}
                  {popularProducts.length > 0 && (
                    <section>
                      <h3 className="text-2xl font-bold mb-6 text-stone-800 border-l-4 border-orange-400 pl-4">Popüler Lezzetler</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularProducts.map((product, index) => (
                          <ProductCard key={product.id} index={index} product={{ ...product, image: product.imageUrl, category: product.categoryId }} variant="card" className="border-2 border-stone-100 hover:border-orange-200 transition-colors" />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* Categories */}
              {categories
                .filter(cat => activeCategory === 'all' || activeCategory === cat.id)
                .map(category => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id);
                  if (categoryProducts.length === 0) return null;

                  return (
                    <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24">
                      <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-stone-800 italic">{category.name}</h2>
                        <div className="h-px flex-1 bg-stone-300 border-t border-dashed border-stone-300"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                        {categoryProducts.map((product, index) => (
                          <div key={product.id} className="group">
                             <ProductCard index={index} product={{ ...product, image: product.imageUrl, category: product.categoryId }} variant="list" className="bg-transparent border-b border-stone-200 rounded-none pb-6 shadow-none hover:bg-transparent" />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
            </>
          )}
        </div>
      </div>

      <CartSheet 
        isOpen={isCartOpen} 
        onOpenChange={setIsCartOpen}
        activeOrders={activeOrders}
        onCancelOrder={handleCancelOrder}
      />

      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
        <CallWaiterButton 
          options={cafe.waiterCallOptions}
        />
      </div>

      {/* Dialogs */}
      <CustomerAuthDialog variant="bistro" />
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md bg-[#f8f5e6] border-2 border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-serif font-bold text-stone-800 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-stone-800 text-[#f8f5e6] flex items-center justify-center">
                <ChefHat className="w-8 h-8" />
              </div>
              Hoş Geldiniz!
            </DialogTitle>
            <DialogDescription className="text-center text-stone-600 text-lg pt-4 italic">
              {cafe.welcomeMessage}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
