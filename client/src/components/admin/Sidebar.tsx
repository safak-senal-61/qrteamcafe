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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportIssueDialog } from './ReportIssueDialog';

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
    title: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Initialize state from localStorage if available to prevent flickering
  const [cafeData, setCafeData] = useState<any>(() => {
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

    if (cafeData.isSubscriptionActive) {
      return (
         <div className="mx-2 px-3 py-2 mb-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
           <div className="flex items-center gap-2 mb-1">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-xs font-semibold text-green-700 dark:text-green-400">Pro Paket Aktif</span>
           </div>
           {cafeData.subscriptionEndsAt && (
              <p className="text-[10px] text-green-600/80 dark:text-green-500/80">
                Bitiş: {new Date(cafeData.subscriptionEndsAt).toLocaleDateString('tr-TR')}
              </p>
           )}
         </div>
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
            <div className={cn(
            "mx-2 px-3 py-2 mb-2 rounded-lg border",
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
        );
    }
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r w-64 p-4">
      <div className="flex flex-col px-2 py-4 mb-6">
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
              <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                <Coffee className="h-6 w-6" />
              </div>
            )}
          </div>
          <span className="font-bold text-xl tracking-tight truncate" suppressHydrationWarning>{cafeData.name}</span>
        </div>
        <div className="pl-[52px] -mt-1">
            <span className="text-[10px] font-bold text-muted-foreground/70 tracking-wider uppercase">powered by qrcafeteam</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
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

      <div className="mt-auto pt-4 border-t space-y-2">
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
