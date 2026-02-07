import { Link } from '@/navigation';
import { QrCode, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const nav = useTranslations('Navigation');

  return (
    <footer className="border-t bg-zinc-950 text-zinc-50 border-zinc-800 relative z-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-white/10 p-2 rounded-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white">qrders</span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm font-medium">
              {t('description')}
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg">{t('product')}</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/features" className="hover:text-white transition-colors font-medium">{nav('features')}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors font-medium">{nav('pricing')}</Link></li>
              <li><Link href="/integrations" className="hover:text-white transition-colors font-medium">{nav('integrations')}</Link></li>
              <li><Link href="/roadmap" className="hover:text-white transition-colors font-medium">{nav('roadmap')}</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg">{t('company')}</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/" className="hover:text-white transition-colors font-medium">{nav('home')}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors font-medium">{nav('about')}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors font-medium">{nav('contact')}</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors font-medium">{nav('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors font-medium">{nav('terms')}</Link></li>
              <li><Link href="/kvkk" className="hover:text-white transition-colors font-medium">{nav('kvkk')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500 font-medium">
            {t('rights')}
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
