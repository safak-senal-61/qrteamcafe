'use client';

import './globals.css';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-foreground font-sans">
      <div className="w-full max-w-lg mb-8">
        <LottieAnimation
          url="/animations/404.json"
          width="100%"
          height={400}
        />
      </div>

      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary">
        404
      </h1>

      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Aradığınız sayfa bulunamadı.
      </p>

      <Link href="/">
        <Button size="lg" className="group">
          <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
          Anasayfaya Dön
        </Button>
      </Link>
    </div>
  );
}
