'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QrCode, Utensils, Smartphone, CheckCircle2, Zap, LayoutDashboard, Users, BarChart3, Clock, Globe, Wallet, ChevronRight, Menu } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import LottieAnimation from '@/components/ui/LottieAnimation';
import PanelGallery from '@/components/ui/panel-gallery';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';

export default function Home() {
  const t = useTranslations('HomePage');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

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
    <div className="flex flex-col min-h-screen relative overflow-x-hidden text-white">
      {/* Global Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop")',
        }}
      />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-0" />

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/10"
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link className="flex items-center gap-3 group" href="#">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 text-amber-500 p-2 rounded-2xl border border-white/10"
            >
              <QrCode className="h-7 w-7" />
            </motion.div>
            <span className="font-bold text-2xl tracking-tight text-white">
              QrDers
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-white/80 hover:text-white transition-colors">
                 <LanguageSwitcher />
              </div>
              <Link href="/admin/login">
                <Button variant="ghost" className="font-medium text-white hover:bg-white/10 hover:text-amber-500 text-base relative overflow-hidden group transition-colors">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/waiter/login">
                <Button variant="ghost" className="font-medium text-white hover:bg-white/10 hover:text-amber-500 text-base relative overflow-hidden group transition-colors">
                  {t('waiterLogin')}
                </Button>
              </Link>
              <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="rounded-full shadow-lg hover:shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white border-0">
                    <span className="flex items-center font-bold">{t('demo')} <ChevronRight className="ml-1 h-4 w-4 rtl:rotate-180" /></span>
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] border-l border-white/10 p-0 bg-black/90 backdrop-blur-xl">
                  <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b border-white/10 bg-white/5">
                      <SheetTitle className="text-left flex items-center gap-3">
                        <div className="bg-amber-600 text-white p-2 rounded-xl shadow-lg shadow-amber-500/20">
                          <QrCode className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">
                          QrDers
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col flex-1 p-6 gap-6 text-white">
                      {/* Language Selection Section */}
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white/70 flex items-center gap-2">
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
                          <Button variant="outline" className="w-full justify-between h-14 text-base font-medium rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10 hover:border-amber-500/50 hover:text-amber-500 transition-all group">
                            <span className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                                <Users className="h-5 w-5 text-white/70 group-hover:text-amber-500 transition-colors" />
                              </div>
                              {t('login')}
                            </span>
                            <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-amber-500 transition-colors" />
                          </Button>
                        </Link>
                        
                        <Link href="/waiter/login" onClick={() => {}}>
                          <Button variant="outline" className="w-full justify-between h-14 text-base font-medium rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10 hover:border-amber-500/50 hover:text-amber-500 transition-all group">
                            <span className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                                <Users className="h-5 w-5 text-white/70 group-hover:text-amber-500 transition-colors" />
                              </div>
                              {t('waiterLogin')}
                            </span>
                            <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-amber-500 transition-colors" />
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
                      <div className="mt-auto pt-6 border-t border-white/10 text-center">
                        <p className="text-xs text-white/40">
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
      </motion.header>
      
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden flex items-center justify-center min-h-[90vh]">
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-10 text-center max-w-5xl mx-auto">
              <div className="space-y-6">
                <div 
                  className="inline-flex items-center rounded-full border border-amber-500/30 px-6 py-2 text-sm font-semibold text-amber-400 bg-amber-500/10 shadow-lg backdrop-blur-md mb-6 hover:bg-amber-500/20 transition-colors cursor-default"
                >
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 mr-3 animate-pulse"></span>
                  {t('futureOfDining')}
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight text-white drop-shadow-lg">
                  <span>
                    {t('title')}
                  </span> <br className="hidden sm:inline" />
                  <span className="text-amber-500">
                    {t('innovation')}
                  </span>
                </h1>
                <p className="mx-auto max-w-[800px] text-white/80 text-xl md:text-2xl leading-relaxed font-light drop-shadow-md">
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
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 rounded-full text-base md:text-lg font-bold border-2 border-white/20 text-white bg-transparent hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm">
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
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg hover:border-amber-500/30 transition-all cursor-default"
                  >
                    <div className="mb-2 p-2 rounded-full bg-white/5 shadow-inner">
                      {benefit.icon}
                    </div>
                    <span className="text-sm font-medium text-white/80">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-20 space-y-4" data-aos="fade-up">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white">
                {t('whyQrTeam')}
              </h2>
              <p className="text-white/60 text-xl max-w-[700px] mx-auto font-light">
                {t('whyQrTeamDesc')}
              </p>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    y: -5
                  }}
                  className="group relative overflow-hidden rounded-[2rem] bg-black/40 backdrop-blur-xl p-8 shadow-lg border border-white/10 hover:border-amber-500/50 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl transition-all group-hover:scale-150 duration-500" />
                  
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-amber-500 border border-white/10 shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-colors"
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <h3 className="mb-4 text-2xl font-bold text-white group-hover:text-amber-500 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed text-lg group-hover:text-white/80 transition-colors">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Modern Showcase Section */}
        <section className="w-full py-24 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8" data-aos="fade-right">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold text-sm mb-2"
                >
                  🚀 {t('innovation')}
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                  {t('notJustMenu')} <br />
                  <span className="text-amber-500">{t('fullOperation')}</span>
                </h2>
                <p className="text-xl text-white/70 leading-relaxed">
                  {t('operationDesc')}
                </p>
                
                <ul className="space-y-4">
                  {[
                    t('showcaseList.liveTracking'),
                    t('showcaseList.kds'),
                    t('showcaseList.waiterCall'),
                    t('showcaseList.multiLang')
                  ].map((item, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-lg font-medium text-white/90"
                    >
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-14 px-8 rounded-full text-lg mt-4 bg-white text-black hover:bg-white/90 font-bold">
                    {t('discoverFeatures')}
                  </Button>
                </motion.div>
              </div>

              <div className="relative mt-12 md:mt-0" data-aos="fade-left">
                {/* Decorative Elements */}
                <div className="hidden md:block absolute -inset-4 bg-amber-500/20 rounded-[2.5rem] blur-2xl animate-pulse" />
                <motion.div 
                  whileHover={{ rotateY: 5, rotateX: 5 }}
                  style={{ perspective: 1000 }}
                  className="relative bg-black/40 border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl group mx-auto max-w-[90vw] md:max-w-none backdrop-blur-xl"
                >
                   {/* Lottie Animation for Dashboard */}
                   <div 
                      className="aspect-video rounded-xl bg-black/50 flex items-center justify-center border-2 border-dashed border-white/10 overflow-hidden relative cursor-pointer hover:border-amber-500/50 transition-colors"
                      onClick={() => setIsGalleryOpen(true)}
                   >
                      <div className="absolute inset-0 flex items-center justify-center opacity-80">
                         <LottieAnimation 
                            url="https://assets9.lottiefiles.com/packages/lf20_5njp3vgg.json" 
                            width="120%" 
                            height="120%" 
                         />
                      </div>
                      <div className="text-center space-y-2 relative z-10 bg-black/60 p-3 md:p-4 rounded-xl backdrop-blur-md border border-white/10 shadow-sm group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="h-10 w-10 md:h-12 md:w-12 mx-auto text-amber-500" />
                        <p className="text-white font-bold text-sm md:text-base">{t('dashboardPreview.title')}</p>
                        <p className="text-xs text-white/60 font-medium">{t('dashboardPreview.clickToView')}</p>
                      </div>
                   </div>
                   
                   {/* Floating Cards - Adjusted for Mobile */}
                   <motion.div 
                      variants={floatVariants}
                      animate="animate"
                      className="absolute -bottom-4 -left-4 md:-bottom-8 md:-left-8 bg-black/80 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-white/10 scale-90 md:scale-100 z-20"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-white/60">{t('dashboardPreview.dailyRevenue')}</p>
                          <p className="font-bold text-base md:text-lg text-white">₺12,450</p>
                        </div>
                      </div>
                   </motion.div>

                   <motion.div 
                      variants={floatVariantsReverse}
                      animate="animate"
                      className="absolute -top-4 -right-4 md:-top-8 md:-right-8 bg-black/80 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-white/10 scale-90 md:scale-100 z-20"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <Users className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-white/60">{t('dashboardPreview.activeTable')}</p>
                          <p className="font-bold text-base md:text-lg text-white">24/30</p>
                        </div>
                      </div>
                   </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-24 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative rounded-[3rem] bg-black/60 backdrop-blur-xl border border-white/10 overflow-hidden px-6 py-20 md:px-20 md:py-24 text-center shadow-2xl"
            >
              {/* Animated Background Effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent animate-pulse" />
              </div>
              
              <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white leading-tight">
                  {t('readyToMove')} <br />
                  <span className="text-amber-500">{t('readyToMoveHighlight')}</span>
                </h2>
                <p className="text-white/70 text-xl md:text-2xl max-w-[700px] mx-auto font-light">
                  {t('readyToMoveDesc')}
                </p>
                <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/admin/login">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-16 px-12 rounded-full text-lg font-bold shadow-lg hover:shadow-amber-500/50 transition-all bg-amber-600 text-white hover:bg-amber-700 border-0">
                        {t('cta')}
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/contact">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="h-16 px-12 rounded-full text-lg font-bold bg-transparent text-white border-white/20 hover:bg-white/10 hover:border-white">
                        {t('contactUs')}
                      </Button>
                    </motion.div>
                  </Link>
                </div>
                <p className="text-sm text-white/40 pt-4">
                  {t('noCreditCard')}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <PanelGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
    </div>
  );
}
