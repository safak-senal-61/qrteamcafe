'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QrCode, Utensils, Smartphone, CheckCircle2, Zap, LayoutDashboard, Users, BarChart3, Clock, Globe, Wallet, ChevronRight, Menu } from 'lucide-react';
import { LazyMotion, domAnimation, m, Variants } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const PanelGallery = dynamic(() => import('@/components/ui/panel-gallery'), { ssr: false });
const LottieAnimation = dynamic(() => import('@/components/ui/LottieAnimation'), { ssr: false });
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';

export default function Home() {
  const t = useTranslations('HomePage');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  const features = [
    {
      icon: <QrCode className="h-8 w-8" />,
      title: t('featuresList.contactless'),
      description: t('featuresList.contactlessDesc'),
      delay: 0,
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: t('featuresList.mobileOrder'),
      description: t('featuresList.mobileOrderDesc'),
      delay: 100,
    },
    {
      icon: <LayoutDashboard className="h-8 w-8" />,
      title: t('featuresList.dashboard'),
      description: t('featuresList.dashboardDesc'),
      delay: 200,
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: t('featuresList.reporting'),
      description: t('featuresList.reportingDesc'),
      delay: 300,
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: t('featuresList.dynamicPrice'),
      description: t('featuresList.dynamicPriceDesc'),
      delay: 400,
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: t('featuresList.loyalty'),
      description: t('featuresList.loyaltyDesc'),
      delay: 500,
    },
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      text: t('benefits.faster'),
    },
    {
      icon: <Wallet className="h-6 w-6 text-amber-500" />,
      text: t('benefits.increase'),
    },
    {
      icon: <Globe className="h-6 w-6 text-amber-500" />,
      text: t('benefits.savings'),
    },
  ];

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
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

  const floatVariants: Variants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatVariantsReverse: Variants = {
    animate: {
      y: [0, 15, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden text-slate-900">
      <LazyMotion features={domAnimation}>
      {/* Global Background */}
      <div className="fixed inset-0 z-0 bg-white" />

      {/* Header */}
      <m.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link className="flex items-center gap-3 group" href="#">
            <m.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-100 text-amber-500 p-2 rounded-2xl border border-slate-200"
            >
              <Image src="/logo/logo.svg" alt="QrDers Logo" width={64} height={64} className="h-14 w-14" />
            </m.div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              QrDers
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">{t('pricing')}</Link>
              <Link href="/roadmap" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">{t('roadmap')}</Link>
              <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">{t('contact')}</Link>
              <div className="text-slate-600 hover:text-slate-900 transition-colors">
                 <LanguageSwitcher />
              </div>
              <Link href="/admin/login">
                <Button variant="ghost" className="font-medium text-slate-700 hover:bg-slate-100 hover:text-amber-600 text-base relative overflow-hidden group transition-colors">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d">
                <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="rounded-full shadow-lg hover:shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white border-0">
                    <span className="flex items-center font-bold">{t('demo')} <ChevronRight className="ml-1 h-4 w-4 rtl:rotate-180" /></span>
                  </Button>
                </m.div>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t('menu') || 'Menu'} className="rounded-full text-slate-900 hover:bg-slate-100">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] border-l border-slate-200 p-0 bg-white">
                  <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b border-slate-200 bg-slate-50">
                      <SheetTitle className="text-left flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                          <Image src="/logo/logo.svg" alt="QrDers Logo" width={48} height={48} className="h-10 w-10" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">
                          QrDers
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col flex-1 p-6 gap-6 text-slate-900">
                      <nav className="flex flex-col gap-2">
                        <Link href="/pricing" onClick={() => {}} className="text-lg font-medium text-slate-600 hover:text-amber-600 transition-colors p-2 hover:bg-slate-50 rounded-lg">{t('pricing')}</Link>
                        <Link href="/roadmap" onClick={() => {}} className="text-lg font-medium text-slate-600 hover:text-amber-600 transition-colors p-2 hover:bg-slate-50 rounded-lg">{t('roadmap')}</Link>
                        <Link href="/contact" onClick={() => {}} className="text-lg font-medium text-slate-600 hover:text-amber-600 transition-colors p-2 hover:bg-slate-50 rounded-lg">{t('contact')}</Link>
                      </nav>
                      {/* Language Selection Section */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {t('language') || 'Dil Seçimi'}
                          </span>
                        </div>
                        <div className="flex justify-end">
                           <LanguageSwitcher />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 mt-auto mb-6">
                        <Link href="/admin/login" onClick={() => {}}>
                          <Button variant="outline" className="w-full justify-between h-14 text-base font-medium rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-amber-500/50 hover:text-amber-600 transition-all group">
                            <span className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-amber-500/10 transition-colors">
                                <Users className="h-5 w-5 text-slate-500 group-hover:text-amber-600 transition-colors" />
                              </div>
                              {t('login')}
                            </span>
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          </Button>
                        </Link>
                        
                        <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d" onClick={() => {}}>
                          <Button className="w-full justify-between h-14 text-base font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all group border-0">
                            <span className="flex items-center gap-3">
                              <div className="p-2 bg-white/20 rounded-lg">
                                <Utensils className="h-5 w-5 text-white" />
                              </div>
                              {t('demo')}
                            </span>
                            <ChevronRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </Button>
                        </Link>
                      </div>

                      {/* Footer Info */}
                      <div className="mt-auto pt-6 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-500">
                          &copy; {new Date().getFullYear()} qrders
                        </p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </m.header>
      
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden flex items-center justify-center min-h-[90vh]">
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-10 text-center max-w-5xl mx-auto">
              <div className="space-y-6">
                <div 
                  className="inline-flex items-center rounded-full border border-amber-400/30 px-6 py-2 text-sm font-semibold text-amber-600 bg-amber-50 shadow-lg backdrop-blur-md mb-6 hover:bg-amber-100 transition-colors cursor-default"
                >
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 mr-3 animate-pulse"></span>
                  {t('futureOfDining')}
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight text-slate-900 drop-shadow-sm">
                  <span>
                    {t('title')}
                  </span> <br className="hidden sm:inline" />
                  <span className="text-amber-500">
                    {t('innovation')}
                  </span>
                </h1>
                <p className="mx-auto max-w-[800px] text-slate-600 text-xl md:text-2xl leading-relaxed font-light">
                  {t('subtitle')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-4 sm:px-0">
                <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d" className="w-full sm:w-auto">
                  <div className="w-full sm:w-auto hover:scale-105 transition-transform duration-200">
                    <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 rounded-full text-base md:text-lg font-bold shadow-xl hover:shadow-amber-500/40 transition-all duration-300 bg-amber-600 hover:bg-amber-700 text-white border-0">
                      {t('demo')} <Utensils className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />
                    </Button>
                  </div>
                </Link>
                <Link href="/admin/login" className="w-full sm:w-auto">
                  <div className="w-full sm:w-auto hover:scale-105 transition-transform duration-200">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 rounded-full text-base md:text-lg font-bold border-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-300">
                      {t('getStarted')}
                    </Button>
                  </div>
                </Link>
              </div>
              
              {/* Stats / Trust Indicators */}
              <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 shadow-lg hover:border-amber-500/30 transition-all cursor-default"
                  >
                    <div className="mb-2 p-2 rounded-full bg-slate-50 shadow-inner">
                      {benefit.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 relative">
          <div className="container mx-auto px-4 md:px-6">
            <m.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center mb-20 space-y-4"
            >
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-slate-900">
                {t('whyqrders')}
              </h2>
              <p className="text-slate-600 text-xl max-w-[700px] mx-auto font-light">
                {t('whyqrdersDesc')}
              </p>
            </m.div>
            
            <m.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
            >
              {features.map((feature, index) => (
                <m.div 
                  key={index}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    y: -5
                  }}
                  className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-lg border border-slate-200 hover:border-amber-500/50 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:scale-150 duration-500" />
                  
                  <m.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-amber-600 border border-slate-200 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors"
                  >
                    {feature.icon}
                  </m.div>
                  
                  <h3 className="mb-4 text-2xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-lg group-hover:text-slate-700 transition-colors">
                    {feature.description}
                  </p>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* Modern Showcase Section */}
        <section className="w-full py-24 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <m.div
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="space-y-8"
              >
                <m.div 
                  whileHover={{ scale: 1.05 }}
                  className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 font-semibold text-sm mb-2"
                >
                  🚀 {t('innovation')}
                </m.div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
                  {t('notJustMenu')} <br />
                  <span className="text-amber-500">{t('fullOperation')}</span>
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  {t('operationDesc')}
                </p>
                
                <ul className="space-y-4">
                  {[
                    t('showcaseList.liveTracking'),
                    t('showcaseList.kds'),
                    t('showcaseList.waiterCall'),
                    t('showcaseList.multiLang')
                  ].map((item, i) => (
                    <m.li 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-lg font-medium text-slate-700"
                    >
                      <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      {item}
                    </m.li>
                  ))}
                </ul>

                <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-14 px-8 rounded-full text-lg mt-4 bg-slate-900 text-white hover:bg-slate-800 font-bold">
                    {t('discoverFeatures')}
                  </Button>
                </m.div>
              </m.div>

              <m.div
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative mt-12 md:mt-0"
              >
                {/* Decorative Elements */}
                <div className="hidden md:block absolute -inset-4 bg-amber-500/10 rounded-[2.5rem] blur-2xl animate-pulse" />
                <m.div 
                  whileHover={{ rotateY: 5, rotateX: 5 }}
                  style={{ perspective: 1000 }}
                  className="relative bg-white border border-slate-200 rounded-[2rem] p-4 md:p-6 shadow-2xl group mx-auto max-w-[90vw] md:max-w-none backdrop-blur-xl"
                >
                   {/* Lottie Animation for Dashboard */}
                   <div 
                      className="aspect-video rounded-xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative cursor-pointer hover:border-amber-500/50 transition-colors"
                      onClick={() => setIsGalleryOpen(true)}
                   >
                      <div className="absolute inset-0 flex items-center justify-center opacity-80">
                         <LottieAnimation 
                            url="https://assets9.lottiefiles.com/packages/lf20_5njp3vgg.json" 
                            width="120%" 
                            height="120%" 
                         />
                      </div>
                      <div className="text-center space-y-2 relative z-10 bg-white/90 p-3 md:p-4 rounded-xl backdrop-blur-md border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="h-10 w-10 md:h-12 md:w-12 mx-auto text-amber-500" />
                        <p className="text-slate-900 font-bold text-sm md:text-base">{t('dashboardPreview.title')}</p>
                        <p className="text-xs text-slate-500 font-medium">{t('dashboardPreview.clickToView')}</p>
                      </div>
                   </div>
                   
                   {/* Floating Cards - Adjusted for Mobile */}
                   <m.div 
                      variants={floatVariants}
                      animate="animate"
                      className="absolute -bottom-4 -left-4 md:-bottom-8 md:-left-8 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-slate-200 scale-90 md:scale-100 z-20"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                          <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-slate-500">{t('dashboardPreview.dailyRevenue')}</p>
                          <p className="font-bold text-base md:text-lg text-slate-900">₺12,450</p>
                        </div>
                      </div>
                   </m.div>

                   <m.div 
                      variants={floatVariantsReverse}
                      animate="animate"
                      className="absolute -top-4 -right-4 md:-top-8 md:-right-8 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-slate-200 scale-90 md:scale-100 z-20"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Users className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-slate-500">{t('dashboardPreview.activeTable')}</p>
                          <p className="font-bold text-base md:text-lg text-slate-900">24/30</p>
                        </div>
                      </div>
                   </m.div>
                </m.div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-24 md:py-32">
          <div className="container mx-auto px-4">
            <m.div 
              whileHover={{ scale: 1.02 }}
              className="relative rounded-[3rem] bg-white border border-slate-200 overflow-hidden px-6 py-20 md:px-20 md:py-24 text-center shadow-2xl"
            >
              {/* Animated Background Effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent animate-pulse" />
              </div>
              
              <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-slate-900 leading-tight">
                  {t('readyToMove')} <br />
                  <span className="text-amber-500">{t('readyToMoveHighlight')}</span>
                </h2>
                <p className="text-slate-600 text-xl md:text-2xl max-w-[700px] mx-auto font-light">
                  {t('readyToMoveDesc')}
                </p>
                <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/admin/login">
                    <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-16 px-12 rounded-full text-lg font-bold shadow-lg hover:shadow-amber-500/50 transition-all bg-amber-600 text-white hover:bg-amber-700 border-0">
                        {t('cta')}
                      </Button>
                    </m.div>
                  </Link>
                  <Link href="/contact">
                    <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="h-16 px-12 rounded-full text-lg font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors">
                        {t('contactUs')}
                      </Button>
                    </m.div>
                  </Link>
                </div>
                <p className="text-sm text-slate-400 pt-4">
                  {t('noCreditCard')}
                </p>
              </div>
            </m.div>
          </div>
        </section>
      </main>
      
      <PanelGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
      </LazyMotion>
    </div>
  );
}
