import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingBasket, X, Star, ChefHat, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { API_URL } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Product, useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showRating?: boolean;
  isReadOnly?: boolean;
}

interface Review {
  id: string;
  customerName?: string;
  rating: number;
  comment?: string;
  adminReply?: string;
  createdAt: string;
}

export function ProductDetailDialog({ product, open, onOpenChange, showRating = true, isReadOnly = false }: ProductDetailDialogProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (open && product.id) {
      // Fetch reviews only if showRating is true
      if (showRating) {
        fetch(`${API_URL}/reviews?productId=${product.id}`)
          .then(res => res.json())
          .then(data => setReviews(data))
          .catch(err => console.error('Error fetching reviews:', err));
      }
        
      // Fetch recommendations
      fetch(`${API_URL}/products/${product.id}/recommendations`)
        .then(res => res.json())
        .then(data => {
          // Map API response to Product type
          const mappedData = data.map((item: unknown) => {
             const prod = item as (Product & { imageUrl: string, categoryId: string });
             return {
                ...prod,
                image: prod.imageUrl,
                category: prod.categoryId
             };
          });
          setRecommendations(mappedData);
        })
        .catch(err => console.error('Error fetching recommendations:', err));
    }
  }, [open, product.id, showRating]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setQuantity(1);
      setNote('');
      setShowReviews(false);
      setReviews([]);
      setRecommendations([]);
    }
    onOpenChange(newOpen);
  };

  const handleAddToCart = () => {
    // Customer check removed to allow guest cart building. Login enforced at checkout.
    
    if (product.stock && quantity > product.stock) {
      toast.error(`Stok yetersiz. En fazla ${product.stock} adet ekleyebilirsiniz.`);
      return;
    }

    // Add item with note logic...
    // The addItem function in cart-store handles adding.
    // We call addItem multiple times or pass quantity if supported.
    // cart-store addItem signature: (product: Product, note?: string) => void
    // It adds 1 item. So loop is correct.
    for (let i = 0; i < quantity; i++) {
      addItem(product, note);
    }
    
    toast.success(`${quantity} adet ${product.name} sepete eklendi.`);
    onOpenChange(false);
    setQuantity(1);
    setNote('');
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-4xl p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl h-[90vh] sm:h-[80vh] flex flex-col sm:flex-row rounded-xl sm:rounded-2xl">
        
        {/* Left Side - Image */}
        <div className="relative h-[40vh] sm:h-full w-full sm:w-[55%] bg-zinc-100 shrink-0 overflow-hidden">
          <Image
            src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
            alt={product.name}
            fill
            className="object-cover transition-transform hover:scale-105 duration-700"
            priority
            unoptimized={true}
          />
          
          <DialogClose className="absolute top-4 right-4 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-all backdrop-blur-md border border-white/20 shadow-lg sm:hidden">
            <X className="h-5 w-5" />
            <span className="sr-only">Kapat</span>
          </DialogClose>

          {product.isChefRecommended && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-orange-500/90 hover:bg-orange-600 text-white border-none gap-1.5 px-3 py-1.5 shadow-lg backdrop-blur-sm">
                <ChefHat className="w-4 h-4" />
                <span className="font-semibold text-xs tracking-wide">ŞEFİN ÖNERİSİ</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Right Side - Content */}
        <div className="flex flex-col h-full w-full sm:w-[45%] bg-white relative">
          <DialogClose className="hidden sm:flex absolute top-4 right-4 z-50 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 p-2 transition-all">
            <X className="h-5 w-5" />
            <span className="sr-only">Kapat</span>
          </DialogClose>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Header Info */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-start gap-4">
                <DialogTitle className="text-2xl sm:text-3xl font-bold leading-tight text-foreground text-left tracking-tight pr-8">
                  {product.name}
                </DialogTitle>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  {showRating && Number(product.averageRating) > 0 && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                        <span className="font-bold text-foreground">{Number(product.averageRating).toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">({product.reviewCount})</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                  {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                    <span className="text-muted-foreground line-through text-base decoration-muted-foreground/50 mb-0.5">
                      {Number(product.originalPrice).toFixed(2)} ₺
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-black text-orange-600 tracking-tight">{Number(product.price).toFixed(2)} ₺</span>
                </div>
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">ÜRÜN DETAYI</h4>
              <p id="product-description" className="text-sm text-foreground/80 leading-relaxed font-medium">
                {product.description || 'Açıklama bulunmuyor.'}
              </p>
            </div>

            {recommendations.length > 0 && (
              <div className="pt-2">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/90">
                  <ShoppingBasket className="w-4 h-4 text-orange-500" />
                  Bununla İyi Gider
                </h4>
                <ScrollArea className="w-full whitespace-nowrap -mx-6 px-6 pb-2">
                  <div className="flex w-max space-x-3">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="w-[140px] group cursor-pointer border rounded-xl overflow-hidden hover:border-orange-200 transition-colors bg-white shadow-sm">
                        <div className="relative h-24 w-full bg-zinc-100 overflow-hidden">
                          <Image
                            src={rec.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
                            alt={rec.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized={true}
                          />
                          {!isReadOnly && (
                            <Button 
                              size="icon" 
                              className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-white/90 text-orange-600 hover:bg-orange-600 hover:text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem({
                                  id: rec.id,
                                  name: rec.name,
                                  description: rec.description,
                                  price: rec.price,
                                  image: rec.image || '',
                                  category: rec.category,
                                  stock: rec.stock,
                                  originalPrice: rec.originalPrice
                                });
                                toast.success(`${rec.name} sepete eklendi.`);
                              }}
                              disabled={rec.stock <= 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="p-2.5 flex flex-col gap-1">
                          <span className="text-sm font-semibold truncate text-foreground/90" title={rec.name}>{rec.name}</span>
                          <span className="text-sm font-bold text-orange-600">{rec.price} ₺</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {!isReadOnly && (
            <div className="space-y-3">
              <Label htmlFor="note" className="text-sm font-semibold text-foreground/90">Sipariş Notu</Label>
              <Textarea
                id="note"
                placeholder="Örn: Acısız olsun, sosu bol olsun..."
                className="resize-none bg-zinc-50 border-zinc-200 focus:border-orange-500 focus:ring-orange-500/20 min-h-[80px] rounded-xl text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            )}

            {showRating && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between h-12 rounded-xl border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-foreground/80"
                  onClick={() => setShowReviews(!showReviews)}
                >
                  <span className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4" />
                    Değerlendirmeler <span className="text-muted-foreground text-xs font-normal ml-1">({reviews.length})</span>
                  </span>
                  <span className="text-xs font-medium text-orange-600">
                    {showReviews ? 'Gizle' : 'Tümünü Gör'}
                  </span>
                </Button>

                {showReviews && (
                  <ScrollArea className="h-[250px] mt-4 -mx-2 px-2">
                    <div className="space-y-4">
                      {reviews.length > 0 ? reviews.map((review) => (
                        <div key={review.id} className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                {(review.customerName || 'M').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-none">{review.customerName || 'Misafir'}</span>
                                <div className="flex gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${star <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-zinc-200'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground bg-white px-2 py-1 rounded-full border border-zinc-100">
                              {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-foreground/80 leading-relaxed pl-10">{review.comment}</p>
                          )}
                          {review.adminReply && (
                            <div className="ml-10 mt-3 bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                              <span className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-1">
                                <ChefHat className="w-3 h-3" />
                                İşletme Yanıtı
                              </span>
                              <p className="text-xs text-foreground/70">{review.adminReply}</p>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-8 text-muted-foreground text-sm bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                          Henüz değerlendirme yapılmamış.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          {!isReadOnly && (
            <div className="p-6 pt-2 bg-white border-t border-zinc-100">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center bg-zinc-100 rounded-xl p-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white hover:shadow-sm hover:text-red-500 transition-all"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold w-8 text-center text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white hover:shadow-sm hover:text-green-600 transition-all"
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  className="flex-1 h-12 rounded-xl font-bold text-base bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 shadow-lg hover:shadow-xl transition-all" 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  <ShoppingBasket className="w-5 h-5 mr-2" />
                  <span className="flex-1 text-left">Sepete Ekle</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                    {(product.price * quantity).toFixed(2)} ₺
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
