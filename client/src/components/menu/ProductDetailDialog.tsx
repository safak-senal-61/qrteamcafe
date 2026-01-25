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
      <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-3xl p-0 gap-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none shadow-2xl h-[90vh] sm:h-[85vh] flex flex-col sm:flex-row">
        
        {/* Left Side - Image */}
        <div className="relative h-[35vh] sm:h-full w-full sm:w-[45%] bg-white shrink-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full">
            <Image
              src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
              alt={product.name}
              fill
              className="object-contain"
              priority
              unoptimized={true}
            />
          </div>
          
          <DialogClose className="absolute top-4 right-4 rounded-full bg-black/20 hover:bg-black/40 text-white p-2 transition-colors backdrop-blur-sm z-10">
            <X className="h-5 w-5" />
            <span className="sr-only">Kapat</span>
          </DialogClose>

          {product.isChefRecommended && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none gap-1 px-3 py-1.5 shadow-lg">
                <ChefHat className="w-4 h-4" />
                <span className="font-semibold">Şefin Önerisi</span>
              </Badge>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex justify-between items-end">
              <div>
                <DialogTitle className="text-2xl font-bold leading-tight mb-1 text-white text-left">{product.name}</DialogTitle>
                {showRating && Number(product.averageRating) > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-white">{Number(product.averageRating).toFixed(1)}</span>
                    <span className="text-white/70 text-xs">({product.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <span className="text-white/70 line-through text-lg decoration-white/50">
                  {Number(product.originalPrice).toFixed(2)} ₺
                </span>
              )}
              <p className="text-white/95 font-bold text-xl">{Number(product.price).toFixed(2)} ₺</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ürün Detayı</h4>
            <p id="product-description" className="text-sm text-foreground/80 leading-relaxed">
              {product.description || 'Açıklama bulunmuyor.'}
            </p>
          </div>

          {recommendations.length > 0 && (
            <div className="py-2">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <ShoppingBasket className="w-4 h-4 text-primary" />
                Bununla İyi Gider
              </h4>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border p-2 bg-secondary/20">
                <div className="flex w-max space-x-4 p-1">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="w-[120px] flex flex-col gap-1">
                      <div className="relative h-20 w-full rounded-md overflow-hidden bg-white">
                        <Image
                          src={rec.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'}
                          alt={rec.name}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium truncate" title={rec.name}>{rec.name}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">{rec.price} ₺</span>
                          {!isReadOnly && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                            onClick={() => {
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
                            <Plus className="h-3 w-3" />
                          </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {!isReadOnly && (
          <div className="space-y-3">
            <Label htmlFor="note" className="text-base font-semibold">Sipariş Notu</Label>
            <Textarea
              id="note"
              placeholder="Örn: Acısız olsun, sosu bol olsun..."
              className="resize-none bg-secondary/30 min-h-[80px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          )}

          {showRating && (
            <div className="pt-2">
              {reviews.length > 0 ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => setShowReviews(!showReviews)}
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Değerlendirmeler ({reviews.length})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {showReviews ? 'Gizle' : 'Göster'}
                    </span>
                  </Button>

                  {showReviews && (
                    <ScrollArea className="h-[200px] mt-3 rounded-md border p-4">
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm">{review.customerName || 'Misafir'}</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-foreground/80">{review.comment}</p>
                            )}
                            {review.adminReply && (
                              <div className="bg-primary/5 p-2 rounded-md mt-2 text-xs">
                                <span className="font-semibold text-primary block mb-1">İşletme Yanıtı:</span>
                                {review.adminReply}
                              </div>
                            )}
                            <Separator className="mt-4" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-md text-sm text-muted-foreground">
                   <Star className="w-4 h-4 text-muted-foreground/50" />
                   Henüz değerlendirme yapılmamış.
                </div>
              )}
            </div>
          )}

          {!isReadOnly && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3 bg-secondary/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-4 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={incrementQuantity}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              className="flex-1 ml-4 font-bold" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingBasket className="w-4 h-4 mr-2" />
              {(product.price * quantity).toFixed(2)} ₺ • Ekle
            </Button>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
