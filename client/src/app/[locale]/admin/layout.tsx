'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/navigation';
import { Sidebar } from '@/components/admin/Sidebar';
import { Loader2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PendingOrdersWidget } from '@/components/admin/PendingOrdersWidget';
import { WaiterCallWidget } from '@/components/admin/WaiterCallWidget';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register';
  const isSuperAdmin = pathname.startsWith('/admin/super');

  useEffect(() => {
    if (isAuthPage || isSuperAdmin) {
      return;
    }

    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setTimeout(() => router.push('/admin/login'), 100);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'CAFE_ADMIN') {
          console.warn('Unauthorized role:', user.role);
          setTimeout(() => router.push('/admin/login'), 100);
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('user');
        setTimeout(() => router.push('/admin/login'), 100);
      }
    };

    checkAuth();
  }, [pathname, isAuthPage, isSuperAdmin, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setTimeout(() => setIsMobileOpen(false), 0);
  }, [pathname]);

  if (isAuthPage || isSuperAdmin) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary/20">
      <PendingOrdersWidget />
      <WaiterCallWidget />
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center p-4 bg-card border-b">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-lg">Cafe Admin</span>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
