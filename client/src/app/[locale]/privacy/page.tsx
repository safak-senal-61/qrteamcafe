'use client';

import { useTranslations } from 'next-intl';
import { motion, Variants } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Server, UserCheck, Bell, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from '@/navigation';

export default function PrivacyPage() {
  const t = useTranslations('PrivacyPage');

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

  const renderListItem = (key: string) => {
    const text = t(key);
    const parts = text.split(':');
    if (parts.length > 1) {
      return (
        <li>
          <strong>{parts[0]}:</strong>{parts.slice(1).join(':')}
        </li>
      );
    }
    return <li>{text}</li>;
  };

  const sections = [
    {
      icon: <UserCheck className="h-6 w-6 text-primary" />,
      title: t('sections.1.title'),
      content: (
        <div className="space-y-4">
          <p>{t('sections.1.content')}</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>{renderListItem(`sections.1.list.${i}`)}</div>
            ))}
          </ul>
        </div>
      )
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: t('sections.2.title'),
      content: (
        <div className="space-y-4">
          <p>{t('sections.2.content')}</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>{renderListItem(`sections.2.list.${i}`)}</div>
            ))}
          </ul>
        </div>
      )
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: t('sections.3.title'),
      content: (
        <div className="space-y-4">
          <p>{t('sections.3.content')}</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>{renderListItem(`sections.3.list.${i}`)}</div>
            ))}
          </ul>
        </div>
      )
    },
    {
      icon: <Server className="h-6 w-6 text-primary" />,
      title: t('sections.4.title'),
      content: (
        <div className="space-y-4">
          <p>{t('sections.4.content')}</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>{renderListItem(`sections.4.list.${i}`)}</div>
            ))}
          </ul>
        </div>
      )
    },
    {
      icon: <Eye className="h-6 w-6 text-primary" />,
      title: t('sections.5.title'),
      content: (
        <div className="space-y-4">
          <p>{t('sections.5.content')}</p>
        </div>
      )
    },
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: t('sections.6.title'),
      content: (
        <div className="space-y-4">
          <p>{t('sections.6.content')}</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>{renderListItem(`sections.6.list.${i}`)}</div>
            ))}
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <motion.div variants={itemVariants} className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
            >
              {t('title')}
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-muted-foreground">
              {t('subtitle')}
            </motion.p>
            <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
              <Bell className="h-4 w-4" />
              <span>{t('lastUpdated')}</span>
            </motion.div>
          </div>

          <motion.div variants={itemVariants}>
            <Separator className="my-8" />
          </motion.div>

          {/* Intro Text */}
          <motion.div variants={itemVariants} className="prose prose-lg dark:prose-invert mx-auto text-center max-w-3xl mb-12">
            <p className="lead">
              {t('intro')}
            </p>
          </motion.div>

          {/* Sections Grid */}
          <div className="grid gap-8 md:grid-cols-1">
            {sections.map((section, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="p-2 bg-secondary rounded-lg">
                      {section.icon}
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base leading-relaxed">
                      {section.content}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div variants={itemVariants} className="mt-16">
            <Card className="bg-primary/5 border-none">
              <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-bold">{t('contact.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('contact.description')}
                  </p>
                </div>
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/contact">
                    <Mail className="h-4 w-4" />
                    {t('contact.button')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
