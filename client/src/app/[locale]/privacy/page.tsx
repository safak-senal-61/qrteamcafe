'use client';

import { motion, Variants } from 'framer-motion';

export default function PrivacyPage() {
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
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tight">
              Gizlilik Politikası
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
              Son Güncelleme: 21 Ocak 2026
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="prose prose-lg dark:prose-invert mx-auto">
            <p>
              QR Team Cafe olarak gizliliğinize önem veriyoruz. Bu Gizlilik Politikası, hizmetlerimizi kullandığınızda verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
            </p>

            <h3>1. Toplanan Veriler</h3>
            <p>
              Hizmetlerimizi kullanırken aşağıdaki bilgileri toplayabiliriz:
            </p>
            <ul>
              <li><strong>Hesap Bilgileri:</strong> Ad, e-posta adresi, telefon numarası ve şifre.</li>
              <li><strong>İşletme Bilgileri:</strong> Restoran adı, menü içeriği, fiyatlandırma ve sipariş verileri.</li>
              <li><strong>Kullanım Verileri:</strong> IP adresi, tarayıcı türü, ziyaret süresi ve sayfa etkileşimleri.</li>
            </ul>

            <h3>2. Verilerin Kullanımı</h3>
            <p>
              Topladığımız verileri şu amaçlarla kullanırız:
            </p>
            <ul>
              <li>Hizmetlerimizi sağlamak ve iyileştirmek.</li>
              <li>Müşteri desteği sunmak.</li>
              <li>Yasal yükümlülükleri yerine getirmek.</li>
              <li>Pazarlama ve iletişim faaliyetlerini yürütmek (izniniz dahilinde).</li>
            </ul>

            <h3>3. Veri Güvenliği</h3>
            <p>
              Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz. Ancak, internet üzerinden yapılan hiçbir veri iletiminin %100 güvenli olduğunu garanti edemeyiz.
            </p>

            <h3>4. Üçüncü Taraflarla Paylaşım</h3>
            <p>
              Verilerinizi asla izniniz olmadan satmayız. Ancak, hizmet sağlayıcılarımızla (ödeme işlemcileri, sunucu sağlayıcıları vb.) gerekli olduğu ölçüde veri paylaşabiliriz.
            </p>

            <h3>5. İletişim</h3>
            <p>
              Gizlilik politikamızla ilgili sorularınız için <a href="/contact">iletişim sayfamız</a> üzerinden bize ulaşabilirsiniz.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
