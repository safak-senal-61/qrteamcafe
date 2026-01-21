'use client';

import { motion, Variants } from 'framer-motion';
import { CheckCircle2, Zap, Shield, Smartphone, BarChart3, Globe } from 'lucide-react';

export default function FeaturesPage() {
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

  const features = [
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: 'Mobil Uyumlu QR Menü',
      description: 'Tüm cihazlarda kusursuz çalışan, hızlı ve modern bir menü deneyimi. Uygulama indirmeye gerek yok.'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: 'Hızlı Sipariş Sistemi',
      description: 'Müşterileriniz garson beklemeden sipariş versin, operasyon hızınız %30 artsın.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: 'Detaylı Analizler',
      description: 'Hangi ürün ne zaman satılıyor? Veriye dayalı kararlar alarak cironuzu artırın.'
    },
    {
      icon: <Globe className="h-8 w-8 text-green-500" />,
      title: 'Çoklu Dil Desteği',
      description: 'Menünüzü otomatik olarak farklı dillere çevirin, turist müşterilerinizi memnun edin.'
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      title: 'Güvenli Altyapı',
      description: 'KVKK uyumlu, güvenli ve yedekli sunucu altyapısı ile verileriniz güvende.'
    },
    {
      icon: <CheckCircle2 className="h-8 w-8 text-red-500" />,
      title: 'Kolay Yönetim Paneli',
      description: 'Ürünlerinizi, fiyatlarınızı ve stok durumunuzu saniyeler içinde güncelleyin.'
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
              İşletmenizi Güçlendiren <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Gelişmiş Özellikler
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              QR Team Cafe, bir menüden çok daha fazlası. İşletmenizin tüm ihtiyaçlarını karşılayan kapsamlı bir çözüm.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="mb-6 p-4 rounded-xl bg-secondary/50 w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
