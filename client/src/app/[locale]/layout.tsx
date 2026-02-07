import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../globals.css';
import { Toaster } from 'sonner';
import Footer from '@/components/footer';
import NetworkStatus from '@/components/NetworkStatus';
import BackToHomeButton from '@/components/BackToHomeButton';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

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
  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
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