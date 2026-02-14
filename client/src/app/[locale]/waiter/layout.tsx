'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WaiterSocketProvider } from '@/providers/WaiterSocketProvider';

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [waiter, setWaiter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Public sayfalar için kontrol yapma
    if (pathname.includes('/waiter/login') || pathname.includes('/waiter/register')) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      const token = localStorage.getItem('waiter-token');
      const waiterInfo = localStorage.getItem('waiter-info');

      if (!token || !waiterInfo) {
        router.push('/waiter/login');
        return;
      }

      try {
        // Verify token validity with a simple request
        await api.get('/waiters/me');
        setWaiter(JSON.parse(waiterInfo));
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('waiter-token');
        localStorage.removeItem('waiter-info');
        router.push('/waiter/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('waiter-token');
    localStorage.removeItem('waiter-info');
    router.push('/waiter/login');
  };

  // Public sayfalarda layout gösterme, direkt içeriği bas
  if (pathname.includes('/waiter/login') || pathname.includes('/waiter/register')) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <WaiterSocketProvider>
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="font-bold text-lg">
            Garson Paneli
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              {waiter?.cafeName}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Kullanıcı menüsü</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {waiter?.firstName} {waiter?.lastName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="container py-6 px-4">
        {children}
      </main>
    </div>
    </WaiterSocketProvider>
  );
}
