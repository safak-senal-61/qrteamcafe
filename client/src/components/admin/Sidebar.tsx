import { Link, usePathname, useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  LayoutDashboard,
  UtensilsCrossed,
  List,
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
    title: 'İstatistikler',
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
  const [cafeData, setCafeData] = useState(() => {
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
            logoUrl: data.logoUrl || ''
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r w-64 p-4">
      <div className="flex flex-col px-2 py-4 mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border"
            suppressHydrationWarning
          >
            {mounted && cafeData.logoUrl ? (
              <img 
                src={cafeData.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'; // Hide broken image
                }}
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

      <div className="mt-auto pt-4 border-t">
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
