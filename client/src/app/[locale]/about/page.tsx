'use client';

import { motion, Variants } from 'framer-motion';
import { Users, Target, Heart, Coffee, Lightbulb, Shield, Globe, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

export default function AboutPage() {
  const router = useRouter();
  const t = useTranslations('AboutPage');
  const [statsData, setStatsData] = useState({
    activeCafes: 0,
    totalProducts: 0,
    totalOrders: 0,
    uniqueCities: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`, { next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (error) {
        // Sunucu kapalıysa veya hata varsa sessizce geç
        // console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

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

  const stats = [
    { label: t('stats.happyBusiness'), value: statsData.activeCafes > 0 ? `${statsData.activeCafes}+` : '500+', icon: <Coffee className="w-6 h-6" /> },
    { label: t('stats.digitalMenu'), value: statsData.totalProducts > 0 ? `${statsData.totalProducts}+` : '1000+', icon: <Globe className="w-6 h-6" /> },
    { label: t('stats.monthlyTransaction'), value: statsData.totalOrders > 0 ? `${(statsData.totalOrders / 1000).toFixed(1)}K+` : '5M+', icon: <Sparkles className="w-6 h-6" /> },
    { label: t('stats.citiesServed'), value: statsData.uniqueCities > 0 ? `${statsData.uniqueCities}` : '81', icon: <Target className="w-6 h-6" /> },
  ];

  const values = [
    {
      title: t('values.transparency.title'),
      description: t('values.transparency.description'),
      icon: <Shield className="w-10 h-10 text-emerald-500" />,
      bg: 'bg-emerald-500/10'
    },
    {
      title: t('values.innovation.title'),
      description: t('values.innovation.description'),
      icon: <Lightbulb className="w-10 h-10 text-amber-500" />,
      bg: 'bg-amber-500/10'
    },
    {
      title: t('values.customerFocus.title'),
      description: t('values.customerFocus.description'),
      icon: <Heart className="w-10 h-10 text-rose-500" />,
      bg: 'bg-rose-500/10'
    }
  ];

  const team = [
    { 
      name: 'Furkan Erdoğan', 
      role: t('team.roles.founder'), 
      color: 'bg-blue-500',
      image: '/personel/Furkan_Erdogan.png'
    },
    { 
      name: 'Ad Soyad', 
      role: t('team.roles.founder'), 
      color: 'bg-purple-500',
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 lg:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-24 lg:space-y-32"
        >
          {/* Hero Section */}
          <div className="text-center space-y-8 max-w-5xl mx-auto relative">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              <span>{t('hero.badge')}</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-4xl md:text-7xl font-bold tracking-tight leading-tight">
              {t('hero.title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-primary bg-300% animate-gradient">
                {t('hero.titleHighlight')}
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-muted-foreground text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
              {t('hero.description')}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full" onClick={() => router.push('/contact')}>
                {t('hero.buttonContact')}
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full" onClick={() => router.push('/features')}>
                {t('hero.buttonFeatures')}
              </Button>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="relative p-6 lg:p-8 rounded-3xl bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="p-3 bg-primary/10 w-fit rounded-2xl text-primary mb-4 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold text-foreground mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Vision & Mission Split */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div variants={itemVariants} className="space-y-8 relative">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
              <h2 className="text-3xl md:text-5xl font-bold relative z-10">
                {t('mission.title')} <br />
                <span className="text-primary">{t('mission.highlight')}</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
                {t('mission.description')}
              </p>
              <ul className="space-y-4 relative z-10">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {t(`mission.list.${i}`)}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={itemVariants} className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-[3rem] blur-xl transform rotate-3" />
              <div className="relative bg-card border border-border p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-6">
                <Target className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold">{t('vision.title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t('vision.description')}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Values Section */}
          <div className="space-y-12">
             <motion.div variants={itemVariants} className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold">{t('values.title')}</h2>
                <p className="text-muted-foreground text-lg">
                  {t('values.subtitle')}
                </p>
             </motion.div>
             
             <div className="grid md:grid-cols-3 gap-8">
                {values.map((value, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                    className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all shadow-lg hover:shadow-2xl group"
                  >
                    <div className={`w-20 h-20 rounded-2xl ${value.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {value.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </motion.div>
                ))}
             </div>
          </div>

          {/* Team Section */}
          <div className="space-y-12">
            <motion.div variants={itemVariants} className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">{t('team.title')}</h2>
              <p className="text-muted-foreground text-lg">
                {t('team.subtitle')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="text-center group"
                >
                  <div className="relative mb-6 mx-auto w-40 h-40">
                    <div className={`absolute inset-0 ${member.color} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity`} />
                    <div className={`relative w-full h-full ${member.color}/10 rounded-full flex items-center justify-center border border-border/50 overflow-hidden`}>
                    {(member as any).image ? (
                      <img 
                        src={(member as any).image} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className={`w-12 h-12 ${member.color.replace('bg-', 'text-')}`} />
                    )}
                  </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-muted-foreground font-medium text-sm">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}