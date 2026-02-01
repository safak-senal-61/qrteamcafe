'use client';

import { Link, usePathname } from '@/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function BackToHomeButton() {
  const pathname = usePathname();
  const [backLink, setBackLink] = useState('/');

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'CAFE_ADMIN') {
           setBackLink('/admin/dashboard');
        } else if (user.role === 'SUPER_ADMIN') {
           setBackLink('/admin/super/dashboard');
        }
      } catch (e) {
        console.error('User parse error', e);
      }
    }
  }, []);

  // Don't show on home page
  if (pathname === '/') return null;

  // Don't show on admin or menu pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/menu') || pathname.startsWith('/super')) {
    return null;
  }

  return (
    <div className="absolute top-6 left-6 z-50">
      <Link href={backLink}>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 hover:scale-105 transition-all shadow-sm"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="h-6 w-6 text-foreground/80" />
        </Button>
      </Link>
    </div>
  );
}