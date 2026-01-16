import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QrCode, Utensils, Smartphone, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="#">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl transition-transform group-hover:scale-110 shadow-sm">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              QR Menu
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin/login">
              <Button variant="ghost" className="font-medium hover:bg-secondary/80">
                Admin Girişi
              </Button>
            </Link>
            <Link href="/menu/demo-cafe">
              <Button className="hidden sm:flex rounded-full shadow-md hover:shadow-lg transition-all">
                Menüyü Dene
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-secondary via-background to-background" />
          
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold text-primary bg-primary/5 shadow-sm mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                  Dijital Dönüşüm Başladı
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Kafe ve Restoranlar İçin <br className="hidden sm:inline" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
                    Akıllı QR Menü
                  </span>
                </h1>
                <p className="mx-auto max-w-[800px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                  Müşterilerinize modern, hızlı ve temassız bir sipariş deneyimi sunun. 
                  Uygulama indirmeden, sadece QR kodu okutarak menünüze erişsinler.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <Link href="/menu/demo-cafe">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                    Demo Menüyü İncele <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/admin/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full text-lg border-2 hover:bg-secondary/50 transition-all duration-300">
                    İşletme Hesabı Oluştur
                  </Button>
                </Link>
              </div>

              {/* Stats / Trust Indicators */}
              <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Hızlı Kurulum</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>7/24 Destek</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Güvenli Altyapı</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 bg-secondary/30 relative">
           <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Neden QR Menü?
              </h2>
              <p className="text-muted-foreground text-lg max-w-[700px] mx-auto">
                İşletmenizi dijital çağa taşıyacak özellikler ile tanışın.
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="group relative overflow-hidden rounded-3xl bg-background p-8 shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-foreground">Temassız Erişim</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Müşterileriniz uygulama indirmek zorunda kalmadan, sadece telefonlarının kamerasıyla QR kodu okutarak menünüze anında ulaşır.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-3xl bg-background p-8 shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-foreground">Kolay Sipariş</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Görsel zenginliği yüksek, kullanıcı dostu arayüz ile müşterileriniz ürünleri inceler, seçenekleri belirler ve kolayca sipariş verir.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-3xl bg-background p-8 shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-foreground">Dijital Yönetim</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Menü içeriklerini, fiyatları ve stok durumunu anlık olarak güncelleyin. Detaylı raporlar ile işletmenizin performansını takip edin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="relative rounded-[2.5rem] bg-primary overflow-hidden px-6 py-16 md:px-16 md:py-20 text-center shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary-foreground">
                  İşletmenizi Dijitalleştirin
                </h2>
                <p className="text-primary-foreground/90 text-lg md:text-xl max-w-[600px] mx-auto">
                  Hemen ücretsiz bir hesap oluşturun ve menünüzü dijital dünyaya taşıyın. İlk ay kullanım bizden!
                </p>
                <div className="pt-4">
                  <Link href="/admin/login">
                    <Button size="lg" variant="secondary" className="h-14 px-10 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      Hemen Başlayın
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl">QR Menu</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground font-medium">
              <Link href="#" className="hover:text-primary transition-colors">Hakkımızda</Link>
              <Link href="#" className="hover:text-primary transition-colors">Özellikler</Link>
              <Link href="#" className="hover:text-primary transition-colors">Fiyatlandırma</Link>
              <Link href="#" className="hover:text-primary transition-colors">İletişim</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 QR Team Cafe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
