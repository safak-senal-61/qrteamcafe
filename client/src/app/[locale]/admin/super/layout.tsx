'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/navigation';
import { Loader2 } from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isAuthPage = pathname === '/admin/super/login' || pathname === '/admin/super/register';

  useEffect(() => {
    if (isAuthPage) {
      setIsAuthorized(true);
      return;
    }

    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setTimeout(() => router.push('/admin/super/login'), 100);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'SUPER_ADMIN') {
          setTimeout(() => router.push('/admin/super/login'), 100);
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        localStorage.removeItem('user');
        setTimeout(() => router.push('/admin/super/login'), 100);
      }
    };

    checkAuth();
  }, [pathname, isAuthPage, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
