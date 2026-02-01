'use client';

import { useTranslations } from 'next-intl';
import React, { useEffect, useState, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ShieldCheck, Clock, Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionData {
  plan: string;
  subscriptionEndsAt: string;
  isSubscriptionActive: boolean;
  trialEndsAt: string;
  iyzicoSubReferenceCode?: string;
}

interface StoredCard {
  cardToken: string;
  cardAlias: string;
  binNumber: string;
  lastFourDigits: string;
  cardType: string;
  cardAssociation: string;
  cardFamily: string;
}

export default function SubscriptionPage() {
  const t = useTranslations('SubscriptionPage');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [cards, setCards] = useState<StoredCard[]>([]);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelConfirmationText, setCancelConfirmationText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Payment States
  const [isExtending, setIsExtending] = useState(false);
  const [selectedPlanDuration, setSelectedPlanDuration] = useState<'monthly' | 'yearly'>('monthly');

  const fetchSubscriptionData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      if (!user.cafeId) return;

      const [subRes, cardsRes] = await Promise.all([
        fetch(`${API_URL}/cafes/${user.cafeId}`),
        fetch(`${API_URL}/payments/cards`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription({
          plan: data.plan,
          subscriptionEndsAt: data.subscriptionEndsAt,
          isSubscriptionActive: data.isSubscriptionActive,
          trialEndsAt: data.trialEndsAt,
          iyzicoSubReferenceCode: data.iyzicoSubReferenceCode
        });
      }

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(Array.isArray(cardsData) ? cardsData : []);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t('errorFetch'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    
    setIsDeletingCard(true);
    try {
      const res = await fetch(`${API_URL}/payments/cards/${cardToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        setCards(cards.filter(c => c.cardToken !== cardToDelete));
        toast.success(t('messages.cardDeleted'));
      } else {
        throw new Error('Failed to delete');
      }
    } catch {
      toast.error(t('errors.cardDeleteFailed'));
    } finally {
      setIsDeletingCard(false);
      setCardToDelete(null);
    }
  };

  const handleUpdateCard = () => {
    // Redirect to pricing page with a special mode or just let them pick a plan to re-subscribe with new card
    // Since "Update Card" usually implies replacing the card, and we store card on payment, 
    // we guide them to make a payment (even min amount) or just renew.
    // For now, redirect to pricing.
    router.push('/pricing?mode=update_card');
  };

  const handleExtendSubscription = async (duration: 'monthly' | 'yearly') => {
    setIsExtending(true);
    setSelectedPlanDuration(duration);
    
    try {
      // Direct to pricing page with pre-selection
      router.push(`/pricing?mode=extend&duration=${duration}`);
      
    } catch {
      toast.error('Bir hata oluştu.');
    } finally {
      setIsExtending(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (cancelConfirmationText !== 'onayla') return;
    
    setIsCancelling(true);
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/payments/cancel-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            toast.success(t('messages.subscriptionCancelled'));
            setIsCancelDialogOpen(false);
            fetchSubscriptionData();
        } else {
             toast.error(t('errors.subscriptionCancelFailed'));
        }
    } catch (error) {
        console.error(error);
        toast.error(t('errors.subscriptionCancelFailed'));
    } finally {
        setIsCancelling(false);
        setCancelConfirmationText('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t('loading')}</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('notFound.title')}</h2>
        <Button onClick={() => router.push('/pricing')}>{t('actions.viewPackages')}</Button>
      </div>
    );
  }

  const endDate = new Date(subscription.subscriptionEndsAt);
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex gap-4">
           {/* Actions like Cancel could go here */}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan Status */}
        <Card className="md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              {t('currentPlan.title')}
            </CardTitle>
            <CardDescription>{t('currentPlan.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('labels.planType')}</span>
                <p className="text-2xl font-bold">QR Team Pro</p>
                <Badge variant={isExpired ? "destructive" : (!subscription.isSubscriptionActive ? "secondary" : "default")} className="mt-1">
                  {isExpired ? t('status.expired') : (!subscription.isSubscriptionActive ? t('status.cancelled') : t('status.active'))}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('labels.endDate')}</span>
                <p className="text-2xl font-bold">
                  {endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className={`text-sm ${daysLeft < 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                  {isExpired 
                    ? t('status.expiredDaysAgo', { days: Math.abs(daysLeft) }) 
                    : t('status.daysLeft', { days: daysLeft })}
                </p>
              </div>

              <div className="space-y-1">
                 <span className="text-sm text-muted-foreground">{t('labels.renewalAmount')}</span>
                 <p className="text-2xl font-bold">499.00 ₺ <span className="text-sm font-normal text-muted-foreground">/ay</span></p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t p-6 flex flex-wrap gap-4">
            <Button 
              onClick={() => router.push('/pricing?extend=true')} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              {t('actions.extend')}
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setIsCancelDialogOpen(true)} disabled={!subscription.isSubscriptionActive || isExpired}>
              {t('cancelSubscription.button')}
            </Button>
          </CardFooter>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              {t('paymentMethod.title')}
            </CardTitle>
            <CardDescription>{t('paymentMethod.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.cardToken} className="relative group">
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-white dark:bg-slate-700 rounded border flex items-center justify-center">
                        {/* Simple icon or brand detection */}
                        <span className="font-bold text-xs">{card.cardAssociation}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">•••• •••• •••• {card.lastFourDigits}</p>
                        <p className="text-xs text-muted-foreground">{card.cardFamily} - {card.cardType}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setCardToDelete(card.cardToken)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 border-2 border-dashed rounded-xl">
                <CreditCard className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('paymentMethod.noCard')}</p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {t('paymentMethod.info')}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={handleUpdateCard}>
              {cards.length > 0 ? t('paymentMethod.update') : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('paymentMethod.add')}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Plan Options */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={`cursor-pointer transition-all border-2 hover:border-primary ${selectedPlanDuration === 'monthly' ? 'border-primary bg-primary/5' : 'border-transparent'}`}
              onClick={() => setSelectedPlanDuration('monthly')}>
          <CardHeader>
            <CardTitle>{t('plans.monthly.title')}</CardTitle>
            <CardDescription>{t('plans.monthly.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">499 ₺<span className="text-sm font-normal text-muted-foreground">/ay</span></div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleExtendSubscription('monthly')}
              disabled={isExtending}
            >
              {isExtending && selectedPlanDuration === 'monthly' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('plans.monthly.action')
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className={`cursor-pointer transition-all border-2 hover:border-primary ${selectedPlanDuration === 'yearly' ? 'border-primary bg-primary/5' : 'border-transparent'}`}
              onClick={() => setSelectedPlanDuration('yearly')}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{t('plans.yearly.title')}</CardTitle>
                <CardDescription>{t('plans.yearly.description')}</CardDescription>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">{t('plans.yearly.discountBadge')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.990 ₺<span className="text-sm font-normal text-muted-foreground">/yıl</span></div>
            <p className="text-sm text-green-600 mt-2 font-medium">{t('plans.yearly.savings')}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleExtendSubscription('yearly')}
              disabled={isExtending}
            >
              {isExtending && selectedPlanDuration === 'yearly' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('plans.yearly.action')
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <AlertDialog open={!!cardToDelete} onOpenChange={(open: boolean) => !open && setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCard.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteCard.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCard}>{t('deleteCard.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleDeleteCard();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingCard}
            >
              {isDeletingCard ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('deleteCard.action')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
  </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('cancelSubscription.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('cancelSubscription.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input 
                value={cancelConfirmationText}
                onChange={(e) => setCancelConfirmationText(e.target.value)}
                placeholder={t('cancelSubscription.inputPlaceholder')}
                className="w-full"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancelConfirmationText('')}>{t('cancelSubscription.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelSubscription();
                }}
                disabled={cancelConfirmationText !== 'onayla' || isCancelling}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : t('cancelSubscription.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
