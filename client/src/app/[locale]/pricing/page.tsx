'use client';

import { motion, Variants } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

export default function PricingPage() {
  const t = useTranslations('PricingPage');
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'CAFE_ADMIN') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: '127.0.0.1' })
      });

      const data = await res.json();

      if (data.status === 'success' && data.checkoutFormContent) {
         const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ödeme - QR Team Cafe</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
              <div id="iyzipay-checkout-form" class="responsive"></div>
              ${data.checkoutFormContent}
            </body>
          </html>
        `;
        document.open();
        document.write(html);
        document.close();
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
      cta: t('plans.starter.cta'),
      popular: false,
      href: '/admin/register',
      action: null
    },
    {
      name: t('plans.pro.name'),
      price: t('plans.pro.price'),
      description: t('plans.pro.description'),
      features: [
        t('plans.pro.features.0'),
        t('plans.pro.features.1'),
        t('plans.pro.features.2'),
        t('plans.pro.features.3'),
        t('plans.pro.features.4')
      ],
      cta: isAdmin ? 'Abone Ol' : t('plans.pro.cta'),
      popular: true,
      href: isAdmin ? '#' : '/admin/register',
      action: isAdmin ? handleSubscribe : null
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
    <div className="min-h-screen bg-background py-12 lg:py-32">
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
    </div>
  );
}
