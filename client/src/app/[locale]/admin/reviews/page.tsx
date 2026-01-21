'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, Save, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  adminScore: number | null;
  adminReply: string | null;
  createdAt: string;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        toast.error('Değerlendirmeler yüklenemedi.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreUpdate = async (id: string, score: number) => {
    if (score < 1 || score > 5) return;
    
    setUpdating(id);
    try {
      const res = await fetch(`${API_URL}/reviews/${id}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });

      if (res.ok) {
        toast.success('Puan güncellendi.');
        setReviews(prev => prev.map(r => r.id === id ? { ...r, adminScore: score } : r));
      } else {
        toast.error('Puan güncellenemedi.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu.');
    } finally {
      setUpdating(null);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyingReview) return;

    setUpdating(replyingReview.id);
    try {
      const res = await fetch(`${API_URL}/reviews/${replyingReview.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });

      if (res.ok) {
        toast.success('Yanıt gönderildi.');
        setReviews(prev => prev.map(r => r.id === replyingReview.id ? { ...r, adminReply: replyText } : r));
        setIsReplyDialogOpen(false);
        setReplyText('');
        setReplyingReview(null);
      } else {
        toast.error('Yanıt gönderilemedi.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu.');
    } finally {
      setUpdating(null);
    }
  };

  const openReplyDialog = (review: Review) => {
    setReplyingReview(review);
    setReplyText(review.adminReply || '');
    setIsReplyDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Değerlendirmeler</h1>
        <div className="text-muted-foreground">
          Toplam {reviews.length} değerlendirme
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Puan</TableHead>
              <TableHead className="w-[300px]">Yorum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>İşletme Yanıtı</TableHead>
              <TableHead>İşletme Puanı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Henüz değerlendirme bulunmuyor.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                        {review.product.imageUrl ? (
                          <Image 
                            src={review.product.imageUrl} 
                            alt={review.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">IMG</div>
                        )}
                      </div>
                      <span className="font-medium">{review.product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.customerName || 'Misafir'}
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2" title={review.comment || ''}>
                      {review.comment || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {review.adminReply && (
                        <p className="text-xs text-muted-foreground line-clamp-2" title={review.adminReply}>
                          {review.adminReply}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReplyDialog(review)}
                        className="h-7 text-xs w-full"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {review.adminReply ? 'Düzenle' : 'Yanıtla'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        className="w-16 h-8"
                        value={review.adminScore || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) handleScoreUpdate(review.id, val);
                        }}
                        disabled={updating === review.id}
                      />
                      {updating === review.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Değerlendirmeye Yanıt Ver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Müşteri Yorumu:</p>
              <div className="bg-secondary/20 p-3 rounded-md text-sm italic">
                "{replyingReview?.comment || 'Yorum yok'}"
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Yanıtınız:</p>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Yanıtınızı buraya yazın..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>İptal</Button>
            <Button onClick={handleReplySubmit} disabled={!replyText.trim() || updating === replyingReview?.id}>
              {updating === replyingReview?.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
