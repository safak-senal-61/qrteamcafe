'use client';

import { motion, Variants } from 'framer-motion';

export default function TermsPage() {
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
              Kullanım Şartları
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
              Son Güncelleme: 21 Ocak 2026
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="prose prose-lg dark:prose-invert mx-auto">
            <p>
              QR Team Cafe hizmetlerini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız. Lütfen bu şartları dikkatlice okuyunuz.
            </p>

            <h3>1. Hizmetin Tanımı</h3>
            <p>
              QR Team Cafe, restoran ve kafeler için dijital menü, sipariş yönetimi ve raporlama hizmetleri sunan bir SaaS (Hizmet Olarak Yazılım) platformudur.
            </p>

            <h3>2. Hesap Oluşturma ve Güvenlik</h3>
            <p>
              Hizmetlerimizden yararlanmak için doğru ve güncel bilgilerle hesap oluşturmanız gerekmektedir. Hesap güvenliğinizden siz sorumlusunuz. Şüpheli bir işlem fark ederseniz derhal bize bildirmelisiniz.
            </p>

            <h3>3. Kullanım Kuralları</h3>
            <p>
              Platformu yasalara aykırı, zararlı veya başkalarının haklarını ihlal edecek şekilde kullanamazsınız. Sistemin güvenliğini veya bütünlüğünü tehlikeye atacak girişimlerde bulunmak yasaktır.
            </p>

            <h3>4. Ödeme ve Abonelik</h3>
            <p>
              Bazı özellikler ücretli abonelik gerektirebilir. Ödemeler, seçtiğiniz plana göre aylık veya yıllık olarak tahsil edilir. İptal politikamız hakkında bilgi için fiyatlandırma sayfasını inceleyebilirsiniz.
            </p>

            <h3>5. Fikri Mülkiyet</h3>
            <p>
              Platform üzerindeki tüm tasarımlar, logolar, kodlar ve içerikler QR Team Cafe'nin mülkiyetindedir. İznimiz olmadan kopyalanamaz veya çoğaltılamaz.
            </p>

            <h3>6. Sorumluluk Reddi</h3>
            <p>
              Hizmetlerimiz "olduğu gibi" sunulmaktadır. Kesintisiz veya hatasız çalışacağını garanti etmeyiz. Doğrudan veya dolaylı zararlardan sorumlu tutulamayız.
            </p>

            <h3>7. Değişiklikler</h3>
            <p>
              Bu kullanım şartlarını zaman zaman güncelleyebiliriz. Değişiklikler yayınlandığı tarihte yürürlüğe girer.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
