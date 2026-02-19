'use client';

import { motion, Variants } from 'framer-motion';
import { Check, Loader2, ArrowLeft, User, CreditCard, MapPin, Phone, Building, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import IyzipayForm from '@/components/IyzipayForm';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { TURKEY_CITIES } from '@/lib/cities';

export default function PricingPage() {
  const t = useTranslations('PricingPage');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Payment States
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentContent, setPaymentContent] = useState('');
  
  // Extension Dialog States
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [extendMonth, setExtendMonth] = useState(1);
  
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const [mode, setMode] = useState<string | null>(null);

  const [prices, setPrices] = useState({
    monthly: 499,
    yearly: 4990
  });
  
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  const [discountPercentage, setDiscountPercentage] = useState(() => {
    return Math.round((1 - (4990 / (499 * 12))) * 100);
  });

  useEffect(() => {
    fetch(`${API_URL}/super-admin/settings`)
      .then(res => res.json())
      .then(data => {
        let newMonthly = prices.monthly;
        let newYearly = prices.yearly;

        if (data.PRICING_MONTHLY) {
          newMonthly = parseFloat(data.PRICING_MONTHLY);
        }
        if (data.PRICING_YEARLY) {
          newYearly = parseFloat(data.PRICING_YEARLY);
        }

        setPrices({ monthly: newMonthly, yearly: newYearly });
        
        // Calculate discount percentage
        if (newMonthly > 0 && newYearly > 0) {
          const yearlyTotal = newMonthly * 12;
          const discount = Math.round((1 - (newYearly / yearlyTotal)) * 100);
          setDiscountPercentage(discount);
        }
      })
      .catch(err => console.error('Failed to fetch pricing:', err))
      .finally(() => setIsPriceLoading(false));
  }, []);

  useEffect(() => {
    const durationParam = searchParams.get('duration');
    const modeParam = searchParams.get('mode');
    const extendParam = searchParams.get('extend');
    
    if (durationParam) {
      setBillingCycle(durationParam);
    }

    if (modeParam) setMode(modeParam);
    if (extendParam === 'true') setMode('extend');

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'CAFE_ADMIN') {
          setIsAdmin(true);
          // Auto-open if mode is present and user is admin
          if (modeParam === 'extend' || modeParam === 'update_card' || extendParam === 'true') {
             // If extending but no duration specified, open selection dialog instead of billing form
             if ((modeParam === 'extend' || extendParam === 'true') && !durationParam) {
                setIsExtendDialogOpen(true);
             } else {
                setShowBillingForm(true);
             }
          }

          // Fetch Cafe Info to pre-fill billing data
          if (user.cafeId) {
            fetch(`${API_URL}/cafes/${user.cafeId}`)
              .then(res => res.json())
              .then(cafe => {
                setBillingData(prev => ({
                  ...prev,
                  contactName: cafe.authorizedPerson || prev.contactName,
                  city: cafe.city || prev.city,
                  address: cafe.address || prev.address,
                  gsmNumber: cafe.phone || prev.gsmNumber,
                }));
              })
              .catch(console.error);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [searchParams]);

  const [billingData, setBillingData] = useState({
    contactName: '',
    identityNumber: '',
    city: '',
    country: 'Turkey',
    zipCode: '',
    address: '',
    gsmNumber: '',
    birthYear: ''
  });
  
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const handleSubscribeClick = () => {
    if (mode === 'extend') {
      setIsExtendDialogOpen(true);
    } else {
      setShowBillingForm(true);
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      // TC Validation disabled temporarily for smoother testing if needed, or fix parameters
      // const verifyRes = await fetch(`${API_URL}/verification/tc-verify`, { ... });

      const res = await fetch(`${API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ip: '127.0.0.1',
          contactName: billingData.contactName,
          identityNumber: billingData.identityNumber,
          city: billingData.city,
          country: billingData.country,
          zipCode: billingData.zipCode,
          address: billingData.address,
          gsmNumber: billingData.gsmNumber,
          planDuration: billingCycle,
          mode: mode,
          storeCard: true
        })
      });

      const data = await res.json();

      if (data.status === 'success' && data.checkoutFormContent) {
        setPaymentContent(data.checkoutFormContent);
        setShowBillingForm(false);
        setShowPaymentModal(true);
      } else {
        toast.error('Ödeme başlatılamadı: ' + (data.errorMessage || 'Bilinmeyen hata'));
      }
    } catch (e) {
      console.error(e);
      toast.error('Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (isAdmin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const getPriceDisplay = () => {
    if (isPriceLoading) {
      return <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg mx-auto" />;
    }

    if (billingCycle === 'yearly') return `₺${prices.yearly.toLocaleString('tr-TR')}/yıl`;
    if (billingCycle === 'monthly') return `₺${prices.monthly.toLocaleString('tr-TR')}/ay`;
    if (billingCycle && billingCycle.endsWith('_months')) {
        const m = parseInt(billingCycle.split('_')[0]);
        if (!isNaN(m)) {
            const price = (prices.monthly * m).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            return `₺${price} / ${m} Ay`;
        }
    }
    return `₺${prices.monthly.toLocaleString('tr-TR')}/ay`;
  };

  const plans = [
    {
      name: t('plans.starter.name'),
      price: t('plans.starter.price'),
      description: t('plans.starter.description'),
      features: [
        t('plans.starter.features.0'),
        t('plans.starter.features.1'),
        t('plans.starter.features.2'),
        t('plans.starter.features.3')
      ],
      cta: isAdmin ? 'Panele Git' : t('plans.starter.cta'),
      popular: false,
      href: isAdmin ? '/admin/dashboard' : '/admin/register',
      action: null
    },
    {
      name: t('plans.pro.name'),
      price: getPriceDisplay(),
      description: billingCycle === 'yearly' ? (isPriceLoading ? 'Yıllık öde, tasarruf et.' : `Yıllık öde, %${discountPercentage} tasarruf et.`) : t('plans.pro.description'),
      features: [
        t('plans.pro.features.0'),
        t('plans.pro.features.1'),
        t('plans.pro.features.2'),
        t('plans.pro.features.3'),
        t('plans.pro.features.4')
      ],
      cta: isAdmin 
        ? (mode === 'update_card' ? 'Kartı Güncelle' : (mode === 'extend' ? 'Süreyi Uzat' : 'Abone Ol'))
        : t('plans.pro.cta'),
      popular: true,
      href: isAdmin ? '#' : '/admin/register',
      action: isAdmin ? handleSubscribeClick : null
    },
    {
      name: t('plans.enterprise.name'),
      price: t('plans.enterprise.price'),
      description: t('plans.enterprise.description'),
      features: [
        t('plans.enterprise.features.0'),
        t('plans.enterprise.features.1'),
        t('plans.enterprise.features.2'),
        t('plans.enterprise.features.3'),
        t('plans.enterprise.features.4')
      ],
      cta: t('plans.enterprise.cta'),
      popular: false,
      href: '/contact',
      action: null
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12 lg:py-32 relative">
      <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="flex items-center gap-2 hover:bg-transparent hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="text-lg font-medium"></span>
        </Button>
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-12 lg:space-y-16"
        >
          <div className="text-center space-y-4">
            <motion.h1 variants={itemVariants} className="text-3xl md:text-6xl font-bold tracking-tight">
              {t('title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                {t('titleHighlight')}
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('subtitle')}
            </motion.p>
          </div>

          {/* Billing Cycle Toggle - Hide if custom duration */}
          {!billingCycle.endsWith('_months') && (
          <div className="flex justify-center -mt-4 mb-8">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center relative">
               <button 
                 onClick={() => setBillingCycle('monthly')}
                 className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 Aylık
               </button>
               <button 
                 onClick={() => setBillingCycle('yearly')}
                 className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 Yıllık
                 {!isPriceLoading && discountPercentage > 0 && (
                   <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                     %{discountPercentage} İndirim
                   </span>
                 )}
               </button>
            </div>
          </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className={`relative p-8 rounded-3xl border ${
                  plan.popular 
                    ? 'bg-primary/5 border-primary shadow-2xl shadow-primary/10' 
                    : 'bg-card border-border/50 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {t('popular')}
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">{plan.price}</div>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full h-12 rounded-xl font-bold ${
                    plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                  variant={plan.popular ? 'default' : 'secondary'}
                  onClick={() => {
                    if (plan.action) {
                      plan.action();
                    } else {
                      router.push(plan.href);
                    }
                  }}
                  disabled={isLoading && !!plan.action}
                >
                  {plan.action && isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <Dialog open={showBillingForm} onOpenChange={setShowBillingForm}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                {mode === 'update_card' ? 'Kart Güncelleme Bilgileri' : 'Fatura Bilgileri'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-indigo-100 text-sm sm:text-base mt-2">
              {mode === 'update_card' 
                ? 'Kart doğrulaması için 1 TL çekilecek ve iade edilecektir.' 
                : 'Yasal zorunluluk gereği lütfen bilgileri doldurunuz.'}
            </DialogDescription>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            <form onSubmit={handleBillingSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-xs sm:text-sm font-medium text-slate-700">Ad Soyad / Firma Adı</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="contactName"
                      required
                      value={billingData.contactName}
                      onChange={(e) => setBillingData({ ...billingData, contactName: e.target.value })}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="pl-9 sm:pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-lg sm:rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identityNumber" className="text-xs sm:text-sm font-medium text-slate-700">TC Kimlik / Vergi No</Label>
                  <div className="relative group">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="identityNumber"
                      required
                      value={billingData.identityNumber}
                      onChange={(e) => setBillingData({ ...billingData, identityNumber: e.target.value })}
                      placeholder="11 haneli TC veya Vergi No"
                      maxLength={11}
                      className="pl-9 sm:pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-lg sm:rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs sm:text-sm font-medium text-slate-700">Açık Adres</Label>
                  <AddressAutocomplete
                    defaultValue={billingData.address}
                    onAddressSelect={(data) => {
                      setBillingData(prev => ({
                        ...prev,
                        address: data.address,
                        city: data.city || prev.city,
                        zipCode: data.zipCode || prev.zipCode,
                        country: data.country || prev.country
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs sm:text-sm font-medium text-slate-700">Şehir</Label>
                    <div className="relative group">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        id="city"
                        required
                        value={billingData.city}
                        onChange={(e) => {
                          setBillingData({ ...billingData, city: e.target.value });
                          setShowCitySuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => {
                          if (billingData.city.length > 0) setShowCitySuggestions(true);
                        }}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                        placeholder="İl"
                        className="pl-9 sm:pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-lg sm:rounded-xl text-sm"
                        autoComplete="off"
                      />
                      {showCitySuggestions && billingData.city.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {TURKEY_CITIES
                            .filter(city => city.toLocaleLowerCase('tr').startsWith(billingData.city.toLocaleLowerCase('tr')))
                            .slice(0, 3)
                            .map((city) => (
                              <div
                                key={city}
                                className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                onClick={() => {
                                  setBillingData(prev => ({ ...prev, city }));
                                  setShowCitySuggestions(false);
                                }}
                              >
                                {city}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-xs sm:text-sm font-medium text-slate-700">Posta Kodu</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        id="zipCode"
                        required
                        value={billingData.zipCode}
                        onChange={(e) => setBillingData({ ...billingData, zipCode: e.target.value })}
                        placeholder="34000"
                        className="pl-9 sm:pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-lg sm:rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gsmNumber" className="text-xs sm:text-sm font-medium text-slate-700">Telefon</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      id="gsmNumber"
                      value={billingData.gsmNumber}
                      onChange={(e) => setBillingData({ ...billingData, gsmNumber: e.target.value })}
                      placeholder="+905555555555"
                      className="pl-9 sm:pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-lg sm:rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100">
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                  <span>Bilgileriniz 256-bit SSL sertifikası ile korunmaktadır.</span>
                </div>
                
                <div className="flex justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white pt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowBillingForm(false)}
                    className="h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-slate-100 text-sm"
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-10 sm:h-11 px-6 sm:px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 rounded-lg sm:rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        {mode === 'update_card' ? 'Doğrula ve Güncelle' : 'Ödemeye Geç'} <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Abonelik Süresini Uzat</DialogTitle>
            <DialogDescription>
              Mevcut aboneliğinizi uzatmak için bir süre seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 6, 12].map((month) => (
                <Button
                  key={month}
                  variant={extendMonth === month ? "default" : "outline"}
                  className={extendMonth === month ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setExtendMonth(month)}
                >
                  {month === 12 ? "1 Yıl" : `${month} Ay`}
                </Button>
              ))}
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <span className="font-medium">Toplam Tutar:</span>
              <span className="text-xl font-bold">
                {isPriceLoading ? (
                  <span className="inline-block h-6 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                ) : (
                  extendMonth === 12 
                    ? `₺${prices.yearly.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                    : `₺${(extendMonth * prices.monthly).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                )}
              </span>
            </div>
            {extendMonth === 12 && !isPriceLoading && (
              <p className="text-sm text-green-600 text-center font-medium">
                Yıllık planda %{discountPercentage} tasarruf edersiniz!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              const duration = extendMonth === 12 ? 'yearly' : (extendMonth === 1 ? 'monthly' : `${extendMonth}_months`);
              setBillingCycle(duration);
              setIsExtendDialogOpen(false);
              setShowBillingForm(true);
            }}>
              Ödemeye Geç
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal} modal={false}>
        <DialogContent 
          className="w-[95vw] sm:w-full sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-0 sm:p-6 rounded-xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-4 sm:p-0">
            <DialogTitle className="text-center text-xl font-bold">{mode === 'update_card' ? 'Kart Doğrulama' : 'Güvenli Ödeme'}</DialogTitle>
          </DialogHeader>
          <div className="mt-0 sm:mt-4 w-full">
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 flex gap-3 shadow-sm">
               <div className="bg-amber-100 p-2 rounded-full h-fit shrink-0">
                 <CreditCard className="w-5 h-5 text-amber-600" />
               </div>
               <div>
                  <p className="font-bold mb-1 text-base">⚠️ Kartınızı Kaydetmeyi Unutmayın!</p>
                  <p className="leading-relaxed">
                    {mode === 'update_card' 
                      ? 'Kartınızın başarıyla güncellenmesi için açılan pencerede "Iyzico ile kartımı sakla" kutucuğunu MUTLAKA işaretleyiniz. Aksi takdirde kartınız kaydedilmeyecektir.' 
                      : 'Aboneliğinizin sorunsuz devam etmesi ve otomatik yenileme için ödeme ekranında "Kartımı sakla" seçeneğini işaretleyiniz.'}
                  </p>
               </div>
            </div>
            <IyzipayForm content={paymentContent} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
