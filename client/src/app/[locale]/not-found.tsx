'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg mb-8"
      >
        <LottieAnimation
          url="https://lottie.host/92a8e483-4903-4c9c-8597-9c988c575003/E5677943r3.json"
          width="100%"
          height={400}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-4xl md:text-6xl font-bold text-foreground mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
      >
        {t('title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-lg text-muted-foreground max-w-md mb-8"
      >
        {t('description')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Link href="/">
          <Button size="lg" className="group">
            <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            {t('homeButton')}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
