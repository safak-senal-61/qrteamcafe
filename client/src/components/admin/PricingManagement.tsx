'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles, Percent, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export function PricingManagement() {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({
    monthly: '499',
    yearly: '4990'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/super-admin/settings`);
      const data = await res.json();
      if (data.PRICING_MONTHLY) {
        setPrices(prev => ({ ...prev, monthly: data.PRICING_MONTHLY }));
      }
      if (data.PRICING_YEARLY) {
        setPrices(prev => ({ ...prev, yearly: data.PRICING_YEARLY }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Update Monthly Price
      await fetch(`${API_URL}/super-admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: 'PRICING_MONTHLY',
          value: prices.monthly
        })
      });

      // Update Yearly Price
      await fetch(`${API_URL}/super-admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: 'PRICING_YEARLY',
          value: prices.yearly
        })
      });

      toast.success('Fiyatlar başarıyla güncellendi.');
    } catch (error) {
      console.error(error);
      toast.error('Fiyatlar güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = (percentage: number) => {
    const monthlyPrice = parseFloat(prices.monthly);
    if (isNaN(monthlyPrice)) {
      toast.error('Lütfen geçerli bir aylık fiyat giriniz.');
      return;
    }

    const yearlyTotal = monthlyPrice * 12;
    const discountedYearly = yearlyTotal * (1 - percentage / 100);
    
    setPrices(prev => ({
      ...prev,
      yearly: Math.round(discountedYearly).toString()
    }));
    
    toast.success(`%${percentage} indirim uygulandı!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24 text-indigo-500" />
        </div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Fiyatlandırma Yönetimi
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                Paket fiyatlarını ve indirim oranlarını buradan yönetebilirsiniz.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monthly Price Section */}
            <div className="space-y-4 p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Label htmlFor="monthlyPrice" className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Aylık Abonelik Fiyatı
              </Label>
              <div className="relative">
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={prices.monthly}
                  onChange={(e) => setPrices({ ...prices, monthly: e.target.value })}
                  placeholder="499"
                  className="pl-8 text-lg font-medium h-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₺</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Temel aylık abonelik ücretidir. Diğer hesaplamalar bu fiyat üzerinden yapılır.
              </p>
            </div>

            {/* Yearly Price Section */}
            <div className="space-y-4 p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Label htmlFor="yearlyPrice" className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Yıllık Abonelik Fiyatı
              </Label>
              <div className="relative">
                <Input
                  id="yearlyPrice"
                  type="number"
                  value={prices.yearly}
                  onChange={(e) => setPrices({ ...prices, yearly: e.target.value })}
                  placeholder="4990"
                  className="pl-8 text-lg font-medium h-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₺</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kullanıcı yıllık ödeme yaptığında ödeyeceği toplam tutardır.
              </p>
            </div>
          </div>

          {/* Discount Calculator Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Otomatik İndirim Uygula (Yıllık Plan İçin)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[10, 20, 30, 40, 50].map((discount) => (
                <Button
                  key={discount}
                  variant="outline"
                  onClick={() => applyDiscount(discount)}
                  className="h-auto py-3 flex flex-col gap-1 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                >
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    %{discount}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">İndirim</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-center text-slate-500 italic">
              * Aylık fiyat üzerinden 12 aylık toplam hesaplanır ve seçilen indirim oranı düşülerek yıllık fiyat otomatik güncellenir.
            </p>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 p-6 flex justify-end border-t border-slate-100 dark:border-slate-800">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full md:w-auto min-w-[150px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
