'use client';

import { useEffect } from 'react';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QrCode, Utensils, Smartphone, ChevronRight, CheckCircle2, Zap, LayoutDashboard, Users, BarChart3, Clock, Globe, Wallet, Menu } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import LottieAnimation from '@/components/ui/LottieAnimation';
import PanelGallery from '@/components/ui/panel-gallery';
import { useState } from 'react';
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
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      text: t('benefits.faster'),
    },
    {
      icon: <Wallet className="h-6 w-6 text-green-500" />,
      text: t('benefits.increase'),
    },
    {
      icon: <Globe className="h-6 w-6 text-blue-500" />,
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
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 md:bg-background/90 md:backdrop-blur-md supports-[backdrop-filter]:md:bg-background/80"
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link className="flex items-center gap-3 group" href="#">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-primary/10 text-primary p-2 rounded-2xl shadow-sm"
            >
              <QrCode className="h-7 w-7" />
            </motion.div>
            <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">
              QR Team <span className="text-foreground">Cafe</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <Link href="/admin/login">
                <Button variant="ghost" className="font-medium hover:bg-secondary/80 text-base relative overflow-hidden group">
                  <span className="relative z-10">{t('login')}</span>
                  <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </Link>
              <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-green-600 border-0 relative overflow-hidden">
                    <span className="relative z-10 flex items-center">{t('demo')} <ChevronRight className="ml-1 h-4 w-4 rtl:rotate-180" /></span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full hover:animate-shimmer"></div>
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] border-l-0 sm:border-l p-0">
                  <div className="flex flex-col h-full bg-background/95 backdrop-blur-md">
                    <SheetHeader className="p-6 border-b bg-background/50">
                      <SheetTitle className="text-left flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-green-600 text-white p-2 rounded-xl shadow-lg shadow-primary/20">
                          <QrCode className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">
                          QR Team Cafe
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col flex-1 p-6 gap-6">
                      {/* Language Selection Section */}
                      <div className="bg-secondary/30 p-4 rounded-2xl border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
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
                          <Button variant="outline" className="w-full justify-between h-14 text-base font-medium rounded-xl border-2 hover:bg-secondary/50 hover:border-primary/20 transition-all group">
                            <span className="flex items-center gap-3">
                              <div className="p-2 bg-secondary rounded-lg group-hover:bg-white transition-colors">
                                <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              {t('login')}
                            </span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                          </Button>
                        </Link>
                        
                        <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d" onClick={() => {}}>
                          <Button className="w-full justify-between h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-green-600 hover:shadow-lg hover:shadow-primary/25 transition-all group border-0">
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
                      <div className="mt-auto pt-6 border-t text-center">
                        <p className="text-xs text-muted-foreground">
                          &copy; {new Date().getFullYear()} QR Team Cafe
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
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden flex items-center justify-center min-h-[90vh]">
          {/* Animated Background */}
          <div className="absolute inset-0 -z-10">
                <div className="hidden md:block absolute top-10 right-10 w-64 h-64 opacity-20 pointer-events-none">
                   <LottieAnimation 
                      url="/animations/hero-bg.json" 
                   />
                </div>
            {/* Optimized Background for Mobile - Simple Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background md:hidden" />

            {/* Desktop Only: Advanced Background Blobs with Blur */}
            <div className="hidden md:block absolute top-0 -left-4 w-96 h-96 bg-green-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="hidden md:block absolute top-0 -right-4 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="hidden md:block absolute -bottom-8 left-20 w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-background/80 via-background to-background" />
          </div>
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-10 text-center max-w-5xl mx-auto">
              <div className="space-y-6">
                <div 
                  className="inline-flex items-center rounded-full border border-primary/20 px-6 py-2 text-sm font-semibold text-primary bg-primary/5 shadow-lg md:backdrop-blur-md mb-6 hover:bg-primary/10 transition-colors cursor-default"
                >
                  <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 mr-3 animate-pulse"></span>
                  {t('futureOfDining')}
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight">
                  <span>
                    {t('title')}
                  </span> <br className="hidden sm:inline" />
                  <span className="text-primary">
                    {t('innovation')}
                  </span>
                </h1>
                <p className="mx-auto max-w-[800px] text-muted-foreground text-xl md:text-2xl leading-relaxed font-light">
                  {t('subtitle')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-4 sm:px-0">
                <Link href="/menu/2ea6acce-7d77-4a0b-910f-56a05666d89d" className="w-full sm:w-auto">
                  <div className="w-full sm:w-auto hover:scale-105 transition-transform duration-200">
                    <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 rounded-full text-base md:text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-green-600 border-0">
                      {t('demo')} <Utensils className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />
                    </Button>
                  </div>
                </Link>
                <Link href="/admin/login" className="w-full sm:w-auto">
                  <div className="w-full sm:w-auto hover:scale-105 transition-transform duration-200">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-6 md:px-10 rounded-full text-base md:text-lg font-bold border-2 hover:bg-secondary/50 transition-all duration-300 backdrop-blur-sm">
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
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/50 md:backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default"
                  >
                    <div className="mb-2 p-2 rounded-full bg-background shadow-inner">
                      {benefit.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground/80">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 bg-secondary/20 relative">
           <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-20 space-y-4" data-aos="fade-up">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {t('whyQrTeam')}
              </h2>
              <p className="text-muted-foreground text-xl max-w-[700px] mx-auto font-light">
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
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    y: -5
                  }}
                  className="group relative overflow-hidden rounded-[2rem] bg-background p-8 shadow-lg border border-primary/5 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-green-500/20 blur-3xl transition-all group-hover:scale-150 duration-500" />
                  
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-green-500/10 text-primary shadow-inner"
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <h3 className="mb-4 text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
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
                  className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-2"
                >
                  🚀 {t('innovation')}
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  {t('notJustMenu')} <br />
                  <span className="text-primary">{t('fullOperation')}</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
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
                      className="flex items-center gap-3 text-lg font-medium"
                    >
                      <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-14 px-8 rounded-full text-lg mt-4 bg-foreground text-background hover:bg-foreground/90">
                    {t('discoverFeatures')}
                  </Button>
                </motion.div>
              </div>

              <div className="relative mt-12 md:mt-0" data-aos="fade-left">
                {/* Decorative Elements */}
                <div className="hidden md:block absolute -inset-4 bg-gradient-to-r from-primary to-green-600 rounded-[2.5rem] opacity-20 blur-2xl animate-pulse" />
                <motion.div 
                  whileHover={{ rotateY: 5, rotateX: 5 }}
                  style={{ perspective: 1000 }}
                  className="relative bg-background border rounded-[2rem] p-4 md:p-6 shadow-2xl group mx-auto max-w-[90vw] md:max-w-none"
                >
                   {/* Lottie Animation for Dashboard */}
                   <div 
                      className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 overflow-hidden relative cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setIsGalleryOpen(true)}
                   >
                      <div className="absolute inset-0 flex items-center justify-center opacity-80">
                         {/* Show simplified image on mobile, Lottie on desktop if needed, or optimized Lottie */}
                         <LottieAnimation 
                            url="https://assets9.lottiefiles.com/packages/lf20_5njp3vgg.json" 
                            width="120%" 
                            height="120%" 
                         />
                      </div>
                      <div className="text-center space-y-2 relative z-10 bg-background/80 p-3 md:p-4 rounded-xl md:backdrop-blur-sm border shadow-sm group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="h-10 w-10 md:h-12 md:w-12 mx-auto text-primary" />
                        <p className="text-foreground font-bold text-sm md:text-base">{t('dashboardPreview.title')}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('dashboardPreview.clickToView')}</p>
                      </div>
                   </div>
                   
                   {/* Floating Cards - Adjusted for Mobile */}
                   <motion.div 
                      variants={floatVariants}
                      animate="animate"
                      className="absolute -bottom-4 -left-4 md:-bottom-8 md:-left-8 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border scale-90 md:scale-100 z-20"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">{t('dashboardPreview.dailyRevenue')}</p>
                          <p className="font-bold text-base md:text-lg">₺12,450</p>
                        </div>
                      </div>
                   </motion.div>

                   <motion.div 
                      variants={floatVariantsReverse}
                      animate="animate"
                      className="absolute -top-4 -right-4 md:-top-8 md:-right-8 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border scale-90 md:scale-100 z-20"
                   >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Users className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground">{t('dashboardPreview.activeTable')}</p>
                          <p className="font-bold text-base md:text-lg">24/30</p>
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
              className="relative rounded-[3rem] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden px-6 py-20 md:px-20 md:py-24 text-center shadow-2xl"
            >
              {/* Animated Background Effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent animate-pulse" />
              </div>
              
              <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white leading-tight">
                  {t('readyToMove')} <br />
                  <span className="text-primary">{t('readyToMoveHighlight')}</span>
                </h2>
                <p className="text-gray-300 text-xl md:text-2xl max-w-[700px] mx-auto font-light">
                  {t('readyToMoveDesc')}
                </p>
                <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/admin/login">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-16 px-12 rounded-full text-lg font-bold shadow-lg hover:shadow-primary/50 transition-all bg-primary text-primary-foreground hover:bg-primary/90 border-0">
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
                <p className="text-sm text-gray-400 pt-4">
                  {t('noCreditCard')}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <PanelGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
      {/* Gallery Component Loaded */}
    </div>
  );
}
