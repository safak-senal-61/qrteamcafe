import { Link } from '@/navigation';
import { QrCode, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const nav = useTranslations('Navigation');

  return (
    <footer className="border-t bg-background/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-primary/10 p-2 rounded-lg">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl">QR Team Cafe</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t('description')}
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('product')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/features" className="hover:text-primary transition-colors">{nav('features')}</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">{nav('pricing')}</Link></li>
              <li><Link href="/integrations" className="hover:text-primary transition-colors">{nav('integrations')}</Link></li>
              <li><Link href="/roadmap" className="hover:text-primary transition-colors">{nav('roadmap')}</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">{nav('home')}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{nav('about')}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{nav('contact')}</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">{nav('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">{nav('terms')}</Link></li>
              <li><Link href="/kvkk" className="hover:text-primary transition-colors">{nav('kvkk')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t('rights')}
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
