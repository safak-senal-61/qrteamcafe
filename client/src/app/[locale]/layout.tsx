import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../globals.css';
import { Toaster } from 'sonner';
import Footer from '@/components/footer';
import NetworkStatus from '@/components/NetworkStatus';
import BackToHomeButton from '@/components/BackToHomeButton';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import MaintenancePage from '@/components/MaintenancePage';
import { API_URL } from '@/lib/api';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://qrders.com.tr'),
  title: {
    default: 'qrders - QR Menü Sistemi',
    template: '%s | qrders'
  },
  description: 'Modern QR Menü ve Sipariş Yönetim Sistemi. Hızlı, kolay ve temassız sipariş deneyimi.',
  icons: {
    icon: [
      { url: '/favicons/icons/favicon.ico' },
      { url: '/favicons/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicons/icons/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicons/icons/favicon.ico',
    apple: [
      { url: '/favicons/icons/favicon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/favicons/icons/favicon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/favicons/icons/favicon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/favicons/icons/favicon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/favicons/icons/favicon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/favicons/icons/favicon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/favicons/icons/favicon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/favicons/icons/favicon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/favicons/icons/favicon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/favicons/icons/favicon-152x152.png' },
    ],
  },
  openGraph: {
    title: 'qrders - QR Menü Sistemi',
    description: 'Modern QR Menü ve Sipariş Yönetim Sistemi',
    url: 'https://qrders.com.tr',
    siteName: 'qrders',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/favicons/icons/favicon-310x310.png',
        width: 310,
        height: 310,
        alt: 'qrders Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'qrders - QR Menü Sistemi',
    description: 'Modern QR Menü ve Sipariş Yönetim Sistemi',
    images: ['/favicons/icons/favicon-310x310.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  console.log('--- LocaleLayout Rendered ---', locale);

  // Maintenance Check Start
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  let isMaintenance = false;

  try {
    const res = await fetch(`${API_URL}/system-status`, { next: { revalidate: 10 } });
    if (res.ok) {
      const data = await res.json();
      isMaintenance = data.maintenanceMode;
    }
  } catch (error) {
    // Backend kapalıysa veya ulaşılamıyorsa sadece bilgi ver, hata basma
    if (error instanceof TypeError && error.cause && (error.cause as any).code === 'ECONNREFUSED') {
       console.log('Backend not reachable - Maintenance check skipped');
    } else {
       console.error('Failed to check system status:', error);
    }
  }

  const isSuperAdminPath = pathname.includes('/admin/super');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  if (isMaintenance && !isSuperAdminPath) {
    return (
      <html lang={locale} dir={direction} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950`} suppressHydrationWarning>
           <MaintenancePage />
        </body>
      </html>
    );
  }
  // Maintenance Check End

  const messages = await getMessages();
  // const direction = locale === 'ar' ? 'rtl' : 'ltr'; // Removed duplicate declaration

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <NetworkStatus />
          <BackToHomeButton />
          {children}
          <Footer />
          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}