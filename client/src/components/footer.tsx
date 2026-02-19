import { Link } from '@/navigation';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const nav = useTranslations('Navigation');

  return (
    <footer className="border-t bg-white text-slate-900 border-slate-200 relative z-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-amber-100 p-2 rounded-lg border border-amber-200">
                <Image src="/logo/logo.svg" alt="QrDers Logo" width={40} height={40} className="h-10 w-10" />
              </div>
              <span className="font-bold text-2xl text-slate-900">qrders</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm font-medium">
              {t('description')}
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">{t('product')}</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/features" className="hover:text-amber-600 transition-colors font-medium">{nav('features')}</Link></li>
              <li><Link href="/pricing" className="hover:text-amber-600 transition-colors font-medium">{nav('pricing')}</Link></li>
              <li><Link href="/roadmap" className="hover:text-amber-600 transition-colors font-medium">{nav('roadmap')}</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">{t('company')}</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-amber-600 transition-colors font-medium">{nav('home')}</Link></li>
              <li><Link href="/about" className="hover:text-amber-600 transition-colors font-medium">{nav('about')}</Link></li>
              <li><Link href="/contact" className="hover:text-amber-600 transition-colors font-medium">{nav('contact')}</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">{t('legal')}</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/privacy" className="hover:text-amber-600 transition-colors font-medium">{nav('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-amber-600 transition-colors font-medium">{nav('terms')}</Link></li>
              <li><Link href="/distance-sales-agreement" className="hover:text-amber-600 transition-colors font-medium">{nav('distanceSales')}</Link></li>
              <li><Link href="/return-policy" className="hover:text-amber-600 transition-colors font-medium">{nav('returnPolicy')}</Link></li>
              <li><Link href="/kvkk" className="hover:text-amber-600 transition-colors font-medium">{nav('kvkk')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">
            {t('rights')}
          </p>
          <div className="flex gap-4">
            <Link href="#" aria-label="Facebook" className="text-slate-400 hover:text-amber-600 transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="Twitter" className="text-slate-400 hover:text-amber-600 transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="Instagram" className="text-slate-400 hover:text-amber-600 transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="LinkedIn" className="text-slate-400 hover:text-amber-600 transition-colors">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
