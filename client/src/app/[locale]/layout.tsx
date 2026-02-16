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
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'qrders - QR Menü Sistemi',
    description: 'Modern QR Menü ve Sipariş Yönetim Sistemi',
    url: 'https://qrders.com.tr',
    siteName: 'qrders',
    locale: 'tr_TR',
    type: 'website',
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
    console.error('Failed to check system status:', error);
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