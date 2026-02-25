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
import ConsoleWarning from '@/components/ConsoleWarning';

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
  let hideConsoleLogs = false;

  try {
    const res = await fetch(`${API_URL}/system-status`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      isMaintenance = data.maintenanceMode;
      hideConsoleLogs = data.hideConsoleLogs === true || data.hideConsoleLogs === 'true';
    }
  } catch (error: unknown) {
    // Backend kapalıysa veya ulaşılamıyorsa sadece bilgi ver, hata basma
    // Node.js fetch hataları bazen AggregateError içinde gelebilir veya doğrudan TypeError olabilir
    const err = error as { code?: string; cause?: { code?: string }; message?: string };
    const isConnectionError = 
      (err?.code === 'ECONNREFUSED') || 
      (err?.cause?.code === 'ECONNREFUSED') ||
      (err?.message?.includes('fetch failed'));

    if (isConnectionError) {
       // Sadece geliştirme ortamında veya explicit debug modunda logla
       if (process.env.NODE_ENV === 'development') {
         // console.log('Backend not reachable - Maintenance check skipped');
       }
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
        {hideConsoleLogs && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var noop = function(){};
                    var originalLog = console.log;
                    console.log = function() {
                      var args = Array.from(arguments);
                      if (args.length > 0 && typeof args[0] === 'string' && (
                          args[0].indexOf('%cDUR!') !== -1 ||
                          args[0].indexOf('geliştiriciler için tasarlanmış') !== -1 ||
                          args[0].indexOf('qrders.com.tr/guvenlik') !== -1
                      )) {
                          originalLog.apply(console, args);
                          return;
                      }
                    };
                    console.warn = noop;
                    console.error = noop;
                    console.info = noop;
                    console.debug = noop;
                    console.clear();
                    
                    var titleStyle = [
                      'color: red',
                      'font-size: 60px',
                      'font-weight: bold',
                      'text-shadow: 2px 2px 0px black',
                      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    ].join(';');

                    var bodyStyle = [
                      'font-size: 18px',
                      'color: #333',
                      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      'line-height: 1.5'
                    ].join(';');

                    var linkStyle = [
                      'font-size: 16px',
                      'color: #0095f6',
                      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      'text-decoration: underline',
                      'cursor: pointer'
                    ].join(';');

                    originalLog.call(console, '%cDUR!', titleStyle);
                    
                    originalLog.call(
                      console,
                      '%cBu, geliştiriciler için tasarlanmış bir tarayıcı özelliğidir. Biri sana bir qrders özelliğini etkinleştirmek veya birinin hesabını ele geçirmek için bir şeyi kopyalayıp buraya yapıştırmanı söylediyse bu bir dolandırıcılık girişimidir ve bunu yapmanı söyleyen kişi sen bunu yaptığında senin qrders hesabına erişebilecektir.',
                      bodyStyle
                    );

                    originalLog.call(
                      console,
                      '%cDaha fazla bilgi için https://qrders.com.tr/guvenlik adresine göz at.',
                      linkStyle
                    );
                  } catch(e) {}
                })();
              `
            }}
          />
        )}
        <NextIntlClientProvider messages={messages}>
          <ConsoleWarning shouldHideLogs={hideConsoleLogs} />
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