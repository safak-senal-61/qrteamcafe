'use client';

import { motion, Variants } from 'framer-motion';
import { Blocks, Database, Server, CreditCard, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function IntegrationsPage() {
  const t = useTranslations('IntegrationsPage');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const integrations = [
    {
      category: t('categories.pos'),
      icon: <Server className="h-6 w-6" />,
      items: t.raw('items.pos') as string[]
    },
    {
      category: t('categories.payment'),
      icon: <CreditCard className="h-6 w-6" />,
      items: t.raw('items.payment') as string[]
    },
    {
      category: t('categories.delivery'),
      icon: <ShoppingCart className="h-6 w-6" />,
      items: t.raw('items.delivery') as string[]
    },
    {
      category: t('categories.accounting'),
      icon: <Database className="h-6 w-6" />,
      items: t.raw('items.accounting') as string[]
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-16"
        >
          <div className="text-center space-y-4">
            <motion.div variants={itemVariants} className="inline-block p-3 rounded-2xl bg-primary/10 text-primary mb-4">
              <Blocks className="h-8 w-8" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
              {t('title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                {t('titleHighlight')}
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('subtitle')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {integrations.map((group, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-secondary text-foreground">
                    {group.icon}
                  </div>
                  <h3 className="text-xl font-bold">{group.category}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}