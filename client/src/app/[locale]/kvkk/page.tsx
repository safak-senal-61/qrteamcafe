'use client';

import { motion, Variants } from 'framer-motion';

export default function KvkkPage() {
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
              KVKK Aydınlatma Metni
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
              Kişisel Verilerin Korunması Kanunu Kapsamında Bilgilendirme
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="prose prose-lg dark:prose-invert mx-auto">
            <p>
              QR Team Cafe ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlar ve yöntemlerle işlemekteyiz.
            </p>

            <h3>1. Kişisel Verilerin İşlenme Amacı</h3>
            <p>
              Kişisel verileriniz; ürün ve hizmetlerimizin sunulabilmesi, müşteri ilişkilerinin yönetimi, yasal yükümlülüklerin yerine getirilmesi, pazarlama faaliyetlerinin yürütülmesi ve hizmet kalitesinin artırılması amaçlarıyla işlenmektedir.
            </p>

            <h3>2. İşlenen Kişisel Veri Kategorileri</h3>
            <ul>
              <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası (fatura işlemleri için).</li>
              <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, adres.</li>
              <li><strong>Müşteri İşlem Bilgileri:</strong> Sipariş geçmişi, ödeme bilgileri.</li>
              <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, log kayıtları.</li>
            </ul>

            <h3>3. Kişisel Verilerin Aktarılması</h3>
            <p>
              Kişisel verileriniz, kanunen yetkili kamu kurum ve kuruluşları ile hizmet aldığımız iş ortaklarımız (ödeme kuruluşları, bilişim altyapı sağlayıcıları) ile KVKK'nın 8. ve 9. maddelerine uygun olarak paylaşılabilir.
            </p>

            <h3>4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h3>
            <p>
              Kişisel verileriniz, internet sitemiz, mobil uygulamamız, çağrı merkezimiz veya e-posta yoluyla elektronik ortamda toplanmaktadır. Bu veriler, sözleşmenin ifası, kanunlarda öngörülmesi ve meşru menfaatlerimiz hukuki sebeplerine dayanılarak işlenmektedir.
            </p>

            <h3>5. Haklarınız</h3>
            <p>
              KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <ul>
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
              <li>Silinmesini veya yok edilmesini isteme.</li>
            </ul>
            <p>
              Haklarınızı kullanmak için <a href="/contact">iletişim sayfamız</a> üzerinden bize başvurabilirsiniz.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
