import { TemplateProps } from './types';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/menu/ProductCard';
import { CartSheet } from '@/components/menu/CartSheet';
import { CallWaiterButton } from '@/components/menu/CallWaiterButton';
import { CustomerAuthDialog } from '@/components/menu/CustomerAuthDialog';
import { Badge } from '@/components/ui/badge';
import { Search, Wifi, Instagram, Facebook, Twitter, Info, User, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { useTranslations } from 'next-intl';

export function ModernTemplate({
  cafe,
  cafeId,
  categories,
  chefProducts,
  popularProducts,
  filteredProducts,
  activeCategory,
  searchQuery,
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
  getSocialUrl,
  isDemoMode
}: TemplateProps) {
  const t = useTranslations('Menu');
  const router = useRouter();
  const coverImage = getMediaUrl(cafe.coverImage) || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop';
  const logoImage = getMediaUrl(cafe.logo);
  const productFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 relative font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Modern Header */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
        
        {/* Profile/Login Button */}
        {!isDemoMode && (
        <div className="absolute top-6 right-6 z-50 flex gap-3">
          {customer ? (
            <div 
              onClick={() => router.push(`/menu/${cafe.id}/profile`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer active:scale-95 transition-all hover:bg-white/20 text-white font-medium shadow-2xl"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">{customer.name || t('myAccount')}</span>
            </div>
          ) : (
            <div 
              onClick={() => setAuthDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/80 backdrop-blur-md border border-primary/50 cursor-pointer active:scale-95 transition-all hover:bg-primary text-white font-medium shadow-2xl"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">{t('login')}</span>
            </div>
          )}
        </div>
        )}

        <motion.div
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={coverImage}
            alt={cafe.name}
            fill
            className="object-cover opacity-60"
            priority
          />
        </motion.div>
        
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pt-32">
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center space-y-4"
            >
                {logoImage && (
                    <div className="relative w-24 h-24 rounded-full border-2 border-white/20 shadow-2xl overflow-hidden mb-2">
                        <Image src={logoImage} alt={cafe.name} fill className="object-cover" />
                    </div>
                )}
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg">{cafe.name}</h1>
              
              <div className="flex flex-wrap justify-center gap-3">
                {tableNumber && (
                  <Badge className="text-lg px-6 py-1.5 font-bold bg-white text-black hover:bg-white/90 shadow-lg border-0 rounded-full">
                    {t('table')} {tableNumber}
                  </Badge>
                )}
                 {cafe.wifiSsid && (
                  <div 
                    onClick={copyWifi}
                    className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 cursor-pointer hover:bg-white/20 transition-all text-white"
                  >
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">{cafe.wifiSsid}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search Area */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 transition-all">
        <div className="container mx-auto px-4">
            <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
                placeholder={t('searchPlaceholder')}
                className="pl-12 bg-slate-900/50 border-white/10 focus:border-primary/50 focus:bg-slate-900 rounded-full h-12 text-lg text-white placeholder:text-slate-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
        </div>
        
        {/* Categories */}
        <div className="container mx-auto mt-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2 px-4 justify-start md:justify-center min-w-max">
                {/* Custom Category Nav for Modern Theme */}
                {[
                    { id: 'all', name: t('all') },
                    ...(chefProducts.length > 0 ? [{ id: 'chef', name: t('chefChoice') }] : []),
                    ...(popularProducts.length > 0 ? [{ id: 'popular', name: t('popular') }] : []),
                    ...categories
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategorySelect(cat.id)}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            activeCategory === cat.id 
                                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105" 
                                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Product List */}
      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Chef's Recommendations - Modern Card */}
        {chefProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            id="chef"
            className="scroll-mt-48"
          >
            <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
              <Star className="h-8 w-8 text-orange-500 fill-orange-500" />
              {t('chefChoice')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chefProducts.map((product, index) => (
                <div key={product.id} className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 hover:border-primary/50 transition-all duration-500">
                    <div className="relative aspect-video w-full overflow-hidden">
                        <Image src={getMediaUrl(product.imageUrl) || productFallback} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                                <p className="text-slate-300 line-clamp-2 text-sm mb-4">{product.description}</p>
                                <span className="text-xl font-bold text-primary">{product.price} ₺</span>
                            </div>
                            <ProductCard 
                              product={{...product, category: product.categoryId, image: product.imageUrl}} 
                              index={index} 
                              showRating={cafe?.showProductRatings} 
                              variant="compact" 
                              hideImage={true} 
                              className="bg-transparent border-0 shadow-none !p-0"
                              isReadOnly={isDemoMode}
                            />
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Categories */}
        {categories.map((category, catIndex) => {
          const categoryProducts = filteredProducts.filter(
            (p) => p.categoryId === category.id
          );

          if (categoryProducts.length === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: catIndex * 0.1 }}
              key={category.id}
              id={category.id}
              className="scroll-mt-48"
            >
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-4xl font-black text-slate-800 dark:text-slate-800 select-none absolute -z-10 opacity-20 transform -translate-y-4 scale-150 origin-left">
                    {category.name}
                </h2>
                <h2 className="text-3xl font-bold text-white relative z-10">
                  {category.name}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product, index) => (
                  <div key={product.id} className="bg-slate-900 rounded-2xl p-4 border border-white/5 hover:bg-slate-800/50 transition-colors flex gap-4">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                          <Image src={getMediaUrl(product.imageUrl) || productFallback} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                          <div>
                              <h3 className="font-bold text-lg text-white leading-tight mb-1">{product.name}</h3>
                              <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-primary">{product.price} ₺</span>
                               {/* Reusing ProductCard logic but simplifying UI invocation - actually, ProductCard has the add to cart logic, so we should wrap it or use it directly. 
                                  To save time, I will render ProductCard but customize it via CSS or just use it as is if it supports 'list' mode well.
                                  Or better, I'll just use the standard ProductCard but wrapped in a dark theme provider style.
                               */}
                              <ProductCard 
                                product={{...product, category: category.id, image: product.imageUrl}} 
                                index={index} 
                                showRating={cafe?.showProductRatings} 
                                variant="compact" 
                                hideImage={true} 
                                className="!bg-transparent !border-0 !shadow-none !p-0"
                                isReadOnly={isDemoMode}
                              />
                          </div>
                      </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {!isDemoMode && <CallWaiterButton options={cafe.waiterCallOptions} />}

      {/* Footer */}
      <footer className="mt-32 py-12 bg-slate-900 border-t border-white/5">
        <div className="container mx-auto px-4 flex flex-col items-center gap-8">
          <div className="flex gap-6">
            {cafe.instagramUrl && (
              <a href={getSocialUrl('instagram', cafe.instagramUrl)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500 transition-colors">
                <Instagram className="h-8 w-8" />
              </a>
            )}
            {cafe.facebookUrl && (
              <a href={getSocialUrl('facebook', cafe.facebookUrl)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors">
                <Facebook className="h-8 w-8" />
              </a>
            )}
            {cafe.twitterUrl && (
              <a href={getSocialUrl('twitter', cafe.twitterUrl)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-500 transition-colors">
                <Twitter className="h-8 w-8" />
              </a>
            )}
            {cafe.website && (
              <a href={getSocialUrl('website', cafe.website)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Info className="h-8 w-8" />
              </a>
            )}
          </div>
          <div className="text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} {cafe.name}</p>
            <p className="mt-2 text-xs uppercase tracking-widest opacity-50">{t('poweredBy')}</p>
          </div>
        </div>
      </footer>

      {!isDemoMode && (
        <CartSheet 
          cafeId={cafeId || cafe.id}
          tableId={currentTableId || undefined}
          themeConfig={cafe.themeConfig}
          onOrderSuccess={() => {
            setIsCartOpen(true);
            fetchActiveOrders();
          }}
          activeOrders={activeOrders}
          onCancelOrder={handleCancelOrder}
          isOpen={isCartOpen}
          onOpenChange={setIsCartOpen}
        />
      )}

      {/* Welcome Message Dialog - Styled for Dark Mode */}
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md text-center bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex flex-col items-center gap-4 pt-4">
              {cafe.logo && (
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                   <Image src={cafe.logo} alt={cafe.name} fill className="object-cover" />
                </div>
              )}
              <span>{t('welcome')}</span>
            </DialogTitle>
            <DialogDescription className="text-lg pt-2 text-slate-300">
              {cafe.welcomeMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-6 pb-2">
            <Badge variant="outline" className="text-white border-white/20 py-2 px-8 cursor-pointer hover:bg-white/10 transition-all text-base" onClick={() => setWelcomeOpen(false)}>
              {t('viewMenu')}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
      <CustomerAuthDialog variant="modern" />
    </div>
  );
}
