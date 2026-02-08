'use client';

import { useState, useEffect } from 'react';
import { API_URL, getMediaUrl } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';
import { Star, Loader2, MessageCircle } from 'lucide-react';
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
  isVisible: boolean;
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
      const userStr = localStorage.getItem('user');
      console.log('Reviews Page - User from localStorage:', userStr);

      let url = `${API_URL}/reviews`;

      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.cafeId) {
          url += `?cafeId=${user.cafeId}`;
          console.log('Reviews Page - Fetching URL:', url);
        } else {
          console.warn('Reviews Page - No cafeId found in user object');
        }
      } else {
        console.warn('Reviews Page - No user found in localStorage');
      }

      const res = await fetch(url);
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

  const handleVisibilityToggle = async (id: string, currentVisibility: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API_URL}/reviews/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });

      if (res.ok) {
        toast.success(currentVisibility ? 'Yorum gizlendi.' : 'Yorum görünür yapıldı.');
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: !currentVisibility } : r));
      } else {
        toast.error('Görünürlük güncellenemedi.');
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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Değerlendirmeler</h1>
        <div className="text-muted-foreground text-sm md:text-base">
          Toplam {reviews.length} değerlendirme
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Puan</TableHead>
              <TableHead className="w-[300px]">Yorum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Durum</TableHead>
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
                            src={getMediaUrl(review.product.imageUrl)} 
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
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={review.isVisible}
                        onCheckedChange={() => handleVisibilityToggle(review.id, review.isVisible)}
                        disabled={updating === review.id}
                      />
                      <span className="text-xs text-muted-foreground">
                        {review.isVisible ? 'Görünür' : 'Gizli'}
                      </span>
                    </div>
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

      {/* Mobile List View */}
      <div className="md:hidden space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Henüz değerlendirme bulunmuyor.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
              {/* Product & Date Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {review.product.imageUrl ? (
                      <Image 
                        src={getMediaUrl(review.product.imageUrl)} 
                        alt={review.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{review.product.name}</h3>
                    <div className="text-xs text-muted-foreground">{review.customerName || 'Misafir'}</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>

              {/* Comment */}
              {review.comment && (
                <div className="text-sm bg-muted/30 p-3 rounded-md">
                  &quot;{review.comment}&quot;
                </div>
              )}

              {/* Admin Reply */}
              {review.adminReply && (
                <div className="text-sm bg-primary/5 p-3 rounded-md border border-primary/10">
                  <div className="flex items-center gap-2 mb-1 text-primary text-xs font-medium">
                    <MessageCircle className="w-3 h-3" />
                    <span>İşletme Yanıtı</span>
                  </div>
                  {review.adminReply}
                </div>
              )}

              {/* Actions Divider */}
              <div className="h-px bg-border" />

              {/* Action Controls */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* Visibility */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Görünürlük</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={review.isVisible}
                      onCheckedChange={() => handleVisibilityToggle(review.id, review.isVisible)}
                      disabled={updating === review.id}
                    />
                    <span className="text-xs">
                      {review.isVisible ? 'Yayında' : 'Gizli'}
                    </span>
                  </div>
                </div>

                {/* Admin Score */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">İşletme Puanı (1-5)</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      className="w-full h-9"
                      value={review.adminScore || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) handleScoreUpdate(review.id, val);
                      }}
                      disabled={updating === review.id}
                    />
                    {updating === review.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Reply Button */}
              <Button
                variant={review.adminReply ? "secondary" : "default"}
                size="sm"
                onClick={() => openReplyDialog(review)}
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {review.adminReply ? 'Yanıtı Düzenle' : 'Yanıtla'}
              </Button>
            </div>
          ))
        )}
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
                &quot;{replyingReview?.comment || 'Yorum yok'}&quot;
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
