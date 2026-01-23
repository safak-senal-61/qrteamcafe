# Gunibirlik / QR Team Cafe - Proje Roadmap

Bu doküman, QR Team Cafe projesinin mevcut durumunu, tamamlanan özelliklerini ve gelecek planlarını içerir.

## 🌟 Proje Durum Özeti
**Gunibirlik / QR Team Cafe**, NestJS (Backend) ve Next.js (Frontend) üzerine kurulu, modern bir mimariye sahip, çoklu panelli (Süper Admin, Kafe Admin, Müşteri) bir QR menü sistemidir.

---

## ✅ Tamamlananlar (Phase 1 & 2)

### 1. Altyapı ve Veritabanı
- [x] **Monorepo Yapısı:** Client ve Server ayrı klasörlerde, temiz bir yapı kuruldu.
- [x] **Veritabanı Şeması (Prisma):** Kafe, Admin, Ürün, Kategori, Sipariş, Masa, Garson Çağrısı tabloları ilişkisel olarak tasarlandı.
- [x] **GitHub Entegrasyonu:** Proje versiyon kontrolüne alındı ve `.gitignore` ile temizlendi.

### 2. Kimlik Doğrulama (Auth)
- [x] **Süper Admin:** Login ve kayıt akışları hazır.
- [x] **Kafe Admin:** Kayıt olma, onay süreci, şifre sıfırlama, e-posta doğrulama altyapısı hazır.
- [x] **Güvenlik:** JWT tabanlı kimlik doğrulama (Access & Refresh Token) ve bcrypt ile şifreleme.

### 3. Yönetim Panelleri
- [x] **Süper Admin Dashboard:** Kafeleri listeleme, onaylama/reddetme, genel istatistikler.
- [x] **Kafe Admin Dashboard:**
    - **Logo Yükleme:** Kayıt sırasında ve sonrasında logo yükleme ve kırpma özelliği.
    - **Ürün Yönetimi:** Ürün ekleme, düzenleme, silme, resim yükleme.
    - **Kategori Yönetimi:** Menü kategorilerini oluşturma ve sıralama.
    - **Masa Yönetimi:** Masaları oluşturma ve QR kod için ID atama.
    - **Garson Çağrıları:** Gelen çağrıları listeleme.

### 4. Müşteri Arayüzü (QR Menü)
- [x] **Menü Görüntüleme:** Kategorilere ayrılmış modern ürün listesi.
- [x] **Sepet Mantığı:** Ürünleri sepete ekleme, adet güncelleme.
- [x] **Garson Çağırma:** Masa üzerinden garson çağırma butonu.

---

## 🚀 Yapılacaklar (Roadmap)

### Phase 3: Gerçek Zamanlı Deneyim ve Sipariş Akışı (Öncelikli)
Şu anki en kritik eksiklik, siparişlerin anlık olarak admin paneline düşmesi ve durum yönetimidir.
- [ ] **Sipariş Yönetimi (Admin):**
    - Siparişlerin "Bekliyor" -> "Hazırlanıyor" -> "Tamamlandı" durum geçişlerinin yapılması.
    - Yeni sipariş geldiğinde admin panelinde sesli veya görsel bildirim (Socket.io entegrasyonunun iyileştirilmesi).
- [ ] **Sipariş Takibi (Müşteri):**
    - Müşterinin verdiği siparişin durumunu (Hazırlanıyor vb.) ekranında canlı izleyebilmesi.
- [ ] **Masa Durumu:**
    - Masanın dolu/boş durumunun sipariş açıldığında otomatik güncellenmesi.

### Phase 4: QR Kod ve Pazarlama
- [ ] **QR Kod Üretici (Generator):**
    - Admin panelinde her masa için özel QR kod (PDF veya resim) oluşturup indirme butonu.
    - QR kod tasarımına kafe logosunun ve masa numarasının otomatik eklenmesi.
- [ ] **Stok Yönetimi:**
    - Ürün satıldıkça stoktan düşmesi ve stok bitince menüde "Tükendi" yazması.

### Phase 5: Ödeme ve Finans
- [ ] **Ödeme Entegrasyonu:**
    - Basit "Nakit/Kredi Kartı (Masada)" seçeneğinin ötesinde, Iyzico veya Stripe gibi sanal POS entegrasyonu.
- [ ] **Raporlama:**
    - Günlük/Haftalık ciro raporlarının grafiklerle (Chart.js/Recharts) görselleştirilmesi.
    - En çok satan ürünler analizi.

### Phase 6: Optimizasyon ve Canlıya Geçiş
- [ ] **Deployment:**
    - Backend'in bir sunucuya (VPS/DigitalOcean) Docker ile kurulması.
    - Frontend'in Vercel'e deploy edilmesi.
    - Domain ve SSL ayarları.
- [ ] **PWA (Progressive Web App):**
    - Müşterilerin menüyü uygulama gibi ana ekranlarına ekleyebilmesi.

---

## 💡 Gelecek Vizyonu ve Fikir Havuzu (Phase 7+)

### 1. Etkileşim ve Müşteri Deneyimi (Interactive)
- [ ] **🤝 Gerçek Zamanlı "Ortak Sipariş" (Live Shared Cart):**
    - Masadaki herkesin kendi telefonundan aynı sepete ürün ekleyebilmesi (WebSocket).
    - Canlı senkronizasyon ve "Hesabı Bölüş" özelliği.
- [ ] **🧠 AI Destekli "Akıllı Sommelier / Eşlikçi":**
    - Ana yemek seçimine göre yapay zeka destekli içecek/yan ürün önerisi (Upselling).
- [ ] **🎰 Oyunlaştırılmış Sadakat Sistemi (Gamification):**
    - Ödeme sonrası "Çarkıfelek" veya "Kazı Kazan" ile ödül/indirim kazanma şansı.
- [ ] **🕒 Dinamik Menü ve "Happy Hour":**
    - Saate göre menü temasının ve fiyatların otomatik değişmesi (Örn: Sabah kahvaltı, Akşam Happy Hour).

### 2. İşletme ve Operasyonel Derinlik
- [ ] **🌡️ Mutfak Performans Ekranı (KDS):**
    - Mutfak için sipariş ekranı ve hazırlama süresi analizi.
- [ ] **⭐ Yorum ve Değerlendirme Sistemi:**
    - Müşterilerin ürünlere/kafeye puan verip yorum yapabilmesi ve admin onayı.
- [ ] **📅 Rezervasyon Modülü:**
    - Tarih/saat bazlı masa rezervasyonu ve takvim yönetimi.
- [ ] **🧾 Gider Takibi (Basit Muhasebe):**
    - İşletme giderlerinin (kira, fatura, hammadde) sisteme girilmesi ve kar/zarar raporu.
- [ ] **📦 Stok/Envanter Takibi (Detaylı):**
    - Reçete bazlı stok düşümü (Örn: Hamburger satılınca kıyma ve ekmekten düşmesi).
- [ ] **🏢 Vale & Araç Çağırma Sistemi:**
    - Müşterinin tek tuşla aracını çağırması ve valeye bildirim gitmesi.
- [ ] **🚚 Akıllı Tedarik Zinciri (B2B):**
    - Kritik stok seviyesinde tedarikçiye otomatik sipariş taslağı oluşturma.
- [ ] **🏆 Garson Ligi (Personel Gamification):**
    - Personel performans takibi ve "Ayın Elemanı" panosu.

### 3. Pazarlama ve Genişleme
- [ ] **🎟️ Kampanya ve İndirim Kuponları:**
    - "YAZ20" gibi indirim kodları ve "Alana Bedava" kampanyaları.
- [ ] **🌍 Çoklu Dil Desteği (Localization):**
    - Menünün İngilizce, Arapça, Rusça vb. dillerde görüntülenmesi.
- [ ] **🎵 Jukebox / DJ Sensin Modu:**
    - Müşterilerin çalan müziğe oy vermesi veya istek parça göndermesi.
- [ ] **💬 Masalar Arası Sosyal Mod:**
    - Anonim mesajlaşma veya ikram gönderme özelliği.
- [ ] **📱 AR (Artırılmış Gerçeklik) Menü:**
    - Ürünlerin 3D modellerinin masada görüntülenmesi.
- [ ] **🥗 Akıllı Diyet Asistanı:**
    - Glutensiz, Vegan vb. filtrelere göre kişiselleştirilmiş menü.
- [ ] **💸 Alman Usulü 2.0:**
    - Sürükle-bırak yöntemiyle gelişmiş hesap bölüşümü.

### 4. Sosyal Sorumluluk ve VIP
- [ ] **🌟 Beacon ile VIP Tanıma:**
    - Müdavim müşteri mekana girdiğinde yöneticiye bildirim gitmesi.
- [ ] **💳 Dijital Bahşiş (Cashless Tipping):**
    - Kredi kartı ile garsona doğrudan bahşiş bırakma.
- [ ] **🍞 Askıda Yemek / İyilik Modülü:**
    - Müşterilerin "Askıda Kahve" veya yemek bırakabilmesi.

### 5. Teknoloji ve Fütüristik Deneyim
- [ ] **📈 Borsa Bar Konsepti (Dinamik Fiyatlandırma):**
    - "Borsa Modu" ile çok satılanın fiyatının artıp, az satılanın düştüğü dinamik sistem.
- [ ] **🤖 Self-Service Kiosk Modu:**
    - Sistemin tablet/kiosk modunda kasiyersiz sipariş noktası olarak çalışması.
- [ ] **🍎 AI Kalori & Besin Analizi:**
    - Tabağın fotoğrafı veya menü seçimi ile kalori/protein değerlerinin hesaplanıp sağlık uygulamalarına (Apple Health/Google Fit) gönderilmesi.

### 6. Sürdürülebilirlik (Sustainability)
- [ ] **♻️ Atık Takibi (Waste Management):**
    - Mutfak atıklarının takibi ve israf azaltma raporları.

---

## 🚧 WIP (Work In Progress) Sayfası Özellikleri
Bu özellikler, kullanıcıların geliştirme sürecine dahil olmasını sağlar:
- [ ] **🗳️ Özellik Oylama (Feature Voting):** Kullanıcıların hangi özelliğin önce gelmesini istediklerini oylaması.
- [ ] **🚧 Canlı İlerleme Çubukları:** Özelliklerin geliştirilme durumunun (örn: %60) gösterilmesi.
- [ ] **🔔 "Gelince Haber Ver" Butonu:** Özellik canlıya alındığında ilgili kullanıcılara bildirim gönderilmesi.





🥗 Diyet ve Alerjen Tercihleri (En Önemli):

- Kullanıcılar "Vejetaryen" , "Glütensiz" , "Laktozsuz" veya "Acı Sevmem" gibi tercihlerini profilinden işaretleyebilir.
- Bu tercihler menü sayfasında otomatik filtreleme yapmak veya ürün detaylarında uyarı göstermek için kullanılır.

🔔 Bildirim Ayarları:

- Sipariş durumu, kampanyalar veya özel teklifler için bildirim tercihlerini yönetme alanı.

### 2. ❤️ Favorilerim (İstek Listesi)
Müşteriler her zaman sipariş vermese bile menüyü incelerken beğendiklerini kaydetmek ister.

- Özellik: Ürün kartlarına "Kalp" ikonu eklenmesi ve profilde "Favorilerim" sekmesi.
- Fayda: Müşterinin bir sonraki ziyaretinde karar verme süresini kısaltır.


### 3. 🎂 Özel Günler (Doğum Günü)
Müşteri sadakati (CRM) için en değerli verilerden biridir.

- Özellik: Profilde "Doğum Tarihi" alanı.
- Kullanım: "Doğum gününüzü girin, o gün tatlınız bizden olsun" gibi bir teşvikle veri toplanır. Sistem o gün otomatik bildirim veya indirim tanımlar.


### 4. 🎟️ Kuponlarım ve Kampanyalar
- Özellik: Müşteriye özel tanımlanmış indirim kodlarının veya "Kahve Kartı" (10 kahve al 1 bedava) gibi dijital damga kartlarının görüntülendiği alan.


### 5. 🔁 "Aynısını Getir" (Hızlı Sipariş)
- Özellik: Sipariş geçmişinde, önceki bir siparişin yanında "Tekrarla" butonu. Sepeti o siparişin içeriğiyle otomatik doldurur.


### 6. 🔔 İletişim Tercihleri
- Özellik: SMS, E-posta veya Bildirim almak isteyip istemediğini seçebileceği ayarlar. KVKK uyumu için de önemlidir.

###  Oyunlaştırma (Gamification) & Rozetler
Sadece puan toplamak yerine, kullanıcı davranışlarını ödüllendiren görsel rozetler.

- Örnekler:
  - ☕ Kahve Gurmesi: 5 farklı kahve deneyen.
  - 🌙 Gece Kuşu: Akşam 20:00'den sonra 3 kez sipariş veren.
  - 🍰 Tatlı Canavarı: 5 tatlı siparişi veren.
  - 🗓️ Müdavim: Aynı ay içinde 10 kez gelen.
- Fayda: Kullanıcıları farklı ürünleri denemeye ve daha sık gelmeye teşvik eder. Profilde renkli ikonlar olarak durur.

###  Arkadaşına Ismarla (Hediyeleşme)
- Özellik: Kullanıcı, menüden bir ürünü seçip "Hediye Et" diyerek arkadaşının telefon numarasını girer. Arkadaşına SMS ile bir kod gider ve gelip o ürünü ücretsiz alabilir.
- Fayda: Yeni müşteri kazanımı sağlar (Viral büyüme).


### 👥 "Hesabı Bölüş" (Split Bill) Grubu
- Özellik: Masadaki diğer kullanıcıları QR ile bir "Masa Grubu"na ekleme ve sipariş sonunda hesabı kişi başı veya ürün bazlı bölüştürüp ayrı ayrı ödeme (entegrasyon destekliyorsa) imkanı.
### 📝 Kişisel Tadım Notları
- Özellik: Kullanıcıların sipariş ettikleri ürünlerin altına sadece kendilerinin görebileceği notlar alması.
- Örnek: "Bu kahveyi az şekerli daha çok sevdim" veya "Acısı çok fazlaydı, bir dahakine dikkat."
### 📅 Rezervasyon Yönetimi
- Özellik: "Rezervasyonlarım" sekmesi. Geçmiş ve gelecek masa rezervasyonlarını görüntüleme, iptal etme veya yeni rezervasyon oluşturma.
### ♿ Erişilebilirlik Tercihleri
- Özellik: Profil bazlı arayüz ayarları.
  - Büyük Metin Modu
  - Yüksek Kontrast
  - Sadece Resimli Menü / Sadece Yazılı Menü tercihi.



### 1. 🎵 Mekan DJ'i (Jukebox)
Müşterilerin mekanda çalan müziğe müdahale edebilmesi.

- Özellik: Profilde "Müzik" sekmesi. Şu an çalan şarkıyı görme ve listeden sıradaki şarkı için oy kullanma veya istek parça gönderme.
- Kısıt: Sadece Gold/Platinum üyeler şarkı isteyebilir.
### 2. 🚗 Vale / Taksi Çağır
Premium hizmet veren mekanlar için.

- Özellik: "Araç İşlemleri" butonu.
- Vale: Arabasını valeye veren müşteri, kalkmadan 10dk önce "Arabamı Hazırla" butonuna basar.
- Taksi: Tek tuşla mekanın kapısına taksi çağırma entegrasyonu.
### 3. 📅 Etkinlik Takvimi & Rezervasyon
Mekanda maç yayını, canlı müzik veya workshop varsa.

- Özellik: Profilde "Yaklaşan Etkinliklerim" alanı. Etkinliklere "Katılacağım" diyerek yer ayırtma ve hatırlatıcı alma.
### 4. 🌱 Sürdürülebilirlik / Karbon Ayak İzi
Çevre bilinci yüksek kitleler için.

- Özellik: "Kağıt fiş/fatura istemiyorum, dijital yeterli" seçeneği (Varsayılan yapılabilir).
- Detay: Siparişlerin karbon ayak izini gösterme veya "Bugün 2 ağaç kurtardınız" gibi motive edici mesajlar.
### 5. 👨‍👩‍👧‍👦 Aile Modu (Ebeveyn Kontrolü)
- Özellik: Çocuğun tabletiyle sipariş vermesini kısıtlayan veya sadece "Çocuk Menüsü"nü görmesini sağlayan bir "Çocuk Kilidi" modu.
### 6. 💼 İş Modu (Expense Report)
- Özellik: İş yemekleri için, ay sonunda seçili siparişleri tek bir PDF raporu/ekstresi olarak e-posta atma özelliği. Muhasebe departmanına iletmek için hayat kurtarır.
### 7. 🔮 Kahve Falı (Eğlence)
Türk kahvesi kültürüne özel.

- Özellik: Kahve içtikten sonra fincanın fotoğrafını yükleme ve yapay zeka (veya rastgele) ile üretilmiş eğlenceli bir yorum alma. Profilde "Fallarım" geçmişi.