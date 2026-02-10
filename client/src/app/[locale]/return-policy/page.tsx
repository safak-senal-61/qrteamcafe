'use client';

import { motion, Variants } from 'framer-motion';
import { RefreshCcw, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ReturnPolicyPage() {
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

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            İade ve İptal Politikası
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Müşteri memnuniyeti önceliğimizdir. İade ve iptal süreçlerimiz aşağıda detaylandırılmıştır.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCcw className="h-6 w-6 text-primary" />
                1. Genel İade Koşulları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                QrDers üzerinden satın alınan ürünler (dijital abonelikler ve hizmetler hariç), teslim tarihinden itibaren 14 gün içinde iade edilebilir. İade edilecek ürünün kullanılmamış, hasar görmemiş ve orijinal ambalajında olması gerekmektedir.
              </p>
              <p>
                Restoran/Cafe siparişlerinde ise; sipariş hazırlanmaya başlanmadan önce iptal işlemi gerçekleştirilebilir. Hazırlanmaya başlanan veya teslim edilen yiyecek/içecek ürünlerinde, hijyen ve gıda güvenliği standartları gereği iade kabul edilmemektedir (ayıplı/bozuk ürünler hariç).
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-primary" />
                2. İade Edilemeyecek Ürünler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallar.</li>
                <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek mallar (yiyecek, içecek vb.).</li>
                <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan mallardan; iadesi sağlık ve hijyen açısından uygun olmayanlar.</li>
                <li>Abonelik hizmetleri (hizmet ifasına başlandıktan sonra cayma hakkı kullanılamaz).</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                3. İade Süreci
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                İade talebinizi oluşturmak için lütfen bizimle iletişime geçin veya panelinizden iade talebi oluşturun. Talebiniz incelendikten sonra, iade koşullarına uygun bulunması durumunda ürün bedeli, ödeme yaptığınız karta veya hesaba 7-14 iş günü içerisinde iade edilecektir.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-primary" />
                4. Sipariş İptali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Siparişiniz kargoya verilmeden veya hizmet (yemek siparişi vb.) hazırlanmaya başlanmadan önce iptal edebilirsiniz. İptal talebinizi müşteri hizmetlerimize iletmeniz gerekmektedir.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                Yardıma mı ihtiyacınız var?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                İade ve iptal süreçleriyle ilgili sorularınız için <strong>support@qrders.com</strong> adresinden veya <strong>0850 123 45 67</strong> numaralı telefondan bize ulaşabilirsiniz.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="my-8" />
        
        <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
          <p>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
        </motion.div>

      </motion.div>
    </div>
  );
}
