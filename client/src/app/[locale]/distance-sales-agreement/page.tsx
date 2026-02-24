'use client';

import { motion, Variants } from 'framer-motion';
import { FileText, Scale, RefreshCw, CreditCard, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function DistanceSalesAgreementPage() {
  // Removed unused translation hook
  
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
            Uzaktan Satış Sözleşmesi
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Bu sözleşme, alıcı ve satıcı arasındaki hak ve yükümlülükleri belirler.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                1. Taraflar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>1.1. Satıcı Bilgileri:</strong><br />
                Ünvan: QrDers (Bundan sonra &quot;SATICI&quot; olarak anılacaktır)<br />
                Adres: Pelitli Mahallesi, Kızılcık Sokak, Ortahisar / Trabzon<br />
                E-posta: support@qrders.com.tr<br />
              </p>
              <p>
                <strong>1.2. Alıcı Bilgileri:</strong><br />
                Sisteme üye olan veya sipariş veren müşteri (Bundan sonra &quot;ALICI&quot; olarak anılacaktır).
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                2. Konu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                İşbu sözleşmenin konusu, ALICI&apos;nın SATICI&apos;ya ait www.qrders.com.tr internet sitesi veya mobil uygulaması üzerinden elektronik ortamda siparişini yaptığı aşağıda nitelikleri ve satış fiyatı belirtilen ürünün/hizmetin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                3. Sözleşme Konusu Ürün/Hizmet Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                3.1. Malın/Ürünün/Hizmetin türü, miktarı, marka/modeli, rengi, adedi, satış bedeli, ödeme şekli, siparişin sonlandığı andaki bilgilerden oluşmaktadır.
              </p>
              <p>
                3.2. Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                4. Genel Hükümler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                4.1. ALICI, SATICI&apos;ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini beyan eder.
              </p>
              <p>
                4.2. Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak koşulu ile her bir ürün için ALICI&apos;nın yerleşim yerinin uzaklığına bağlı olarak internet sitesinde ön bilgiler içinde açıklanan süre içinde ALICI veya gösterdiği adresteki kişi/kuruluşa teslim edilir.
              </p>
              <p>
                4.3. Sözleşme konusu ürün, ALICI&apos;dan başka bir kişi/kuruluşa teslim edilecek ise, teslim edilecek kişi/kuruluşun teslimatı kabul etmemesinden SATICI sorumlu tutulamaz.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 text-primary" />
                5. Cayma Hakkı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                5.1. ALICI; mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (on dört) gün içerisinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir.
              </p>
              <p>
                5.2. Cayma hakkının kullanılması için bu süre içinde SATICI&apos;ya yazılı bildirimde bulunulması şarttır.
              </p>
              <div>
                5.3. Cayma hakkının kullanılamayacağı ürünler:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                   <li>Fiyatı finansal piyasalardaki dalgalanmalara bağlı olarak değişen ve satıcının kontrolünde olmayan mal veya hizmetler.</li>
                   <li>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallar.</li>
                   <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek mallar.</li>
                   <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan mallardan; iadesi sağlık ve hijyen açısından uygun olmayanlar.</li>
                </ul>
              </div>
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
