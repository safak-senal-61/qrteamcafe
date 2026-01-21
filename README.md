# 🍽️ QR Team Cafe (Gunibirlik)

> **Modern, Hızlı ve Akıllı QR Menü Sistemi**
> 
> Kafeler ve restoranlar için dijital dönüşümü başlatan, siparişten ödemeye kadar tüm süreci yöneten yeni nesil platform.

![Project Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_NestJS_|_Prisma-black?style=for-the-badge)

---

## 📖 Proje Hakkında

**QR Team Cafe**, işletmelerin kağıt menü maliyetlerinden kurtulmasını, sipariş süreçlerini hızlandırmasını ve müşteri deneyimini üst seviyeye taşımasını sağlayan kapsamlı bir SaaS (Software as a Service) çözümüdür.

Müşteriler masadaki QR kodu okutarak saniyeler içinde menüye ulaşır, garson beklemeden sipariş verir ve hatta hesabı öder. İşletme sahipleri ise gelişmiş yönetim paneli ile tüm operasyonu tek ekrandan yönetir.

---

## ✨ Özellikler

### 📱 Müşteriler İçin (QR Menü)
*   **Hızlı Erişim:** Uygulama indirmeden, sadece kamera ile QR kod okutarak menüye erişim.
*   **Canlı Menü:** Anlık güncellenen fiyatlar, ürün görselleri ve stok durumu.
*   **Kolay Sipariş:** Sepete ekle, not yaz ve siparişi gönder.
*   **Garson Çağır:** Tek tuşla garson isteme özelliği.
*   **Akıllı Sepet:** Kişiselleştirilebilir ürün seçenekleri.

### 🏢 Kafe Yöneticileri İçin (Admin Panel)
*   **Dashboard:** Günlük ciro, aktif masa sayısı ve bekleyen siparişlerin özeti.
*   **Menü Yönetimi:** Kategori ve ürünleri sürükle-bırak kolaylığında düzenleme.
*   **QR Oluşturucu:** Her masa için özel tasarımlı QR kodlar oluşturma ve indirme.
*   **Sipariş Takibi:** Gelen siparişleri anlık görme, durumu (Hazırlanıyor/Teslim Edildi) güncelleme.
*   **Logo & Marka:** İşletme logosunu yükleme ve menü temasını özelleştirme.

### 🛡️ Süper Admin (Platform Yönetimi)
*   **Kafe Onayı:** Sisteme kayıt olan işletmelerin onayı ve yönetimi.
*   **Global İstatistikler:** Tüm platformun performans verileri.

---

## 🛠️ Teknolojiler ve Mimari

Bu proje, ölçeklenebilirlik ve performans odaklı modern teknolojilerle geliştirilmiştir.

| Alan | Teknoloji | Açıklama |
|---|---|---|
| **Frontend (Client)** | ![Next.js](https://img.shields.io/badge/-Next.js-black?logo=next.js) | React tabanlı SSR/CSR framework |
| **Backend (Server)** | ![NestJS](https://img.shields.io/badge/-NestJS-E0234E?logo=nestjs&logoColor=white) | Modüler Node.js framework |
| **Veritabanı** | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white) | İlişkisel veritabanı |
| **ORM** | ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white) | Modern veritabanı yönetimi |
| **Stil** | ![Tailwind CSS](https://img.shields.io/badge/-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white) | Hızlı UI geliştirme |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/-Socket.io-010101?logo=socket.io&logoColor=white) | Canlı sipariş bildirimleri |

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Node.js (v18+)
*   PostgreSQL
*   npm veya yarn

### 1. Repoyu Klonlayın
```bash
git clone https://github.com/safak-senal-61/qrteamcafe.git
cd qrteamcafe
```

### 2. Backend (Server) Kurulumu
```bash
cd server
npm install

# .env dosyasını oluşturun ve veritabanı ayarlarını yapın
cp .env.example .env

# Veritabanını şemaya göre oluşturun
npx prisma migrate dev

# Server'ı başlatın
npm run start:dev
```

### 3. Frontend (Client) Kurulumu
Yeni bir terminal açın:
```bash
cd client
npm install

# Client'ı başlatın
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresine giderek uygulamayı görüntüleyebilirsiniz.

---

## 🗺️ Yol Haritası (Roadmap)

Projenin gelecek vizyonu ve planlanan özellikleri için detaylı [ROADMAP.md](./ROADMAP.md) dosyasını inceleyebilirsiniz.

**Öne Çıkan Gelecek Planları:**
*   🤖 **AI Destekli Öneriler:** Müşteriye özel yemek eşlikçisi.
*   📈 **Borsa Bar Modu:** Talebe göre değişen dinamik fiyatlandırma.
*   🤝 **Ortak Sipariş:** Masadaki herkesin aynı sepete ürün ekleyebilmesi.
*   ♻️ **Sürdürülebilirlik:** Atık takibi modülü.

---

## 🤝 Katkıda Bulunma

1. Bu repoyu fork edin.
2. Yeni bir feature branch oluşturun (`git checkout -b feature/AmazingFeature`).
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add some AmazingFeature'`).
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`).
5. Bir Pull Request oluşturun.

---

## 📞 İletişim

Proje ile ilgili sorularınız veya önerileriniz için lütfen iletişime geçin.

---
*Developed with ❤️ by QR Team*
