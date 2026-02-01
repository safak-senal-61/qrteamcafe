'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from '@/navigation';
import { Sidebar } from '@/components/admin/Sidebar';
import { Loader2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PendingOrdersWidget } from '@/components/admin/PendingOrdersWidget';
import { WaiterCallWidget } from '@/components/admin/WaiterCallWidget';
import { API_URL } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const isAuthPage = pathname.includes('/admin/login') || pathname.includes('/admin/register');
  const isSuperAdmin = pathname.startsWith('/admin/super');

  const applyTheme = useCallback((cafe: { themeConfig?: string; brandColor?: string }) => {
    if (cafe?.themeConfig) {
      try {
        const config = JSON.parse(cafe.themeConfig);
        if (config.theme === 'bordo-gold') {
          document.documentElement.setAttribute('data-theme', 'bordo-gold');
          document.documentElement.style.removeProperty('--primary');
          document.documentElement.style.removeProperty('--ring');
          return;
        }
      } catch (e) {
        // Silent fail for theme parse
      }
    }
    
    // Default or Custom handling
    document.documentElement.removeAttribute('data-theme');
    if (cafe?.brandColor) {
      document.documentElement.style.setProperty('--primary', cafe.brandColor);
      document.documentElement.style.setProperty('--ring', cafe.brandColor);
    }
  }, []);

  const fetchTheme = useCallback(async () => {
    // Skip if on auth pages or super admin
    if (isAuthPage || isSuperAdmin) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      
      if (user.cafeId && API_URL) {
        const res = await fetch(`${API_URL}/cafes/${user.cafeId}`);
        if (res.ok) {
          const cafe = await res.json();
          applyTheme(cafe);

          // Subscription Check (Skip for Super Admin)
          if (user.role !== 'SUPER_ADMIN') {
            const now = new Date();
            const trialEndsAt = cafe.trialEndsAt ? new Date(cafe.trialEndsAt) : null;
            const subscriptionEndsAt = cafe.subscriptionEndsAt ? new Date(cafe.subscriptionEndsAt) : null;
            
            const isTrialActive = trialEndsAt && trialEndsAt > now;
            const isSubscriptionActive = cafe.isSubscriptionActive && subscriptionEndsAt && subscriptionEndsAt > now;

            if (!isTrialActive && !isSubscriptionActive) {
               // Subscription expired
               router.replace('/pricing');
            }
          }
        }
      }
    } catch (e) {
      // Ignore network errors for theme fetching to prevent console spam
      if (process.env.NODE_ENV === 'development') {
        console.warn('Theme fetch failed (likely server down or network issue):', e);
      }
    }
  }, [applyTheme, router, isAuthPage, isSuperAdmin]);

  useEffect(() => {
    if (isAuthPage) return;
    fetchTheme();
    
    const handleUpdate = () => fetchTheme();
    window.addEventListener('cafe-info-updated', handleUpdate);
    return () => window.removeEventListener('cafe-info-updated', handleUpdate);
  }, [isAuthPage, fetchTheme]);

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
  }, [isAuthPage, isSuperAdmin, router]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (isAuthPage || isSuperAdmin) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const userData = await res.json();
          const cafe = userData.cafe;
          if (cafe) {
             const now = new Date();
             const trialEnds = cafe.trialEndsAt ? new Date(cafe.trialEndsAt) : null;
             const subEnds = cafe.subscriptionEndsAt ? new Date(cafe.subscriptionEndsAt) : null;
             
             // Check if trial is active
             const isTrialActive = trialEnds && trialEnds > now;
             
             // Check if subscription is active
             const isSubActive = cafe.isSubscriptionActive && subEnds && subEnds > now;
             
             if (!isTrialActive && !isSubActive) {
               console.log('Subscription expired, redirecting to pricing...');
               router.push('/pricing');
             }
          }
        }
      } catch (e) {
        console.error('Subscription check failed', e);
      }
    };

    checkSubscription();
  }, [isAuthPage, isSuperAdmin, router]);

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
      <div className="hidden md:flex w-[22rem] shrink-0">
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
