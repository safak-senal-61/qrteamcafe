import { TemplateProps } from './types';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/menu/ProductCard';
import { CartSheet } from '@/components/menu/CartSheet';
import { CallWaiterButton } from '@/components/menu/CallWaiterButton';
import { CustomerAuthDialog } from '@/components/menu/CustomerAuthDialog';
import { Search, User, Crown } from 'lucide-react';
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

export function PremiumTemplate({
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
  scrolled,
  isDemoMode
}: TemplateProps) {
  const t = useTranslations('Menu');
  const router = useRouter();
  const coverImage = getMediaUrl(cafe.coverImage) || 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop';
  const logoImage = getMediaUrl(cafe.logo);
  const productFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] pb-24 relative font-serif selection:bg-[#c6a355] selection:text-black overflow-x-hidden">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#0a0a0a] z-10" />
         <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full"
         >
            <Image
              src={coverImage}
              alt={cafe.name}
              fill
              className="object-cover"
            />
         </motion.div>
         
         {/* Top Bar */}
         <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start">
            <div className="flex flex-col">
              {tableNumber && (
                 <div className="px-4 py-1 border border-[#c6a355]/30 bg-black/40 backdrop-blur-md rounded text-[#c6a355] text-xs uppercase tracking-[0.2em]">
                    {t('table')} {tableNumber}
                 </div>
              )}
            </div>
            
            {!isDemoMode && (
              <div className="flex gap-3">
                 {customer ? (
                   <button 
                     onClick={() => router.push(`/menu/${cafe.id}/profile`)}
                     className="flex items-center gap-2 px-4 py-2 border border-[#c6a355]/50 bg-black/60 backdrop-blur-md text-[#c6a355] hover:bg-[#c6a355] hover:text-black transition-all duration-300 rounded-sm"
                   >
                     <User className="w-4 h-4" />
                     <span className="text-xs uppercase tracking-wider">{customer.name}</span>
                   </button>
                 ) : (
                   <button 
                     onClick={() => setAuthDialogOpen(true)}
                     className="flex items-center gap-2 px-4 py-2 border border-[#c6a355]/50 bg-black/60 backdrop-blur-md text-[#c6a355] hover:bg-[#c6a355] hover:text-black transition-all duration-300 rounded-sm"
                   >
                     <User className="w-4 h-4" />
                     <span className="text-xs uppercase tracking-wider">{t('login')}</span>
                   </button>
                 )}
              </div>
            )}
         </div>

         {/* Center Content */}
         <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4">
            <motion.div
               initial={{ y: 30, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.5, duration: 0.8 }}
            >
               {logoImage && (
                 <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-[#c6a355]/50 p-1 relative">
                    <Image src={logoImage} alt={cafe.name} fill className="rounded-full object-cover" />
                 </div>
               )}
               <h1 className="text-5xl md:text-7xl font-serif text-[#c6a355] mb-4 tracking-tight drop-shadow-2xl">
                 {cafe.name}
               </h1>
               <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#c6a355] to-transparent mx-auto"></div>
            </motion.div>
         </div>
      </div>

      {/* Sticky Search & Nav */}
      <div className={cn(
        "sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-[#c6a355]/10 transition-all duration-300",
        scrolled ? "shadow-[0_4px_20px_-5px_rgba(198,163,85,0.1)]" : ""
      )}>
         <div className="container mx-auto px-4 py-4">
            {/* Search */}
            <div className="relative max-w-md mx-auto mb-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c6a355]/50" />
               <input
                 type="text"
                 placeholder={t('searchPlaceholder')}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-[#1a1a1a] border border-[#333] focus:border-[#c6a355]/50 rounded-sm py-2 pl-10 pr-4 text-sm text-[#e5e5e5] placeholder:text-zinc-600 focus:outline-none transition-colors font-sans"
               />
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto gap-8 justify-start md:justify-center pb-2 scrollbar-hide">
               <button
                  onClick={() => onCategorySelect('all')}
                  className={cn(
                    "whitespace-nowrap text-sm tracking-[0.15em] uppercase transition-all duration-300 relative py-2",
                    activeCategory === 'all' ? "text-[#c6a355]" : "text-zinc-500 hover:text-[#c6a355]/70"
                  )}
               >
                 {t('all')}
                 {activeCategory === 'all' && (
                   <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px bg-[#c6a355]" />
                 )}
               </button>
               {chefProducts.length > 0 && (
                  <button
                     onClick={() => onCategorySelect('chef')}
                     className={cn(
                       "whitespace-nowrap text-sm tracking-[0.15em] uppercase transition-all duration-300 relative py-2",
                       activeCategory === 'chef' ? "text-[#c6a355]" : "text-zinc-500 hover:text-[#c6a355]/70"
                   )}
                >
                  {t('chefChoice')}
                  {activeCategory === 'chef' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px bg-[#c6a355]" />
                    )}
                  </button>
               )}
               {popularProducts.length > 0 && (
                  <button
                     onClick={() => onCategorySelect('popular')}
                     className={cn(
                       "whitespace-nowrap text-sm tracking-[0.15em] uppercase transition-all duration-300 relative py-2",
                       activeCategory === 'popular' ? "text-[#c6a355]" : "text-zinc-500 hover:text-[#c6a355]/70"
                   )}
                >
                  {t('popular')}
                  {activeCategory === 'popular' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px bg-[#c6a355]" />
                    )}
                  </button>
               )}
               {categories.map((cat) => (
                 <button
                   key={cat.id}
                   onClick={() => onCategorySelect(cat.id)}
                   className={cn(
                     "whitespace-nowrap text-sm tracking-[0.15em] uppercase transition-all duration-300 relative py-2",
                     activeCategory === cat.id ? "text-[#c6a355]" : "text-zinc-500 hover:text-[#c6a355]/70"
                   )}
                 >
                   {cat.name}
                   {activeCategory === cat.id && (
                     <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px bg-[#c6a355]" />
                   )}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 space-y-20 relative z-10">
         {/* Chef's */}
         {chefProducts.length > 0 && (
           <section id="chef" className="scroll-mt-48">
              <div className="flex flex-col items-center mb-10">
                 <Crown className="w-8 h-8 text-[#c6a355] mb-3" />
                 <h2 className="text-3xl font-serif text-[#c6a355]">Şefin İmzası</h2>
                 <p className="text-zinc-500 text-sm italic mt-2">Özel hazırlanmış lezzetler</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {chefProducts.map((product, index) => (
                    <ProductCard 
                       key={product.id}
                       product={{...product, category: product.categoryId, image: product.imageUrl}} 
                       index={index} 
                       showRating={cafe?.showProductRatings} 
                       variant="compact"
                       className="bg-[#111] border border-[#222] hover:border-[#c6a355]/30 p-4 rounded-sm transition-all duration-500 group"
                       isReadOnly={isDemoMode}
                    />
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
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c6a355]/30"></div>
                   <h2 className="text-2xl font-serif text-[#e5e5e5] uppercase tracking-widest">{category.name}</h2>
                   <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c6a355]/30"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                   {categoryProducts.map((product, index) => (
                      <div key={product.id} className="group flex gap-4 items-start">
                         {/* Image with Gold Border effect */}
                         <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-sm border border-[#c6a355]/20 group-hover:border-[#c6a355] transition-colors duration-500">
                            <Image src={getMediaUrl(product.imageUrl) || productFallback} alt={product.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-baseline border-b border-[#222] pb-2 mb-2 group-hover:border-[#c6a355]/30 transition-colors duration-500">
                               <h3 className="text-lg font-serif text-[#e5e5e5] group-hover:text-[#c6a355] transition-colors">{product.name}</h3>
                               <span className="text-[#c6a355] font-bold text-lg">{product.price}₺</span>
                            </div>
                            <p className="text-zinc-500 text-sm font-sans leading-relaxed line-clamp-2">{product.description}</p>
                            
                            {/* Actions overlay for compact variant doesn't fit here well, so we use a custom minimal layout or rely on ProductCard */}
                            {/* Re-using ProductCard with compact variant but styled via className */}
                            <div className="mt-3">
                                <ProductCard 
                                  product={{...product, category: category.id, image: product.imageUrl}} 
                                  index={index} 
                                  showRating={cafe?.showProductRatings} 
                                  variant="compact"
                                  hideImage={true} // We showed image manually
                                  className="p-0 border-none bg-transparent shadow-none"
                                  isReadOnly={isDemoMode}
                                />
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
           );
         })}
      </div>

      {!isDemoMode && <CallWaiterButton options={cafe.waiterCallOptions} />}
      
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

      <CustomerAuthDialog variant="premium" />
      
      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md text-center bg-[#111] border border-[#c6a355]/30 text-[#e5e5e5]">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto mb-4 text-[#c6a355] border border-[#c6a355] rounded-full flex items-center justify-center">
               <Crown className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-serif text-[#c6a355]">Hoş Geldiniz</DialogTitle>
            <DialogDescription className="pt-2 text-zinc-400 font-serif italic">
              {cafe.welcomeMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-6 pb-2">
            <button 
              onClick={() => setWelcomeOpen(false)}
              className="px-8 py-2 border border-[#c6a355] text-[#c6a355] hover:bg-[#c6a355] hover:text-black transition-all duration-300 uppercase tracking-widest text-xs"
            >
              {t('viewMenu')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
