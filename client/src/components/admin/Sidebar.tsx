import { Link, usePathname, useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Settings,
  LogOut,
  Coffee,
  TrendingUp,
  Bell,
  Receipt,
  MessageSquare,
  LayoutTemplate,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportIssueDialog } from './ReportIssueDialog';

interface CafeData {
  name: string;
  logoUrl: string;
  plan?: string;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  isSubscriptionActive?: boolean;
}

const menuItems = [
  {
    title: 'Panel',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Siparişler',
    href: '/admin/orders',
    icon: Receipt,
  },
  {
    title: 'Garson Çağrıları',
    href: '/admin/waiter-calls',
    icon: Bell,
  },
  {
    title: 'Ürünler',
    href: '/admin/products',
    icon: UtensilsCrossed,
  },
  {
    title: 'Değerlendirmeler',
    href: '/admin/reviews',
    icon: MessageSquare,
  },
  {
    title: 'Masalar & QR',
    href: '/admin/tables',
    icon: QrCode,
  },
  {
    title: 'Şablonlar',
    href: '/admin/templates',
    icon: LayoutTemplate,
  },
  {
    title: 'İstatistikler & Stoklar',
    href: '/admin/statistics',
    icon: TrendingUp,
  },
  {
    title: 'Personel',
    href: '/admin/staff',
    icon: Users,
  },
  {
    title: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Initialize state from localStorage if available to prevent flickering
  const [cafeData, setCafeData] = useState<CafeData>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cafe_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Ensure logoUrl is absolute
        if (parsed.logoUrl && !parsed.logoUrl.startsWith('http')) {
           parsed.logoUrl = `${API_URL}${parsed.logoUrl}`;
        }
        return parsed;
      }
    }
    return { name: '\u00A0', logoUrl: '' };
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    const fetchCafeInfo = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        if (!user.cafeId) return;

        const res = await fetch(`${API_URL}/cafes/${user.cafeId}`);
        if (res.ok) {
          const data = await res.json();
          const newData = {
            name: data.name || 'Cafe Admin',
            logoUrl: data.logoUrl || '',
            plan: data.plan,
            trialEndsAt: data.trialEndsAt,
            subscriptionEndsAt: data.subscriptionEndsAt,
            isSubscriptionActive: data.isSubscriptionActive
          };
          setCafeData(newData);
          // Cache the data
          localStorage.setItem('cafe_info', JSON.stringify(newData));
          
          // Update document title and favicon
          document.title = newData.name;
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = newData.logoUrl || '/favicon.ico';
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = newData.logoUrl || '/favicon.ico';
            document.head.appendChild(newLink);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cafe info:', error);
      }
    };

    fetchCafeInfo();
    
    // Listen for updates from settings page
    const handleCafeUpdate = () => fetchCafeInfo();
    window.addEventListener('cafe-info-updated', handleCafeUpdate);
    
    return () => {
      window.removeEventListener('cafe-info-updated', handleCafeUpdate);
    };
  }, []);

  const getSubscriptionStatus = () => {
    if (!mounted || (!cafeData.trialEndsAt && !cafeData.subscriptionEndsAt)) return null;

    const subscriptionEnd = cafeData.subscriptionEndsAt ? new Date(cafeData.subscriptionEndsAt) : null;
    const isSubscriptionValid = subscriptionEnd && subscriptionEnd > new Date();

    if (cafeData.isSubscriptionActive || isSubscriptionValid) {
      const isCancelled = !cafeData.isSubscriptionActive && isSubscriptionValid;
      
      return (
        <Link href="/admin/subscription" className="block mx-2 mb-2">
         <div className={cn(
           "px-3 py-2 rounded-lg border transition-colors cursor-pointer",
           isCancelled 
            ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            : "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-950/50"
         )}>
           <div className="flex items-center gap-2 mb-1">
             <div className={cn(
               "h-2 w-2 rounded-full animate-pulse",
               isCancelled ? "bg-slate-400" : "bg-green-500"
             )} />
             <span className={cn(
               "text-xs font-semibold",
               isCancelled ? "text-slate-700 dark:text-slate-400" : "text-green-700 dark:text-green-400"
             )}>
               {isCancelled ? 'Abonelik İptal' : 'Pro Paket Aktif'}
             </span>
           </div>
           {subscriptionEnd && (
              <p className={cn(
                "text-[10px]",
                isCancelled ? "text-slate-600/80 dark:text-slate-500/80" : "text-green-600/80 dark:text-green-500/80"
              )}>
                Bitiş: {subscriptionEnd.toLocaleDateString('tr-TR')}
              </p>
           )}
         </div>
        </Link>
      );
    }

    // Trial Mode
    if (cafeData.trialEndsAt) {
        const trialEnd = new Date(cafeData.trialEndsAt);
        const now = new Date();
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isExpired = diffDays <= 0;

        return (
            <Link href="/pricing" className="block mx-2 mb-2">
            <div className={cn(
            "px-3 py-2 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer",
            isExpired 
                ? "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" 
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900"
            )}>
            <div className="flex items-center justify-between mb-1">
                <span className={cn(
                "text-xs font-semibold",
                isExpired ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                )}>
                {isExpired ? 'Süre Doldu' : 'Deneme Sürümü'}
                </span>
            </div>
            {!isExpired && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-amber-600/80 dark:text-amber-500/80">
                    <span>Kalan Süre</span>
                    <span className="font-bold">{diffDays} Gün</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-amber-100 dark:bg-amber-900/50 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, (diffDays / 30) * 100)}%` }}
                    />
                    </div>
                </div>
            )}
            </div>
            </Link>
        );
    }
    
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r w-full p-4">
      <div className="flex flex-col px-6 py-6 mb-2">
        <div className="flex items-center gap-3">
          <div 
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border"
            suppressHydrationWarning
          >
            {mounted && cafeData.logoUrl ? (
              <Image 
                src={cafeData.logoUrl} 
                alt="Logo" 
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white relative">
                <Image src="/logo/logo.svg" alt="System Logo" fill className="object-contain p-0.5" />
              </div>
            )}
          </div>
          <span className="font-bold text-xl tracking-tight truncate" suppressHydrationWarning>{cafeData.name}</span>
        </div>
        <div className="pl-[52px] -mt-1">
            <span className="text-[10px] font-bold text-muted-foreground/70 tracking-wider uppercase whitespace-nowrap">powered by qrders</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 overflow-y-auto py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start h-12 text-base font-medium',
                  isActive
                    ? 'shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t space-y-2 px-4 pb-6 bg-card">
        {getSubscriptionStatus()}
        <ReportIssueDialog />
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}