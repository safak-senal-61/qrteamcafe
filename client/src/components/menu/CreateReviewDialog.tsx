import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { useCustomerStore } from '@/store/customer-store';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
}

interface OrderItem {
  id: string;
  product: Product;
}

interface Review {
  id: string;
  productId: string;
  rating: number;
  comment?: string;
}

interface CreateReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  items: OrderItem[];
  existingReviews?: Review[];
}

export function CreateReviewDialog({ open, onOpenChange, orderId, items, existingReviews }: CreateReviewDialogProps) {
  const { customer, token } = useCustomerStore();
  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string; submitted: boolean }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && items.length > 0) {
      const initialReviews: Record<string, { rating: number; comment: string; submitted: boolean }> = {};
      
      items.forEach(item => {
        const existing = existingReviews?.find(r => r.productId === item.product.id);
        if (existing) {
          initialReviews[item.id] = {
            rating: existing.rating,
            comment: existing.comment || '',
            submitted: true
          };
        }
      });
      
      setReviews(prev => ({ ...prev, ...initialReviews }));
    }
  }, [open, items, existingReviews]);

  const handleRate = (itemId: string, rating: number) => {
    if (reviews[itemId]?.submitted) return;
    setReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating, submitted: false }
    }));
  };

  const handleComment = (itemId: string, comment: string) => {
    if (reviews[itemId]?.submitted) return;
    setReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment, submitted: false }
    }));
  };

  const handleSubmit = async (item: OrderItem) => {
    const review = reviews[item.id];
    if (!review || review.rating === 0) {
      toast.error('Lütfen puan verin');
      return;
    }

    setLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(`${API_URL}/reviews`, {
        productId: item.product.id,
        orderId,
        rating: review.rating,
        comment: review.comment,
        customerName: customer?.name || 'Misafir',
        customerId: customer?.id
      }, {
        headers
      });
      
      setReviews(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], submitted: true }
      }));
      toast.success('Değerlendirme gönderildi');
    } catch (error) {
      console.error(error);
      toast.error('Hata oluştu');
    } finally {
      setLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-emerald-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Siparişi Değerlendir</DialogTitle>
          <DialogDescription>
            Yediğiniz yemekleri puanlayın ve yorum yapın.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {items.map((item) => {
            const review = reviews[item.id] || { rating: 0, comment: '', submitted: false };
            const isSubmitted = review.submitted;
            const isLoading = loading[item.id];

            return (
              <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">Lezzeti nasıldı?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(item.id, star)}
                        disabled={isSubmitted || isLoading}
                        className={cn(
                          "transition-all hover:scale-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                          star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                        )}
                      >
                        <Star className={cn("w-8 h-8", star <= review.rating && "fill-current")} />
                      </button>
                    ))}
                  </div>

                  {!isSubmitted ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Yorumunuzu yazın (isteğe bağlı)..."
                        value={review.comment || ''}
                        onChange={(e) => handleComment(item.id, e.target.value)}
                        className="resize-none bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                        rows={3}
                      />
                      <Button 
                        onClick={() => handleSubmit(item)} 
                        disabled={review.rating === 0 || isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isLoading ? 'Gönderiliyor...' : 'Değerlendir'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Değerlendirildi</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
