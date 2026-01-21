import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface OrderItem {
  id: string;
  productId: string;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  orderId: string;
}

interface ReviewState {
  rating: number;
  comment: string;
}

export function ReviewDialog({ isOpen, onClose, orderItems, orderId }: ReviewDialogProps) {
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state when dialog opens (handled by effect or initial state if items change)
  // Actually, we can just use empty state and fill as user interacts.

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating,
        comment: prev[productId]?.comment || ''
      }
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating: prev[productId]?.rating || 0,
        comment
      }
    }));
  };

  const handleSubmit = async () => {
    // Filter out items that have no rating
    const itemsToReview = Object.entries(reviews).filter(([_, data]) => data.rating > 0);

    if (itemsToReview.length === 0) {
      toast.error('Lütfen en az bir ürünü puanlayın.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send requests sequentially or in parallel
      const promises = itemsToReview.map(([productId, data]) => {
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            orderId,
            rating: data.rating,
            comment: data.comment,
            // customerName could be passed if we had it stored or prompt for it
          }),
        });
      });

      await Promise.all(promises);
      toast.success('Değerlendirmeleriniz alındı. Teşekkürler!');
      onClose();
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Değerlendirme gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Siparişinizi Değerlendirin</DialogTitle>
          <DialogDescription>
            Yediğiniz yemekleri puanlayarak bize ve diğer müşterilere yardımcı olun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {orderItems.map((item) => (
            <div key={item.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product.imageUrl ? (
                    <Image 
                      src={item.product.imageUrl} 
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">IMG</div>
                  )}
                </div>
                <h4 className="font-medium text-sm">{item.product.name}</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(item.productId, star)}
                      className={`p-1 transition-colors ${
                        (reviews[item.productId]?.rating || 0) >= star 
                          ? 'text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
                
                <Textarea 
                  placeholder="Yorumunuz (isteğe bağlı)..."
                  value={reviews[item.productId]?.comment || ''}
                  onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                  className="text-sm resize-none h-20"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
