import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCartStore, Product } from '@/store/cart-store';
import { Badge } from '@/components/ui/badge';
import { ProductDetailDialog } from './ProductDetailDialog';
import { cn } from '@/lib/utils';

import { Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index: number;
  showRating?: boolean;
  variant?: 'card' | 'list' | 'compact';
  hideImage?: boolean;
  className?: string;
}

export function ProductCard({ product, index, showRating = true, variant = 'card', hideImage = false, className }: ProductCardProps) {
  const { items } = useCartStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Calculate total quantity of this product (across all variants/notes)
  const totalQuantity = items
    .filter((item) => item.id === product.id)
    .reduce((acc, item) => acc + item.quantity, 0);

  const rating = Number(product.averageRating) || 0;
  const reviewCount = product.reviewCount || 0;

  if (variant === 'list' || variant === 'compact') {
    return (
      <>
        <ProductDetailDialog 
          product={product} 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          showRating={showRating}
        />
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={cn("h-full", className)}
        >
          <div 
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-md transition-all cursor-pointer group relative overflow-hidden",
              variant === 'compact' && "p-0 bg-transparent hover:bg-transparent hover:shadow-none border-0"
            )}
            onClick={() => setIsDialogOpen(true)}
          >
            {/* Image (Small) */}
            {!hideImage && (
              <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-secondary/30">
                 <Image
                  src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
                  alt={product.name}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized={!!product.image?.includes('localhost') || !!product.image?.includes('127.0.0.1') || !!product.image?.startsWith('/uploads/')}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 py-1">
              <div className="flex justify-between items-start">
                {variant !== 'compact' && <h3 className="font-bold text-base truncate pr-2 text-foreground/90">{product.name}</h3>}
                {variant === 'compact' ? (
                     <Button size="sm" className="h-8 rounded-full px-4 font-bold">
                        Ekle
                     </Button>
                ) : (
                    <span className="font-extrabold text-primary whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded text-sm">
                    {Number(product.price).toFixed(2)} ₺
                    </span>
                )}
              </div>
              {variant !== 'compact' && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">
                    {product.description}
                  </p>
              )}
              
              <div className="flex items-center gap-2">
                {showRating && rating > 0 && variant !== 'compact' && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Badge */}
            <AnimatePresence>
              {totalQuantity > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-2 right-2"
                >
                   <Badge className="bg-primary text-primary-foreground font-bold text-xs h-6 w-6 flex items-center justify-center rounded-full shadow-md border border-white">
                      {totalQuantity}
                   </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <ProductDetailDialog 
        product={product} 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        showRating={showRating}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className="h-full"
      >
        <Card 
          className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white/50 backdrop-blur-sm hover:bg-white ring-1 ring-black/5 cursor-pointer"
          onClick={() => setIsDialogOpen(true)}
        >
          <div className="relative h-40 sm:h-56 w-full overflow-hidden group">
            <Image
              src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
              unoptimized={!!product.image?.includes('localhost') || !!product.image?.includes('127.0.0.1') || !!product.image?.startsWith('/uploads/')}
            />
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            
            {showRating && rating > 0 && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-gray-800">{rating.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-500">({reviewCount})</span>
                </div>
              </div>
            )}
            
            <AnimatePresence>
              {totalQuantity > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-3 right-3"
                >
                   <Badge className="bg-primary text-primary-foreground font-bold text-base h-8 w-8 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                      {totalQuantity}
                   </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <CardContent className="p-5 flex-grow space-y-2">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-lg leading-tight line-clamp-2 text-foreground/90">
                {product.name}
              </h3>
              <div className="flex flex-col items-end gap-1">
                  {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                    <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                      {Number(product.originalPrice).toFixed(2)} ₺
                    </span>
                  )}
                  <span className="font-extrabold text-primary text-lg whitespace-nowrap bg-primary/10 px-2 py-1 rounded-md">
                  {Number(product.price).toFixed(2)} ₺
                  </span>
                  {product.stock > 0 && product.stock <= 5 && (
                      <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                          Son {product.stock} ürün
                      </span>
                  )}
              </div>
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </CardContent>
          
          <CardFooter className="p-5 pt-0">
            {product.stock <= 0 ? (
              <div className="w-full text-center p-3 bg-muted text-muted-foreground rounded-xl font-bold border border-muted-foreground/20">
                Tükendi
              </div>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click event
                  setIsDialogOpen(true);
                }}
                className="w-full font-bold rounded-xl h-12 shadow-md hover:shadow-lg transition-all active:scale-95 group"
                size="lg"
                variant={totalQuantity > 0 ? "secondary" : "default"}
              >
                <ShoppingBasket className="w-5 h-5 mr-2 group-hover:animate-bounce" /> 
                {totalQuantity > 0 ? "Tekrar Ekle" : "Sepete Ekle"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
}
